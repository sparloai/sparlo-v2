# Prevention Implementation Guide

Your complete roadmap for implementing the Sparlo V2 prevention strategies.

## Documents Created

This package includes 4 comprehensive documents:

### 1. PREVENTION_STRATEGIES.md (49 KB)
**Detailed guidance on each of 9 issue categories**
- Full context on why each issue matters
- Prevention checklists for developers
- Code review checklist items for reviewers
- Automated checks configuration (ESLint, tests, TypeScript)
- Best practices with code examples
- Real code from Sparlo codebase

**When to Use**: Learning the "why" and "how" of each issue category

---

### 2. CODE_REVIEW_CHECKLISTS.md (12 KB)
**Quick reference checklists for code reviewers**
- 10 focused checklists (1-2 minutes each)
- Quick decision guide
- Priority guide (must-check vs nice-to-check)
- Common red flags
- Approval template

**When to Use**: During code review (copy-paste to PR comments)

---

### 3. AUTOMATED_CHECKS_SETUP.md (21 KB)
**Implementation guides for automation**
- 5 ready-to-copy ESLint rules
- TypeScript strict mode configuration
- Pre-commit hook scripts
- 4 test templates (copy-paste ready)
- GitHub Actions workflow
- Implementation checklist

**When to Use**: Setting up tooling and CI/CD

---

### 4. PREVENTION_STRATEGIES_SUMMARY.md (9.3 KB)
**Executive summary and quick reference**
- Overview of all 9 issues
- Quick decision matrix
- Implementation roadmap
- Metrics to track
- Team communication templates
- FAQ

**When to Use**: Getting everyone on the same page

---

## 4-Week Implementation Plan

### Week 1: Foundation (5 hours)
**Goal**: Set up automated checks and constants

**Monday**
- [ ] Read PREVENTION_STRATEGIES.md sections 1-3 (authorization, rate limiting, input validation)
- [ ] Copy centralized constants file structure
- [ ] Create `packages/utils/src/constants/sparlo.ts`

**Tuesday**
- [ ] Review AUTOMATED_CHECKS_SETUP.md section 1 (ESLint rules)
- [ ] Copy the 5 ESLint rules to `tooling/eslint/rules/`
- [ ] Update `tooling/eslint/base.js` to import them
- [ ] Run `pnpm lint` to verify setup

**Wednesday**
- [ ] Review TypeScript configuration (AUTOMATED_CHECKS_SETUP.md section 2)
- [ ] Update `tsconfig.json` with strict mode
- [ ] Run `pnpm typecheck` - expect ~50 errors
- [ ] Fix top 10 errors to build confidence

**Thursday**
- [ ] Set up pre-commit hooks (AUTOMATED_CHECKS_SETUP.md section 3)
- [ ] Install Husky: `npm install husky --save-dev`
- [ ] Create `.husky/pre-commit`
- [ ] Test on a local commit

**Friday**
- [ ] Review setup with team
- [ ] Fix any CI/CD issues
- [ ] Run `pnpm lint:fix` to auto-fix violations
- [ ] Create Slack reminder for next week

---

### Week 2: Testing Framework (6 hours)
**Goal**: Add test infrastructure for automated validation

**Monday**
- [ ] Read PREVENTION_STRATEGIES.md sections 4-6 (performance, streaming)
- [ ] Review AUTOMATED_CHECKS_SETUP.md section 4 (test templates)
- [ ] Copy test templates to appropriate directories

**Tuesday**
- [ ] Create `apps/web/app/home/(user)/_lib/__tests__/authorization.test.ts`
- [ ] Run tests: `pnpm test apps/web/app/home/(user)/_lib/__tests__`
- [ ] Fix any import issues

**Wednesday**
- [ ] Create rate limiting test template
- [ ] Create input validation test template
- [ ] Create database constraint test
- [ ] Run all tests

**Thursday**
- [ ] Add test coverage reporting
- [ ] Set up CI/CD to fail on low coverage (<70%)
- [ ] Review coverage reports
- [ ] Document testing patterns for team

**Friday**
- [ ] Weekly team standup on test coverage
- [ ] Plan which tests to add for existing code
- [ ] Create issue tracker for test gaps

---

### Week 3: Code Review Process (4 hours)
**Goal**: Implement consistent code review practices

**Monday**
- [ ] Update PR template with checklists (see `.github/pull_request_template.md`)
- [ ] Replace existing PR template or create new one
- [ ] Test the new template on a dummy PR

**Tuesday**
- [ ] Train team on CODE_REVIEW_CHECKLISTS.md
- [ ] Share document in Slack, email, wiki
- [ ] Create 5-minute video overview (optional)
- [ ] Run team walkthrough of one checklist

**Wednesday**
- [ ] Update code review SLA with checklist time
- [ ] Create review assignment rules by expertise
- [ ] Document escalation path (when to loop in security team)
- [ ] Create runbook for common findings

**Thursday**
- [ ] Audit recent PRs against new standards
- [ ] Document patterns/anti-patterns found
- [ ] Create internal "Sparlo Code Review Dos & Don'ts"
- [ ] Share learnings with team

**Friday**
- [ ] Retrospective on week 1-3 implementation
- [ ] Gather feedback from team
- [ ] Adjust checklists based on feedback
- [ ] Plan monitoring for week 4

---

### Week 4: Monitoring & Continuous Improvement (3 hours)
**Goal**: Measure impact and establish continuous improvement

**Monday**
- [ ] Set up metrics collection (PREVENTION_STRATEGIES.md section monitoring)
- [ ] Enable slow query logging
- [ ] Add rate limit monitoring
- [ ] Add authorization failure logging

**Tuesday**
- [ ] Create dashboard showing metrics:
  - ESLint violations over time
  - Test coverage trend
  - Security issues found (zero expected)
  - Code review cycle time
  - Rule violations by category

**Wednesday**
- [ ] Review metrics from week 1-3
- [ ] Document what's working
- [ ] Identify gaps or false positives
- [ ] Plan adjustments

**Thursday**
- [ ] Update documentation based on learnings
- [ ] Create monthly review process (recurring)
- [ ] Archive baseline metrics
- [ ] Plan Q1 improvements

**Friday**
- [ ] Team celebration of reduced issues
- [ ] Share metrics with stakeholders
- [ ] Plan next quarter improvements
- [ ] Update this guide based on experience

---

## Daily Implementation: By Issue Category

If you prefer to implement by category rather than timeline:

### Security Categories (Do First)
1. **Authorization Checks** (PREVENTION_STRATEGIES.md section 2)
   - Implementation effort: 2 hours
   - ESLint rule + centralized function
   - Test template + audit critical paths

2. **Input Validation** (PREVENTION_STRATEGIES.md section 4)
   - Implementation effort: 1 hour
   - ESLint rule + Zod pattern
   - Test template

3. **Rate Limiting** (PREVENTION_STRATEGIES.md section 3)
   - Implementation effort: 2 hours
   - Constants file + test patterns
   - Monitoring setup

4. **Webhook Signature Verification** (PREVENTION_STRATEGIES.md section 1)
   - Implementation effort: 30 minutes
   - Code review checklist only (already fixed)

### Performance Categories (Do Second)
5. **Missing useMemo** (PREVENTION_STRATEGIES.md section 6)
   - Implementation effort: 2 hours
   - ESLint rule + profiling guide
   - Measurement setup

6. **Missing Indexes** (PREVENTION_STRATEGIES.md section 8)
   - Implementation effort: 3 hours
   - Query analysis + index patterns
   - Slow query monitoring

### Data/Maintainability Categories (Do Last)
7. **CASCADE Constraints** (PREVENTION_STRATEGIES.md section 7)
   - Implementation effort: 1 hour
   - Migration validation + test template
   - Audit existing schema

8. **Duplicated Constants** (PREVENTION_STRATEGIES.md section 9)
   - Implementation effort: 2 hours
   - Centralize + ESLint rule
   - Audit existing code

9. **Fake Streaming** (PREVENTION_STRATEGIES.md section 5)
   - Implementation effort: 1 hour
   - Architecture checklist only
   - Design review process

---

## Configuration Checklists

### ESLint Setup Checklist
- [ ] Copy 5 rules from AUTOMATED_CHECKS_SETUP.md section 1
- [ ] Update tooling/eslint/base.js
- [ ] Run `pnpm lint --fix`
- [ ] Review failing rules
- [ ] Fix or suppress known violations
- [ ] Add to CI/CD lint job

### TypeScript Setup Checklist
- [ ] Update tsconfig.json with strict mode (section 2)
- [ ] Run `pnpm typecheck`
- [ ] Fix top 20 errors
- [ ] Create issue for remaining errors
- [ ] Run typecheck in CI/CD

### Testing Setup Checklist
- [ ] Copy 4 test templates (section 4)
- [ ] Install test dependencies if needed
- [ ] Create test files in appropriate directories
- [ ] Run tests: `pnpm test`
- [ ] Fix import issues
- [ ] Add coverage reporting

### CI/CD Setup Checklist
- [ ] Copy GitHub Actions workflow (section 5)
- [ ] Update workflow paths for your structure
- [ ] Add secrets if needed (database URL, etc.)
- [ ] Test on dummy branch
- [ ] Enable branch protection rules

### Pre-commit Checklist
- [ ] Install Husky: `npm install husky --save-dev`
- [ ] Create .husky/pre-commit from section 3
- [ ] Test locally: `git commit` (should run checks)
- [ ] Adjust timeouts if CI is slow
- [ ] Document in team wiki

---

## Team Onboarding

### For Existing Team Members
1. Send email with PREVENTION_STRATEGIES_SUMMARY.md (2 min read)
2. Schedule 30-minute team walkthrough
3. Share CODE_REVIEW_CHECKLISTS.md in wiki
4. Link from PR template
5. Answer questions in team chat

### For New Team Members
1. Add to onboarding checklist:
   - [ ] Read PREVENTION_STRATEGIES_SUMMARY.md (5 min)
   - [ ] Review CODE_REVIEW_CHECKLISTS.md (10 min)
   - [ ] Read relevant sections of PREVENTION_STRATEGIES.md for your area
   - [ ] Pair with senior developer on first PR review
   - [ ] Create PR using new template

2. Resources to share:
   - Link to all 4 documents
   - Video walkthrough (if created)
   - Slack channel for questions
   - Code examples from Sparlo codebase

### For Engineering Leads
1. Share PREVENTION_STRATEGIES_SUMMARY.md
2. Review implementation timeline with team
3. Allocate resources for weeks 1-4
4. Assign owners for each category
5. Set up metrics dashboards
6. Review weekly progress in 1-on-1s

---

## Common Implementation Issues & Fixes

### Issue: ESLint Rules Too Strict
**Symptom**: Linter fails on too many files
**Fix**:
- Start with just 1-2 rules, enable others gradually
- Use `warn` instead of `error` for soft rollout
- Create suppressions for legacy code
- Document why specific rules are disabled

### Issue: Test Setup Fails
**Symptom**: Import errors in test files
**Fix**:
- Check `tsconfig.json` includes test directories
- Verify test runner config (vitest.config.ts)
- Check mock setup files
- Review import paths (use @kit/* not relative)

### Issue: TypeScript Strict Mode Has 1000+ Errors
**Symptom**: Build fails after enabling strict mode
**Fix**:
- Turn on one rule at a time
- Fix errors in waves (50 per day)
- Use `@ts-expect-error` comments temporarily
- Create epic issue to track progress
- Set weekly fix targets (100 errors/week)

### Issue: Pre-commit Hooks Slow Down Development
**Symptom**: Committing takes >30 seconds
**Fix**:
- Run only changed files in pre-commit
- Move slow checks to CI/CD only
- Cache linter results
- Increase timeout
- Document workaround (git commit --no-verify)

### Issue: Team Resistance to New Process
**Symptom**: Checklists ignored, violations merged
**Fix**:
- Make violations block merges (branch protection)
- Show metrics proving value
- Gather feedback and adjust
- Celebrate wins publicly
- Involve team in checklist refinement

---

## Quick Links

**For Reference During Implementation:**
- [PREVENTION_STRATEGIES.md](./PREVENTION_STRATEGIES.md) - Detailed guidance
- [CODE_REVIEW_CHECKLISTS.md](./CODE_REVIEW_CHECKLISTS.md) - Quick reference
- [AUTOMATED_CHECKS_SETUP.md](./AUTOMATED_CHECKS_SETUP.md) - Setup guides
- [PREVENTION_STRATEGIES_SUMMARY.md](./PREVENTION_STRATEGIES_SUMMARY.md) - Overview

**Sparlo Codebase Examples:**
- Server actions: `/apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts`
- Database migrations: `/apps/web/supabase/migrations/20251217000000_sparlo_security_fixes.sql`
- Webhook handling: `/apps/web/app/api/db/webhook/route.ts`

---

## Success Metrics

### By Week 2
- [ ] ESLint rules configured
- [ ] 0 new ESLint violations in new code
- [ ] TypeScript strict mode enabled
- [ ] <50 remaining typecheck errors

### By Week 3
- [ ] Test templates in place
- [ ] 80%+ test coverage on critical paths
- [ ] Code review checklist in use on PRs
- [ ] 0 authorization bypasses in reviews

### By Week 4
- [ ] Monitoring dashboards set up
- [ ] Metrics showing trend (issues down)
- [ ] Team fully onboarded
- [ ] Monthly review process established

### By Month 2
- [ ] All active paths use new patterns
- [ ] Security issues: 0 in production
- [ ] Code review time: -20%
- [ ] TypeScript errors: <10

---

## Getting Help

**Question about a specific issue?**
→ Check section in PREVENTION_STRATEGIES.md

**Need review guidelines?**
→ See CODE_REVIEW_CHECKLISTS.md

**Setting up automation?**
→ Follow AUTOMATED_CHECKS_SETUP.md

**Want a quick overview?**
→ Read PREVENTION_STRATEGIES_SUMMARY.md

**Not finding answer?**
→ Check code examples in Sparlo codebase or ask team

---

**Remember**: This is a living document. Update it as your team's practices evolve!

