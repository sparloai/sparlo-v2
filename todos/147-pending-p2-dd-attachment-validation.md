---
status: pending
priority: p2
issue_id: "147"
tags: [security, dd-mode, validation, attachments]
dependencies: []
---

# DD Mode v2: Unrestricted PDF/Image Attachment Processing

## Problem Statement

No validation on attachment size, count, or content type beyond basic media_type checking. Attackers can upload oversized files or excessive attachment counts, consuming tokens and causing potential DoS.

## Findings

**Location:** `/apps/web/lib/inngest/functions/generate-dd-report.ts:156-173`

**Vulnerable code:**
```typescript
const imageAttachments: ImageAttachment[] = (attachments || [])
  .filter((a: { media_type: string }) =>
    a.media_type.startsWith('image/'),
  )
  .map(/* ... */);
// No size or count validation
```

**Attack vectors:**
- Size Attack: Upload 100MB PDF, consuming excessive tokens
- Count Attack: Upload 50 images, bypassing implicit limits
- Type spoofing: Wrong media_type for malicious content

## Proposed Solutions

### Option A: Comprehensive Validation (Recommended)
- Validate count (max 10 images, 5 PDFs)
- Validate size (max 5MB image, 20MB PDF)
- Validate media types against allowlist
- Pros: Complete protection
- Cons: More code
- Effort: Medium (2-3 hours)
- Risk: Low

## Acceptance Criteria

- [ ] Max 10 images, 5 PDFs enforced
- [ ] Max 5MB per image, 20MB per PDF
- [ ] Only allowed media types accepted
- [ ] Clear error messages for rejections
- [ ] Tests cover limit enforcement

## Work Log

### 2026-01-03 - Issue Created

**By:** Claude Code

**Actions:**
- Identified during DD Mode v2 security review
- Documented attack vectors
- Proposed validation limits
