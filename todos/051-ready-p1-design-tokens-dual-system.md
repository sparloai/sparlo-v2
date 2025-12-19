---
status: ready
priority: p1
issue_id: "051"
tags: [design-system, css, architecture, dark-mode]
dependencies: []
---

# Dual Design Token Systems Creating Conflict

## Problem Statement

The new `sparlo-tokens.css` introduces a parallel design token system that conflicts with existing Shadcn UI tokens in `theme.css`. This creates:
1. Token collisions (both define `--accent`)
2. Inconsistent naming conventions
3. Developer confusion about which system to use
4. Increased CSS bundle size

**Architecture Impact:** Violates Single Source of Truth principle; increases technical debt.

## Findings

- **Files:**
  - `apps/web/styles/sparlo-tokens.css` (new, 252 lines)
  - `apps/web/styles/theme.css` (existing Shadcn)
  - `apps/web/styles/globals.css` (imports both)

**Conflicting tokens:**
```css
/* NEW sparlo-tokens.css */
:root {
  --accent: var(--sparlo-violet);  /* ← Collision */
  --text-primary: var(--sparlo-gray-900);
  --surface-base: var(--sparlo-off-white);
}

/* EXISTING theme.css (Shadcn UI) */
:root {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --accent: 244.84 56.97% 50.59%;  /* ← Different value! */
}
```

**Naming inconsistencies:**
- Sparlo: `--text-primary`, `--surface-base`
- Shadcn: `--color-foreground`, `--background`

**Reviewers identifying this:**
- Architecture Review: P1 - Design Token System Duplication
- Pattern Recognition: P1 - CSS Token Pattern Duplication

## Proposed Solutions

### Option 1: Extend Existing Shadcn System

**Approach:** Add Sparlo tokens as extensions to existing system, not replacements.

```css
/* sparlo-tokens.css - Extend, don't replace */
@layer base {
  :root {
    /* Primitives (don't conflict with Shadcn) */
    --sparlo-violet-600: #7c3aed;
    --sparlo-gray-900: #111827;

    /* Semantic tokens that EXTEND Shadcn */
    --sparlo-accent: var(--sparlo-violet-600);
    --sparlo-text-primary: var(--sparlo-gray-900);

    /* Override Shadcn accent with Sparlo violet */
    --accent: var(--sparlo-violet-600);
  }
}
```

**Pros:**
- Minimal changes to existing code
- Clear namespacing with `--sparlo-` prefix
- Can gradually migrate

**Cons:**
- Still two conceptual systems
- Need to document which to use when

**Effort:** 2-3 hours

**Risk:** Low

---

### Option 2: Consolidate into Single Token System

**Approach:** Merge both systems into one comprehensive file.

```css
/* design-tokens.css - Single Source of Truth */
:root {
  /* Primitives */
  --gray-50: #fafafa;
  --gray-900: #111827;
  --violet-600: #7c3aed;

  /* Shadcn compatibility aliases */
  --background: var(--gray-50);
  --foreground: var(--gray-900);
  --accent: var(--violet-600);

  /* Semantic (Sparlo-specific) */
  --surface-base: var(--gray-50);
  --text-primary: var(--gray-900);
}
```

**Pros:**
- True single source of truth
- No naming conflicts
- Clear token hierarchy

**Cons:**
- Larger refactoring effort
- Risk of breaking Shadcn components
- Need to audit all uses

**Effort:** 6-8 hours

**Risk:** Medium

---

### Option 3: Move to Shared Package

**Approach:** Create `@kit/design-tokens` package.

```
packages/design-tokens/
├── src/
│   ├── primitives.css
│   ├── semantic.css
│   └── index.css
└── package.json
```

**Pros:**
- Reusable across apps
- Proper monorepo architecture
- Enables type-safe JS access

**Cons:**
- Largest refactoring effort
- Requires package setup
- Overkill if only used in web app

**Effort:** 8-12 hours

**Risk:** Medium

## Recommended Action

Implement Option 1 (extend existing) as immediate fix:

1. Prefix all Sparlo tokens with `--sparlo-` to avoid collisions
2. Keep Shadcn tokens for component library compatibility
3. Document token naming convention in CLAUDE.md
4. Create migration path for Option 2 in future sprint

## Technical Details

**Affected files:**
- `apps/web/styles/sparlo-tokens.css` - rename conflicting tokens
- Components using `--accent`, `--text-primary`, etc. - update references

**Token naming convention to document:**
```
Shadcn UI tokens: --background, --foreground, --accent (HSL values)
Sparlo tokens: --sparlo-* prefix for all custom tokens
Semantic tokens: --surface-*, --text-* for UI abstractions
```

## Acceptance Criteria

- [ ] No token name collisions between systems
- [ ] All Sparlo tokens use `--sparlo-` prefix
- [ ] Shadcn components still work correctly
- [ ] Dark mode works in both systems
- [ ] Documentation updated with token conventions
- [ ] Components updated to use correct tokens

## Work Log

### 2025-12-18 - Initial Discovery

**By:** Claude Code (Parallel Review Agents)

**Actions:**
- Identified by Architecture and Pattern Recognition reviewers
- Analyzed token overlap between systems
- Documented 3 consolidation approaches

**Learnings:**
- Shadcn uses HSL color values, Sparlo uses hex
- Token collision can cause subtle color bugs
- Namespacing is simplest immediate fix
