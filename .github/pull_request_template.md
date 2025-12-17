# Pull Request: [Feature/Fix Name]

## Description
<!-- Brief description of changes -->

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Performance improvement
- [ ] Documentation
- [ ] Security improvement
- [ ] Database migration
- [ ] API change

## Related Issues
Closes #<!-- issue number -->

---

## Code Review Checklist

Before submitting, ensure you've addressed the relevant items:

### 1. If this touches Server Actions / API Routes
- [ ] Has `auth: true` in enhanceAction/enhanceRouteHandler
- [ ] Explicit authorization check on mutations
- [ ] Zod schema validates all inputs
- [ ] Error messages are user-friendly
- [ ] Authorization failures logged

**Reference**: See [CODE_REVIEW_CHECKLISTS.md](../CODE_REVIEW_CHECKLISTS.md#checklist-1-server-actions--api-routes-authorization) Section 1

### 2. If this touches User Input
- [ ] All strings have `.max()` in Zod schema
- [ ] Number fields have `.min()` and `.max()`
- [ ] Array fields have `.max()` length limit
- [ ] Error messages tell user the limits
- [ ] Input prevents DoS attacks

**Reference**: See [CODE_REVIEW_CHECKLISTS.md](../CODE_REVIEW_CHECKLISTS.md#checklist-3-input-validation-security) Section 3

### 3. If this touches Expensive Operations
- [ ] Rate limit configured and enforced
- [ ] Check happens BEFORE expensive operation
- [ ] User gets clear "try again in X" message
- [ ] Rate limit hits are logged
- [ ] Limits documented with comment

**Reference**: See [CODE_REVIEW_CHECKLISTS.md](../CODE_REVIEW_CHECKLISTS.md#checklist-2-rate-limiting-performance--security) Section 2

### 4. If this touches Database Queries / Schema
- [ ] Foreign keys have ON DELETE clause (CASCADE/SET NULL/RESTRICT)
- [ ] New queries use appropriate indexes
- [ ] Large queries tested with EXPLAIN ANALYZE
- [ ] Migration is idempotent (IF NOT EXISTS)
- [ ] Tested deleting parent/child records

**Reference**: See [CODE_REVIEW_CHECKLISTS.md](../CODE_REVIEW_CHECKLISTS.md#checklist-5-database-schema-data-integrity--performance) Section 5

### 5. If this touches React Components
- [ ] No unnecessary useState (use useReducer for 4+ fields)
- [ ] useMemo only on expensive computations
- [ ] useMemo dependencies are complete and correct
- [ ] No object/array literals in dependency arrays
- [ ] Performance tested with React DevTools Profiler

**Reference**: See [CODE_REVIEW_CHECKLISTS.md](../CODE_REVIEW_CHECKLISTS.md#checklist-4-performance---memoization-react) Section 4

### 6. If this adds Real-Time Features
- [ ] Uses real streaming, not fake buffering
- [ ] Server-Sent Events or WebSocket properly implemented
- [ ] Connection timeouts handled
- [ ] Cleanup on component unmount
- [ ] Tested with slow/intermittent connection

**Reference**: See [CODE_REVIEW_CHECKLISTS.md](../CODE_REVIEW_CHECKLISTS.md#checklist-6-architecture---streaming-real-time-features) Section 6

### 7. If this handles Webhooks
- [ ] Signature validation before processing
- [ ] Handler is idempotent
- [ ] Invalid webhooks logged
- [ ] Proper error handling
- [ ] Webhook secret secure

**Reference**: See [CODE_REVIEW_CHECKLISTS.md](../CODE_REVIEW_CHECKLISTS.md#checklist-7-webhooks-security) Section 7

### 8. If this defines Constants
- [ ] Not duplicated elsewhere in codebase
- [ ] Exported from centralized constants file
- [ ] Uses SCREAMING_SNAKE_CASE
- [ ] Documented why (not just what)
- [ ] Environment-specific values use env vars

**Reference**: See [CODE_REVIEW_CHECKLISTS.md](../CODE_REVIEW_CHECKLISTS.md#checklist-8-constants--configuration-maintainability) Section 8

### 9. General Code Quality
- [ ] No `any` types in TypeScript
- [ ] No `as unknown as T` type coercions
- [ ] No `console.log` statements
- [ ] No `// TODO` or `// FIXME` comments
- [ ] TypeScript strict mode passes

**Reference**: See [CODE_REVIEW_CHECKLISTS.md](../CODE_REVIEW_CHECKLISTS.md#checklist-9-typescript-type-safety) Section 9

### 10. Testing
- [ ] Happy path tested
- [ ] Error cases tested
- [ ] Edge cases covered
- [ ] Tests have descriptive names
- [ ] Test isolation proper (setup/teardown)

**Reference**: See [CODE_REVIEW_CHECKLISTS.md](../CODE_REVIEW_CHECKLISTS.md#checklist-10-testing-code--error-cases) Section 10

---

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] E2E tests pass (if applicable)
- [ ] Manual testing done
- [ ] No console errors/warnings

### Test Coverage
<!-- Mention which test suites were run -->

---

## Documentation

- [ ] Updated relevant documentation
- [ ] Added/updated comments for complex logic
- [ ] API changes documented
- [ ] Database schema changes documented
- [ ] Breaking changes noted

---

## Screenshots/Demo (if applicable)

<!-- Add screenshots, GIFs, or links to demos -->

---

## Performance Impact

- [ ] No performance regressions
- [ ] Database queries optimized
- [ ] Bundle size unchanged
- [ ] Memory usage reasonable

### Metrics
<!-- Add any relevant performance metrics -->

---

## Security Considerations

- [ ] No sensitive data logged
- [ ] No hardcoded secrets
- [ ] Authorization checks in place
- [ ] Input properly validated
- [ ] Rate limits enforced

---

## Migration Guide (if breaking changes)

<!-- Document how to migrate if this has breaking changes -->

---

## Checklist Before Submitting

- [ ] I've read the [PREVENTION_STRATEGIES.md](../PREVENTION_STRATEGIES.md)
- [ ] I've completed the relevant code review checklist above
- [ ] I've run `pnpm typecheck` and fixed any errors
- [ ] I've run `pnpm lint:fix` to auto-fix style issues
- [ ] I've run `pnpm test` and all tests pass
- [ ] I've tested my changes locally
- [ ] PR title is descriptive
- [ ] PR description explains the "why"

---

## Reviewer Notes

<!-- Specific things you want reviewers to pay attention to -->

---

## Additional Context

<!-- Anything else reviewers should know -->

---

## Deployment Checklist (if applicable)

- [ ] Database migrations need to be run
- [ ] Environment variables need updating
- [ ] Feature flags need to be enabled
- [ ] Cache needs to be cleared
- [ ] Rollback plan documented

---

**See Also:**
- [PREVENTION_STRATEGIES.md](../PREVENTION_STRATEGIES.md) - Detailed prevention strategies
- [CODE_REVIEW_CHECKLISTS.md](../CODE_REVIEW_CHECKLISTS.md) - Quick reference checklists
- [AUTOMATED_CHECKS_SETUP.md](../AUTOMATED_CHECKS_SETUP.md) - CI/CD and automation setup

