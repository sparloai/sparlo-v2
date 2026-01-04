---
status: pending
priority: p3
issue_id: "180"
tags: [code-review, code-quality, subdomain]
dependencies: ["171"]
---

# Magic Strings in Path Configurations

## Problem Statement

Path arrays like `MAIN_DOMAIN_PATHS` and `PUBLIC_PATHS` contain hardcoded strings that should be derived from a central configuration.

**Why it matters**: Magic strings scattered across files make maintenance error-prone and can lead to inconsistencies.

## Findings

**Agent**: pattern-recognition-specialist, code-simplicity-reviewer

**Locations**:

```typescript
// proxy.ts
const MAIN_DOMAIN_PATHS = ['/auth', '/share', '/api', '/healthcheck'];
const PUBLIC_PATHS = ['/auth', '/healthcheck', '/api', '/share', '/_next', '/locales', '/images', '/assets'];

// callback/route.ts
const mainDomainPaths = ['/auth', '/share', '/api', '/healthcheck'];

// confirm/route.ts
const mainDomainPaths = ['/auth', '/share', '/api', '/healthcheck'];
```

**Issues**:
- Same paths defined in multiple files
- Inconsistent variable names (SCREAMING_CASE vs camelCase)
- Related to issue #171 (duplicated constants)

## Proposed Solution

### Consolidate into shared config (builds on #171)

```typescript
// apps/web/config/subdomain.config.ts
export const subdomainConfig = {
  // ... existing from #171 ...

  paths: {
    mainDomainOnly: ['/auth', '/share', '/api', '/healthcheck'],
    public: ['/auth', '/healthcheck', '/api', '/share', '/_next', '/locales', '/images', '/assets'],
  },

  isMainDomainPath(path: string): boolean {
    return this.paths.mainDomainOnly.some(
      prefix => path === prefix || path.startsWith(`${prefix}/`)
    );
  },

  isPublicPath(path: string): boolean {
    return this.paths.public.some(
      prefix => path === prefix || path.startsWith(`${prefix}/`)
    );
  },
} as const;
```

- **Pros**: Single source of truth, consistent naming
- **Cons**: Requires importing shared config
- **Effort**: Small (can be done with #171)
- **Risk**: Low

## Recommended Action

<!-- Leave blank - to be filled during triage -->

## Technical Details

**Affected Files**:
- `apps/web/proxy.ts`
- `apps/web/app/auth/callback/route.ts`
- `apps/web/app/auth/confirm/route.ts`

**Dependency**: Should be addressed together with #171 (duplicated constants)

## Acceptance Criteria

- [ ] All path arrays defined in single location
- [ ] Consistent naming conventions
- [ ] Path checking functions centralized
- [ ] No duplicate string literals

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-04 | Created from code review | Found via multiple agents |

## Resources

- PR/Commit: 3042c09
- Related: #171 (Duplicated Constants)

