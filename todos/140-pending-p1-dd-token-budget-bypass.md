---
status: pending
priority: p1
issue_id: "140"
tags: [security, dd-mode, token-budget, cost-control, critical]
dependencies: []
---

# DD Mode v2: Token Budget Bypass Vulnerability

## Problem Statement

Token budget limit (250K) is checked AFTER each LLM call completes. An attacker can craft input that causes the first LLM call to exceed the budget, incurring significant costs before the check triggers. This enables cost-based DoS attacks and financial exploitation.

## Findings

**Location:** `/apps/web/lib/inngest/functions/generate-dd-report.ts:78, 201-212`

**Vulnerable code:**
```typescript
function checkTokenBudget(usage: TokenUsage, stepName: string) {
  cumulativeTokens += usage.totalTokens;  // Check happens AFTER usage

  if (cumulativeTokens > TOKEN_BUDGET_LIMIT) {  // Too late - already spent
    throw new Error(`Token budget exceeded...`);
  }
}
```

**Attack scenario:**
- Attacker provides 100K character startup materials + large PDFs
- First step (DD0-M) alone could consume 300K+ tokens
- Budget exceeded but tokens already consumed and billed

**Impact:**
- Cost Attack: $10-50 per malicious request
- DoS: Depletes API quota for legitimate users
- Financial Loss: No preemptive protection

## Proposed Solutions

### Option A: Preemptive Input Size Validation (Recommended)
- Estimate token count before making LLM call
- Reject inputs that could exceed step allocation
- Pros: Prevents cost before incurred
- Cons: Estimates may be imperfect
- Effort: Low (2-3 hours)
- Risk: Low

### Option B: Dynamic Budget Allocation
- Allocate proportional budget to each step
- Check remaining budget before each step
- Pros: More flexible, handles variance
- Cons: More complex implementation
- Effort: Medium (4-6 hours)
- Risk: Low

### Option C: Streaming Token Monitoring
- Monitor tokens during streaming response
- Abort mid-response if threshold exceeded
- Pros: Real-time protection
- Cons: May waste partial tokens
- Effort: High (8+ hours)
- Risk: Medium

## Recommended Action

[To be filled during triage]

## Acceptance Criteria

- [ ] Input size validated before DD0-M call
- [ ] Attachment count/size limits enforced
- [ ] Large inputs rejected with clear user message
- [ ] Cost savings measurable vs attack scenarios
- [ ] Tests cover various attack payload sizes

## Technical Details

**Affected files:**
- `apps/web/lib/inngest/functions/generate-dd-report.ts`

**Token estimation formula:**
```typescript
const textTokens = Math.ceil(text.length / 4);
const imageTokens = images * 1500;
const pdfTokens = pdfs * 5000;
```

**Suggested limits:**
- First step max: 40% of total budget (100K tokens)
- Max images: 10
- Max PDFs: 5
- Max PDF size: 20MB each

## Work Log

### 2026-01-03 - Issue Created

**By:** Claude Code

**Actions:**
- Identified during DD Mode v2 security review
- Analyzed token consumption patterns
- Proposed preemptive validation approach

**Learnings:**
- Post-hoc budget checks don't prevent cost overruns
- Input validation must happen before expensive operations
