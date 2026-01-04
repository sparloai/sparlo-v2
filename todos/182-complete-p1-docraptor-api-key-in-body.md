---
status: complete
priority: p1
issue_id: "182"
tags: [pdf, docraptor, security, credentials]
dependencies: []
---

# P1: DocRaptor API Key Sent in Request Body (Not Headers)

## Problem Statement

The DocRaptor API key is sent in the request body instead of using HTTP Basic Auth headers. This increases credential exposure risk:
- Request bodies are often logged by proxies/gateways
- Error reporting tools may capture full request bodies
- Non-standard authentication practice

## Findings

**File:** `apps/web/app/api/reports/[id]/pdf/route.tsx:99-110`

```typescript
// Current code - API key in body
body: JSON.stringify({
  user_credentials: apiKey,  // ❌ Credentials in body
  doc: {
    document_content: html,
    // ...
  }
}),
```

DocRaptor's documentation confirms they support HTTP Basic Auth as the recommended approach.

## Proposed Solutions

### Option 1: Use HTTP Basic Auth Header (Recommended)

Move API key to Authorization header using Basic auth format.

```typescript
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
},
body: JSON.stringify({
  // Remove user_credentials from body
  doc: {
    test: process.env.NODE_ENV !== 'production',
    document_type: 'pdf',
    document_content: html,
    prince_options: { media: 'print', pdf_profile: 'PDF/A-1b' },
  },
}),
```

**Pros:**
- Credentials never in request body logs
- Standard HTTP authentication pattern
- Easier credential rotation

**Cons:**
- None (DocRaptor supports this)

**Effort:** Small (10 min)
**Risk:** Low

## Recommended Action

_To be filled during triage_

## Technical Details

**Affected files:**
- `apps/web/app/api/reports/[id]/pdf/route.tsx`

## Acceptance Criteria

- [ ] API key moved from request body to Authorization header
- [ ] HTTP Basic Auth format used: `Basic {base64(apiKey:)}`
- [ ] `user_credentials` removed from body
- [ ] Test PDF generation works with new auth method

## Work Log

### 2026-01-04 - Initial Finding

**By:** Code Review Agent (security-sentinel)

**Actions:**
- Identified API key in request body as security risk
- Verified DocRaptor supports HTTP Basic Auth
- Proposed header-based authentication

**Learnings:**
- Many logging systems capture request bodies but not auth headers
- HTTP Basic Auth is standard for API authentication

### 2026-01-04 - Fixed

**By:** Claude Code

**Actions:**
- Added Authorization header with HTTP Basic Auth (line 122)
- Removed `user_credentials` from request body
- Format: `Basic ${Buffer.from(apiKey + ':').toString('base64')}`

**File:** `apps/web/app/api/reports/[id]/pdf/route.tsx`
