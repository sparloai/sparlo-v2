# SPARLO Aura Report Redesign (100% Fidelity)

## Overview

Redesign `hybrid-report-display.tsx` to match the Aura HTML design system with 100% fidelity. This plan captures every pattern from the reference HTML files.

**Target:** Match the Aura HTML exactly—border-l-4 ink headers, rounded-xl cards with shadows, monospace labels, proper tables, dark inverted sections.

---

## Aura Design Tokens

```css
/* Colors */
ink: #09090b       /* zinc-950 - primary text, borders */
subtle: #52525b    /* zinc-600 - secondary text */
hairline: #e4e4e7  /* zinc-200 - borders */
paper: #ffffff     /* white - backgrounds */
canvas: #f4f4f5    /* zinc-100 - subtle backgrounds */
```

**Typography:**
- Body: Inter (already configured as `--font-sans`)
- Mono: JetBrains Mono / font-mono

---

## Core Design Patterns

### 1. Report Header
```tsx
<div className="mb-14 border-l-4 border-zinc-950 pl-8 py-2">
  <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-950 mb-3">
    {title}
  </h1>
  <h2 className="text-lg sm:text-xl text-zinc-600 leading-relaxed max-w-3xl font-normal">
    {subtitle}
  </h2>
</div>
```

### 2. Section Header
```tsx
<div className="mb-10 border-l-4 border-zinc-950 pl-6 py-1">
  <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 mb-3">
    {title}
  </h2>
  {subtitle && (
    <p className="text-lg text-zinc-600 font-normal leading-relaxed max-w-4xl">
      {subtitle}
    </p>
  )}
</div>
```

**Note:** All section headers use `border-zinc-950` (ink), NOT violet or other colors.

### 3. Card with Header
```tsx
<section className="border border-zinc-200 rounded-xl overflow-hidden shadow-sm bg-white">
  {/* Card Header */}
  <div className="bg-zinc-50/50 border-b border-zinc-200 p-6 flex items-center gap-3">
    <Icon className="h-5 w-5 text-zinc-950" />
    <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-600">
      {label}
    </h3>
  </div>
  {/* Card Body */}
  <div className="p-8 sm:p-10">
    {children}
  </div>
</section>
```

### 4. Simple Card (No Header)
```tsx
<div className="border border-zinc-200 rounded-xl p-8 bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
  {children}
</div>
```

### 5. Monospace Label
```tsx
<span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-600">
  {label}
</span>
```

### 6. Data Field
```tsx
<div className="space-y-1">
  <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-600">
    {label}
  </span>
  <div className="text-base text-zinc-900 leading-relaxed font-normal">
    {value}
  </div>
</div>
```

### 7. Badge Pattern
```tsx
<span className="px-2.5 py-1 rounded text-xs font-mono font-medium uppercase tracking-widest bg-green-50 text-green-700 border border-green-200">
  {text}
</span>

// Variants:
// Success: bg-green-50 text-green-700 border-green-200
// Warning: bg-amber-50 text-amber-700 border-amber-200
// Info: bg-blue-50 text-blue-700 border-blue-200
// Neutral: bg-zinc-100 text-zinc-600 border-zinc-200
```

### 8. Progress Bar
```tsx
<div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
  <div className="bg-zinc-950 h-full" style={{ width: `${percent}%` }} />
</div>
```

### 9. Confidence Meter
```tsx
<div className="flex flex-col items-end gap-2 min-w-[160px]">
  <div className="flex justify-between w-full text-sm font-mono text-zinc-600 font-medium">
    <span>CONFIDENCE</span>
    <span className="text-zinc-950 font-bold">{value}%</span>
  </div>
  <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
    <div className="h-full bg-zinc-950" style={{ width: `${value}%` }} />
  </div>
</div>
```

### 10. Table
```tsx
<div className="border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
  <table className="w-full text-left">
    <thead className="bg-zinc-50/50 border-b border-zinc-200">
      <tr>
        <th className="px-6 py-4 font-mono text-xs font-bold text-zinc-600 uppercase tracking-wider">
          {header}
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-zinc-200 bg-white">
      <tr>
        <td className="px-6 py-4 text-sm text-zinc-700 font-normal">
          {cell}
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### 11. Dark Inverted Section
```tsx
<div className="bg-zinc-950 text-white rounded-xl shadow-lg border border-zinc-800 p-8 sm:p-10 relative overflow-hidden">
  <h4 className="text-sm font-mono font-bold uppercase tracking-widest text-zinc-400 mb-4">
    {label}
  </h4>
  <p className="text-lg sm:text-xl font-light leading-relaxed text-zinc-100 max-w-3xl">
    {content}
  </p>
</div>
```

### 12. Dark Validation Card (First Validation Step)
```tsx
<div className="bg-zinc-950 text-white rounded-lg p-6 relative overflow-hidden shadow-lg border border-zinc-800">
  <h4 className="text-sm font-mono font-bold uppercase tracking-widest text-zinc-300 mb-5">
    First Validation Step
  </h4>

  <div className="space-y-4">
    <div>
      <span className="text-xs text-zinc-400 font-mono font-bold block mb-2">TEST PROTOCOL</span>
      <p className="text-base font-medium">{protocol}</p>
    </div>

    <div className="flex gap-6">
      <div>
        <span className="text-xs text-zinc-400 font-mono font-bold block mb-2">COST</span>
        <span className="text-base font-mono text-white">{cost}</span>
      </div>
      <div>
        <span className="text-xs text-zinc-400 font-mono font-bold block mb-2">TIMELINE</span>
        <span className="text-base font-mono text-white">{timeline}</span>
      </div>
    </div>

    <div className="pt-4 border-t border-zinc-800 grid grid-cols-2 gap-4 text-sm">
      <div>
        <span className="text-green-400 font-mono font-bold mr-1">GO:</span>
        <span className="text-zinc-300">{goCondition}</span>
      </div>
      <div>
        <span className="text-red-400 font-mono font-bold mr-1">NO-GO:</span>
        <span className="text-zinc-300">{noGoCondition}</span>
      </div>
    </div>
  </div>
</div>
```

### 13. Sustainability Flag
```tsx
<div className="flex items-center gap-3 mb-4">
  <Leaf className="h-5 w-5 text-green-600" />
  <span className="text-sm font-mono font-bold text-zinc-950 uppercase tracking-wider">
    Sustainability Flag
  </span>
</div>
<p className="text-base text-zinc-900 leading-relaxed font-normal">
  <span className="text-green-800 font-semibold text-xs border border-green-300 bg-green-100 px-2 py-0.5 rounded mr-2 align-middle">
    BENEFIT
  </span>
  {description}
</p>

// Badge variants:
// BENEFIT: text-green-800 border-green-300 bg-green-100
// LIFECYCLE_TRADEOFF: text-amber-800 border-amber-300 bg-amber-100
// CAUTION: text-amber-800 border-amber-300 bg-amber-100
```

### 14. Bullet List
```tsx
<ul className="space-y-4">
  <li className="flex gap-4 items-start group">
    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-zinc-300 group-hover:bg-zinc-950 transition-colors" />
    <span className="text-base text-zinc-600 font-normal leading-relaxed">
      <strong className="text-zinc-950 font-medium">{title}</strong>
      {description}
    </span>
  </li>
</ul>
```

### 15. First Principles Insight Block
```tsx
<div className="border-l-4 border-zinc-950 pl-8 py-2 bg-zinc-50/50 rounded-r-lg">
  <h4 className="text-base font-mono font-bold uppercase tracking-widest text-zinc-600 mb-3">
    First Principles Insight
  </h4>
  <p className="text-xl text-zinc-950 font-medium leading-relaxed mb-4">
    {headline}
  </p>
  <p className="text-base text-zinc-600 font-normal leading-relaxed max-w-4xl">
    {explanation}
  </p>
</div>
```

### 16. Domain Tags (Dark)
```tsx
<div className="flex flex-wrap gap-3">
  <span className="text-xs font-mono font-medium border border-zinc-700 bg-zinc-900/50 px-3 py-1.5 rounded-full text-zinc-300">
    {domain}
  </span>
</div>
```

### 17. Economics Definition List
```tsx
<dl className="space-y-6">
  <div className="flex flex-col gap-2">
    <dt className="text-sm font-mono font-bold text-zinc-600">INVESTMENT</dt>
    <dd className="text-base font-semibold text-zinc-950">{value}</dd>
  </div>
</dl>
```

### 18. Risk Table Row
```tsx
<tr className="bg-zinc-50">
  <td className="px-4 py-3 text-sm font-semibold text-zinc-950 w-1/2 align-top">
    {risk}
  </td>
  <td className="px-4 py-3 text-sm text-zinc-900 align-top">
    {mitigation}
  </td>
</tr>
```

---

## Frontier Technologies Deep-Dive Pattern

### Numbered Section Header
```tsx
<div className="flex items-center gap-4 mb-6">
  <div className="w-8 h-8 flex items-center justify-center bg-zinc-950 text-white font-mono text-sm font-medium rounded">
    {String(index).padStart(2, '0')}
  </div>
  <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
    {title}
  </h2>
</div>
```

### Metadata Info Card
```tsx
<div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 md:p-6 mb-8">
  <div className="flex flex-wrap gap-y-2 gap-x-6 text-xs md:text-sm font-mono">
    <div className="flex items-center gap-2">
      <span className="text-zinc-500 uppercase tracking-wider">Type:</span>
      <span className="font-semibold text-zinc-900">{type}</span>
    </div>
    <div className="hidden md:block w-px h-4 bg-zinc-300" />
    <div className="flex items-center gap-2">
      <span className="text-zinc-500 uppercase tracking-wider">Earliest Viability:</span>
      <span className="font-semibold text-zinc-900">{viability}</span>
    </div>
    <div className="hidden md:block w-px h-4 bg-zinc-300" />
    <div className="flex items-center gap-2">
      <span className="text-zinc-500 uppercase tracking-wider">Current TRL:</span>
      <span className="font-semibold text-zinc-900">{trl}</span>
    </div>
  </div>
</div>
```

### Key Parameters Table
```tsx
<div className="border border-zinc-200 rounded-lg overflow-hidden">
  <table className="w-full text-left">
    <thead className="bg-zinc-50">
      <tr>
        <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider border-b border-zinc-200">
          Parameter
        </th>
        <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider border-b border-zinc-200">
          Current State
        </th>
        <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider border-b border-zinc-200">
          Required for Viability
        </th>
        <th className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider border-b border-zinc-200">
          Gap
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-zinc-100 bg-white">
      <tr>
        <td className="px-4 py-3 text-sm font-medium text-zinc-900">{param}</td>
        <td className="px-4 py-3 text-xs font-mono text-zinc-600">{current}</td>
        <td className="px-4 py-3 text-xs font-mono text-zinc-600">{required}</td>
        <td className="px-4 py-3 text-xs text-zinc-500">{gap}</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Gap Badge (Red)
```tsx
<span className="text-xs font-mono text-red-600 bg-red-50 inline-block rounded px-2 py-0.5">
  {gap}
</span>
```

### Viability Assessment (Dark Footer Card)
```tsx
<div className="bg-zinc-950 text-white rounded-xl p-6 md:p-8 relative overflow-hidden">
  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400 mb-4">
    Viability Assessment
  </h3>
  <p className="text-lg font-medium mb-4">{headline}</p>
  <p className="text-sm text-zinc-400 leading-relaxed mb-6 max-w-3xl">
    {description}
  </p>
  <div className="grid md:grid-cols-2 gap-6 text-sm border-t border-zinc-800 pt-6">
    <div>
      <strong className="block text-white mb-1">Revisit in {timeframe}</strong>
      <span className="text-zinc-500">{revisitReason}</span>
    </div>
    <div>
      <strong className="block text-white mb-1">Alternative Strategy</strong>
      <span className="text-zinc-500">{alternative}</span>
    </div>
  </div>
</div>
```

---

## Implementation Plan

### Phase 1: Core Infrastructure

**File:** `apps/web/app/home/(user)/reports/[id]/_components/hybrid-report-display.tsx`

#### 1.1 Update SectionHeader Component

```tsx
function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-10 border-l-4 border-zinc-950 pl-6 py-1">
      <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 mb-3">
        {title}
      </h2>
      {subtitle && (
        <p className="text-lg text-zinc-600 font-normal leading-relaxed max-w-4xl">
          {subtitle}
        </p>
      )}
    </div>
  );
}
```

#### 1.2 Add CardWithHeader Component

```tsx
function CardWithHeader({
  icon: Icon,
  label,
  children,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(
      "border border-zinc-200 rounded-xl overflow-hidden shadow-sm bg-white",
      className
    )}>
      <div className="bg-zinc-50/50 border-b border-zinc-200 p-6 flex items-center gap-3">
        {Icon && <Icon className="h-5 w-5 text-zinc-950" />}
        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-600">
          {label}
        </h3>
      </div>
      <div className="p-8 sm:p-10">
        {children}
      </div>
    </section>
  );
}
```

#### 1.3 Add MonoLabel Component

```tsx
function MonoLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-600">
      {children}
    </span>
  );
}
```

#### 1.4 Add AuraTable Component

```tsx
function AuraTable({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
      <table className="w-full text-left">
        <thead className="bg-zinc-50/50 border-b border-zinc-200">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="px-6 py-4 font-mono text-xs font-bold text-zinc-600 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 bg-white">
          {children}
        </tbody>
      </table>
    </div>
  );
}
```

#### 1.5 Add DarkSection Component

```tsx
function DarkSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-950 text-white rounded-xl shadow-lg border border-zinc-800 p-8 sm:p-10 relative overflow-hidden">
      <h4 className="text-sm font-mono font-bold uppercase tracking-widest text-zinc-400 mb-4">
        {label}
      </h4>
      {children}
    </div>
  );
}
```

#### 1.6 Add ConfidenceMeter Component

```tsx
function ConfidenceMeter({ value }: { value: number }) {
  return (
    <div className="flex flex-col items-end gap-2 min-w-[160px]">
      <div className="flex justify-between w-full text-sm font-mono text-zinc-600 font-medium">
        <span>CONFIDENCE</span>
        <span className="text-zinc-950 font-bold">{value}%</span>
      </div>
      <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
        <div className="h-full bg-zinc-950" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
```

#### 1.7 Add AuraBadge Component

```tsx
type BadgeVariant = 'success' | 'warning' | 'info' | 'neutral';

function AuraBadge({
  children,
  variant = 'neutral',
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
}) {
  const variants = {
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    neutral: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  };

  return (
    <span className={cn(
      'px-2.5 py-1 rounded text-xs font-mono font-medium uppercase tracking-widest border',
      variants[variant]
    )}>
      {children}
    </span>
  );
}
```

---

### Phase 2: Global Style Updates

Apply these search/replace operations throughout the file:

| Find | Replace | Reason |
|------|---------|--------|
| `rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800` | `border border-zinc-200 rounded-xl p-6 bg-white shadow-sm` | Card pattern |
| `rounded-lg border` | `rounded-xl border` | Aura uses rounded-xl |
| `font-medium uppercase tracking-widest` | `font-bold uppercase tracking-widest` | Labels are bold |
| `text-zinc-500 dark:text-zinc-400` (labels) | `text-zinc-600` | Label color |
| `border-l-violet-500` | `border-zinc-950` | Section borders are ink |
| `border-l-amber-500` | `border-zinc-950` | Section borders are ink |
| `border-l-green-500` | `border-zinc-950` | Section borders are ink |

---

### Phase 3: Section-by-Section Updates

#### The Brief (Executive Summary)
```tsx
<CardWithHeader icon={Target} label="The Brief">
  <p className="text-xl sm:text-2xl text-zinc-950 font-light leading-relaxed">
    {briefContent}
  </p>
</CardWithHeader>
```

#### Executive Summary
```tsx
<SectionHeader
  title="Executive Summary"
  subtitle={summaryDescription}
/>

{/* Viability & Recommendation Grid */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
  {/* Viability Card */}
  <div className="border border-zinc-200 rounded-xl p-8 bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
    <div className="flex items-center justify-between mb-6">
      <MonoLabel>Viability Status</MonoLabel>
      <AuraBadge variant="success">ACHIEVABLE</AuraBadge>
    </div>
    {/* Progress bars... */}
  </div>

  {/* Recommendation Card */}
  <div className="border border-blue-100 bg-blue-50/30 rounded-xl p-8 shadow-sm">
    {/* ... */}
  </div>
</div>
```

#### Problem Analysis
```tsx
<SectionHeader title="Problem Analysis" />

{/* What Industry Does Today - bullet list */}
<div className="border-b border-zinc-200 pb-12">
  <h4 className="text-base font-semibold text-zinc-950 mb-6">What Industry Does Today</h4>
  <ul className="space-y-4">
    <li className="flex gap-4 items-start group">
      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-zinc-300 group-hover:bg-zinc-950 transition-colors" />
      <span className="text-base text-zinc-600 font-normal leading-relaxed">
        <strong className="text-zinc-950 font-medium">{title}</strong> — {description}
      </span>
    </li>
  </ul>
</div>

{/* First Principles Insight */}
<div className="border-l-4 border-zinc-950 pl-8 py-2 bg-zinc-50/50 rounded-r-lg">
  <h4 className="text-base font-mono font-bold uppercase tracking-widest text-zinc-600 mb-3">
    First Principles Insight
  </h4>
  <p className="text-xl text-zinc-950 font-medium leading-relaxed mb-4">
    {headline}
  </p>
  <p className="text-base text-zinc-600 font-normal leading-relaxed max-w-4xl">
    {explanation}
  </p>
</div>

{/* Root Cause Hypotheses - 3 column grid */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <div className="border border-zinc-200 rounded-lg p-6 hover:border-zinc-400 transition-colors">
    <div className="flex items-center justify-between mb-3">
      <MonoLabel>Mechanism</MonoLabel>
      <span className="text-[10px] font-mono border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 rounded text-zinc-600">
        95% CONF
      </span>
    </div>
    <h5 className="text-sm font-semibold text-zinc-950 mb-2">{title}</h5>
    <p className="text-sm text-zinc-600 leading-normal font-normal">{description}</p>
  </div>
</div>
```

#### Constraints & Metrics
```tsx
<SectionHeader title="Constraints & Success Metrics" />

<AuraTable headers={['Hard Constraints', 'Soft Constraints', 'Assumptions']}>
  <tr>
    <td className="px-6 py-4 text-sm text-zinc-700 font-normal">{hard}</td>
    <td className="px-6 py-4 text-sm text-zinc-700 font-normal">{soft}</td>
    <td className="px-6 py-4 text-sm text-zinc-700 font-normal">{assumption}</td>
  </tr>
</AuraTable>
```

#### Innovation Analysis (Dark Section)
```tsx
<DarkSection label="The Reframe">
  <p className="text-lg sm:text-xl font-light leading-relaxed text-zinc-100 max-w-3xl mb-8">
    {reframeQuestion}
  </p>

  <div className="border-t border-zinc-800 pt-8">
    <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-500 mb-4">
      Domains Searched
    </h4>
    <div className="flex flex-wrap gap-3">
      {domains.map((domain) => (
        <span className="text-xs font-mono font-medium border border-zinc-700 bg-zinc-900/50 px-3 py-1.5 rounded-full text-zinc-300">
          {domain}
        </span>
      ))}
    </div>
  </div>
</DarkSection>
```

#### Solution Concepts
```tsx
{/* Primary Recommendation Card */}
<section className="border border-zinc-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-500 bg-white">
  {/* Header Bar */}
  <div className="bg-zinc-50 border-b border-zinc-200 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
    <div>
      <div className="flex items-center gap-3 mb-3">
        <AuraBadge variant="info">Primary Recommendation</AuraBadge>
        <AuraBadge variant="neutral">{conceptType}</AuraBadge>
      </div>
      <h3 className="text-2xl font-semibold tracking-tight text-zinc-950">{title}</h3>
    </div>
    <ConfidenceMeter value={confidence} />
  </div>

  <div className="p-8 sm:p-10 space-y-12">
    {/* What It Is */}
    <div>
      <h4 className="text-sm font-mono font-bold uppercase tracking-widest text-zinc-600 mb-4 flex items-center gap-2">
        <Box className="h-[18px] w-[18px]" />
        What It Is
      </h4>
      <p className="text-base sm:text-lg text-zinc-900 leading-relaxed font-normal">
        {description}
      </p>
    </div>

    {/* Economics & Key Risks - two column */}
    {/* First Validation Step (dark card) */}
    {/* Sustainability Flag */}
  </div>
</section>

{/* Supporting Concepts - Fallback/Complementary */}
<section className="border border-zinc-200 rounded-xl bg-zinc-50/50 overflow-hidden shadow-sm">
  <div className="border-b border-zinc-200 bg-white p-8">
    <div className="flex items-center justify-between mb-3">
      <AuraBadge variant="neutral">Fallback</AuraBadge>
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-zinc-600 font-semibold">CONFIDENCE:</span>
        <span className="text-sm font-mono font-bold text-zinc-950">{confidence}%</span>
      </div>
    </div>
    <h3 className="text-xl font-semibold tracking-tight text-zinc-950">{title}</h3>
  </div>
  <div className="p-8 space-y-8">
    {/* Content sections... */}
  </div>
</section>
```

#### Frontier Watch (Deep-Dive Format)
```tsx
{/* Numbered Header */}
<div className="flex items-center gap-4 mb-6">
  <div className="w-8 h-8 flex items-center justify-center bg-zinc-950 text-white font-mono text-sm font-medium rounded">
    {String(index + 1).padStart(2, '0')}
  </div>
  <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">{title}</h2>
</div>

{/* Metadata Card */}
<div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 md:p-6 mb-8">
  <div className="flex flex-wrap gap-y-2 gap-x-6 text-xs md:text-sm font-mono">
    <div className="flex items-center gap-2">
      <span className="text-zinc-500 uppercase tracking-wider">Type:</span>
      <span className="font-semibold text-zinc-900">{innovationType}</span>
    </div>
    <div className="hidden md:block w-px h-4 bg-zinc-300" />
    <div className="flex items-center gap-2">
      <span className="text-zinc-500 uppercase tracking-wider">Earliest Viability:</span>
      <span className="font-semibold text-zinc-900">{earliestViability}</span>
    </div>
    <div className="hidden md:block w-px h-4 bg-zinc-300" />
    <div className="flex items-center gap-2">
      <span className="text-zinc-500 uppercase tracking-wider">Current TRL:</span>
      <span className="font-semibold text-zinc-900">{trlEstimate}</span>
    </div>
  </div>
</div>

{/* Content sections: What It Is, The Science, Key Parameters Table, etc. */}

{/* Viability Assessment (dark footer) */}
<div className="bg-zinc-950 text-white rounded-xl p-6 md:p-8">
  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400 mb-4">
    Viability Assessment
  </h3>
  <p className="text-lg font-medium mb-4">{headline}</p>
  <p className="text-sm text-zinc-400 leading-relaxed mb-6 max-w-3xl">{description}</p>
</div>
```

#### Challenge the Frame (Table)
```tsx
<SectionHeader
  title="Challenge the Frame"
  subtitle="Re-evaluating core assumptions to identify leverage points."
/>

<div className="border border-zinc-200 rounded-lg overflow-hidden bg-white shadow-sm">
  {/* Desktop header row */}
  <div className="hidden lg:grid grid-cols-12 border-b border-zinc-200 bg-zinc-50/50 text-xs font-mono font-bold uppercase tracking-widest text-zinc-600 divide-x divide-zinc-200">
    <div className="col-span-3 p-4">Assumption</div>
    <div className="col-span-5 p-4">Challenge</div>
    <div className="col-span-4 p-4 text-zinc-950">Implication</div>
  </div>

  {/* Rows */}
  <div className="grid grid-cols-1 lg:grid-cols-12 border-b border-zinc-200 hover:bg-zinc-50 transition-colors">
    <div className="lg:col-span-3 p-5 lg:border-r border-zinc-200">
      <span className="font-medium text-sm text-zinc-950">{assumption}</span>
    </div>
    <div className="lg:col-span-5 p-5 lg:border-r border-zinc-200">
      <span className="text-sm text-zinc-700 leading-relaxed">{challenge}</span>
    </div>
    <div className="lg:col-span-4 p-5 bg-zinc-50/30">
      <div className="text-sm text-zinc-950 font-medium leading-relaxed flex gap-3">
        <ChevronRight className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        {implication}
      </div>
    </div>
  </div>
</div>
```

#### Self-Critique
```tsx
<div className="bg-zinc-50 border border-zinc-200 rounded-xl p-8 md:p-10">
  <h2 className="text-xl font-semibold tracking-tight text-zinc-950 mb-8 flex items-center gap-3">
    <AlertCircle className="h-5 w-5 text-zinc-600" />
    Self-Critique
  </h2>

  {/* Overall Confidence */}
  <div className="mb-10">
    <div className="flex items-end justify-between mb-2">
      <MonoLabel>Overall Confidence</MonoLabel>
      <span className="text-sm font-mono font-bold text-amber-600">MEDIUM</span>
    </div>
    <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden flex">
      <div className="w-1/3 h-full bg-zinc-300 border-r border-white" />
      <div className="w-1/3 h-full bg-amber-500 border-r border-white" />
      <div className="w-1/3 h-full bg-transparent" />
    </div>
    <p className="mt-4 text-sm text-zinc-700 leading-relaxed">{confidenceExplanation}</p>
  </div>

  {/* Two column: What We Might Be Wrong About / Unexplored Directions */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-zinc-200 pt-10">
    <div>
      <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-zinc-600 mb-5 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        What We Might Be Wrong About
      </h3>
      <ul className="space-y-4">
        {wrongAbout.map((item) => (
          <li className="flex gap-3 text-sm text-zinc-800 items-start">
            <span className="text-zinc-300 mt-1">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
    <div>
      <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-zinc-600 mb-5 flex items-center gap-2">
        <ArrowDown className="h-4 w-4" />
        Unexplored Directions
      </h3>
      <ul className="space-y-4">
        {unexplored.map((item) => (
          <li className="flex gap-3 text-sm text-zinc-800 items-start">
            <span className="text-zinc-300 mt-1">→</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
</div>
```

---

## Files to Modify

1. **`apps/web/app/home/(user)/reports/[id]/_components/hybrid-report-display.tsx`**
   - Add helper components: `CardWithHeader`, `MonoLabel`, `AuraTable`, `DarkSection`, `ConfidenceMeter`, `AuraBadge`
   - Update `SectionHeader` to use ink border
   - Update all section renderers to match Aura patterns
   - Add Frontier Technologies deep-dive format for `frontier_watch`
   - Global style updates (rounded-xl, shadow-sm, font-bold labels)

---

## Testing Checklist

- [ ] All section headers use `border-zinc-950` (ink)
- [ ] All cards use `rounded-xl shadow-sm`
- [ ] Card headers have `bg-zinc-50/50 border-b` pattern
- [ ] Labels use `font-mono font-bold uppercase tracking-widest text-zinc-600`
- [ ] Tables have proper `thead`/`tbody` structure with zinc-50 headers
- [ ] Dark sections use `bg-zinc-950 text-white rounded-xl border-zinc-800`
- [ ] Confidence meters display correctly
- [ ] Badges have borders
- [ ] Frontier Watch uses deep-dive numbered format
- [ ] First Validation Step dark cards render correctly
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint:fix` passes

---

## Success Criteria

1. **100% Aura fidelity** - Every pattern matches the HTML reference
2. **Ink borders** - Section headers use `border-zinc-950`, not violet
3. **Rounded-xl cards** - With `shadow-sm`
4. **Proper tables** - With `thead`/`tbody` and striped backgrounds
5. **Dark sections** - For Innovation Analysis, First Validation Step, Viability Assessment
6. **Monospace labels** - `font-mono font-bold uppercase tracking-widest`
7. **Frontier deep-dive** - Numbered sections with metadata cards

---

## References

**Aura HTML Design Patterns:**
- Report header: `border-l-4 border-ink pl-8 py-2`
- Section header: `border-l-4 border-ink pl-6 py-1`
- Card: `border border-hairline rounded-xl shadow-sm`
- Card header: `bg-zinc-50/50 border-b border-hairline p-6`
- Labels: `text-xs font-mono font-bold uppercase tracking-widest text-subtle`
- Tables: `thead bg-zinc-50/50`, `tbody divide-y divide-hairline`
- Dark sections: `bg-ink text-white rounded-xl border-zinc-800`

**Target File:**
- `apps/web/app/home/(user)/reports/[id]/_components/hybrid-report-display.tsx`
