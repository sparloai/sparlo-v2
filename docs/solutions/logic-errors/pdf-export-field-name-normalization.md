---
title: PDF Export Missing Sections Due to Field Name Mismatches
category: logic-errors
tags: [pdf, export, field-mapping, react-pdf, data-normalization]
severity: medium
date_documented: 2025-12-24
---

# PDF Export Missing Sections Due to Field Name Mismatches

## Problem

PDF export was missing critical sections including:
- Solution Concepts
- Innovation Concepts
- Self-Critique

The fields existed in the report data returned from the API but weren't rendering in the exported PDF document.

## Root Cause

Field name mismatch between database/API response and PDF component expectations:

| Database Field | PDF Expected Field |
|----------------|-------------------|
| `solution_concepts` | `execution_track` |
| `innovation_concepts` | `innovation_portfolio` |

Additionally, the Self-Critique section was completely missing from the PDF template implementation.

## Solution

### 1. Field Name Normalization

Added field name normalization in the PDF document component to handle both old and new field naming conventions:

```typescript
// Normalize field names for PDF rendering
const normalizedReport = {
  ...report,
  execution_track: report.execution_track || report.solution_concepts,
  innovation_portfolio: report.innovation_portfolio || report.innovation_concepts,
};
```

This approach:
- Maintains backward compatibility with existing data
- Allows the PDF component to work with both field naming conventions
- Gracefully handles the transition between API schema versions

### 2. Added Missing Self-Critique Section

Implemented the Self-Critique section in the PDF template to ensure all report sections are included in the export.

## Key Insights

1. **Schema Evolution Tracking**: When API field names evolve, PDF export components can easily get out of sync since they operate on a snapshot of the data structure.

2. **Always Check Field Mappings**: When sections don't render in PDF exports, the first debugging step should be to verify that field names match between:
   - Database schema
   - API response structure
   - PDF component expectations

3. **Defensive Programming**: Using fallback field names (`field1 || field2`) provides resilience against schema changes and data migration periods.

## Prevention

To prevent similar issues in the future:

1. **Centralize Field Mappings**: Consider creating a shared type definition or mapping configuration that both API and PDF components reference.

2. **Add Type Validation**: Use TypeScript interfaces to ensure field name consistency across components.

3. **Integration Tests**: Add tests that verify PDF exports contain all expected sections by checking the actual rendered output.

4. **Documentation**: Maintain a field mapping document when schema changes occur, especially during migration periods.

## Related Files

- PDF Document Component: Components that generate PDF exports
- API Response Types: Type definitions for report data structure
- Database Schema: Report table definitions

## Impact

- **Severity**: Medium - Missing sections significantly reduce the value of PDF exports
- **User Impact**: Users were unable to access complete report information in PDF format
- **Business Impact**: Reduced utility of the PDF export feature, potential confusion about missing data
