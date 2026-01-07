# Prevention Strategy: Memory Leaks from Object URLs

## Issue Summary

Object URLs created with `URL.createObjectURL()` must be manually revoked. In React components that remain mounted (like with `forceMount` pattern or persistent state), these URLs can accumulate and cause memory leaks.

## Warning Signs to Watch For

### Code Smells

1. **Object URL Creation Without Cleanup**
   ```typescript
   // ⚠️ RED FLAG: Creating object URL without revocation
   const preview = URL.createObjectURL(file);
   ```

2. **State That Persists Object URLs**
   ```typescript
   // ⚠️ RED FLAG: Storing object URLs in state without cleanup
   const [attachments, setAttachments] = useState<{preview: string}[]>([]);
   ```

3. **Components That Never Unmount**
   ```typescript
   // ⚠️ RED FLAG: forceMount keeps component in DOM
   <TabsContent value="tab1" forceMount>
     <FileUploadForm />  {/* This never unmounts! */}
   </TabsContent>
   ```

4. **Multiple Instances of Same Component**
   ```typescript
   // ⚠️ RED FLAG: Both mounted simultaneously, both creating URLs
   {mode === 'technical' && <TechnicalForm />}
   {mode === 'dd' && <DDForm />}
   // If both are rendered together, URLs accumulate
   ```

### Runtime Indicators

1. **Memory Growth Pattern**
   - Chrome DevTools > Memory > Take Heap Snapshot
   - Look for growing number of "Blob" objects
   - Memory doesn't decrease after removing UI elements

2. **Browser Console Warnings**
   - "Warning: Can't perform a React state update on an unmounted component"
   - Often appears alongside memory leaks in cleanup scenarios

3. **Performance Degradation**
   - Slowdown after repeated uploads/removals
   - Especially noticeable on mobile/low-memory devices

## Prevention Checklist

### Before Writing Code

- [ ] **Plan cleanup strategy** - For every `URL.createObjectURL()`, note where `URL.revokeObjectURL()` will be called
- [ ] **Check component lifecycle** - Will this component unmount? If using `forceMount` or similar, plan alternative cleanup
- [ ] **Review state structure** - Are object URLs being stored? If yes, add cleanup handlers

### During Implementation

- [ ] **Add useEffect cleanup** for object URLs stored in state
  ```typescript
  useEffect(() => {
    return () => {
      // Cleanup when component unmounts OR when dependencies change
      attachments.forEach(a => URL.revokeObjectURL(a.preview));
    };
  }, [attachments]);
  ```

- [ ] **Revoke on removal** - When items are removed from arrays
  ```typescript
  const removeAttachment = (id: string) => {
    setAttachments(prev => {
      const attachment = prev.find(a => a.id === id);
      if (attachment) URL.revokeObjectURL(attachment.preview); // ✅ Revoke immediately
      return prev.filter(a => a.id !== id);
    });
  };
  ```

- [ ] **Revoke on replace** - When clearing all items
  ```typescript
  const clearAttachments = () => {
    setAttachments(prev => {
      prev.forEach(a => URL.revokeObjectURL(a.preview)); // ✅ Revoke all before clearing
      return [];
    });
  };
  ```

### Code Review Checklist

- [ ] Search for `URL.createObjectURL` in the diff
- [ ] For each occurrence, verify there's a corresponding `URL.revokeObjectURL`
- [ ] Check that cleanup happens in ALL exit paths (unmount, state update, removal)
- [ ] Verify cleanup in error paths (try/finally blocks if needed)
- [ ] If component uses `forceMount`, verify alternative cleanup strategy

### Testing Checklist

- [ ] Test memory with DevTools (see test cases below)
- [ ] Test upload → remove → upload cycle multiple times
- [ ] Test tab switching (if applicable)
- [ ] Test rapid uploads/removals
- [ ] Test error scenarios (what happens to URLs if upload fails?)

## Test Cases

### 1. Unit Test: Cleanup on Unmount

```typescript
import { render, cleanup } from '@testing-library/react';
import { FileUploadComponent } from './file-upload-component';

describe('FileUploadComponent - Object URL Cleanup', () => {
  // Mock URL methods
  const createObjectURLSpy = jest.spyOn(URL, 'createObjectURL');
  const revokeObjectURLSpy = jest.spyOn(URL, 'revokeObjectURL');

  beforeEach(() => {
    createObjectURLSpy.mockReturnValue('blob:mock-url');
    revokeObjectURLSpy.mockClear();
  });

  it('should revoke object URLs when component unmounts', () => {
    const { unmount } = render(<FileUploadComponent />);

    // Upload a file
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByRole('file-input'), {
      target: { files: [file] },
    });

    // Verify URL was created
    expect(createObjectURLSpy).toHaveBeenCalledWith(file);
    const createdUrl = createObjectURLSpy.mock.results[0].value;

    // Unmount component
    unmount();

    // Verify URL was revoked
    expect(revokeObjectURLSpy).toHaveBeenCalledWith(createdUrl);
  });

  it('should revoke object URL when attachment is removed', () => {
    render(<FileUploadComponent />);

    // Upload file
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByRole('file-input'), {
      target: { files: [file] },
    });

    const createdUrl = createObjectURLSpy.mock.results[0].value;

    // Remove attachment
    fireEvent.click(screen.getByRole('button', { name: /remove/i }));

    // Verify URL was revoked
    expect(revokeObjectURLSpy).toHaveBeenCalledWith(createdUrl);
  });

  it('should revoke all URLs when clearing attachments', () => {
    render(<FileUploadComponent />);

    // Upload multiple files
    const files = [
      new File(['1'], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['2'], 'test2.jpg', { type: 'image/jpeg' }),
    ];

    fireEvent.change(screen.getByRole('file-input'), {
      target: { files },
    });

    const urls = createObjectURLSpy.mock.results.map(r => r.value);

    // Clear all
    fireEvent.click(screen.getByRole('button', { name: /clear all/i }));

    // Verify all URLs were revoked
    urls.forEach(url => {
      expect(revokeObjectURLSpy).toHaveBeenCalledWith(url);
    });
  });
});
```

### 2. Integration Test: Tab Switching with forceMount

```typescript
describe('Tabbed Forms - Memory Leak Prevention', () => {
  it('should not accumulate object URLs when switching tabs', async () => {
    const revokeObjectURLSpy = jest.spyOn(URL, 'revokeObjectURL');

    render(<TabbedForms />);

    // Upload file on Tab 1
    fireEvent.click(screen.getByRole('tab', { name: /technical/i }));
    const file1 = new File(['content'], 'test1.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByRole('file-input'), {
      target: { files: [file1] },
    });

    // Switch to Tab 2
    fireEvent.click(screen.getByRole('tab', { name: /due diligence/i }));

    // Upload file on Tab 2
    const file2 = new File(['content'], 'test2.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByRole('file-input'), {
      target: { files: [file2] },
    });

    // Switch back to Tab 1
    fireEvent.click(screen.getByRole('tab', { name: /technical/i }));

    // Verify that Tab 2's URL was NOT revoked (still needed for preview)
    // This tests that we're only revoking when truly no longer needed
    const allRevokedUrls = revokeObjectURLSpy.mock.calls.map(call => call[0]);

    // Should NOT include Tab 2's URL (component still mounted)
    expect(allRevokedUrls).not.toContain('blob:mock-url-for-file2');
  });
});
```

### 3. Manual Test: Memory Profiling

**Test Procedure:**

1. **Setup**
   - Open Chrome DevTools
   - Navigate to Memory tab
   - Enable "Record allocation timeline"

2. **Baseline Measurement**
   - Take heap snapshot (Snapshot 1)
   - Note memory usage

3. **Stress Test**
   - Upload 5 large images (10MB each)
   - Switch tabs 10 times
   - Remove all attachments
   - Repeat 3 times

4. **Post-Test Measurement**
   - Force garbage collection (DevTools > Memory > 🗑️ icon)
   - Take heap snapshot (Snapshot 2)
   - Compare with Snapshot 1

5. **Analysis**
   ```
   Expected Result:
   - Blob count should return to baseline (±5%)
   - Memory usage within 10% of baseline
   - No growing trend in "Detached DOM tree" count

   Failure Indicators:
   - Blob count grows by 50+ after GC
   - Memory usage 50MB+ higher than baseline
   - Detached DOM trees accumulating
   ```

### 4. Automated Memory Test (E2E)

```typescript
// Using Playwright with memory measurement
test('should not leak memory on repeated file operations', async ({ page }) => {
  await page.goto('/reports/new');

  // Get baseline memory
  const baselineMetrics = await page.evaluate(() => {
    return (performance as any).memory?.usedJSHeapSize || 0;
  });

  // Perform operations
  for (let i = 0; i < 10; i++) {
    // Upload file
    await page.setInputFiles('input[type="file"]', {
      name: `test${i}.jpg`,
      mimeType: 'image/jpeg',
      buffer: Buffer.alloc(5 * 1024 * 1024), // 5MB
    });

    // Wait for preview
    await page.waitForSelector('[data-test="attachment-preview"]');

    // Remove file
    await page.click('[data-test="remove-attachment"]');

    // Wait for removal
    await page.waitForSelector('[data-test="attachment-preview"]', {
      state: 'detached',
    });
  }

  // Force GC (requires Chrome flag: --js-flags="--expose-gc")
  await page.evaluate(() => {
    if (global.gc) global.gc();
  });

  // Check final memory
  const finalMetrics = await page.evaluate(() => {
    return (performance as any).memory?.usedJSHeapSize || 0;
  });

  const memoryGrowth = finalMetrics - baselineMetrics;
  const allowedGrowth = baselineMetrics * 0.2; // 20% tolerance

  expect(memoryGrowth).toBeLessThan(allowedGrowth);
});
```

## Common Patterns & Solutions

### Pattern 1: File Preview Component

```typescript
// ❌ WRONG: No cleanup
function FilePreview({ file }: { file: File }) {
  const [preview] = useState(() => URL.createObjectURL(file));
  return <img src={preview} />;
}

// ✅ CORRECT: Cleanup on unmount
function FilePreview({ file }: { file: File }) {
  const [preview] = useState(() => URL.createObjectURL(file));

  useEffect(() => {
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  return <img src={preview} />;
}
```

### Pattern 2: Array of Attachments

```typescript
// ❌ WRONG: No cleanup when array changes
function AttachmentList() {
  const [attachments, setAttachments] = useState<Array<{
    id: string;
    preview: string;
  }>>([]);

  const addFile = (file: File) => {
    setAttachments(prev => [...prev, {
      id: crypto.randomUUID(),
      preview: URL.createObjectURL(file), // ❌ Leak!
    }]);
  };

  return <div>{attachments.map(a => <img src={a.preview} />)}</div>;
}

// ✅ CORRECT: Cleanup on changes and unmount
function AttachmentList() {
  const [attachments, setAttachments] = useState<Array<{
    id: string;
    preview: string;
  }>>([]);

  useEffect(() => {
    return () => {
      // Cleanup all URLs when component unmounts
      attachments.forEach(a => URL.revokeObjectURL(a.preview));
    };
  }, [attachments]); // ✅ Also runs when attachments change

  const addFile = (file: File) => {
    setAttachments(prev => [...prev, {
      id: crypto.randomUUID(),
      preview: URL.createObjectURL(file),
    }]);
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => {
      const attachment = prev.find(a => a.id === id);
      if (attachment) {
        URL.revokeObjectURL(attachment.preview); // ✅ Immediate cleanup
      }
      return prev.filter(a => a.id !== id);
    });
  };

  return <div>{attachments.map(a => <img src={a.preview} />)}</div>;
}
```

### Pattern 3: forceMount with Tab Switching

```typescript
// ❌ WRONG: Components never unmount, URLs accumulate
<Tabs>
  <TabsContent value="tab1" forceMount>
    <FormWithFiles /> {/* Never unmounts! */}
  </TabsContent>
  <TabsContent value="tab2" forceMount>
    <FormWithFiles /> {/* Never unmounts! */}
  </TabsContent>
</Tabs>

// ✅ OPTION 1: Remove forceMount (simplest)
<Tabs>
  <TabsContent value="tab1">
    <FormWithFiles /> {/* Unmounts when switching tabs */}
  </TabsContent>
  <TabsContent value="tab2">
    <FormWithFiles />
  </TabsContent>
</Tabs>

// ✅ OPTION 2: Keep forceMount, add visibility-based cleanup
function FormWithFiles() {
  const [attachments, setAttachments] = useState([]);
  const isVisible = useTabVisibility(); // Custom hook

  useEffect(() => {
    if (!isVisible) {
      // Cleanup when tab becomes inactive
      attachments.forEach(a => URL.revokeObjectURL(a.preview));
      setAttachments([]);
    }
  }, [isVisible]);
}

// ✅ OPTION 3: Lift state to parent (best for forceMount)
function TabbedForms() {
  const [tab1Files, setTab1Files] = useState([]);
  const [tab2Files, setTab2Files] = useState([]);

  // Cleanup managed in parent
  useEffect(() => {
    return () => {
      tab1Files.forEach(f => URL.revokeObjectURL(f.preview));
      tab2Files.forEach(f => URL.revokeObjectURL(f.preview));
    };
  }, [tab1Files, tab2Files]);

  return (
    <Tabs>
      <TabsContent value="tab1" forceMount>
        <Form files={tab1Files} setFiles={setTab1Files} />
      </TabsContent>
      <TabsContent value="tab2" forceMount>
        <Form files={tab2Files} setFiles={setTab2Files} />
      </TabsContent>
    </Tabs>
  );
}
```

## Quick Reference

### Golden Rules

1. **One-to-One Rule**: Every `URL.createObjectURL()` must have exactly one `URL.revokeObjectURL()`
2. **Cleanup Timing**: Revoke ASAP - when item removed, when component unmounts, or when replacing URL
3. **forceMount Warning**: If component never unmounts, you MUST handle cleanup manually
4. **State Storage**: If storing object URLs in state, add cleanup in `useEffect` with URL as dependency

### Code Review Regex Searches

```bash
# Find object URL creation
grep -r "URL.createObjectURL" --include="*.tsx" --include="*.ts"

# Find forceMount usage
grep -r "forceMount" --include="*.tsx"

# Find cleanup (should match creation count)
grep -r "URL.revokeObjectURL" --include="*.tsx" --include="*.ts"
```

### DevTools Quick Check

1. Open Memory tab
2. Take snapshot
3. Perform file operations
4. Force GC
5. Take second snapshot
6. Compare > Search for "blob:" or "Blob"
7. Count should be similar (±10%)

## Related Resources

- [MDN: URL.createObjectURL()](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL)
- [MDN: URL.revokeObjectURL()](https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL)
- [React Docs: useEffect cleanup](https://react.dev/reference/react/useEffect#disconnecting-from-the-server)
- Chrome DevTools: [Memory Profiling](https://developer.chrome.com/docs/devtools/memory-problems/)
