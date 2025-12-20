# Agent-Native API Endpoints

**Solution Documentation**

REST API layer enabling programmatic access to Discovery Mode and report management. Resolves agent-native principle: "Whatever the user can do, the agent can do."

## Philosophy

APIs designed for AI agent consumption with:
- Clear request/response contracts
- Zod schema validation
- RLS-based authorization
- Mode-aware routing (discovery vs standard)

## Endpoint Structure

### Start Discovery Report
```
POST /api/discovery/reports
Body: { designChallenge: string (50-10000 chars) }
Returns: { success: true, reportId: UUID, conversationId: UUID }
Rate Limit: 1 per 5 minutes, 1000 per day
```

### Answer Clarification
```
POST /api/reports/[id]/clarify
Body: { answer: string (1-5000 chars) }
Returns: { success: true }
Resumes: report/discovery-clarification-answered event
```

### Get Clarification Question
```
GET /api/reports/[id]/clarify
Returns: { needsClarification: boolean, question: string | null, clarificationHistory: [] }
```

### Monitor Progress
```
GET /api/reports/[id]/progress
Returns: {
  progress: {
    status, mode, currentStep, phaseProgress, overallProgress,
    isComplete, needsClarification, hasError
  }
}
```

### List Reports
```
GET /api/reports?mode=discovery&status=processing&limit=20&offset=0
Returns: { reports: [], pagination: { total, hasMore } }
Filters: mode (discovery|standard), status, limit (max 100), offset
```

## Integration with Discovery Mode

Mode detection via `report_data.mode` field:
- Discovery: `mode: 'discovery'` triggers AN0-D → AN5-D chain
- Standard: `mode: null` triggers AN0 → AN5 chain

Inngest event routing:
```typescript
const eventName = isDiscovery
  ? 'report/discovery-clarification-answered'
  : 'report/clarification-answered';
```

## Key Files

- `/apps/web/app/api/discovery/reports/route.ts` - Start discovery report
- `/apps/web/app/api/reports/[id]/clarify/route.ts` - Clarification Q&A
- `/apps/web/app/api/reports/[id]/progress/route.ts` - Progress monitoring
- `/apps/web/app/api/reports/route.ts` - List with mode filtering

**Version**: 1.0 | **Updated**: 2025-12-19
