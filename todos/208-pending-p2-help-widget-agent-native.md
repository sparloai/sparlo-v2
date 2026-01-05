---
status: pending
priority: p2
issue_id: 208
tags: [code-review, architecture, help-center, agent-native]
dependencies: [200]
---

# Help Center Not Agent-Native - No MCP Tools

## Problem Statement

The Help Center has well-designed HTTP APIs but no agent tools. Agents cannot help users with support tasks programmatically - users must manually use the UI even when an agent could handle it.

## Findings

**Agent Capability Map**:
| UI Action | HTTP API | MCP Tool | Status |
|-----------|----------|----------|--------|
| Send chat message | POST /api/help/chat | None | Missing |
| Create support ticket | POST /api/help/tickets | None | Missing |
| Escalate to human | (via tickets) | None | Missing |
| Submit feedback | POST /api/help/feedback | None | Missing |

**Current State**:
- 0/4 help capabilities are agent-accessible
- APIs exist but no tools wrap them
- System prompt doesn't document help capabilities
- Agents are blind to help center functionality

## Proposed Solutions

### Solution A: Create MCP Tools (Recommended)
**Pros**: Full agent parity, enables AI-assisted support
**Cons**: Requires MCP server updates
**Effort**: Medium (2-3 hours)
**Risk**: Low

Create tools in `/packages/mcp-server/src/tools/help.ts`:
```typescript
// Tool: create_help_ticket
export const createHelpTicketTool = {
  name: 'create_help_ticket',
  description: 'Create a support ticket on behalf of the user',
  inputSchema: {
    type: 'object',
    properties: {
      subject: { type: 'string' },
      description: { type: 'string' },
      category: { enum: ['general', 'technical', 'billing', 'feature-request'] }
    },
    required: ['subject', 'description']
  },
  handler: async (params) => {
    // Call /api/help/tickets
  }
};

// Tool: escalate_to_support
export const escalateToSupportTool = {
  name: 'escalate_to_support',
  description: 'Escalate a conversation to human support',
  inputSchema: {
    type: 'object',
    properties: {
      chatHistory: { type: 'array' },
      reason: { type: 'string' }
    },
    required: ['reason']
  },
  handler: async (params) => {
    // Call /api/help/escalate
  }
};
```

### Solution B: Add System Prompt Documentation
**Pros**: Quick win, improves discoverability
**Cons**: Doesn't enable programmatic access
**Effort**: Small (30 min)
**Risk**: None

Update prompt-builder to include capability hints.

## Recommended Action

Implement both:
1. Create MCP tools for all help actions (Solution A)
2. Add capability documentation to system prompt (Solution B)

## Technical Details

- **Affected Files**:
  - `packages/mcp-server/src/index.ts`
  - `packages/mcp-server/src/tools/help.ts` (new)
  - `apps/web/lib/rag/prompt-builder.ts`
- **Components**: MCP server, Help Center
- **Database Changes**: None

## Acceptance Criteria

- [ ] `create_help_ticket` tool created and functional
- [ ] `escalate_to_support` tool created and functional
- [ ] `send_help_message` tool created (optional)
- [ ] Tools registered in MCP server
- [ ] System prompt documents help capabilities
- [ ] Agent can file ticket when user asks

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-04 | Created from code review | Agent-native review finding |

## Resources

- Agent: agent-native-reviewer review
- Dependency: Requires escalation endpoint (#200)
