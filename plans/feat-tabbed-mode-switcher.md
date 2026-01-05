# feat: Add Tabbed Mode Switcher (Engineers/Investors)

## Overview

Add a tabbed interface to the Sparlo landing page that allows users to switch between two modes:
- **For Engineers** — The current engineering/innovation use case (default)
- **For Investors** — A new due diligence use case for VCs evaluating startups

The tab selection changes the content of three sections:
1. The Process
2. The Methodology
3. Example Reports

## Acceptance Criteria

- [ ] Tab component renders below hero section
- [ ] "For Engineers" is default/active state
- [ ] Tab switching is instant with smooth animation (fade/slide)
- [ ] URL hash support: `/` = Engineers, `/#investors` = Investors
- [ ] Mobile-friendly (full-width, easy tap targets)
- [ ] Process section content changes based on mode
- [ ] Methodology section shows 6 different steps per mode
- [ ] Example Reports section shows different category pills and reports per mode
- [ ] For now: Investors tab reuses an existing example report (e.g., Green H2)

---

## Technical Approach

### File Changes

```
apps/web/app/(marketing)/
├── page.tsx                           # Add mode state, pass to children
├── _components/
│   ├── mode-tabs.tsx                  # NEW: Tab component
│   ├── methodology-section.tsx        # Modify: Accept mode prop
│   └── example-reports/
│       ├── example-reports-section.tsx # Modify: Accept mode prop
│       └── example-reports-data.tsx    # Add investor report tabs/data
```

### Phase 1: Mode State & Tab Component

**1.1 Create `mode-tabs.tsx`**

```tsx
// apps/web/app/(marketing)/_components/mode-tabs.tsx
'use client';

import { motion } from 'framer-motion';

type Mode = 'engineers' | 'investors';

interface ModeTabsProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
}

export function ModeTabs({ mode, onModeChange }: ModeTabsProps) {
  const tabs = [
    { id: 'engineers', label: 'For Engineers' },
    { id: 'investors', label: 'For Investors' },
  ] as const;

  return (
    <div className="flex justify-center gap-8 py-8 border-b border-zinc-200">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onModeChange(tab.id)}
          className={`relative px-4 py-2 text-sm font-medium tracking-tight transition-colors ${
            mode === tab.id
              ? 'text-zinc-900'
              : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          {tab.label}
          {mode === tab.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
```

**1.2 Update `page.tsx` with state management**

```tsx
// apps/web/app/(marketing)/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { EngineeringHero } from './_components/engineering-hero';
import { ModeTabs } from './_components/mode-tabs';
import { MethodologySection } from './_components/methodology-section';
import { ExampleReportsSection } from './_components/example-reports/example-reports-section';

type Mode = 'engineers' | 'investors';

function Home() {
  const [mode, setMode] = useState<Mode>('engineers');

  // Handle URL hash on mount
  useEffect(() => {
    if (window.location.hash === '#investors') {
      setMode('investors');
    }
  }, []);

  // Update URL hash on mode change
  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    window.history.replaceState(
      null,
      '',
      newMode === 'investors' ? '#investors' : window.location.pathname
    );
  };

  return (
    <>
      <EngineeringHero />
      <ModeTabs mode={mode} onModeChange={handleModeChange} />
      <MethodologySection mode={mode} />
      <ExampleReportsSection mode={mode} />
    </>
  );
}

export default withI18n(Home);
```

### Phase 2: Update Methodology Section

**2.1 Modify `methodology-section.tsx`**

Add mode prop and conditional content:

```tsx
interface MethodologySectionProps {
  mode: 'engineers' | 'investors';
}

const ENGINEERS_PROCESS = {
  headline: 'The Process',
  body: 'Input a detailed technical challenge. Sparlo runs a systematic innovation methodology to generate a thorough problem analysis with solution pathways, and delivers the report in 30 minutes.',
};

const INVESTORS_PROCESS = {
  headline: 'The Process',
  body: 'Upload a pitch deck or investment memo. Sparlo validates technical claims against physics and literature, maps the competitive solution space, and delivers a due diligence report in 30 minutes.',
};

const ENGINEERS_METHODOLOGY = [
  { title: 'Root Cause Analysis', description: 'First-principles breakdown of why the problem exists and what physical/chemical/biological constraints govern it.' },
  { title: 'Problem Reframe', description: 'Challenge assumptions. Ask whether the stated problem is the real problem, or a symptom of something deeper.' },
  { title: 'Non-Inventive Solutions', description: 'Search for existing solutions from adjacent industries that could be adapted without novel R&D.' },
  { title: 'Cross-Domain Innovation', description: 'Apply proven principles from unrelated fields — how would aerospace, biotech, or semiconductors solve this?' },
  { title: 'Commercial Viability', description: 'Assess whether solutions can scale economically. What's the path to cost parity with incumbents?' },
  { title: 'Sustainability Assessment', description: 'Evaluate environmental impact, resource constraints, and alignment with decarbonization goals.' },
];

const INVESTORS_METHODOLOGY = [
  { title: 'Claims Extraction', description: 'Identify every technical and commercial claim in the pitch — efficiency numbers, cost projections, timeline assertions.' },
  { title: 'Physics Validation', description: 'Validate claims against thermodynamics, chemistry, and engineering literature. Flag what's sound, optimistic, or impossible.' },
  { title: 'Solution Space Mapping', description: 'Map all approaches to this problem — competitors, alternatives, adjacent technologies. Identify what the startup might have missed.' },
  { title: 'Commercialization Reality Check', description: 'Assess unit economics, scale-up assumptions, customer traction, and policy dependencies.' },
  { title: 'Risk & Scenario Analysis', description: 'Model bull/base/bear scenarios with probability-weighted outcomes. Identify what could kill this company.' },
  { title: 'Diligence Roadmap', description: 'Generate specific founder questions, expert calls to make, and documents to request — with good/bad answer examples.' },
];
```

### Phase 3: Update Example Reports Section

**3.1 Add investor category pills to `example-reports-data.tsx`**

```tsx
export const INVESTOR_REPORT_TABS = [
  { id: 'thermal-storage', label: 'Thermal Storage' },
  { id: 'geothermal', label: 'Geothermal' },
  { id: 'low-carbon-cement', label: 'Low-Carbon Cement' },
  { id: 'hydrogen', label: 'Hydrogen' },
  { id: 'dac', label: 'DAC' },
  { id: 'biotech', label: 'Biotech' },
];

// Map investor tabs to existing reports (temporary until DD reports ready)
export const INVESTOR_REPORT_MAP: Record<string, string> = {
  'thermal-storage': 'green-h2',      // Reuse Green H2 report
  'geothermal': 'carbon-removal',     // Reuse Carbon Removal report
  'low-carbon-cement': 'materials',   // Reuse Materials report
  'hydrogen': 'green-h2',             // Reuse Green H2 report
  'dac': 'carbon-removal',            // Reuse Carbon Removal report
  'biotech': 'biotech',               // Reuse Biotech report
};
```

**3.2 Modify `example-reports-section.tsx`**

```tsx
interface ExampleReportsSectionProps {
  mode: 'engineers' | 'investors';
}

export function ExampleReportsSection({ mode }: ExampleReportsSectionProps) {
  const tabs = mode === 'engineers' ? ENGINEER_REPORT_TABS : INVESTOR_REPORT_TABS;

  // For investors, map tab selection to existing report
  const getReportId = (tabId: string) => {
    if (mode === 'investors') {
      return INVESTOR_REPORT_MAP[tabId] || tabId;
    }
    return tabId;
  };

  // ... rest of component with mode-aware rendering
}
```

---

## Content Summary

### Engineers Mode (Current Content)
- **Process:** "Input a detailed technical challenge..."
- **Methodology:** Root Cause Analysis → Problem Reframe → Non-Inventive Solutions → Cross-Domain Innovation → Commercial Viability → Sustainability Assessment
- **Report Categories:** Carbon Removal | Green H2 | Waste | Advanced Materials | Food Tech | Biotech

### Investors Mode (New Content)
- **Process:** "Upload a pitch deck or investment memo..."
- **Methodology:** Claims Extraction → Physics Validation → Solution Space Mapping → Commercialization Reality Check → Risk & Scenario Analysis → Diligence Roadmap
- **Report Categories:** Thermal Storage | Geothermal | Low-Carbon Cement | Hydrogen | DAC | Biotech
- **Reports:** Reuse existing reports for now (Green H2, Carbon Removal, etc.)

---

## Design Notes

### Tab Styling
- Centered horizontally below hero
- Active tab: `text-zinc-900` with animated underline
- Inactive tab: `text-zinc-400` with hover state
- Transition: spring animation (Framer Motion `layoutId`)

### Content Transition
- Use `AnimatePresence` with fade + slide
- Duration: 200ms ease-out
- Prevents jarring layout shifts

### Mobile
- Tabs side-by-side with smaller text
- Full-width content sections
- Min 44px tap targets

---

## Implementation Order

1. Create `mode-tabs.tsx` component
2. Update `page.tsx` to client component with mode state + URL hash handling
3. Update `methodology-section.tsx` to accept mode prop
4. Update `example-reports-data.tsx` with investor tabs/mapping
5. Update `example-reports-section.tsx` to accept mode prop
6. Test tab switching, URL hash, mobile responsiveness
7. Test accessibility (keyboard nav, screen reader)

---

## References

- Spec file: `/Users/alijangbar/Downloads/Claude Two Modes Prompt.md`
- Main page: `apps/web/app/(marketing)/page.tsx`
- Methodology: `apps/web/app/(marketing)/_components/methodology-section.tsx`
- Example Reports: `apps/web/app/(marketing)/_components/example-reports/example-reports-section.tsx`
- Report Data: `apps/web/app/(marketing)/_components/example-reports/example-reports-data.tsx`
