# Prevention Strategy: Code Duplication

## Issue Summary

Duplicated code creates maintenance burden, increases bug risk, and makes future changes error-prone. The specific case involved 400+ lines of duplicated logic across two form components with ~85% similarity, including identical file handling, UI components, and state management.

## Warning Signs to Watch For

### Code Smells

1. **Copy-Paste Development**
   ```typescript
   // ⚠️ RED FLAG: File created by copying another file
   // cp technical-analysis-form.tsx due-diligence-analysis-form.tsx
   ```

2. **Near-Identical File Names**
   ```
   ⚠️ RED FLAG: Suspiciously similar names
   - create-user-form.tsx
   - create-team-form.tsx
   - create-project-form.tsx
   ```

3. **Repeated Interfaces/Types**
   ```typescript
   // ⚠️ RED FLAG: Same interface in multiple files
   // File 1:
   interface Attachment { id: string; file: File; preview: string; }

   // File 2:
   interface Attachment { id: string; file: File; preview: string; }
   ```

4. **Identical Helper Functions**
   ```typescript
   // ⚠️ RED FLAG: Same function in two files
   // File 1:
   function formatDate(date: Date) { ... }

   // File 2:
   function formatDate(date: Date) { ... }
   ```

5. **Duplicate Constants**
   ```typescript
   // ⚠️ RED FLAG: Same constants
   // File 1:
   const MAX_FILE_SIZE = 10 * 1024 * 1024;

   // File 2:
   const MAX_FILE_SIZE = 10 * 1024 * 1024;
   ```

6. **Parallel Component Hierarchies**
   ```
   ⚠️ RED FLAG: Mirrored structure
   forms/
   ├── user/
   │   ├── user-list.tsx      ← Same logic
   │   ├── user-detail.tsx    ← Same logic
   │   └── user-actions.tsx   ← Same logic
   └── team/
       ├── team-list.tsx      ← as team versions
       ├── team-detail.tsx
       └── team-actions.tsx
   ```

### Similarity Metrics

**When to Extract:**

- **Exact duplicates**: 100% similarity → Extract immediately
- **High similarity**: 80-100% → Extract with parameterization
- **Medium similarity**: 50-80% → Extract common parts, keep differences
- **Low similarity**: < 50% → Usually safe to keep separate (but verify)

**Tools to Measure:**

```bash
# Use jscpd (JavaScript Copy/Paste Detector)
npx jscpd --min-lines 5 --min-tokens 50 src/

# Use git diff to compare files
git diff --no-index file1.tsx file2.tsx --stat

# Use similarity index
git diff --no-index --stat=1000 file1.tsx file2.tsx | grep "similarity"
```

### Runtime Indicators

1. **Bug Appears in Multiple Places**
   - Fix same bug in 2+ files → Code should have been shared

2. **Feature Requires Multiple File Updates**
   - Add feature, need to update 3+ files identically → Should be DRY

3. **Inconsistent Behavior**
   - "Feature works in Form A but not Form B" → Duplication diverged

## Signals to Extract Shared Code

### Strong Signals (Extract Immediately)

1. **Identical Logic in 2+ Files**
   ```typescript
   // If you see this pattern, extract NOW
   // Both files do identical file validation
   if (file.size > MAX_SIZE) return false;
   if (!ALLOWED_TYPES.includes(file.type)) return false;
   ```

2. **Same Bug Fixed in Multiple Places**
   - Fixed memory leak in File A
   - Realized File B has same bug
   - → Extract to prevent future divergence

3. **Copilot/AI Suggests Same Code Twice**
   - If AI autocomplete gives same code in two places
   - → Probably should be shared

4. **Three Strikes Rule**
   - First time: Write it
   - Second time: Note the duplication
   - Third time: Refactor and extract

### Medium Signals (Consider Extracting)

1. **Similar but Not Identical**
   - 70-80% similarity
   - Differences are just parameter values
   - → Extract with configuration parameter

2. **Parallel Features**
   - "User settings" and "Team settings" do similar things
   - → Extract shared logic, pass context

3. **Repeated UI Patterns**
   - Same card/list/form layout in multiple places
   - → Extract component with variants

### Weak Signals (Probably Okay to Keep Separate)

1. **Coincidentally Similar**
   - Both components fetch data and display a list
   - But they fetch different data with different APIs
   - → Similarity is superficial, abstraction would be forced

2. **Domain-Specific Logic**
   - User validation rules vs Product validation rules
   - Similar structure but different business logic
   - → Keep separate for clarity

3. **Temporary Duplication**
   - Experimenting with new pattern
   - Will converge or diverge based on results
   - → Wait until pattern stabilizes

## Prevention Checklist

### Before Writing Code

- [ ] **Search for similar features** - Does this already exist somewhere?
  ```bash
  grep -r "function.*FileUpload" --include="*.tsx"
  ```

- [ ] **Check for shared utilities** - Is there a util file for this domain?
  ```bash
  ls -la **/utils/ **/_lib/ **/shared/
  ```

- [ ] **Review component library** - Does a shared component already do this?
  ```bash
  ls -la packages/ui/src/
  ```

- [ ] **Ask the team** - "Has anyone built X before?"

### During Implementation

- [ ] **Extract constants** - Magic numbers and strings to config
  ```typescript
  // ❌ WRONG
  if (file.size > 10485760) // Magic number

  // ✅ CORRECT
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // Named constant
  ```

- [ ] **Extract types** - Shared interfaces to separate file
  ```typescript
  // Create shared types file
  // _lib/types/attachment.ts
  export interface Attachment { ... }
  ```

- [ ] **Extract helpers** - Repeated logic to utility functions
  ```typescript
  // _lib/utils/file-validation.ts
  export function validateFile(file: File, config: Config) { ... }
  ```

- [ ] **Extract components** - Repeated JSX to shared components
  ```typescript
  // _components/shared/attachment-list.tsx
  export function AttachmentList({ attachments, onRemove }) { ... }
  ```

- [ ] **Extract hooks** - Repeated state/effect logic to custom hooks
  ```typescript
  // _lib/hooks/use-file-attachments.ts
  export function useFileAttachments(config) { ... }
  ```

### Code Review Checklist

- [ ] **Similarity check** - Compare with related files
  ```bash
  git diff --no-index file1.tsx file2.tsx
  ```

- [ ] **Search for duplicates** - Look for similar function names
  ```bash
  grep -r "function handleFileSelect" --include="*.tsx"
  ```

- [ ] **Count similar patterns** - How many files have this pattern?
  ```bash
  grep -r "useState.*attachments" --include="*.tsx" | wc -l
  ```

- [ ] **DRY violation check** - Ask: "If I need to change this logic, how many files do I update?"
  - If answer > 1, consider extracting

### Refactoring Checklist

- [ ] **Tests first** - Ensure behavior is preserved
- [ ] **Extract incrementally** - One piece at a time
- [ ] **Keep both versions briefly** - Verify new version works before deleting old
- [ ] **Update all usages** - Don't leave orphaned duplicates
- [ ] **Document the extraction** - Add JSDoc to explain shared code

## Extraction Strategies

### Strategy 1: Extract Custom Hook

**Use When:**
- State management logic is duplicated
- Side effects (useEffect) are identical
- Event handlers are similar

**Example:**

```typescript
// ❌ BEFORE: Duplicated in two files
function FormA() {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    // ... 30 lines of file handling
  }, [attachments]);

  const removeAttachment = useCallback((id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  }, []);

  useEffect(() => {
    return () => {
      attachments.forEach(a => URL.revokeObjectURL(a.preview));
    };
  }, [attachments]);
}

// ✅ AFTER: Shared hook
// _lib/use-file-attachments.ts
export function useFileAttachments(config: {
  maxAttachments?: number;
  maxFileSize?: number;
  allowedTypes?: string[];
}) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ... all the logic

  return {
    attachments,
    fileInputRef,
    handleFileSelect,
    removeAttachment,
    clearAttachments,
  };
}

// Both forms now use:
function FormA() {
  const { attachments, handleFileSelect, removeAttachment } = useFileAttachments({
    allowedTypes: ['image/jpeg', 'image/png'],
  });
}
```

**Checklist:**
- [ ] All state moved to hook
- [ ] All callbacks memoized in hook
- [ ] Configuration passed as parameter
- [ ] Return object contains everything form needs

### Strategy 2: Extract Shared Component

**Use When:**
- JSX structure is duplicated
- Styling is identical
- Props are similar

**Example:**

```typescript
// ❌ BEFORE: Duplicated JSX in two files
function FormA() {
  return (
    <div className="flex gap-2">
      {attachments.map(a => (
        <div key={a.id} className="relative rounded border p-2">
          <img src={a.preview} className="h-20 w-20" />
          <button onClick={() => removeAttachment(a.id)}>×</button>
        </div>
      ))}
    </div>
  );
}

// ✅ AFTER: Shared component
// _components/shared/attachment-list.tsx
export function AttachmentList({
  attachments,
  onRemove,
}: {
  attachments: Attachment[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex gap-2">
      {attachments.map(a => (
        <div key={a.id} className="relative rounded border p-2">
          <img src={a.preview} className="h-20 w-20" />
          <button onClick={() => onRemove(a.id)}>×</button>
        </div>
      ))}
    </div>
  );
}

// Both forms now use:
<AttachmentList attachments={attachments} onRemove={removeAttachment} />
```

**Checklist:**
- [ ] Component is fully presentational (no business logic)
- [ ] Props are clearly defined with TypeScript
- [ ] Styling is parameterized if needed (via className prop or variants)
- [ ] Component is placed in `_components/shared/` or `packages/ui/`

### Strategy 3: Extract Utility Function

**Use When:**
- Pure logic (no React hooks/state)
- Used in multiple components/files
- Domain-agnostic (not tied to specific feature)

**Example:**

```typescript
// ❌ BEFORE: Duplicated in two files
function FormA() {
  const validateFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      return { valid: false, error: 'File too large' };
    }
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      return { valid: false, error: 'Invalid type' };
    }
    return { valid: true };
  };
}

// ✅ AFTER: Shared utility
// _lib/utils/file-validation.ts
export function validateFile(
  file: File,
  config: { maxSize: number; allowedTypes: string[] }
): { valid: boolean; error?: string } {
  if (file.size > config.maxSize) {
    return { valid: false, error: `File exceeds ${config.maxSize / 1024 / 1024}MB` };
  }
  if (!config.allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type' };
  }
  return { valid: true };
}

// Both forms now use:
const result = validateFile(file, {
  maxSize: 10 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png'],
});
```

**Checklist:**
- [ ] Function is pure (same inputs = same outputs)
- [ ] No side effects (no setState, no API calls)
- [ ] Well-typed with TypeScript
- [ ] Has unit tests
- [ ] Documented with JSDoc

### Strategy 4: Configuration Object Pattern

**Use When:**
- Similar components with different configurations
- Behavior is same, only values differ

**Example:**

```typescript
// ❌ BEFORE: Two separate components
function UserForm() {
  const MAX_LENGTH = 100;
  const PLACEHOLDER = "Enter user name";
  const VALIDATION = /^[a-zA-Z ]+$/;
}

function TeamForm() {
  const MAX_LENGTH = 50;
  const PLACEHOLDER = "Enter team name";
  const VALIDATION = /^[a-zA-Z0-9-]+$/;
}

// ✅ AFTER: Shared component with config
type EntityFormConfig = {
  maxLength: number;
  placeholder: string;
  validation: RegExp;
  submitLabel: string;
};

function EntityForm({ config }: { config: EntityFormConfig }) {
  // Shared logic using config values
}

// Usage:
const USER_CONFIG: EntityFormConfig = {
  maxLength: 100,
  placeholder: "Enter user name",
  validation: /^[a-zA-Z ]+$/,
  submitLabel: "Create User",
};

const TEAM_CONFIG: EntityFormConfig = {
  maxLength: 50,
  placeholder: "Enter team name",
  validation: /^[a-zA-Z0-9-]+$/,
  submitLabel: "Create Team",
};

<EntityForm config={USER_CONFIG} />
<EntityForm config={TEAM_CONFIG} />
```

**Checklist:**
- [ ] All differences captured in config object
- [ ] Config is type-safe
- [ ] Config is defined outside component (not recreated on render)
- [ ] Consider using Zod for runtime config validation

## Test Cases

### 1. Similarity Detection Test

```typescript
// Test to catch duplication during CI
import { execSync } from 'child_process';

describe('Code Duplication', () => {
  it('should not have high duplication across form components', () => {
    // Run jscpd (copy-paste detector)
    const result = execSync(
      'npx jscpd --min-lines 10 --min-tokens 50 --format json apps/web/app/**/forms/',
      { encoding: 'utf-8' }
    );

    const report = JSON.parse(result);

    // Fail if > 15% duplication detected
    expect(report.statistics.total.percentage).toBeLessThan(15);
  });

  it('should not have identical functions in multiple files', () => {
    const files = [
      'apps/web/app/forms/form-a.tsx',
      'apps/web/app/forms/form-b.tsx',
    ];

    const functionSignatures = files.map(file => {
      const content = fs.readFileSync(file, 'utf-8');
      // Extract function signatures
      return content.match(/function \w+\([^)]*\)/g) || [];
    });

    // Check for identical signatures
    const duplicates = functionSignatures[0].filter(sig =>
      functionSignatures[1].includes(sig)
    );

    // Allow some common names, but flag suspicious duplicates
    const suspicious = duplicates.filter(sig =>
      !['handleSubmit', 'handleChange'].some(common => sig.includes(common))
    );

    expect(suspicious).toHaveLength(0);
  });
});
```

### 2. Hook Extraction Test

```typescript
import { renderHook } from '@testing-library/react';
import { useFileAttachments } from './_lib/use-file-attachments';

describe('useFileAttachments', () => {
  it('should work with default config', () => {
    const { result } = renderHook(() => useFileAttachments());

    expect(result.current.attachments).toEqual([]);
    expect(result.current.fileInputRef.current).toBeNull();
    expect(typeof result.current.handleFileSelect).toBe('function');
    expect(typeof result.current.removeAttachment).toBe('function');
  });

  it('should work with custom config', () => {
    const { result } = renderHook(() =>
      useFileAttachments({
        maxAttachments: 3,
        maxFileSize: 5 * 1024 * 1024,
        allowedTypes: ['image/png'],
      })
    );

    // Test that config is respected
    const largeFile = new File(
      [new ArrayBuffer(6 * 1024 * 1024)],
      'large.png',
      { type: 'image/png' }
    );

    act(() => {
      result.current.handleFileSelect({
        target: { files: [largeFile] },
      } as any);
    });

    // Should reject file (too large)
    expect(result.current.attachments).toHaveLength(0);
  });

  it('should be reusable across components', () => {
    // Simulate two components using same hook
    const { result: result1 } = renderHook(() => useFileAttachments());
    const { result: result2 } = renderHook(() => useFileAttachments());

    // Should be independent instances
    expect(result1.current.attachments).not.toBe(result2.current.attachments);

    // But should have same interface
    expect(Object.keys(result1.current)).toEqual(Object.keys(result2.current));
  });
});
```

### 3. Component Extraction Test

```typescript
import { render, screen } from '@testing-library/react';
import { AttachmentList } from './_components/shared/attachment-list';

describe('AttachmentList', () => {
  const mockAttachments = [
    { id: '1', file: new File([], 'a.jpg'), preview: 'blob:url1' },
    { id: '2', file: new File([], 'b.jpg'), preview: 'blob:url2' },
  ];

  it('should render all attachments', () => {
    const onRemove = jest.fn();

    render(<AttachmentList attachments={mockAttachments} onRemove={onRemove} />);

    expect(screen.getAllByRole('img')).toHaveLength(2);
  });

  it('should call onRemove when delete clicked', () => {
    const onRemove = jest.fn();

    render(<AttachmentList attachments={mockAttachments} onRemove={onRemove} />);

    const removeButtons = screen.getAllByRole('button');
    fireEvent.click(removeButtons[0]);

    expect(onRemove).toHaveBeenCalledWith('1');
  });

  it('should work in different contexts', () => {
    // Simulate using in two different forms
    const FormA = () => {
      const [attachments, setAttachments] = useState(mockAttachments);
      return (
        <AttachmentList
          attachments={attachments}
          onRemove={(id) => setAttachments(prev => prev.filter(a => a.id !== id))}
        />
      );
    };

    const FormB = () => {
      const [attachments, setAttachments] = useState(mockAttachments);
      return (
        <AttachmentList
          attachments={attachments}
          onRemove={(id) => setAttachments(prev => prev.filter(a => a.id !== id))}
        />
      );
    };

    const { container: containerA } = render(<FormA />);
    const { container: containerB } = render(<FormB />);

    // Should render identically
    expect(containerA.innerHTML).toEqual(containerB.innerHTML);
  });
});
```

### 4. Integration Test: Shared Code Usage

```typescript
describe('Forms using shared code', () => {
  it('TechnicalAnalysisForm and DDAnalysisForm should use shared attachments hook', () => {
    // Parse both files and verify they import the hook
    const technicalForm = fs.readFileSync(
      'apps/web/app/home/(user)/reports/new/_components/technical-analysis-form.tsx',
      'utf-8'
    );

    const ddForm = fs.readFileSync(
      'apps/web/app/home/(user)/reports/new/_components/due-diligence-analysis-form.tsx',
      'utf-8'
    );

    // Both should import the shared hook
    expect(technicalForm).toContain("import { useFileAttachments } from '../_lib/use-file-attachments'");
    expect(ddForm).toContain("import { useFileAttachments } from '../_lib/use-file-attachments'");

    // Neither should have duplicate implementation
    expect(technicalForm).not.toContain('const [attachments, setAttachments] = useState');
    expect(ddForm).not.toContain('const [attachments, setAttachments] = useState');
  });

  it('should use shared AttachmentList component', () => {
    const technicalForm = fs.readFileSync(
      'apps/web/app/home/(user)/reports/new/_components/technical-analysis-form.tsx',
      'utf-8'
    );

    const ddForm = fs.readFileSync(
      'apps/web/app/home/(user)/reports/new/_components/due-diligence-analysis-form.tsx',
      'utf-8'
    );

    // Both should use the component
    expect(technicalForm).toContain('<AttachmentList');
    expect(ddForm).toContain('<AttachmentList');

    // Neither should have inline attachment rendering
    expect(technicalForm).not.toMatch(/attachments\.map.*<div/);
    expect(ddForm).not.toMatch(/attachments\.map.*<div/);
  });
});
```

## Quick Reference

### Extraction Decision Tree

```
Is code duplicated?
├─ No → Continue
└─ Yes → How similar?
    ├─ 100% identical
    │   └─ Extract immediately (hook/component/util)
    ├─ 80-99% similar
    │   └─ Extract with parameterization
    ├─ 50-79% similar
    │   ├─ Business logic similar? → Extract logic
    │   └─ Just UI similar? → Extract component with variants
    └─ < 50% similar
        └─ Probably coincidental, keep separate
```

### Extract As

| What's Duplicated | Extract As | Location |
|-------------------|------------|----------|
| State + effects | Custom hook | `_lib/use-*.ts` |
| JSX structure | Component | `_components/shared/*.tsx` |
| Pure function | Utility | `_lib/utils/*.ts` |
| Type/interface | Type file | `_lib/types/*.ts` |
| Constants | Config file | `_lib/constants.ts` |
| Validation logic | Schema file | `_lib/schemas/*.ts` |

### Red Flags Checklist

- [ ] File created by copy-paste
- [ ] Same interface in 2+ files
- [ ] Same constants in 2+ files
- [ ] Fixed same bug in 2+ places
- [ ] Feature update required 2+ file changes
- [ ] Similar file names (user-x, team-x, project-x)
- [ ] Code review comment: "This looks like X file"

### Refactoring Safety

1. ✅ **Write tests first** - Capture current behavior
2. ✅ **Extract incrementally** - One piece at a time
3. ✅ **Keep old code temporarily** - Until new version is proven
4. ✅ **Run full test suite** - After each extraction
5. ✅ **Update all usages** - Don't leave orphans
6. ✅ **Delete old code** - After all usages updated

## Related Resources

- [DRY Principle](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)
- [React Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [Component Composition](https://react.dev/learn/passing-props-to-a-component)
- [Code Duplication Detection: jscpd](https://github.com/kucherenko/jscpd)
