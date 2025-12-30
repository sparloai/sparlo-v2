import 'server-only';

/**
 * Print-optimized CSS styles for PDF generation.
 *
 * These styles are embedded directly in the HTML output and are designed
 * for Puppeteer/Chromium PDF rendering. Uses Suisse Intl for headings
 * and Soehne for body text, matching the Sparlo brand.
 */

// Logo as base64 for reliable embedding in PDF
export const LOGO_BASE64 =
  'data:image/png;base64,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';

export const PRINT_STYLES = `
/* ============================================
   BASE RESET & PAGE SETUP
   ============================================ */

@page {
  size: A4;
  margin: 48px 48px 64px 48px;
}

@page :first {
  margin-top: 48px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

/* ============================================
   TYPOGRAPHY
   Suisse Intl for headings, Soehne for body
   Falls back to system fonts for PDF generation
   ============================================ */

body {
  font-family: 'Suisse Intl', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  font-size: 10pt;
  line-height: 1.5;
  color: #3f3f46; /* zinc-700 */
  background: white;
}

/* Heading font */
h1, h2, h3, h4, .report-title, .section-title, .subsection-title,
.recommendation-title, .innovation-title, .concept-title, .investigation-title {
  font-family: 'Suisse Intl', 'SF Pro Display', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
}

/* Monospace for labels and code */
.mono-label, .mono-label-strong, .mono-label-muted, code {
  font-family: 'Soehne Mono', 'SF Mono', 'JetBrains Mono', ui-monospace, monospace;
}

/* ============================================
   LOGO
   ============================================ */

.report-logo {
  margin-bottom: 32px;
}

.report-logo img {
  height: 28px;
  width: auto;
}

/* ============================================
   COLORS (Zinc Palette)
   ============================================ */

:root {
  --zinc-50: #fafafa;
  --zinc-100: #f4f4f5;
  --zinc-200: #e4e4e7;
  --zinc-300: #d4d4d8;
  --zinc-400: #a1a1aa;
  --zinc-500: #71717a;
  --zinc-600: #52525b;
  --zinc-700: #3f3f46;
  --zinc-800: #27272a;
  --zinc-900: #18181b;
  --zinc-950: #09090b;
}

/* ============================================
   LAYOUT
   ============================================ */

.report-container {
  max-width: 100%;
  padding: 0;
}

/* ============================================
   HEADER
   ============================================ */

.report-header {
  margin-bottom: 48px;
  page-break-after: avoid;
}

.report-title {
  font-size: 28pt;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: var(--zinc-900);
  margin-bottom: 12px;
}

.report-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 9pt;
  color: var(--zinc-500);
}

.meta-separator {
  color: var(--zinc-300);
}

/* ============================================
   SECTIONS
   ============================================ */

.section {
  margin-top: 36px;
  page-break-inside: avoid;
}

.section-title {
  font-size: 20pt;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--zinc-900);
  margin-bottom: 16px;
  page-break-after: avoid;
}

.subsection-title {
  font-size: 14pt;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--zinc-900);
  margin-bottom: 12px;
  margin-top: 24px;
  page-break-after: avoid;
}

.section-intro {
  font-size: 11pt;
  line-height: 1.5;
  color: var(--zinc-600);
  margin-bottom: 20px;
  max-width: 60ch;
}

/* ============================================
   CONTENT BLOCKS
   ============================================ */

.content-block {
  margin-top: 16px;
  page-break-inside: avoid;
}

.content-block + .content-block {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--zinc-200);
}

/* ============================================
   TYPOGRAPHY COMPONENTS
   ============================================ */

.mono-label {
  display: block;
  font-size: 8pt;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--zinc-500);
  margin-bottom: 6px;
}

.mono-label-strong {
  display: block;
  font-size: 8pt;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--zinc-900);
  margin-bottom: 6px;
}

.mono-label-muted {
  display: block;
  font-size: 8pt;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--zinc-400);
  margin-bottom: 6px;
}

.body-text {
  font-size: 11pt;
  line-height: 1.5;
  color: var(--zinc-700);
  max-width: 60ch;
}

.body-text-lg {
  font-size: 12pt;
  line-height: 1.5;
  color: var(--zinc-700);
  max-width: 60ch;
}

.body-text-secondary {
  font-size: 10pt;
  line-height: 1.5;
  color: var(--zinc-600);
  max-width: 60ch;
}

.lead-text {
  font-size: 13pt;
  line-height: 1.4;
  color: var(--zinc-800);
  margin-bottom: 20px;
  max-width: 60ch;
}

/* ============================================
   BOXES & HIGHLIGHTS
   ============================================ */

.brief-box {
  background: var(--zinc-50);
  border: 1px solid var(--zinc-200);
  border-radius: 4px;
  padding: 16px;
}

.insight-box {
  border-left: 3px solid var(--zinc-900);
  padding-left: 16px;
  margin-top: 16px;
  page-break-inside: avoid;
}

.insight-headline {
  font-size: 13pt;
  font-weight: 500;
  color: var(--zinc-900);
  margin-bottom: 8px;
}

.insight-block {
  border-left: 3px solid var(--zinc-900);
  padding-left: 16px;
  margin-top: 20px;
  page-break-inside: avoid;
}

.insight-what {
  font-size: 12pt;
  font-weight: 500;
  color: var(--zinc-900);
  margin-bottom: 8px;
  line-height: 1.4;
}

.insight-source {
  margin-top: 8px;
  font-size: 10pt;
  color: var(--zinc-600);
}

.insight-source p {
  margin-bottom: 4px;
}

.insight-source .label {
  font-weight: 500;
  color: var(--zinc-500);
}

.insight-missed {
  margin-top: 8px;
  font-size: 10pt;
  color: var(--zinc-600);
  font-style: italic;
}

.viability-box {
  background: var(--zinc-900);
  color: white;
  padding: 16px;
  margin-bottom: 20px;
  page-break-inside: avoid;
}

.viability-box .mono-label {
  color: var(--zinc-400);
}

.viability-box .body-text-lg {
  color: white;
}

.warning-box {
  background: var(--zinc-50);
  border: 1px solid var(--zinc-300);
  border-left: 3px solid var(--zinc-700);
  padding: 16px;
  margin-top: 16px;
  page-break-inside: avoid;
}

.warning-list {
  list-style: none;
  padding: 0;
  margin-top: 8px;
}

.warning-list li {
  position: relative;
  padding-left: 16px;
  margin-bottom: 6px;
  font-size: 10pt;
  color: var(--zinc-600);
}

.warning-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 7px;
  width: 4px;
  height: 4px;
  background: var(--zinc-400);
  border-radius: 50%;
}

.breakthrough-box {
  background: var(--zinc-50);
  border: 1px solid var(--zinc-200);
  padding: 16px;
  margin-top: 16px;
  page-break-inside: avoid;
}

.confidence-box {
  background: var(--zinc-50);
  border: 1px solid var(--zinc-200);
  padding: 16px;
  margin-bottom: 20px;
  page-break-inside: avoid;
}

.confidence-value {
  font-size: 14pt;
  font-weight: 600;
  color: var(--zinc-900);
  margin-top: 4px;
}

/* ============================================
   METRICS GRID
   ============================================ */

.metrics-grid {
  display: flex;
  gap: 24px;
  background: var(--zinc-50);
  border: 1px solid var(--zinc-200);
  padding: 16px;
  margin-top: 16px;
  page-break-inside: avoid;
}

.metric-item {
  flex: 1;
}

.metric-value {
  font-size: 12pt;
  font-weight: 600;
  color: var(--zinc-900);
  margin-top: 4px;
}

.metric-highlight {
  font-size: 12pt;
  font-weight: 600;
  color: var(--zinc-900);
  margin-top: 8px;
}

/* ============================================
   LISTS
   ============================================ */

.constraint-list {
  list-style: none;
  padding: 0;
  margin-top: 8px;
}

.constraint-list li {
  position: relative;
  padding-left: 16px;
  margin-bottom: 8px;
  font-size: 10pt;
  color: var(--zinc-600);
}

.constraint-list.hard li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  width: 6px;
  height: 6px;
  background: var(--zinc-900);
  border-radius: 50%;
}

.constraint-list.soft li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  width: 6px;
  height: 6px;
  background: var(--zinc-400);
  border-radius: 50%;
}

.constraint-list.assumption li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  width: 6px;
  height: 6px;
  background: var(--zinc-300);
  border-radius: 50%;
}

.numbered-list {
  list-style: none;
  padding: 0;
  margin-top: 12px;
}

.numbered-item {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  page-break-inside: avoid;
}

.step-number {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9pt;
  font-weight: 600;
  color: var(--zinc-400);
}

.step-content {
  flex: 1;
}

.step-rationale {
  font-size: 9pt;
  color: var(--zinc-500);
  margin-top: 4px;
  font-style: italic;
}

.critique-list {
  list-style: none;
  padding: 0;
  margin-top: 8px;
}

.critique-list li {
  position: relative;
  padding-left: 16px;
  margin-bottom: 8px;
  font-size: 10pt;
  color: var(--zinc-600);
}

.critique-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  width: 6px;
  height: 6px;
  background: var(--zinc-400);
  border-radius: 50%;
}

/* ============================================
   TABLES
   ============================================ */

.benchmark-table {
  margin-top: 12px;
  overflow: hidden;
}

.benchmark-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 9pt;
}

.benchmark-table th {
  text-align: left;
  padding: 8px 12px;
  background: var(--zinc-100);
  font-weight: 600;
  color: var(--zinc-700);
  border-bottom: 1px solid var(--zinc-300);
}

.benchmark-table td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--zinc-200);
  color: var(--zinc-600);
}

/* ============================================
   RECOMMENDATIONS & CONCEPTS
   ============================================ */

.primary-recommendation,
.recommended-innovation {
  margin-top: 20px;
  page-break-inside: avoid;
}

.recommendation-header,
.innovation-header {
  margin-bottom: 16px;
  page-break-after: avoid;
}

.recommendation-title,
.innovation-title {
  font-size: 16pt;
  font-weight: 600;
  color: var(--zinc-900);
  margin: 8px 0;
}

.recommendation-meta,
.innovation-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 9pt;
  color: var(--zinc-500);
}

.confidence {
  font-weight: 500;
  color: var(--zinc-700);
}

.confidence-badge {
  font-size: 9pt;
  font-weight: 500;
  color: var(--zinc-700);
  background: var(--zinc-100);
  padding: 2px 8px;
  border-radius: 2px;
}

.supporting-concepts,
.parallel-investigations {
  margin-top: 24px;
}

.concepts-list,
.investigations-list {
  margin-top: 16px;
}

.concept-item,
.investigation-item {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--zinc-200);
  page-break-inside: avoid;
}

.concept-item:last-child,
.investigation-item:last-child {
  border-bottom: none;
}

.concept-header,
.investigation-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 8px;
}

.concept-title,
.investigation-title {
  font-size: 12pt;
  font-weight: 600;
  color: var(--zinc-900);
}

.concept-relationship {
  font-size: 8pt;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--zinc-400);
}

.concept-oneliner,
.investigation-oneliner {
  font-size: 10pt;
  color: var(--zinc-600);
  font-style: italic;
  margin-bottom: 12px;
}

.concept-detail {
  margin-top: 12px;
}

.concept-when {
  margin-top: 12px;
  border-left: 2px solid var(--zinc-200);
  padding-left: 12px;
}

.ceiling,
.uncertainty {
  font-size: 10pt;
  color: var(--zinc-600);
  margin-top: 6px;
}

/* ============================================
   VALIDATION
   ============================================ */

.validation-gates {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--zinc-200);
}

.gates-list {
  margin-top: 12px;
}

.gate-item {
  padding: 12px 0 12px 16px;
  border-left: 2px solid var(--zinc-300);
  margin-bottom: 12px;
  page-break-inside: avoid;
}

.gate-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.gate-week {
  font-size: 8pt;
  font-weight: 500;
  color: var(--zinc-400);
}

.gate-test {
  font-size: 11pt;
  font-weight: 500;
  color: var(--zinc-900);
  margin-top: 2px;
}

.gate-cost {
  font-size: 8pt;
  color: var(--zinc-500);
  flex-shrink: 0;
}

.gate-detail {
  font-size: 10pt;
  color: var(--zinc-600);
  margin-top: 6px;
}

.gate-detail .label {
  font-weight: 500;
  color: var(--zinc-500);
}

.gate-decision {
  font-size: 9pt;
  color: var(--zinc-500);
  font-style: italic;
  margin-top: 6px;
}

.validation-path {
  margin-top: 16px;
  padding: 12px;
  background: var(--zinc-50);
  border: 1px solid var(--zinc-200);
  page-break-inside: avoid;
}

.validation-meta {
  display: flex;
  gap: 16px;
  font-size: 9pt;
  color: var(--zinc-500);
  margin-top: 8px;
}

.go-no-go {
  font-size: 10pt;
  font-weight: 500;
  color: var(--zinc-700);
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--zinc-200);
}

.validation-gaps {
  margin-top: 12px;
}

.gap-item {
  padding: 12px;
  margin-bottom: 8px;
  background: var(--zinc-50);
  border: 1px solid var(--zinc-200);
  page-break-inside: avoid;
}

.gap-item.addressed {
  border-left: 3px solid #22c55e;
}

.gap-item.extended-needed {
  border-left: 3px solid #eab308;
}

.gap-item.accepted-risk {
  border-left: 3px solid var(--zinc-400);
}

.gap-header {
  margin-bottom: 6px;
}

.gap-status {
  font-size: 8pt;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--zinc-500);
}

.gap-concern {
  font-size: 10pt;
  font-weight: 500;
  color: var(--zinc-800);
  margin-bottom: 4px;
}

.gap-rationale {
  font-size: 9pt;
  color: var(--zinc-600);
}

/* ============================================
   CHALLENGE FRAME
   ============================================ */

.challenge-list {
  margin-top: 16px;
}

.challenge-item {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--zinc-200);
  page-break-inside: avoid;
}

.challenge-item:last-child {
  border-bottom: none;
}

.challenge-assumption,
.challenge-challenge {
  margin-bottom: 12px;
}

.challenge-implication {
  border-left: 2px solid var(--zinc-200);
  padding-left: 12px;
}

/* ============================================
   RISKS
   ============================================ */

.risks-list {
  margin-top: 16px;
}

.risk-item {
  padding: 12px;
  margin-bottom: 12px;
  background: var(--zinc-50);
  border: 1px solid var(--zinc-200);
  page-break-inside: avoid;
}

.risk-item.high {
  border-left: 3px solid var(--zinc-800);
}

.risk-item.medium {
  border-left: 3px solid var(--zinc-500);
}

.risk-item.low {
  border-left: 3px solid var(--zinc-300);
}

.risk-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.risk-category {
  font-size: 8pt;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--zinc-500);
}

.risk-severity {
  font-size: 8pt;
  color: var(--zinc-500);
}

.risk-severity.high {
  color: var(--zinc-800);
  font-weight: 500;
}

.risk-description {
  font-size: 10pt;
  color: var(--zinc-700);
  margin-bottom: 8px;
}

.risk-mitigation {
  font-size: 9pt;
  color: var(--zinc-600);
}

.risk-section {
  margin-top: 12px;
}

.risk-label {
  font-size: 9pt;
  font-weight: 500;
  color: var(--zinc-600);
  margin-bottom: 4px;
}

/* ============================================
   RECOMMENDATION SECTION
   ============================================ */

.personal-recommendation {
  margin-top: 16px;
  padding: 16px;
  background: var(--zinc-50);
  border: 1px solid var(--zinc-200);
}

.key-insight {
  font-size: 12pt;
  font-weight: 500;
  color: var(--zinc-900);
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--zinc-200);
}

/* ============================================
   HYPOTHESIS
   ============================================ */

.hypothesis-list {
  margin-top: 12px;
}

.hypothesis-item {
  padding: 12px;
  margin-bottom: 8px;
  background: var(--zinc-50);
  border: 1px solid var(--zinc-200);
  page-break-inside: avoid;
}

.hypothesis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.hypothesis-name {
  font-size: 11pt;
  font-weight: 600;
  color: var(--zinc-900);
}

/* ============================================
   EQUATIONS
   ============================================ */

.equation-box {
  margin-top: 12px;
  padding: 12px;
  background: var(--zinc-100);
  border: 1px solid var(--zinc-200);
}

.equation-box code {
  font-family: 'SF Mono', Monaco, Consolas, monospace;
  font-size: 10pt;
  color: var(--zinc-800);
}

.equation-explanation {
  font-size: 9pt;
  color: var(--zinc-600);
  margin-top: 8px;
}

.physics-box {
  margin-top: 12px;
  padding: 12px;
  background: var(--zinc-100);
  border: 1px solid var(--zinc-200);
}

.physics-box .label {
  font-size: 8pt;
  font-weight: 500;
  color: var(--zinc-500);
  display: block;
  margin-bottom: 4px;
}

.physics-box code {
  font-family: 'SF Mono', Monaco, Consolas, monospace;
  font-size: 10pt;
  color: var(--zinc-800);
}

/* ============================================
   PRINT-SPECIFIC RULES
   ============================================ */

@media print {
  body {
    background: white;
  }

  .section {
    page-break-inside: avoid;
  }

  .section-title,
  .subsection-title {
    page-break-after: avoid;
  }

  h1, h2, h3, h4 {
    page-break-after: avoid;
  }

  p {
    orphans: 3;
    widows: 3;
  }

  .page-break {
    page-break-before: always;
  }

  .no-break {
    page-break-inside: avoid;
  }
}
`;
