# Prevention Strategy: Error Message Exposure

## Issue Summary

Displaying raw error messages from the backend exposes sensitive internal details like database schema, table names, constraint names, RLS policies, and implementation details. This information helps attackers understand your system and craft targeted attacks.

## Warning Signs to Watch For

### Code Smells

1. **Direct Error Display**
   ```typescript
   // ⚠️ RED FLAG: Showing raw error to user
   catch (error) {
     setError(error.message); // ❌ Could expose DB details
   }
   ```

2. **Error Passed Through Multiple Layers**
   ```typescript
   // ⚠️ RED FLAG: Error message travels to client unchanged
   // Server:
   throw new Error(`DB Error: ${dbError.message}`);
   // Client:
   toast.error(error.message); // Shows DB details
   ```

3. **Stack Traces in Production**
   ```typescript
   // ⚠️ RED FLAG: Full error details in UI
   <pre>{JSON.stringify(error, null, 2)}</pre>
   ```

4. **Generic Catch-All**
   ```typescript
   // ⚠️ RED FLAG: Catches everything, shows everything
   catch (error) {
     alert(String(error)); // Could be anything
   }
   ```

5. **No Error Sanitization Layer**
   ```typescript
   // ⚠️ RED FLAG: No sanitization before displaying
   async function submitForm() {
     try {
       await api.createUser(data);
     } catch (error) {
       return <ErrorMessage error={error} />; // No sanitization!
     }
   }
   ```

### Information Leakage Examples

**Database Schema Exposure:**
```
❌ Error: duplicate key value violates unique constraint "users_email_key"
   Reveals: table name, column name, constraint name

✅ Better: An account with this email already exists.
```

**RLS Policy Exposure:**
```
❌ Error: new row violates row-level security policy "users_tenant_isolation" for table "users"
   Reveals: table name, RLS policy name, security mechanism

✅ Better: You don't have permission to perform this action.
```

**Implementation Details:**
```
❌ Error: Failed to connect to database at postgres://user@db.internal:5432/production
   Reveals: database host, user, internal network structure

✅ Better: Service temporarily unavailable. Please try again.
```

**Business Logic:**
```
❌ Error: User has 5 active sessions, maximum is 5
   Reveals: session limits, implementation details

✅ Better: Too many active sessions. Please log out from another device.
```

## Security Best Practices

### Principle 1: Defense in Depth

**Multiple layers of error sanitization:**

```
Database Error
    ↓
Server-Side Sanitization (first line of defense)
    ↓
API Response Sanitization (second line)
    ↓
Client-Side Sanitization (last resort)
    ↓
User-Friendly Message
```

### Principle 2: Log Everything, Show Little

```typescript
// ✅ CORRECT: Full details in logs, sanitized for user
try {
  await dangerousOperation();
} catch (error) {
  // Log full error server-side for debugging
  console.error('Operation failed:', {
    error,
    stack: error.stack,
    user: userId,
    timestamp: new Date().toISOString(),
  });

  // Show sanitized message to user
  throw new Error('Operation failed. Please contact support.');
}
```

### Principle 3: Error Categorization

Group errors into categories, each with its own user message:

| Category | Example Errors | User Message |
|----------|---------------|--------------|
| Validation | Required field, invalid format | Specific field error |
| Permission | RLS violation, unauthorized | "You don't have permission" |
| Not Found | Record doesn't exist | "Not found" |
| Conflict | Duplicate key, constraint violation | "Already exists" |
| Rate Limit | Too many requests | "Please slow down" |
| Server Error | Database down, timeout | "Service unavailable" |
| Network | Connection failed, timeout | "Connection error" |

### Principle 4: Never Trust Error Source

```typescript
// ❌ WRONG: Assuming error is safe
function displayError(error: unknown) {
  // What if error comes from third-party library?
  // What if it contains stack trace, credentials, etc.?
  return error.message;
}

// ✅ CORRECT: Always sanitize
function displayError(error: unknown): string {
  return sanitizeError(error);
}
```

## Prevention Checklist

### Before Writing Code

- [ ] **Plan error handling** - Where will errors be caught? How sanitized?
- [ ] **Define error categories** - What types of errors can occur?
- [ ] **Design user messages** - What should user see for each category?
- [ ] **Set up logging** - Where will full errors be logged?

### During Implementation

- [ ] **Create sanitization utility** - Centralized error mapping
  ```typescript
  // _lib/utils/sanitize-error.ts
  export function sanitizeError(error: unknown): string { ... }
  ```

- [ ] **Sanitize at source** - In server actions/API routes
  ```typescript
  try {
    await operation();
  } catch (error) {
    console.error('Full error:', error);
    throw new Error(sanitizeError(error)); // Sanitize before throwing
  }
  ```

- [ ] **Sanitize on receipt** - In client components as backup
  ```typescript
  try {
    await serverAction();
  } catch (error) {
    setError(sanitizeError(error)); // Sanitize again (defense in depth)
  }
  ```

- [ ] **Never show stack traces** - In production
  ```typescript
  if (process.env.NODE_ENV !== 'production') {
    console.error(error.stack);
  }
  ```

### Code Review Checklist

- [ ] Search for `.message` in error handlers
  ```bash
  grep -r "error\.message" --include="*.tsx" --include="*.ts"
  ```

- [ ] Verify no `error.stack` in UI code
  ```bash
  grep -r "error\.stack" --include="*.tsx"
  ```

- [ ] Check for raw error display
  ```bash
  grep -r "toast.*error\|alert.*error\|throw error" --include="*.tsx"
  ```

- [ ] Confirm logging before sanitization
  ```bash
  # Should find console.error BEFORE sanitization
  grep -B 3 "sanitizeError" **/*.ts
  ```

### Testing Checklist

- [ ] **Test with real errors** - Trigger actual DB errors
- [ ] **Verify no schema exposure** - Check UI doesn't show table names
- [ ] **Check production logs** - Full errors logged server-side?
- [ ] **Penetration test** - Can attacker extract info from errors?

## Implementation Patterns

### Pattern 1: Server-Side Sanitization (Recommended)

```typescript
// apps/web/app/api/users/route.ts
import { enhanceRouteHandler } from '@kit/next/routes';
import { sanitizeError } from '~/lib/security/sanitize-error';

export const POST = enhanceRouteHandler(
  async ({ body, user }) => {
    try {
      const result = await db.users.create({
        data: body,
      });

      return NextResponse.json({ success: true, data: result });
    } catch (error) {
      // Log full error server-side
      console.error('Failed to create user:', {
        error,
        userId: user.id,
        body,
        timestamp: new Date().toISOString(),
      });

      // Return sanitized error to client
      throw new Error(sanitizeError(error));
    }
  },
  { auth: true, schema: CreateUserSchema }
);
```

### Pattern 2: Centralized Error Sanitizer

```typescript
// lib/security/sanitize-error.ts

/**
 * Sanitizes error messages to prevent information disclosure.
 * Logs full error details server-side.
 */
export function sanitizeError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'An unexpected error occurred. Please try again.';
  }

  const message = error.message.toLowerCase();

  // Database constraint violations
  if (message.includes('duplicate') || message.includes('unique constraint')) {
    return 'This item already exists. Please use a different value.';
  }

  if (message.includes('unique_violation')) {
    return 'A record with this information already exists.';
  }

  // Foreign key violations
  if (message.includes('foreign key') || message.includes('violates')) {
    return 'Invalid reference. The related item may not exist.';
  }

  // Permission/RLS errors
  if (
    message.includes('permission') ||
    message.includes('rls') ||
    message.includes('row-level security') ||
    message.includes('access denied') ||
    message.includes('policy')
  ) {
    return 'You do not have permission to perform this action.';
  }

  // Rate limiting
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  // Resource limits
  if (
    message.includes('usage') ||
    message.includes('quota') ||
    message.includes('limit exceeded')
  ) {
    // These are often business errors we want to show
    // Extract just the limit info, not implementation details
    const limitMatch = message.match(/limit: (\d+)/);
    if (limitMatch) {
      return `Limit exceeded. Maximum: ${limitMatch[1]}`;
    }
    return 'Resource limit exceeded. Please upgrade your plan.';
  }

  // Token/auth errors (may want to preserve for UX)
  if (
    message.includes('token') &&
    (message.includes('usage') || message.includes('insufficient'))
  ) {
    // Re-throw these so they can be handled specially
    throw error;
  }

  // Network errors
  if (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('connection') ||
    message.includes('econnrefused')
  ) {
    return 'Network error. Please check your connection and try again.';
  }

  // Not found errors
  if (message.includes('not found') || message.includes('does not exist')) {
    return 'The requested item was not found.';
  }

  // Validation errors (often safe to show)
  if (message.includes('validation') || message.includes('invalid')) {
    // Only show if it's a simple validation message
    if (error.message.length < 100 && !message.includes('table')) {
      return error.message;
    }
    return 'Validation failed. Please check your input.';
  }

  // Default: Generic error
  return 'An error occurred. Please try again or contact support.';
}
```

### Pattern 3: Typed Error System

```typescript
// lib/errors/app-errors.ts

export class AppError extends Error {
  constructor(
    public userMessage: string,
    public internalMessage: string,
    public statusCode: number = 500,
    public metadata?: Record<string, unknown>
  ) {
    super(internalMessage);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(
      `Validation failed: ${message}`,
      `Validation error on field: ${field}`,
      400,
      { field }
    );
    this.name = 'ValidationError';
  }
}

export class PermissionError extends AppError {
  constructor(resource: string) {
    super(
      'You do not have permission to perform this action.',
      `Permission denied for resource: ${resource}`,
      403,
      { resource }
    );
    this.name = 'PermissionError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      'The requested item was not found.',
      `Resource not found: ${resource} (id: ${id})`,
      404,
      { resource, id }
    );
    this.name = 'NotFoundError';
  }
}

// Usage in server action:
export async function deleteUser(userId: string) {
  const user = await db.users.findUnique({ where: { id: userId } });

  if (!user) {
    throw new NotFoundError('user', userId);
  }

  if (user.role === 'admin') {
    throw new PermissionError('admin user deletion');
  }

  try {
    await db.users.delete({ where: { id: userId } });
  } catch (error) {
    console.error('Failed to delete user:', error);
    throw new AppError(
      'Failed to delete user. Please try again.',
      `Database error: ${error.message}`,
      500,
      { userId, originalError: error }
    );
  }
}

// Client-side handler:
try {
  await deleteUser(id);
} catch (error) {
  if (error instanceof AppError) {
    toast.error(error.userMessage); // Safe to show
    console.error(error.internalMessage); // Full details in console
  } else {
    toast.error('An unexpected error occurred');
  }
}
```

### Pattern 4: Error Boundary with Sanitization

```typescript
// components/error-boundary.tsx
'use client';

import { Component, ReactNode } from 'react';
import { sanitizeError } from '~/lib/security/sanitize-error';

interface Props {
  children: ReactNode;
  fallback?: (error: string) => ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    // Log full error
    console.error('ErrorBoundary caught:', error);

    // Sanitize for display
    return {
      hasError: true,
      errorMessage: sanitizeError(error),
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Send to error tracking service (with full details)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: true,
      });
    }

    // Log full details server-side
    console.error('Error details:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.errorMessage);
      }

      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded">
          <h2 className="text-lg font-semibold text-red-800">
            Something went wrong
          </h2>
          <p className="mt-2 text-red-700">{this.state.errorMessage}</p>
          <button
            onClick={() => this.setState({ hasError: false, errorMessage: '' })}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Test Cases

### 1. Unit Test: Error Sanitization

```typescript
import { sanitizeError } from '~/lib/security/sanitize-error';

describe('sanitizeError', () => {
  it('should sanitize database constraint violations', () => {
    const dbError = new Error(
      'duplicate key value violates unique constraint "users_email_key"'
    );

    const result = sanitizeError(dbError);

    expect(result).not.toContain('users_email_key');
    expect(result).not.toContain('constraint');
    expect(result).toContain('already exists');
  });

  it('should sanitize RLS policy errors', () => {
    const rlsError = new Error(
      'new row violates row-level security policy "users_tenant_isolation" for table "users"'
    );

    const result = sanitizeError(rlsError);

    expect(result).not.toContain('users_tenant_isolation');
    expect(result).not.toContain('table');
    expect(result).toContain('permission');
  });

  it('should sanitize foreign key violations', () => {
    const fkError = new Error(
      'insert or update on table "posts" violates foreign key constraint "posts_user_id_fkey"'
    );

    const result = sanitizeError(fkError);

    expect(result).not.toContain('posts_user_id_fkey');
    expect(result).not.toContain('table');
    expect(result).toContain('Invalid reference');
  });

  it('should handle network errors', () => {
    const networkError = new Error('ECONNREFUSED: Connection refused at 192.168.1.100:5432');

    const result = sanitizeError(networkError);

    expect(result).not.toContain('192.168.1.100');
    expect(result).not.toContain('5432');
    expect(result).toContain('Network error');
  });

  it('should handle unknown errors safely', () => {
    const weirdError = { toString: () => 'Something broke' };

    const result = sanitizeError(weirdError);

    expect(result).toContain('unexpected error');
  });

  it('should preserve safe validation errors', () => {
    const validationError = new Error('Email is required');

    const result = sanitizeError(validationError);

    expect(result).toContain('Email is required');
  });

  it('should NOT preserve errors with table names', () => {
    const validationError = new Error('Invalid value for users.email');

    const result = sanitizeError(validationError);

    expect(result).not.toContain('users.email');
    expect(result).toContain('Validation failed');
  });
});
```

### 2. Integration Test: Server Action Error Handling

```typescript
import { startReportGeneration } from './_lib/server/sparlo-reports-server-actions';

describe('Server Actions - Error Sanitization', () => {
  it('should sanitize database errors', async () => {
    // Mock database error
    jest.spyOn(db.reports, 'create').mockRejectedValue(
      new Error('duplicate key value violates unique constraint "reports_id_key"')
    );

    await expect(
      startReportGeneration({ designChallenge: 'test' })
    ).rejects.toThrow();

    // Error message should NOT contain table/constraint names
    try {
      await startReportGeneration({ designChallenge: 'test' });
    } catch (error) {
      expect(error.message).not.toContain('reports_id_key');
      expect(error.message).not.toContain('constraint');
    }
  });

  it('should log full error server-side', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    jest.spyOn(db.reports, 'create').mockRejectedValue(
      new Error('Database connection failed')
    );

    try {
      await startReportGeneration({ designChallenge: 'test' });
    } catch {
      // Ignore
    }

    // Full error should be logged
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Database connection failed'),
      expect.any(Object)
    );

    consoleSpy.mockRestore();
  });
});
```

### 3. E2E Test: No Information Disclosure

```typescript
import { test, expect } from '@playwright/test';

test('should not expose database schema in errors', async ({ page }) => {
  await page.goto('/reports/new');

  // Intercept network requests
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Fill form with duplicate data (should trigger constraint violation)
  await page.fill('textarea[data-test="challenge-input"]', 'Test challenge');
  await page.click('button[data-test="challenge-submit"]');

  // Wait for error
  await page.waitForSelector('[role="alert"]', { timeout: 5000 }).catch(() => {});

  // Check UI for sensitive info
  const errorText = await page.textContent('[role="alert"]');

  // Should NOT contain DB-specific terms
  expect(errorText).not.toContain('constraint');
  expect(errorText).not.toContain('violates');
  expect(errorText).not.toContain('table');
  expect(errorText).not.toContain('_key');
  expect(errorText).not.toContain('postgres');
  expect(errorText).not.toContain('policy');

  // Console errors should also be sanitized in production
  const dbTerms = ['constraint', 'table', 'violates', 'policy'];
  const exposedTerms = errors.filter((err) =>
    dbTerms.some((term) => err.toLowerCase().includes(term))
  );

  if (process.env.NODE_ENV === 'production') {
    expect(exposedTerms).toHaveLength(0);
  }
});

test('should show user-friendly error messages', async ({ page }) => {
  await page.goto('/reports/new');

  // Trigger validation error
  await page.click('button[data-test="challenge-submit"]');

  const errorText = await page.textContent('[role="alert"]');

  // Should contain user-friendly message
  expect(errorText).toMatch(/minimum|required|please|try again/i);
});
```

### 4. Security Test: Penetration Testing

```typescript
describe('Security - Error Message Enumeration', () => {
  it('should not reveal user existence through errors', async () => {
    // Try to login with non-existent user
    const response1 = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: 'password',
      }),
    });

    const error1 = await response1.json();

    // Try to login with existing user but wrong password
    const response2 = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'existing@example.com',
        password: 'wrongpassword',
      }),
    });

    const error2 = await response2.json();

    // Both should return SAME error message
    // (Otherwise attacker can enumerate users)
    expect(error1.message).toBe(error2.message);
    expect(error1.message).toBe('Invalid email or password');
  });

  it('should not reveal internal paths in errors', async () => {
    // Trigger various errors
    const responses = await Promise.all([
      fetch('/api/invalid-endpoint'),
      fetch('/api/users/999999'), // Non-existent ID
      fetch('/api/restricted'), // Unauthorized
    ]);

    const errors = await Promise.all(responses.map((r) => r.json()));

    // Check that NO error contains file paths
    errors.forEach((error) => {
      expect(error.message).not.toMatch(/\/[a-z-]+\/[a-z-]+\.ts/);
      expect(error.message).not.toMatch(/apps\/web\//);
      expect(error.message).not.toContain('node_modules');
    });
  });
});
```

## Quick Reference

### Common Error Patterns to Sanitize

| Pattern | Contains | User Message |
|---------|----------|--------------|
| Duplicate key | `duplicate`, `unique constraint` | "Already exists" |
| Foreign key | `foreign key`, `violates` | "Invalid reference" |
| RLS violation | `rls`, `row-level security`, `policy` | "Permission denied" |
| Not found | `not found`, `does not exist` | "Not found" |
| Rate limit | `rate limit`, `too many requests` | "Please slow down" |
| Network error | `ECONNREFUSED`, `timeout`, `connection` | "Network error" |
| Database down | `connect`, `database`, `pool` | "Service unavailable" |

### Red Flags in Error Messages

```typescript
// ❌ BAD - Reveals too much
"Error: duplicate key value violates unique constraint \"users_email_key\""
"Error: new row violates row-level security policy \"tenant_isolation\""
"Error: insert or update on table \"posts\" violates foreign key"
"Error: Failed to connect to postgres://user@internal-db:5432/prod"

// ✅ GOOD - Safe for users
"An account with this email already exists"
"You don't have permission to perform this action"
"Invalid reference. The related item may not exist"
"Service temporarily unavailable. Please try again"
```

### Error Sanitization Checklist

- [ ] Full error logged server-side with context
- [ ] Sanitized error returned to client
- [ ] No table names in error messages
- [ ] No constraint names in error messages
- [ ] No RLS policy names in error messages
- [ ] No file paths or stack traces
- [ ] No IP addresses or internal URLs
- [ ] No database connection strings
- [ ] User gets actionable feedback
- [ ] Error tracking system receives full details

### Code Review Commands

```bash
# Find potential error exposures
grep -r "throw new Error.*error\.message" --include="*.ts"
grep -r "error\.message" --include="*.tsx"
grep -r "error\.stack" --include="*.tsx"

# Find missing sanitization
grep -r "catch.*{" -A 5 --include="*.ts" | grep -v "sanitizeError"

# Check for console.error before throw (good pattern)
grep -B 2 "throw new Error" --include="*.ts" | grep "console.error"
```

## Related Resources

- [OWASP: Error Handling](https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html)
- [CWE-209: Information Exposure Through Error Message](https://cwe.mitre.org/data/definitions/209.html)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
