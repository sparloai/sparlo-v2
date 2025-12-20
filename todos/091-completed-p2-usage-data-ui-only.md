---
status: pending
priority: p2
issue_id: "091"
tags: [agent-native, ui, usage-tracking]
dependencies: ["086"]
---

# Usage Data Trapped in UI Components Only

Usage metrics are rendered in UI but not exposed as structured data that agents can programmatically access.

## Problem Statement

The usage tracking feature displays data in React components but:

1. No JSON/API representation of usage data
2. Agents must scrape UI or cannot access usage info
3. No structured format for downstream systems
4. Violates agent-native design principle

## Findings

- Usage component renders human-readable format
- No machine-readable data exposure
- Related to missing API endpoint (issue 086)
- UI-centric design excludes programmatic access

## Proposed Solutions

### Option 1: Implement with API Endpoint

**Approach:** Implement alongside issue 086 - the API will expose structured data.

**Pros:**
- Single solution addresses both issues
- RESTful design

**Cons:**
- Dependency on 086

**Effort:** Included in 086

**Risk:** Low

## Recommended Action

Resolve alongside issue 086 (no-usage-api-endpoint). Once API exists, this issue is automatically resolved.

## Technical Details

**Depends on:**
- Issue 086: No API Endpoint for Usage Data Access

## Acceptance Criteria

- [ ] Usage data available as JSON via API
- [ ] Agent can query usage without parsing UI
- [ ] Response schema documented
- [ ] Typecheck passes

## Work Log

### 2025-12-19 - Initial Discovery

**By:** Claude Code (Agent-Native Reviewer)

**Actions:**
- Identified UI-only usage data exposure
- Linked to API endpoint gap (086)
- Marked as dependent issue

**Learnings:**
- Agent-native means data-first, UI-second
- APIs should be designed alongside UIs
- Structured data enables integrations

## Notes

- Dependent on issue 086
- Will be automatically resolved when 086 is implemented
- Consider GraphQL for complex queries in future
