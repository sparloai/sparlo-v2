# Prevention Strategy: Pattern Matching Performance

## Issue Summary

Running regex pattern matching on every keystroke without debouncing causes unnecessary CPU usage, input lag, and battery drain. With complex detection patterns (93 regex operations per keystroke in the example case), this becomes noticeable on slower devices.

## Warning Signs to Watch For

### Code Smells

1. **Regex in Render Path**
   ```typescript
   // ⚠️ RED FLAG: Pattern matching directly in render
   function Component() {
     return (
       <div>
         {hasPattern(inputText) && <Indicator />}
       </div>
     );
   }
   ```

2. **Multiple Pattern Checks Without Memoization**
   ```typescript
   // ⚠️ RED FLAG: All run on every render
   const hasProblem = patterns.some(p => p.test(text));
   const hasConstraints = constraints.some(p => p.test(text));
   const hasSuccess = success.some(p => p.test(text));
   ```

3. **onChange Handler Triggering Heavy Computation**
   ```typescript
   // ⚠️ RED FLAG: validateInput() runs on every keystroke
   <input
     onChange={(e) => {
       setText(e.target.value);
       validateInput(e.target.value); // Expensive!
     }}
   />
   ```

4. **Large Pattern Arrays**
   ```typescript
   // ⚠️ RED FLAG: 18+ patterns to check
   const PATTERNS = [
     /pattern1/i, /pattern2/i, /pattern3/i, // ... 15 more
   ];
   ```

### Runtime Indicators

1. **Input Lag**
   - Noticeable delay between keystroke and character appearing
   - Especially on mobile or older devices

2. **High CPU Usage**
   - Chrome DevTools > Performance tab
   - Yellow bars (scripting) spike with each keystroke
   - Frame drops during typing

3. **Battery Drain**
   - Unusual battery usage on mobile during typing
   - Device heating up during text entry

4. **Performance Metrics**
   ```javascript
   // Log execution time
   console.time('pattern-check');
   const result = checkPatterns(text);
   console.timeEnd('pattern-check');
   // If consistently > 16ms (one frame), it's a problem
   ```

## Prevention Checklist

### Design Phase

- [ ] **Identify pattern matching needs** - Where will regex be used?
- [ ] **Estimate pattern count** - How many patterns per input?
- [ ] **Calculate operations** - patterns × keystrokes/sec (typical: 3-5)
- [ ] **Threshold check** - If > 20 operations/sec, plan debouncing
- [ ] **Consider alternatives** - Can simple string methods replace regex?

### Implementation Phase

- [ ] **Use debouncing for user input** - `useDeferredValue` or custom debounce
- [ ] **Memoize pattern results** - `useMemo` to prevent re-computation
- [ ] **Compile patterns once** - Store compiled RegExp objects, not strings
- [ ] **Consider Web Workers** - For extremely heavy pattern matching
- [ ] **Add loading states** - Show user that processing is happening

### Code Review Checklist

- [ ] Search for `.test(`, `.match(`, `.exec(` in components
- [ ] Check if pattern matching is in render path
- [ ] Verify `useMemo` or debouncing is used for expensive checks
- [ ] Confirm patterns are defined outside component (not re-created)
- [ ] Test typing speed on slower devices

## When to Use Debouncing

### Always Debounce

1. **User Input Validation**
   - Email format checking
   - Password strength indicators
   - Search suggestions

2. **Multiple Pattern Checks**
   - > 10 patterns to check
   - OR > 5 patterns × > 3 checks = 15+ operations

3. **Expensive Computations**
   - Any operation taking > 16ms (one frame)
   - Complex regex with lookaheads/lookbehinds

### Sometimes Debounce

1. **Single Simple Pattern**
   - One simple regex: debounce if noticeable lag
   - Use performance profiling to decide

2. **Visual Indicators**
   - If user expects immediate feedback, use `useDeferredValue` (non-blocking)
   - If slight delay is acceptable, use traditional debounce (300ms)

### Don't Need to Debounce

1. **Post-Submit Validation**
   - Runs once on form submit, not per keystroke

2. **Simple String Operations**
   - `.includes()`, `.startsWith()`, `.length`
   - Fast enough even on every keystroke

3. **Single Simple Pattern on Short Text**
   - `< 5` patterns on text `< 100` characters
   - Test on low-end device to confirm

## Debouncing Techniques

### Technique 1: useDeferredValue (React 18+)

**Best for:** Visual indicators, non-critical updates

```typescript
// ✅ CORRECT: React-native debouncing
function DetectionForm() {
  const [text, setText] = useState('');

  // Deferred value updates in background, doesn't block typing
  const deferredText = useDeferredValue(text);

  // Expensive computation only on deferred value
  const detectionResults = useMemo(() => ({
    hasProblem: checkPatterns(PROBLEM_PATTERNS, deferredText),
    hasConstraints: checkPatterns(CONSTRAINT_PATTERNS, deferredText),
    hasSuccess: checkPatterns(SUCCESS_PATTERNS, deferredText),
  }), [deferredText]);

  return (
    <>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <DetectionIndicator results={detectionResults} />
    </>
  );
}

function checkPatterns(patterns: RegExp[], text: string): boolean {
  return patterns.some(p => p.test(text));
}
```

**Pros:**
- Built into React 18+
- Non-blocking (typing is never delayed)
- Automatic priority management

**Cons:**
- Requires React 18+
- Indicator update has slight delay (usually imperceptible)

### Technique 2: Custom Debounce Hook

**Best for:** Search, API calls, controlled delay timing

```typescript
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Usage
function SearchForm() {
  const [searchText, setSearchText] = useState('');
  const debouncedSearchText = useDebounce(searchText, 300);

  const searchResults = useMemo(() => {
    return performExpensiveSearch(debouncedSearchText);
  }, [debouncedSearchText]);

  return (
    <input
      value={searchText}
      onChange={(e) => setSearchText(e.target.value)}
    />
  );
}
```

**Pros:**
- Fine-grained control over delay
- Compatible with older React versions

**Cons:**
- Manual timing management
- User sees delay before feedback

### Technique 3: Throttle (Alternative)

**Best for:** Scroll events, resize handlers

```typescript
function useThrottle<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const timer = setTimeout(() => {
      if (Date.now() - lastRan.current >= interval) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, interval - (Date.now() - lastRan.current));

    return () => clearTimeout(timer);
  }, [value, interval]);

  return throttledValue;
}
```

**Difference from Debounce:**
- Debounce: Waits for pause in input
- Throttle: Guarantees execution at regular intervals

**Use throttle when:** You want periodic updates during continuous input (e.g., scroll position tracking)

### Technique 4: useMemo Only (No Debounce)

**Best for:** Moderately expensive operations (5-15ms)

```typescript
function ModerateCostForm() {
  const [text, setText] = useState('');

  // Runs on every text change, but only once per change (not per render)
  const validationResult = useMemo(() => {
    return validateWithPatterns(text); // ~10ms operation
  }, [text]);

  return (
    <textarea
      value={text}
      onChange={(e) => setText(e.target.value)}
    />
  );
}
```

**When to use:**
- Operation takes < 16ms
- User expects immediate feedback
- Pattern count is moderate (< 10)

## Test Cases

### 1. Unit Test: Debounce Hook

```typescript
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './use-debounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should debounce value updates', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } }
    );

    expect(result.current).toBe('initial');

    // Update value
    rerender({ value: 'updated', delay: 300 });

    // Should NOT update immediately
    expect(result.current).toBe('initial');

    // Fast-forward time by 299ms
    act(() => {
      jest.advanceTimersByTime(299);
    });

    // Still old value
    expect(result.current).toBe('initial');

    // Fast-forward to 300ms
    act(() => {
      jest.advanceTimersByTime(1);
    });

    // Now updated
    expect(result.current).toBe('updated');
  });

  it('should cancel pending update on value change', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'first', delay: 300 } }
    );

    rerender({ value: 'second', delay: 300 });

    act(() => {
      jest.advanceTimersByTime(150);
    });

    // Change again before timeout
    rerender({ value: 'third', delay: 300 });

    // Fast-forward 300ms from first update
    act(() => {
      jest.advanceTimersByTime(150);
    });

    // Should still be initial (first update was cancelled)
    expect(result.current).toBe('first');

    // Fast-forward another 300ms
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Now should be 'third'
    expect(result.current).toBe('third');
  });
});
```

### 2. Performance Test: Pattern Matching

```typescript
describe('Pattern Matching Performance', () => {
  const PROBLEM_PATTERNS = [
    /need to/i, /trying to/i, /want to/i, // ... 15 more patterns
  ];

  const LONG_TEXT = 'We are trying to solve a problem...'.repeat(10);

  it('should complete pattern check within performance budget', () => {
    const start = performance.now();

    const result = PROBLEM_PATTERNS.some(p => p.test(LONG_TEXT));

    const duration = performance.now() - start;

    // Should complete in less than one frame (16ms)
    expect(duration).toBeLessThan(16);
  });

  it('should cache compiled patterns', () => {
    // Patterns defined outside component should be same instance
    const patterns1 = PROBLEM_PATTERNS;
    const patterns2 = PROBLEM_PATTERNS;

    expect(patterns1).toBe(patterns2); // Same reference
  });

  it('should memoize results for same input', () => {
    const checkPatterns = jest.fn((text) =>
      PROBLEM_PATTERNS.some(p => p.test(text))
    );

    const Component = () => {
      const [text] = useState('test');
      const result = useMemo(() => checkPatterns(text), [text]);
      return <div>{result}</div>;
    };

    const { rerender } = render(<Component />);

    // Initial call
    expect(checkPatterns).toHaveBeenCalledTimes(1);

    // Rerender with same text
    rerender(<Component />);

    // Should NOT call again (memoized)
    expect(checkPatterns).toHaveBeenCalledTimes(1);
  });
});
```

### 3. Integration Test: Typing Performance

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Detection Form - Typing Performance', () => {
  it('should handle fast typing without lag', async () => {
    const user = userEvent.setup({ delay: null }); // Instant typing

    render(<DetectionForm />);

    const textarea = screen.getByRole('textbox');

    // Measure time to type 100 characters
    const start = performance.now();

    await user.type(textarea, 'a'.repeat(100));

    const duration = performance.now() - start;

    // Should handle 100 keystrokes in < 500ms (even with pattern checks)
    expect(duration).toBeLessThan(500);
  });

  it('should update indicators with acceptable delay', async () => {
    const user = userEvent.setup();

    render(<DetectionForm />);

    const textarea = screen.getByRole('textbox');

    await user.type(textarea, 'I need to solve this problem');

    // Indicator should update within 500ms
    const indicator = await screen.findByText(/problem detected/i, {}, {
      timeout: 500,
    });

    expect(indicator).toBeInTheDocument();
  });
});
```

### 4. E2E Test: Real-World Performance

```typescript
import { test, expect } from '@playwright/test';

test('typing performance in detection form', async ({ page }) => {
  await page.goto('/reports/new');

  const textarea = page.locator('textarea[data-test="challenge-input"]');

  // Type long text quickly
  const longText = 'I need to solve this critical problem with budget constraints and tight deadlines achieving 90% efficiency';

  const startTime = Date.now();

  await textarea.type(longText, { delay: 10 }); // 10ms between keys (fast typing)

  const typeTime = Date.now() - startTime;

  // Should complete within 2 seconds (includes network latency)
  expect(typeTime).toBeLessThan(2000);

  // Indicators should appear
  await expect(page.locator('[data-test="problem-indicator"]')).toHaveClass(/detected/);
  await expect(page.locator('[data-test="constraints-indicator"]')).toHaveClass(/detected/);
  await expect(page.locator('[data-test="success-indicator"]')).toHaveClass(/detected/);
});

test('CPU usage during typing', async ({ page }) => {
  await page.goto('/reports/new');

  // Start performance monitoring
  await page.evaluate(() => {
    (window as any).performanceData = [];
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        (window as any).performanceData.push(entry.duration);
      }
    });
    observer.observe({ entryTypes: ['measure'] });
  });

  const textarea = page.locator('textarea[data-test="challenge-input"]');

  // Type with measurement
  await page.evaluate(() => {
    performance.mark('typing-start');
  });

  await textarea.type('a'.repeat(100), { delay: 50 });

  await page.evaluate(() => {
    performance.mark('typing-end');
    performance.measure('typing-duration', 'typing-start', 'typing-end');
  });

  // Get performance data
  const performanceData = await page.evaluate(() => {
    return (window as any).performanceData;
  });

  // No single operation should take > 16ms
  const slowOperations = performanceData.filter((d: number) => d > 16);
  expect(slowOperations.length).toBeLessThan(5); // Allow a few outliers
});
```

## Common Patterns & Solutions

### Pattern 1: Live Validation Indicator

```typescript
// ❌ WRONG: No debouncing
function EmailInput() {
  const [email, setEmail] = useState('');
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); // Runs on every keystroke

  return (
    <div>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      {isValid ? '✓' : '✗'}
    </div>
  );
}

// ✅ CORRECT: Debounced validation
function EmailInput() {
  const [email, setEmail] = useState('');
  const debouncedEmail = useDeferredValue(email);
  const isValid = useMemo(() =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(debouncedEmail),
    [debouncedEmail]
  );

  return (
    <div>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      {isValid ? '✓' : '✗'}
    </div>
  );
}
```

### Pattern 2: Multiple Detection Indicators

```typescript
// ❌ WRONG: Multiple inline checks
function DetectionForm() {
  const [text, setText] = useState('');

  return (
    <div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
      <Indicator label="Problem" detected={/problem/i.test(text)} />
      <Indicator label="Solution" detected={/solution/i.test(text)} />
      <Indicator label="Constraint" detected={/must|cannot/i.test(text)} />
    </div>
  );
}

// ✅ CORRECT: Memoized detection results
function DetectionForm() {
  const [text, setText] = useState('');
  const deferredText = useDeferredValue(text);

  const detection = useMemo(() => ({
    hasProblem: /problem/i.test(deferredText),
    hasSolution: /solution/i.test(deferredText),
    hasConstraint: /must|cannot/i.test(deferredText),
  }), [deferredText]);

  return (
    <div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
      <Indicator label="Problem" detected={detection.hasProblem} />
      <Indicator label="Solution" detected={detection.hasSolution} />
      <Indicator label="Constraint" detected={detection.hasConstraint} />
    </div>
  );
}
```

### Pattern 3: Search Suggestions

```typescript
// ❌ WRONG: API call on every keystroke
function SearchInput() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    const suggestions = await fetchSuggestions(value); // ❌ Too many calls!
    setResults(suggestions);
  };

  return <input value={query} onChange={handleChange} />;
}

// ✅ CORRECT: Debounced API calls
function SearchInput() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) {
      fetchSuggestions(debouncedQuery).then(setResults);
    }
  }, [debouncedQuery]);

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
  );
}
```

## Quick Reference

### Decision Matrix

| Scenario | Technique | Delay | Reason |
|----------|-----------|-------|--------|
| Visual indicator (non-critical) | `useDeferredValue` | Auto | Non-blocking, React-native |
| Search suggestions | `useDebounce` | 300ms | Wait for user to pause |
| Email validation | `useDebounce` | 500ms | Wait for complete input |
| Scroll position tracking | `useThrottle` | 100ms | Periodic updates during scroll |
| Simple string check | `useMemo` only | 0ms | Fast enough without debounce |
| Password strength | `useDebounce` | 300ms | Wait for typing pause |
| Autocomplete | `useDebounce` | 200ms | Balance between UX and API calls |

### Performance Budgets

```
Single regex pattern:     < 1ms   (no debounce needed)
5-10 patterns:           1-5ms   (useMemo sufficient)
10-20 patterns:         5-15ms   (useDeferredValue recommended)
20+ patterns:           15ms+    (useDebounce required)
API calls:              Always   (debounce 200-500ms)
```

### Code Review Checklist

```bash
# Find pattern matching in components
grep -r "\.test\(" --include="*.tsx" | grep -v "spec.tsx"

# Find potential heavy operations in onChange
grep -r "onChange.*{" --include="*.tsx" -A 5

# Check for useMemo/useDeferredValue usage
grep -r "useMemo\|useDeferredValue" --include="*.tsx"
```

## Related Resources

- [React useDeferredValue](https://react.dev/reference/react/useDeferredValue)
- [React useMemo](https://react.dev/reference/react/useMemo)
- [Regex Performance](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#using_regular_expressions_in_javascript)
- [Web Performance: Input Responsiveness](https://web.dev/inp/)
