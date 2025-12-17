# Code Review Extraction Guide for Compound Docs

This document provides guidance on extracting and documenting the 7-agent code review findings for the Compound Docs system.

## Overview

**Review Project:** Sparlo V2 (Report Generation Application)
**Review Date:** 2024-12-16
**Agents Involved:** 7 specialized code review agents
**Issues Identified:** 40 total
**Documentation Format:** YAML Frontmatter + Markdown Content
**Target System:** Compound Docs with tag-based organization

## YAML Frontmatter Structure for Issue Documentation

Every issue should follow this structure:

```yaml
---
title: "{Brief, searchable issue name}"
date: "2024-12-16"
categories:
  - "{category1}"
  - "{category2}"
tags:
  - "sparlo-v2"
  - "{issue-type}"
  - "{affected-technology}"
  - "{severity}"
severity: "{critical|high|medium|low}"
component: "{affected-component}"
symptoms:
  - "{observable-problem-1}"
  - "{observable-problem-2}"
root_cause: "{technical-explanation}"
resolution_time_saved: "{hours-or-value}"
---
```

## Issue Category Mapping

### 1. Performance & Race Conditions (8 issues)
**Issues:** 001, 005, 010, 021, 029, 030
**Agent:** Julik - Frontend Race Conditions Reviewer
**File Pattern:** `/apps/web/app/home/(user)/_lib/use-sparlo.ts`

Example Issue Structure:
```yaml
---
title: "Race Condition: Unmounted Component State Updates"
categories:
  - performance
  - race-condition
  - frontend
tags:
  - race-condition
  - react-hooks
  - memory-leak
severity: high
component: "Frontend - useSparlo Hook"
symptoms:
  - "React warnings about state updates on unmounted components"
  - "Potential crashes during navigation"
  - "Memory leaks from orphaned async operations"
root_cause: "Async setState operations don't validate component mount state"
resolution_time_saved: "12 hours (prevents crash bugs)"
---
```

**Key Metrics to Document:**
- Line numbers of problematic code
- Race condition scenarios
- Memory impact assessment
- Solution options with effort/risk

### 2. Security & Data Integrity (6 issues)
**Issues:** 009, 014, 015, 016, 020, 033
**Agent:** Security Reviewer
**File Pattern:** `sparlo-backend/main.py` and frontend security boundaries

Example Issue Structure:
```yaml
---
title: "Security: Backend Endpoints Missing Authentication"
categories:
  - security
  - authentication
  - backend
tags:
  - security
  - critical
  - authentication
severity: critical
component: "Backend API"
symptoms:
  - "Direct API access bypasses frontend auth"
  - "No user context for audit logging"
  - "Vulnerability to cost attacks"
root_cause: "Zero authentication middleware on FastAPI endpoints"
resolution_time_saved: "6 hours (prevents security incident)"
---
```

**Key Metrics to Document:**
- Attack scenarios
- Exposure assessment
- Compliance implications
- Solution options with implementation complexity

### 3. Type Safety & Validation (5 issues)
**Issues:** 011, 019, 032
**Agent:** TypeScript Type Safety Reviewer
**File Pattern:** `/apps/web/app/home/(user)/_lib/`

Example Issue Structure:
```yaml
---
title: "Type Safety: Unsafe Type Coercions (as unknown as T)"
categories:
  - type-safety
  - typescript
  - validation
tags:
  - typescript
  - type-coercion
  - unsafe-casting
severity: high
component: "Frontend API Integration"
symptoms:
  - "TypeScript type checking completely bypassed"
  - "No runtime validation of API responses"
  - "Silent failures when API structure changes"
root_cause: "6 instances of double-casting bypass type system"
resolution_time_saved: "8 hours (prevents silent type errors)"
---
```

**Key Metrics to Document:**
- Number of instances
- Affected patterns
- Risk of silent failures
- Validation approach options

### 4. Architecture & Code Quality (10 issues)
**Issues:** 002, 003, 006, 012, 013, 017, 018, 038, 039
**Agent:** Code Simplicity & DHH Rails Reviewer
**File Pattern:** `/apps/web/app/home/(user)/` components and hooks

Example Issue Structure:
```yaml
---
title: "Architecture: sendMessage Function Too Complex (258+ Lines)"
categories:
  - architecture
  - code-quality
  - maintainability
tags:
  - god-function
  - refactoring
  - complexity
severity: high
component: "Frontend - useSparlo Hook"
symptoms:
  - "Single function handles message sending, validation, error handling"
  - "High cyclomatic complexity"
  - "Difficult to test individual concerns"
root_cause: "Mixed concerns in single function"
resolution_time_saved: "15 hours (future maintenance savings)"
---
```

**Key Metrics to Document:**
- Lines of code
- Cyclomatic complexity
- Number of concerns/responsibilities
- Reusability opportunities
- Testing difficulty

### 5. Backend Issues (4 issues)
**Issues:** 031, 035, 036
**Agent:** Python Backend Reviewer
**File Pattern:** `sparlo-backend/main.py`

Example Issue Structure:
```yaml
---
title: "Backend: God Function - generate_report() Is Too Large"
categories:
  - backend
  - python
  - architecture
tags:
  - python
  - god-function
  - fastapi
severity: high
component: "Backend Service"
symptoms:
  - "Function performs 5+ distinct operations"
  - "Hard to test individual features"
  - "Difficult to add new report types"
root_cause: "Insufficient decomposition"
resolution_time_saved: "10 hours (backend maintainability)"
---
```

## Investigation Method Documentation

When extracting findings, document the investigation approach:

```yaml
investigation_approach:
  method: "Pattern scanning across codebase"
  tools:
    - "Grep for code patterns"
    - "AST analysis for React hooks"
    - "Dependency graph analysis"
  evidence_collection:
    - "Located specific file:line references"
    - "Reproduced race condition scenarios"
    - "Analyzed impact surface area"
  confidence: "high"  # Based on multiple agent agreement
```

## Technical Context to Include

For each issue, capture technical context:

```yaml
technical_context:
  technology_stack:
    - "Next.js 16 with App Router"
    - "React 19"
    - "TypeScript"
    - "Supabase PostgreSQL"
    - "FastAPI (Python backend)"
  affected_file_paths:
    - "/Users/alijangbar/sparlo-v2/apps/web/app/home/(user)/_lib/use-sparlo.ts"
    - "/Users/alijangbar/sparlo-v2/apps/web/app/home/(user)/[id]/page.tsx"
  dependencies:
    - "react"
    - "zod"
    - "@supabase/supabase-js"
  external_integrations:
    - "Supabase Auth"
    - "Inngest"
    - "AI Services"
```

## Components Affected Reference

Standard components affected by review:

```yaml
components:
  frontend:
    - path: "/Users/alijangbar/sparlo-v2/apps/web/app/home/(user)/_lib/use-sparlo.ts"
      role: "Core hook managing report conversation state"
      issues: [001, 002, 003, 005, 006, 011, 013, 010]
    - path: "/Users/alijangbar/sparlo-v2/apps/web/app/home/(user)/[id]/"
      role: "Report detail page and components"
      issues: [012, 014]
  backend:
    - path: "/Users/alijangbar/sparlo-v2/sparlo-backend/main.py"
      role: "FastAPI service for report generation"
      issues: [009, 031, 035, 036]
  database:
    - path: "/Users/alijangbar/sparlo-v2/apps/web/supabase/"
      role: "Database schema and RLS policies"
      issues: [033, 034, 040]
```

## Symptom Categories for Searchability

When documenting symptoms, use these standard categories:

```yaml
symptom_categories:
  - "Runtime Error: {error description}"
  - "Performance Issue: {observable degradation}"
  - "Memory Leak: {specific leak location}"
  - "Security Vulnerability: {attack vector}"
  - "Type Error: {type mismatch}"
  - "Race Condition: {scenario}"
  - "Data Corruption: {data integrity issue}"
  - "Code Duplication: {pattern occurrence count}"
  - "Maintainability: {future difficulty}"
```

## Solution Evaluation Template

For each solution proposed, document:

```yaml
solutions:
  - name: "{Solution Name}"
    approach: "{High-level description}"
    effort: "small|medium|large"  # In hours
    risk: "low|medium|high"
    recommended: true|false
    pros:
      - "Benefit 1"
      - "Benefit 2"
    cons:
      - "Drawback 1"
      - "Drawback 2"
    implementation_notes: |
      Specific guidance for implementation
    estimated_loc_change: "+X lines"
    testing_approach: "How to verify the fix"
```

## Acceptance Criteria Format

Every issue should have clear acceptance criteria:

```yaml
acceptance_criteria:
  - "✓ Criterion 1"
  - "✓ Criterion 2"
  - "✓ Tests pass"
  - "✓ No TypeScript errors"
  - "✓ Performance metrics improved by X%"
  - "✓ Code review approval"
```

## Status Tracking Fields

```yaml
status: "completed|pending|ready"  # ready = analyzed & solution proposed
priority: "p0|p1|p2|p3"
dependencies:
  - "issue-XXX"  # Issues that must be fixed first
blocked_by:
  - "issue-YYY"  # Issues blocking this one
related_issues:
  - "issue-ZZZ"  # Related but not dependent
```

## Time Savings Documentation

Quantify the value of fixing each issue:

```yaml
resolution_time_saved:
  development_hours: 12  # Hours of future debugging prevented
  production_incidents_prevented: 1-2
  security_incidents_prevented: 0-1
  maintenance_hours_per_quarter: 5-8
  performance_improvement: "30-40%"
```

## Tags for Compound Docs Search

Use these standard tags for consistency:

```yaml
tags:
  - "sparlo-v2"  # Project name
  - "code-review"  # Meta tag
  - "7-agent-analysis"  # Analysis type
  - "{issue-type}"  # race-condition, security, type-safety, etc.
  - "{technology}"  # react, typescript, fastapi, postgres, etc.
  - "{severity}"  # critical, high, medium, low
  - "frontend|backend|database"  # Layer
  - "{custom-category}"  # As needed
```

## Extraction Checklist

When extracting each issue for documentation:

- [ ] Title is specific and searchable
- [ ] All symptoms documented with observable evidence
- [ ] Root cause explained with technical detail
- [ ] File paths are absolute (not relative)
- [ ] Line numbers included for code examples
- [ ] 2-3 solution options with effort/risk analysis
- [ ] Acceptance criteria are concrete and testable
- [ ] Time savings are quantified
- [ ] Technical context documented
- [ ] Dependencies identified
- [ ] Tags are searchable and consistent
- [ ] Status accurately reflects current state

## Document Organization in `/todos/`

All 40 issues are in `/Users/alijangbar/sparlo-v2/todos/`:

**Naming Convention:** `{number:03d}-{status}-{priority}-{kebab-case-title}.md`

Examples:
- `001-completed-p1-unmounted-component-state-updates.md`
- `009-pending-p1-backend-auth-missing.md`
- `026-ready-p0-inngest-signature-verification.md`

**Status Values:**
- `completed`: Fixed and merged
- `pending`: Issue identified, solution designed, awaiting implementation
- `ready`: Analysis complete, solution documented, ready to implement
- `complete`: (alternative spelling, see issue 020)

## Bulk Documentation Command

To extract summary frontmatter from all issues:

```bash
for f in /Users/alijangbar/sparlo-v2/todos/*.md; do
  echo "=== $(basename "$f") ==="
  head -20 "$f" | grep -E "^(title|status|priority|severity|tags|component):"
done
```

## Integration with Compound Docs Workflow

1. **Search:** Use tags and categories to find related issues
2. **Filter:** Show only high-severity items, or issues in specific component
3. **Track:** Monitor status progression from pending → ready → completed
4. **Analyze:** Identify patterns (e.g., all useSparlo issues)
5. **Plan:** Use dependencies to sequence implementation
6. **Document:** Update architecture docs as issues are resolved

## Example: Complete Issue Documentation

See `/Users/alijangbar/sparlo-v2/todos/001-completed-p1-unmounted-component-state-updates.md` for a complete example with all sections properly formatted.

---

**Last Updated:** 2024-12-16
**Extraction Status:** 40/40 issues documented in `/todos/`
**Compound Docs Status:** Ready for integration
