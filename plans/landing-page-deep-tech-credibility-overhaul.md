# Landing Page Deep Tech Credibility Overhaul

**Date:** January 2026
**Type:** Enhancement
**Priority:** High
**Status:** Draft

---

## Overview

Transform sparlo.ai's landing page from "another AI tool" to "legitimate deep tech product" by:
1. Adding credibility signals that differentiate from ChatGPT wrappers
2. Transforming the accordion section from "Notion document" to "holy shit artifact"
3. Conveying depth, rigor, and genuine innovation in problem-solving

---

## Problem Statement

### Current State

The landing page at sparlo.ai has solid bones:
- Video hero with "Engineering AI" headline
- 4-step process animation (Input → Reframe → Analysis → Output)
- Example reports accordion with 8 industry categories
- Near-monochrome design with Suisse Intl typography

### Core Issues

**1. "Could Be ChatGPT Wrapper" Problem**
- No explanation of *how* this is different from prompting GPT-4
- No technical architecture hints
- No proprietary methodology visible
- "~25 min analysis" + "47 domains searched" are metrics but don't explain the *innovation*

**2. "Notion Document" Accordion Problem**
- Current accordion is functionally correct but emotionally flat
- Cards use basic `border border-zinc-200` styling
- Expanded content is dense text without visual hierarchy
- No interactive elements that create discovery moments
- Missing the "wow, look at this artifact" feeling

**3. Missing Deep Tech Legitimacy Signals**
- No team/research background
- No external validation (logos, citations, partnerships)
- No white papers or technical methodology documentation
- No evidence of proprietary tech vs API wrapper

---

## Proposed Solution

### High-Level Strategy

Transform the page across three dimensions:

| Dimension | Current | Target |
|-----------|---------|--------|
| **Trust** | Metrics only ("47 domains") | Methodology + external validation |
| **Artifact Presentation** | Static accordion cards | Interactive, layered discovery |
| **Technical Depth** | Hidden | Visible "iceberg" hints |

---

## Technical Approach

### Phase 1: Credibility Architecture

#### 1.1 Add "How It Works" Technical Depth Section

**File:** `apps/web/app/(marketing)/_components/methodology-section.tsx`

**Purpose:** Show the *iceberg* of technical depth without overwhelming

```markdown
## What We Build (Not Just What We Use)

┌─────────────────────────────────────────────────────────────┐
│  VISIBLE: Reports you receive                               │
├─────────────────────────────────────────────────────────────┤
│  LAYER 1: Multi-agent reasoning architecture                │
│  • 47 specialized domain agents (not one general model)     │
│  • Cross-domain pattern matching engine                     │
│  • Citation verification system                             │
├─────────────────────────────────────────────────────────────┤
│  LAYER 2: Proprietary knowledge graphs                      │
│  • Patent landscape mapping (14M+ patents indexed)          │
│  • Academic paper clustering (real-time ArXiv, PubMed)      │
│  • Failure mode databases (why things didn't work before)   │
├─────────────────────────────────────────────────────────────┤
│  LAYER 3: First-principles reasoning engine                 │
│  • Constraint decomposition algorithms                      │
│  • Analogical transfer from adjacent domains                │
│  • Confidence calibration + self-critique loops             │
└─────────────────────────────────────────────────────────────┘
```

**Visual Treatment:**
- Animated reveal on scroll (layers fade in sequentially)
- Monospace typography for technical credibility
- Subtle code-editor aesthetic (line numbers, syntax highlighting hints)

#### 1.2 Add Trust Signals Strip

**File:** `apps/web/app/(marketing)/_components/trust-signals.tsx`

**Content:**
- "Used by engineers at [Logo Strip: recognizable deep tech companies]"
- "Based on research published in [links to technical blog posts]"
- "Patent-pending methodology" (if applicable)
- Security/privacy badges (SOC 2, data handling)

**Placement:** Between Process Animation and Example Reports

---

### Phase 2: "Holy Shit" Artifact Transformation

#### 2.1 Report Card Visual Overhaul

**Current Problem:** Cards feel like documentation, not artifacts

**Target State:** Each card should feel like a premium research deliverable

##### Typography Upgrades

```tsx
// apps/web/app/(marketing)/_components/showcase-gallery/section-card.tsx

// BEFORE: Generic text styling
className="text-[18px] font-medium text-zinc-900"

// AFTER: Premium artifact typography
className="font-heading text-[22px] font-semibold tracking-[-0.02em] text-zinc-950"
```

##### Visual Hierarchy Additions

**Section Numbers:** Add large, muted section numbers (like premium reports)
```tsx
<div className="absolute -left-2 top-0 font-heading text-[72px] font-bold text-zinc-100 select-none">
  01
</div>
```

**Section Icons:** Add contextual icons to each section type
```tsx
const SECTION_ICONS = {
  'executive-summary': <FileText className="h-5 w-5" />,
  'problem-analysis': <Target className="h-5 w-5" />,
  'constraints': <Lock className="h-5 w-5" />,
  'challenge-frame': <Lightbulb className="h-5 w-5" />,
  'solution-concepts': <Layers className="h-5 w-5" />,
  'innovation-concepts': <Sparkles className="h-5 w-5" />,
  'frontier-tech': <Telescope className="h-5 w-5" />,
  'risks': <AlertTriangle className="h-5 w-5" />,
  'self-critique': <MessageSquare className="h-5 w-5" />,
  'recommendation': <CheckCircle className="h-5 w-5" />,
};
```

##### Card State Animations

```tsx
// Expanded card treatment
<AccordionItem
  className={cn(
    "group overflow-hidden rounded-xl border bg-white transition-all duration-300",
    // Collapsed state
    "border-zinc-200 hover:border-zinc-300 hover:shadow-sm",
    // Expanded state - elevated, prominent
    "data-[state=open]:border-zinc-900 data-[state=open]:shadow-lg data-[state=open]:scale-[1.01]",
    // Left accent border
    "border-l-[4px] border-l-zinc-200 data-[state=open]:border-l-violet-600"
  )}
/>
```

#### 2.2 Content Preview When Collapsed

**Current:** Only shows headline + small metrics
**Target:** Show tantalizing preview that demands expansion

```tsx
// Collapsed state shows first insight
<div className="mt-3 flex items-start gap-2 text-[14px] text-zinc-500">
  <Quote className="h-4 w-4 mt-0.5 flex-shrink-0 text-zinc-400" />
  <span className="line-clamp-2 italic">
    "The desalination industry solved seawater fouling with electrodialysis
    reversal—polarity switching that dissolves scale and kills biofilms..."
  </span>
</div>
```

#### 2.3 Expanded Content Visual Treatment

**Current:** Plain text blocks
**Target:** Premium report formatting with visual anchors

```tsx
// apps/web/app/(marketing)/_components/showcase-gallery/expanded-content.tsx

// Key insight callout boxes
<div className="my-6 border-l-4 border-violet-500 bg-violet-50/50 p-4 rounded-r-lg">
  <div className="text-[11px] font-semibold uppercase tracking-wider text-violet-600 mb-1">
    Key Insight
  </div>
  <p className="text-[15px] text-zinc-800 font-medium">
    {insight}
  </p>
</div>

// Evidence citations with styling
<div className="flex items-start gap-3 text-[14px] text-zinc-600 bg-zinc-50 p-3 rounded-lg">
  <BookOpen className="h-4 w-4 mt-0.5 text-zinc-400" />
  <div>
    <span className="font-medium">Mikhaylin & Bazinet (2016)</span>
    <span className="text-zinc-400"> — documented 5-10x membrane life extension</span>
  </div>
</div>

// Solution confidence meters (visual, not just numbers)
<div className="flex items-center gap-3">
  <div className="text-[13px] font-medium text-zinc-700">94% confidence</div>
  <div className="h-2 w-32 bg-zinc-100 rounded-full overflow-hidden">
    <div className="h-full w-[94%] bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" />
  </div>
</div>
```

#### 2.4 Interactive Discovery Elements

**Hover Previews:** When hovering over collapsed cards, show a subtle preview tooltip

```tsx
<TooltipProvider>
  <Tooltip delayDuration={300}>
    <TooltipTrigger asChild>
      <AccordionTrigger>...</AccordionTrigger>
    </TooltipTrigger>
    <TooltipContent side="right" className="max-w-[300px] p-4">
      <div className="text-[12px] text-zinc-500 mb-1">Preview</div>
      <p className="text-[14px] text-zinc-800">{section.previewText}</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

**Scroll-Triggered Reveals:** Animate content into view as user scrolls through expanded section

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, delay: index * 0.1 }}
  viewport={{ once: true, margin: "-50px" }}
>
  {content}
</motion.div>
```

---

### Phase 3: Differentiation from ChatGPT Wrappers

#### 3.1 "Not Just AI" Messaging

**Add explicit differentiation copy in hero or process section:**

```markdown
## What makes this different from ChatGPT?

| ChatGPT | Sparlo |
|---------|--------|
| Single model, general knowledge | 47 specialized domain agents |
| One-shot responses | Multi-pass reasoning with self-critique |
| No source verification | Every claim traced to patents/papers |
| Pattern matching | First-principles decomposition |
| "Sounds right" | Confidence-calibrated recommendations |
```

**Visual Treatment:** Side-by-side comparison with subtle animation showing the difference in approach

#### 3.2 Show the "Thinking" Process

**Add a "How We Reasoned" preview to each report:**

```tsx
// apps/web/app/(marketing)/_components/showcase-gallery/reasoning-trace.tsx

<Collapsible>
  <CollapsibleTrigger className="flex items-center gap-2 text-[13px] text-zinc-500 hover:text-zinc-700">
    <Terminal className="h-4 w-4" />
    <span>View reasoning trace</span>
    <ChevronDown className="h-3 w-3" />
  </CollapsibleTrigger>
  <CollapsibleContent>
    <div className="mt-3 font-mono text-[12px] bg-zinc-950 text-zinc-300 p-4 rounded-lg overflow-x-auto">
      <div className="text-zinc-500">// Initial constraint analysis</div>
      <div><span className="text-emerald-400">→</span> Detected 8 hard constraints</div>
      <div><span className="text-emerald-400">→</span> Searching electrochemistry domain...</div>
      <div><span className="text-emerald-400">→</span> Cross-referencing desalination literature</div>
      <div><span className="text-amber-400">⚠</span> Challenge identified: standard approaches fail at 5yr horizon</div>
      <div><span className="text-emerald-400">→</span> Reframing: "survival" → "cheap replacement"</div>
      <div><span className="text-violet-400">✓</span> Solution synthesis complete: 4 ranked approaches</div>
    </div>
  </CollapsibleContent>
</Collapsible>
```

#### 3.3 Technical Architecture Hints

**Add subtle technical depth indicators:**

```tsx
// In report metadata bar
<div className="flex items-center gap-4 text-[12px] text-zinc-400">
  <span className="flex items-center gap-1">
    <Cpu className="h-3 w-3" />
    <span>Multi-agent synthesis</span>
  </span>
  <span className="flex items-center gap-1">
    <GitBranch className="h-3 w-3" />
    <span>3 reasoning passes</span>
  </span>
  <span className="flex items-center gap-1">
    <ShieldCheck className="h-3 w-3" />
    <span>Self-critique validated</span>
  </span>
</div>
```

---

### Phase 4: Mobile & Performance

#### 4.1 Mobile Accordion Optimization

**Tab overflow indicator:**
```tsx
// Add fade gradient on right edge for mobile
<div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none md:hidden" />
```

**Touch targets:**
```tsx
// Ensure 44px minimum touch targets
<TabsTrigger className="min-h-[44px] px-4 py-3 ..." />
<AccordionTrigger className="min-h-[56px] px-6 py-5 ..." />
```

#### 4.2 Performance Optimizations

**Lazy-load the showcase gallery:**
```tsx
// apps/web/app/(marketing)/page.tsx
import dynamic from 'next/dynamic';

const ShowcaseGallery = dynamic(
  () => import('./_components/showcase-gallery/showcase-gallery'),
  {
    loading: () => <ShowcaseGallerySkeleton />,
    ssr: false // Load only on client after hero is visible
  }
);
```

**Prefetch report data on tab hover:**
```tsx
const prefetchReport = (reportId: ReportId) => {
  // Trigger dynamic import on hover
  import(`./data/${reportId}-hybrid-data`);
};

<TabsTrigger
  onMouseEnter={() => prefetchReport(reportId)}
  onFocus={() => prefetchReport(reportId)}
/>
```

---

## Acceptance Criteria

### Functional Requirements

- [ ] New "How It Works" methodology section shows technical depth
- [ ] Trust signals strip displays logos/badges between sections
- [ ] Section cards have large section numbers, icons, and improved typography
- [ ] Collapsed cards show tantalizing preview quote
- [ ] Expanded content has insight callouts, evidence citations, and confidence meters
- [ ] Optional "reasoning trace" reveals the AI's thinking process
- [ ] Comparison messaging clearly differentiates from ChatGPT wrappers
- [ ] Mobile has touch-friendly targets (44px+) and overflow indicators

### Non-Functional Requirements

- [ ] Page TTI < 3s on Fast 3G
- [ ] Lighthouse performance score > 90
- [ ] WCAG 2.1 AA compliance (keyboard nav, reduced motion, screen reader)
- [ ] No layout shift during accordion animations (CLS < 0.1)

### Quality Gates

- [ ] User testing: 5 engineers say "this feels like a real product"
- [ ] User testing: 3 investors understand value prop in < 30 seconds
- [ ] Analytics instrumented for tab_clicked, section_expanded, modal_opened

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Time on page (Example Reports section) | Unknown | +40% |
| Example Reports → CTA click-through | Unknown | +25% |
| Bounce rate from organic "AI tool" searches | Unknown | -20% |
| User sentiment: "Feels like real tech" | Unknown | 80%+ positive |

---

## Implementation Phases

### Phase 1: Foundation (Credibility Architecture)
- [ ] Create methodology-section.tsx with iceberg visualization
- [ ] Create trust-signals.tsx with logo strip
- [ ] Add differentiation messaging to hero or process section

### Phase 2: Artifact Transformation (Cards)
- [ ] Upgrade section-card.tsx typography and visual hierarchy
- [ ] Add section numbers and icons
- [ ] Implement expanded card elevation + animation
- [ ] Add collapsed preview quotes

### Phase 3: Content Enhancement
- [ ] Create insight callout component
- [ ] Create evidence citation component
- [ ] Create confidence meter component
- [ ] Add reasoning trace collapsible

### Phase 4: Polish & Performance
- [ ] Mobile optimizations (touch targets, overflow indicators)
- [ ] Lazy-load showcase gallery
- [ ] Add analytics events
- [ ] Accessibility audit and fixes

---

## Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Overdesign makes page feel cluttered | Medium | Test with real users, iterate |
| Performance degrades with animations | Medium | Measure TTI, use will-change wisely |
| Technical depth alienates non-technical visitors | Medium | Layer information progressively |
| Implementation scope creep | High | Stick to MVP phases, defer nice-to-haves |

---

## Alternative Approaches Considered

### Option A: Full Interactive Demo (Rejected)
- **Pros:** Maximum "wow" factor
- **Cons:** 3x implementation effort, maintenance burden
- **Decision:** Too risky for v1; consider for v2 if metrics warrant

### Option B: Video Walkthrough Instead of Accordion (Rejected)
- **Pros:** More engaging than static content
- **Cons:** Less scannable, accessibility concerns
- **Decision:** Add video as supplement, not replacement

### Option C: Minimal Changes (Typography Only)
- **Pros:** Fast to ship
- **Cons:** May not address "Notion document" feeling
- **Decision:** Typography is necessary but not sufficient

---

## References

### Internal
- Design system: `docs/SPARLO-DESIGN-SYSTEM.md`
- Current landing page: `apps/web/app/(marketing)/page.tsx`
- Showcase gallery: `apps/web/app/(marketing)/_components/showcase-gallery/`

### External Best Practices
- [Linear Design Philosophy](https://blog.logrocket.com/ux-design/linear-design/) - Strategic restraint, typography hierarchy
- [Runway's Deep Tech Positioning](https://runwayml.com/) - Research-first narrative
- [Anthropic's Trust Signals](https://anthropic.com/) - Public benefit corporation, research transparency
- [Accordion UI Best Practices](https://www.eleken.co/blog-posts/accordion-ui) - Visual indicators, animation patterns

### Anti-Patterns to Avoid
- [ChatGPT Wrapper Red Flags](https://medium.com/@mithunaprintz/fake-ai-everywhere-why-most-startups-are-just-wrappers-around-chatgpt-9c59a3468b28)
- Generic AI imagery (neural networks, glowing brains)
- Inter font + purple gradients (screams "AI slop")
- "Revolutionary" language without specifics

---

## Open Questions

1. **State persistence:** Should expanded sections persist via URL hash for sharing?
2. **A/B testing:** Should we test different section orderings (e.g., Solution first vs Executive Summary)?
3. **Video content:** Should we add a 60-second video walkthrough of a report?
4. **Team section:** Should we add founder/team credentials for trust?
