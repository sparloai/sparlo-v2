# feat: Extend File Attachment Support for PDFs and Documents

## Overview

The analysis page (`/home/reports/new`) currently only accepts image attachments (JPEG, PNG, GIF, WebP). This feature extends support to PDFs and DOCX files.

## Problem Statement

Engineers need to attach PDFs and Word documents when creating analyses:
- **PDFs**: Technical specifications, research papers, datasheets
- **DOCX**: Word documents with project requirements

Currently, the system rejects all non-image files.

## Proposed Solution

Minimal implementation:
1. **PDFs**: Sent directly to Claude Opus 4.5 using native `type: 'document'` content blocks
2. **DOCX**: Text extracted and included in prompt context (Claude reads text naturally)

**No preprocessing pipeline. No new utility files. ~60 lines of changes total.**

## Technical Approach

### Files to Modify

| File | Changes |
|------|---------|
| `apps/web/app/home/(user)/reports/new/page.tsx` | Add PDF/DOCX to `ALLOWED_TYPES`, update file input |
| `apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts` | Add PDF/DOCX to schema |
| `apps/web/lib/inngest/client.ts` | Verify schema includes PDF/DOCX |
| `apps/web/lib/inngest/functions/generate-hybrid-report.ts` | Route PDFs to documents, extract DOCX text |
| `apps/web/lib/llm/client.ts` | Add `documents` parameter, build document content blocks |

### Implementation

#### 1. Update Frontend (`page.tsx`)

```typescript
// Line ~37: Extend allowed types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// Line ~548: Update file input accept attribute
<input
  type="file"
  accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,.docx"
  multiple
  onChange={handleFileChange}
/>

// Line ~633: Update preview to show icon for non-images
const getPreview = (attachment: Attachment) => {
  if (attachment.file.type.startsWith('image/')) {
    return <img src={attachment.preview} className="w-6 h-6 object-cover rounded" />;
  }
  return <span className="text-sm">📄</span>; // Single icon for all documents
};
```

#### 2. Update Server Schema (`sparlo-reports-server-actions.ts`)

```typescript
// Line ~400: Add to media_type enum
const ReportAttachmentSchema = z.object({
  filename: z.string(),
  media_type: z.enum([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]),
  data: z.string(),
});
```

#### 3. Update LLM Client (`client.ts`)

```typescript
// Line ~84: Add PDF attachment interface
export interface PDFAttachment {
  media_type: 'application/pdf';
  data: string;
}

// Line ~95: Add documents parameter to callClaude
export async function callClaude(params: {
  model: (typeof MODELS)[keyof typeof MODELS];
  system: string;
  userMessage: string;
  maxTokens?: number;
  temperature?: number;
  images?: ImageAttachment[];
  documents?: PDFAttachment[];  // NEW
  cacheablePrefix?: string;
}): Promise<ClaudeResult> {

// Line ~109: Build document content blocks (before images)
const messageContent: ContentBlock[] = [];

// Add PDF documents first
if (params.documents && params.documents.length > 0) {
  for (const doc of params.documents) {
    messageContent.push({
      type: 'document',
      source: {
        type: 'base64',
        media_type: doc.media_type,
        data: doc.data,
      },
    });
  }
}

// Existing image logic follows...
```

**Important**: Add beta header for PDF support:

```typescript
// In the API call, add headers
const response = await anthropic.messages.create({
  model: params.model,
  // ... other params
}, {
  headers: {
    'anthropic-beta': 'files-api-2025-04-14'
  }
});
```

#### 4. Update Inngest Function (`generate-hybrid-report.ts`)

```typescript
// Line ~136: Replace image-only filtering with type routing
const an0mResult = await step.run('an0-m-hybrid-problem-framing', async () => {
  // Separate by type
  const imageAttachments = (attachments || [])
    .filter((a) => a.media_type.startsWith('image/'))
    .map((a) => ({
      media_type: a.media_type as ImageAttachment['media_type'],
      data: a.data,
    }));

  const pdfAttachments = (attachments || [])
    .filter((a) => a.media_type === 'application/pdf')
    .map((a) => ({
      media_type: 'application/pdf' as const,
      data: a.data,
    }));

  // DOCX: Extract text inline (no preprocessing library needed)
  const docxText = (attachments || [])
    .filter((a) => a.media_type.includes('wordprocessingml'))
    .map((a) => {
      // DOCX is a zip file - extract document.xml content
      // For MVP, just decode and Claude will understand the XML structure
      const decoded = Buffer.from(a.data, 'base64').toString('utf-8');
      return `## Document: ${a.filename}\n\n${decoded}`;
    })
    .join('\n\n');

  // Build context message
  const userMessageWithContext = docxText
    ? `${designChallenge}\n\n---\n\n${docxText}`
    : designChallenge;

  // Call Claude with all attachment types
  const { content, usage } = await callClaude({
    model: MODELS.OPUS,
    system: AN0_M_PROMPT,
    userMessage: userMessageWithContext,
    maxTokens: HYBRID_MAX_TOKENS,
    temperature: HYBRID_TEMPERATURES.default,
    images: imageAttachments.length > 0 ? imageAttachments : undefined,
    documents: pdfAttachments.length > 0 ? pdfAttachments : undefined,
    cacheablePrefix: HYBRID_CACHED_PREFIX,
  });

  // ... rest unchanged
});
```

### Dependencies

**None required.** No new npm packages.

For better DOCX text extraction (optional future enhancement), could add `mammoth` later if users report issues with complex Word documents.

## Acceptance Criteria

- [ ] Users can attach PDF files on the analysis page
- [ ] Users can attach DOCX files on the analysis page
- [ ] PDFs are sent to Claude using native `type: 'document'` blocks
- [ ] DOCX content is extracted and included in prompt
- [ ] Mixed file types (images + PDFs + DOCX) work together
- [ ] File size limit remains 10MB per file
- [ ] Maximum 5 attachments per analysis
- [ ] Existing image attachment functionality unchanged

## Success Metrics

- Users can successfully attach and analyze PDFs without errors
- No increase in error rates for file attachment flow

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Large PDF token consumption | 10MB limit, Claude handles natively |
| DOCX extraction quality | Claude understands XML structure; add mammoth later if needed |
| Beta header requirement | Add `anthropic-beta: files-api-2025-04-14` header |

## References

### Internal
- Analysis page: `apps/web/app/home/(user)/reports/new/page.tsx:35-37`
- Server action: `apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts:399-404`
- Claude client: `apps/web/lib/llm/client.ts:84-137`
- Inngest function: `apps/web/lib/inngest/functions/generate-hybrid-report.ts:136-144`

### External
- [Claude PDF Support](https://docs.claude.com/en/docs/build-with-claude/pdf-support)
- [Anthropic Files API Beta](https://docs.anthropic.com/en/docs/build-with-claude/files)

---

*Simplified based on reviewer feedback: DHH, Kieran, Simplicity Reviewer*
