---
status: pending
priority: p2
issue_id: "187"
tags: [pdf, docraptor, privacy, gdpr, compliance]
dependencies: []
---

# P2: User Data Sent to DocRaptor Without Consent Disclosure

## Problem Statement

Report content (potentially containing sensitive business intelligence, strategic analysis, competitive insights) is transmitted to DocRaptor (third-party service) without:
1. User consent or notification
2. Data Processing Agreement disclosure
3. Privacy policy update

## Findings

**File:** `apps/web/app/api/reports/[id]/pdf/route.tsx:238-247`

```typescript
const html = renderReportToHtml({
  reportData,  // Contains user's business intelligence
  title: typedReport.title,
  brief,
  createdAt: typedReport.created_at,
});

// HTML sent to external API
const pdfBuffer = await generatePdfFromHtml(html);
```

**Regulatory considerations:**
- GDPR Article 28: Requires written contract with data processors
- CCPA: Requires disclosure of data sharing with third parties

## Proposed Solutions

### Option 1: Update Privacy Policy + UI Disclosure (Minimum)

Add disclosure to:
1. Privacy policy mentioning DocRaptor as PDF processor
2. PDF export button tooltip or modal

**Pros:**
- Quick to implement
- Meets basic transparency requirements

**Cons:**
- Passive disclosure (users may not notice)

**Effort:** Small (1-2 hours)
**Risk:** Low

### Option 2: Explicit Consent Modal

Show one-time consent modal before first PDF export explaining third-party processing.

**Pros:**
- Active user consent
- Better GDPR compliance

**Cons:**
- UX friction
- Requires consent storage

**Effort:** Medium (4-6 hours)
**Risk:** Low

### Option 3: Self-Hosted PDF (Long-term)

Return to self-hosted PDF generation to avoid third-party data sharing.

**Pros:**
- No third-party data sharing
- Complete data control

**Cons:**
- Undoes infrastructure simplification
- More complex deployment

**Effort:** Large (8+ hours)
**Risk:** Medium

## Recommended Action

_To be filled during triage_

## Technical Details

**Privacy policy update needed:**
- Mention DocRaptor as service provider for PDF generation
- Describe data shared (report content for rendering)
- Link to DocRaptor's privacy policy

**UI disclosure location:**
- PDF export button tooltip
- Or small text below button
- Or first-time modal

## Acceptance Criteria

- [ ] Privacy policy updated with DocRaptor disclosure
- [ ] UI disclosure added near PDF export button
- [ ] (Optional) DocRaptor DPA obtained and reviewed
- [ ] Legal/compliance review if required

## Work Log

### 2026-01-04 - Initial Finding

**By:** Code Review Agent (security-sentinel)

**Actions:**
- Identified third-party data transmission without disclosure
- Analyzed GDPR/CCPA implications
- Proposed disclosure options

**Learnings:**
- Third-party API integrations require privacy policy updates
- Business intelligence data is particularly sensitive
