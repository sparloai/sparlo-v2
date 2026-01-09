---
module: UI
date: 2026-01-09
problem_type: ui_bug
component: frontend_stimulus
symptoms:
  - "React.Children.only expected to receive a single React element child"
  - "Application error on sign-in page"
  - "Client-side exception while loading sparlo.ai"
root_cause: logic_error
resolution_type: code_fix
severity: critical
tags: [react, radix-ui, slot, button, aschild, children]
---

# Troubleshooting: Button asChild Causing React.Children.only Error

## Problem
The sign-in page crashed with "React.Children.only expected to receive a single React element child" error when using Button with the `asChild` prop. This prevented users from accessing the authentication pages.

## Environment
- Module: UI Package (@kit/ui)
- Framework: React 19, Next.js 16, Radix UI
- Affected Component: Button component with asChild prop
- Date: 2026-01-09

## Symptoms
- Sign-in page shows "Application error: a client-side exception has occurred"
- Console error: `React.Children.only expected to receive a single React element child`
- Error occurs on page load, not on interaction
- All pages using `<Button asChild>` potentially affected

## What Didn't Work

**Direct solution:** The problem was identified through careful tracing of the Button component's implementation and understanding how Radix UI's Slot component works with React's children API.

## Solution

The fix separates the `asChild` case into its own return statement that only passes `{children}` to `Slot.Root`, avoiding any extra child expressions.

**Code changes** in `packages/ui/src/shadcn/button.tsx`:

```tsx
// Before (broken):
const Button: React.FC<ButtonProps> = ({
  asChild = false,
  loading = false,
  children,
  ...props
}) => {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp {...props}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </Comp>
  );
};

// After (fixed):
const Button: React.FC<ButtonProps> = ({
  asChild = false,
  loading = false,
  children,
  ...props
}) => {
  const Comp = asChild ? Slot.Root : 'button';

  // When using asChild with Slot.Root, we must pass exactly one child
  // The loading spinner is incompatible with asChild since Slot.Root
  // uses React.Children.only which throws on multiple children
  if (asChild) {
    return (
      <Comp {...props}>
        {children}
      </Comp>
    );
  }

  return (
    <Comp {...props}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </Comp>
  );
};
```

## Why This Works

1. **ROOT CAUSE**: Radix UI's `Slot.Root` component uses `React.Children.only()` internally, which throws an error if it receives anything other than exactly one React element child.

2. **The Bug**: The expression `{loading && <Loader2 />}` creates a child entry in React's children array even when `loading` is `false`. The expression evaluates to the boolean `false`, which React doesn't render but IS counted as a child by `React.Children.only()`.

3. **How JSX Handles This**:
   ```jsx
   <Slot.Root>
     {loading && <Loader2 />}  {/* Evaluates to `false` when loading=false */}
     {children}                 {/* The actual child element */}
   </Slot.Root>
   ```
   React sees this as `[false, <Link>]` - two children, not one.

4. **The Fix**: By separating the `asChild` case into its own return statement with only `{children}`, we ensure `Slot.Root` receives exactly one child element with no extra expressions.

## Prevention

- **Never mix conditional expressions with asChild**: When using Radix UI's Slot pattern (via `asChild`), the component must pass exactly one child element with no conditional siblings.

- **Pattern to avoid**:
  ```tsx
  // BAD - creates multiple children entries
  <SlotBasedComponent>
    {condition && <SomeElement />}
    {children}
  </SlotBasedComponent>
  ```

- **Safe pattern**:
  ```tsx
  // GOOD - separate code paths
  if (asChild) {
    return <SlotBasedComponent>{children}</SlotBasedComponent>;
  }
  return <RegularComponent>{condition && <Extra />}{children}</RegularComponent>;
  ```

- **Testing**: Add E2E tests that specifically navigate to pages using `<Button asChild>` to catch this class of error early.

## Related Issues

No related issues documented yet.
