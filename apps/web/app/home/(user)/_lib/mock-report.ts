import type { FullReport } from './types';

export interface ReportSummary {
  title: string;
  conceptCount: number;
  recommendedCount: number;
  headlineFinding: string;
}

export interface TocItem {
  id: string;
  title: string;
  level: number;
}

// New comprehensive report matching the structured format
export const MOCK_REPORT_MARKDOWN = `## Executive Summary

Your catalyst blows out of the reactor because particles are too small and too variable—a 1-200 μm range with no controlled center point. The core insight: decouple particle geometry from precipitation chemistry by forming particles in a separate templating step where droplet physics, not sintering kinetics, controls the outcome.

Build spray-dried microspheres first (high confidence)—this is exactly how Grace and BASF make FCC catalysts in your target size range. Atomize your nitrate solution, dry into 40-60 μm spheres, calcine with a staged thermal profile, reduce. If spray dryer capital is blocked, characterize your current PSD immediately—if >30% is already 30-80 μm, air classification gets you running while you secure equipment.

**Viability: GREEN.** Multiple proven paths exist. The question isn't whether this is solvable—it's which path fits your capital and timeline constraints.

---

## Your Constraints

**From your input:**

- Ni-Cu-Al-Mg oxide system required for catalytic function
- H₂ reduction at 500°C needed to activate catalyst
- Reactor type is fixed (fluidized bed)
- Nitrate salts as precursors (cost/availability)—some flexibility noted
- Currently 1-200 microns, need D50 of 40-50 microns with narrower distribution

**Assumptions made (flag if incorrect):**

- "1-200 microns" interpreted as wide, uncontrolled distribution with D50 significantly below target. Need your actual PSD data to confirm.
- No current spray drying capability; no pilot equipment specified.
- Activity retention ≥80% of current baseline acceptable given size improvement.
- Capital investment up to $300-500K discussable if justified by performance.

These constraints shaped every recommendation. If any assumption is wrong, let me know.

---

## Problem Analysis

### What's actually going wrong

Fine particles (<30 μm) entrain with fluidizing gas at startup velocities, carrying active catalyst out of the reactor. Your 1-200 μm distribution has no controlled center—it's whatever co-precipitation and calcination happen to produce, dominated by nucleation-driven fines and thermal fragmentation.

Particle retention obeys simple physics: terminal velocity Ut ∝ d²(ρp-ρg). Particles with Ut below your superficial gas velocity get swept out. Your fines are leaving because their terminal velocity is too low—it's that direct.

### Why it's hard

The current synthesis forces thermal decomposition to simultaneously transform chemistry, evolve NOx gas, consolidate particles, and control size distribution. These phenomena compete destructively:

- Gas evolution fragments forming agglomerates
- Nucleation is uncontrolled, creating a spray of crystallite sizes
- Sintering is the only growth mechanism, and it's slow, variable, and trades off against surface area

The apparent contradiction: you need large particles (for retention) but the process inherently makes small ones (for activity). Larger crystallites mean lower surface area—this seems fundamental until you realize it only holds when you're growing particles by sintering. If you control architecture hierarchically—large agglomerates filled with small crystallites—size and activity become independent variables.

### The from-scratch revelation

If you were designing this catalyst today with no process history, you would never ask a single solid-state step to do four competing things. You'd set size in a controllable liquid-phase operation (spray drying, precipitation) where droplet physics governs the outcome, then transform chemistry within that fixed architecture. The droplet boundary constrains all precipitating material to one agglomerate. Size determination moves upstream where you can actually control it.

This is the core insight: you don't need to grow particles to 40-50 μm through solid-state sintering—you can create them at that size directly.

### Root Causes

**Hypothesis 1: Uncontrolled nucleation dominates growth**
High supersaturation during precipitation creates many nuclei that grow into small crystallites, which agglomerate loosely.
*Confidence: High*

**Hypothesis 2: NOx fragmentation during calcination**
Gas evolution rate exceeds gas escape rate from pore network, fracturing particles during thermal decomposition.
*Confidence: High*

**Hypothesis 3: No particle-forming step**
You're relying on natural agglomeration during filtration/drying, which doesn't template controlled geometry.
*Confidence: High*

**Hypothesis 4: Current process may already produce usable fraction**
Some 40-80 μm material likely exists but isn't captured.
*Confidence: Medium—depends on your actual PSD*

### Success Metrics

- D50: 40-50 μm
- Distribution span (D90-D10)/D50 < 1.5
- D10 > 20 μm (avoid cohesive Geldart C behavior)
- Retention at startup: <5% carryover in first 4 hours
- Activity: ≥80% of current baseline (H₂ chemisorption or model reaction)
- Attrition: <5% mass loss after 30 min tumbling

---

## Key Patterns

### Spray-Dried Slurry Templating

Atomize precursor slurry into hot gas; droplet size templates final particle size. The droplet boundary becomes the particle boundary—everything inside one droplet becomes one agglomerate.

**Where it comes from:** This is THE industry approach for FCC-type catalyst microspheres in 40-100 μm range. Grace, BASF, Albemarle all use it. Also appears in pharmaceutical granulation and battery cathode manufacturing.

**Why it matters here:** Your target size is exactly what this process was designed for. Atomizer physics governs droplet size with ±10% precision—dramatically tighter than any solid-state process.

**Precedent:** US4,677,084 (Grace), US6,022,513 (BASF)

### Staged Thermal Decomposition

Separate gas evolution from sintering by using temperature dwells. Slow heating through decomposition window allows gas to escape from still-porous structures before densification traps it.

**Where it comes from:** Cement industry learned this—explosive decarbonation shatters clinker if heated too fast. Ceramic processing uses staged profiles to prevent bloating. Same physics applies to nitrate decomposition.

**Why it matters here:** Your wide PSD likely isn't just from nucleation variability—it's from NOx evolution breaking particles apart during calcination.

**Precedent:** Academic literature on nitrate-derived catalysts; commercial ceramic sintering protocols.

### Controlled Precipitation with Ostwald Ripening

Slower reagent addition and elevated-temperature aging promote ripening—small crystallites dissolve, redeposit on larger ones. Controls primary crystallite size, which influences agglomerate density and strength.

**Where it comes from:** Engelhard patent US4,906,603 for catalyst precursors. Battery cathode NMC co-precipitation uses similar principles for hierarchical structures.

**Why it matters here:** Addresses nucleation-dominated fines. Usually a complement to forming steps rather than standalone solution.

### Phase-Change Size Locking

Use a liquid-to-solid transition to SET particle size before any solid-state transformation occurs. The key insight: move size determination to a phase where you have physical control (droplets, precipitates) rather than relying on solid-state kinetics you can't precisely govern.

**Where it comes from:** Cross-cutting pattern across FCC catalysts, pharmaceutical spray drying, ceramic processing, battery materials. Industries that need precise particle sizes have moved away from solid-state growth toward liquid-phase size setting.

**Why it matters here:** This is the meta-pattern—the reason spray drying emerged as the lead concept.

---

## Solution Concepts

### Lead Concepts

#### C-01: Direct Spray Drying of Nitrate Precursor Slurry
*Track: Best Fit*

**Bottom line:** If you can access spray drying equipment, this is the answer. Proven at scale for exactly your target.

**What it is:** Prepare mixed Ni-Cu-Al-Mg nitrate solution at 30-40 wt% total solids with 5-10 wt% colloidal alumina binder. Atomize through rotary atomizer (12,000-15,000 RPM) or two-fluid nozzle (2-4 bar) into co-current spray dryer (inlet 160-180°C, outlet 90-110°C). Droplets dry into spherical microspheres that template final particle size. Calcine using staged profile (see C-02), then reduce at 500°C per your standard protocol.

**Why it works:** Addresses Hypotheses 2 and 3 directly—creates a dedicated particle-forming step decoupled from precipitation chemistry, and the staged calcination prevents fragmentation. The droplet boundary constrains all material to one agglomerate. Uses Spray-Dried Slurry Templating and Phase-Change Size Locking patterns.

**Confidence:** HIGH — Grace, BASF, and Albemarle use this exact approach for mixed metal oxide catalysts in your target size range. Multiple patents and technical reports confirm 40-70 μm D50 with span <1.5 is routine.

**What would change this:** If your mixed nitrate solution has problematic rheology (>500 cP viscosity from Cu-Ni interactions), if inlet temperature must exceed 200°C for your throughput needs (hollow shell risk), or if capital for spray dryer is unavailable.

**Key risks:**
- Hollow shell formation if drying too fast—gas evolution before interior solidifies. *Mitigation:* Inlet temperature ≤180°C, feed concentration >30 wt%, validate morphology by SEM cross-section.
- Surface area may drop 10-20% vs. precipitated baseline. *Mitigation:* BET monitoring; activity testing before commitment.
- Scale-up from benchtop (Büchi B-290) to pilot requires atomizer redesign. *Mitigation:* Use toll spray dryer at relevant scale before capital decision.

**How to test:**

*Gate 0 — Days, lab equipment: Benchtop spray dry trial*
Vary inlet temp (150-180°C) and solids content (25-40%)
- GO: D50 in 30-60 μm with span <1.5; solid (not hollow) particles by SEM
- NO-GO: D50 <20 μm or >100 μm, span >2.5, or hollow/cracked particles → Check slurry rheology, reformulate

*Gate 1 — Days, calcination furnace: Staged calcination integrity*
Calcine with staged profile (1-2°C/min to 400°C, hold 2h, then 5°C/min to 700°C), re-measure PSD
- GO: D50 shift <15% after calcination; no bimodal distribution
- NO-GO: D50 decrease >25% or fines peak emerges → Reduce heating rate further, add temperature dwells

*Gate 2 — Days, activity testing: Activity validation*
Reduce and test H₂ chemisorption or model reaction vs. baseline
- GO: Activity within 85% of precipitated baseline
- NO-GO: Activity <70% → Surface area loss too severe; consider spray freeze alternative or accept tradeoff

---

#### C-02: Staged Decomposition-Sintering Calcination Profile
*Track: Simpler Path*

**Bottom line:** Start here regardless of other paths. Zero cost, immediate insight into whether fragmentation is driving your fines problem.

**What it is:** Replace your current calcination profile with two stages: slow ramp (1-2°C/min) from room temperature to 400°C with 2-hour hold (complete NOx evolution), then faster ramp (5°C/min) to 700-750°C for sintering/consolidation. Cool and proceed to reduction.

**Why it works:** Addresses Hypothesis 2 directly—NOx fragmentation occurs when gas evolution rate exceeds gas escape rate. Slow heating through the decomposition window (200-400°C) allows gas to escape from still-porous structures before significant densification. Uses Staged Thermal Decomposition pattern.

**Confidence:** HIGH for reducing fragmentation; MEDIUM for hitting full target alone—this addresses breakage but doesn't add a growth mechanism. May only get to 30-40 μm D50.

**What would change this:** If your current PSD is primarily from nucleation variability (Hypothesis 1) rather than calcination fragmentation (Hypothesis 2), staged heating won't shift D50 significantly.

**Key risks:**
- Insufficient size increase if fragmentation isn't the main driver. *Mitigation:* Use as foundation for spray drying, not standalone.
- Longer cycle time—additional 4-6 hours vs. current profile. *Mitigation:* Batch size optimization; acceptable cost for higher yield.
- Crystallite coarsening at 700-750°C approaching danger zone for activity. *Mitigation:* Monitor BET and crystallite size; establish temperature ceiling from activity testing.

**How to test:**

*Gate 0 — Days, existing equipment: Staged vs. control comparison*
Single batch with staged profile vs. control batch with current profile
- GO: D50 increase >20%; fines (<20 μm) reduction >40%
- NO-GO: D50 increase <10% → Fragmentation isn't dominant driver; proceed to spray drying

*Gate 1 — Days, characterization: Activity retention*
BET surface area and activity comparison
- GO: Surface area retention >80%; activity within 85% of baseline
- NO-GO: Activity <70% → Temperature ceiling too aggressive; reduce sintering temp

---

### Other Concepts

#### C-03: Post-Synthesis Classification with Fines Recycling
*Track: Simpler Path*

**Bottom line:** Diagnostic priority. Characterize your current PSD today—this gates all other decisions.

**What it is:** Air classify calcined product into fines (<20 μm), product (40-80 μm), and oversize (>100 μm). Product fraction meets spec immediately; fines recycle to precipitation or granulation.

**Confidence:** HIGH for separation technology; yield unknown—depends entirely on your current PSD. If D50 is ~20 μm, only 10-20% may be recoverable. If centered higher, 30-40% may be usable.

**Critical validation:** Current PSD characterization. GO if >30% of mass in 30-80 μm window—classification becomes viable primary path. NO-GO if <15%—classification is supporting operation only, synthesis change required.

---

#### C-04: Ammonia-Carbonate Co-Precipitation
*Track: Best Fit*

**Bottom line:** Alternative path if spray drying capital is rejected. Same fundamental advantage—decouples size from thermal transformation.

**What it is:** Replace nitrate calcination with precipitation of mixed hydroxides/carbonates using ammonia and sodium carbonate. Control supersaturation for nucleation density, residence time for agglomerate size. Calcine the precipitate—CO₂ evolves more gently than NOx, reducing fragmentation.

**Confidence:** MEDIUM — Addresses Hypotheses 1 and 2. Johnson Matthey and Clariant use this for Ni-based precursors. But four-metal co-precipitation may have kinetic mismatches (Ni and Cu precipitate at different rates).

**Critical validation:** Stoichiometric incorporation. GO if all metals within ±5% of target by ICP-OES and single-phase oxide by XRD. NO-GO if metal segregation or secondary phases detected.

---

#### C-05: Seed-Templated Growth via Recycled Coarse Fraction
*Track: Best Fit*

**Bottom line:** Promising if you have existing coarse fraction. Enables growth without new equipment.

**What it is:** Recycle >40 μm fraction as 10-20 wt% seeds in precipitation. Seeds provide heterogeneous nucleation sites, directing fresh precipitate onto existing particles rather than forming fines. Requires 2-3× slower addition rate.

**Confidence:** MEDIUM — Seeded crystallization is established for single-component systems. Multi-metal hydroxide co-precipitation is more complex—different metals may have different affinities for calcined oxide surfaces.

**Critical validation:** Seed nucleation affinity. GO if precipitate deposits visibly on seeds within 30 min with no independent fines. NO-GO if fines form independently—seeds don't template.

---

### The Spark Concept

#### Density-Focused Retention via Sintering Flux

**Why it's interesting:** Everyone focuses on size because that's how the problem was framed. But per Stokes law, Ut ∝ d²Δρ. Instead of increasing d, increase particle density. Add 0.5-1% KNO₃ as sintering flux that creates liquid-phase sintering at lower temperature, densifying particles from ~1500 kg/m³ to ~2500 kg/m³. This increases terminal velocity by 67% at current size. Alkali should volatilize during H₂ reduction.

**Why it's uncertain:** Does alkali fully volatilize at 500°C reduction temperature? Does residual alkali (<100 ppm) poison the catalyst? Both are testable but unvalidated for this system.

**Confidence:** LOW. Sound first-principles basis—genuine reframe of the physics. But no catalyst-specific precedent.

**When to pursue:** Quick kill experiment in parallel with primary path. If alkali leaves cleanly and activity survives, you've unlocked a secondary lever that works regardless of which synthesis path you choose.

**Critical validation:** Post-reduction alkali content by ICP-MS. GO if <100 ppm K remaining AND activity ≥90% baseline. NO-GO if residual K or activity drop → Concept dead.

---

## Concept Comparison

| Concept | D50 Achievable | Confidence | Capital | Timeline | Key Risk |
|---------|----------------|------------|---------|----------|----------|
| Spray Drying | 40-70 μm | High | Medium | 4-6 weeks | Hollow particles, 10-20% SA loss |
| Staged Calcination | 30-45 μm | High | None | 1 week | May be insufficient alone |
| Classification | Recovers existing | High | Medium | 2 weeks | Yield depends on current PSD |
| Co-Precipitation | 40-60 μm | Medium | Low | 6-8 weeks | Four-metal kinetic mismatch |
| Seeded Growth | 40-60 μm | Medium | Low | 4 weeks | Seed-coating integration |
| Density via Flux | Current size | Low | None | 2 weeks | No catalyst precedent |

**Key insight:** Spray drying is the industry standard because it actually works at scale. The "simpler" approaches (staged calcination, classification) may suffice depending on your current PSD and how much fragmentation contributes to fines, but they're potentially insufficient alone.

---

## Validation Summary

**Failure Modes Checked:**
- NOx fragmentation (addressed by staged calcination, eliminated by co-precipitation route)
- Hollow shell formation (flagged for spray drying, mitigation via temperature control)
- Crystallite coarsening (monitored via BET/XRD in all thermal concepts)
- Metal segregation (flagged for co-precipitation, verified by ICP-OES)

**Parameter Bounds Validated:**
- Spray dryer can achieve 40-50 μm (within 10-150 μm commercial range)
- Target D50 within Geldart Group A optimal range (20-100 μm)
- NiO-CuO sintering window (600-800°C) compatible with proposed profiles

**Literature Precedent:**
- Spray drying for mixed oxide catalysts: HIGH (Grace, BASF, Albemarle standard practice)
- Co-precipitation for Ni-based precursors: HIGH (Johnson Matthey, Clariant patents)
- Staged calcination for nitrates: MEDIUM (academic literature, limited commercial)
- Density via sintering flux: LOW (ceramic applications only)

---

## Decision Architecture

\`\`\`
What's your current PSD? (characterize immediately)
│
├── >30% in 30-80 μm range
│   └── Classification viable as primary path
│       └── Need more? → Add staged calcination or seeded growth
│
├── <30% in target range
│   └── Can you access spray dryer? (toll or capital)
│       │
│       ├── YES → Spray drying + staged calcination
│       │   └── >20% activity loss? → Evaluate co-precipitation
│       │
│       └── NO → Can you modify upstream chemistry?
│           │
│           ├── YES → Co-precipitation route
│           │
│           └── NO → Staged calcination + classification
│                   └── Still short? → Push for spray dryer access
│
└── PARALLEL (all paths): Run density flux experiment as exploration
\`\`\`

**Primary path:** Spray drying with staged calcination
**Fallback:** Classification + staged calcination combination
**Parallel bet:** Density via sintering flux (quick kill to validate/eliminate)

---

## What I'd Actually Do

If this were my project:

**Today:** Run PSD characterization on your current product—two hours on a laser diffraction instrument tells you whether classification alone gets you running, and whether your distribution is continuous or bimodal.

**Week 1:** Run staged calcination on one batch vs. control. Zero cost, uses existing equipment. You'll learn whether fragmentation is a significant contributor to your fines problem. Simultaneously, run the KNO₃ flux experiment—add 1% to one batch, calcine/reduce normally. If alkali leaves and activity survives, you've unlocked a powerful secondary lever.

**Week 2:** Get 200g of your nitrate solution to a toll spray dryer. One day of testing tells you whether spray drying achieves your D50 target. Bring samples back for calcination using the staged profile you validated in Week 1.

**Week 3:** Calcine and reduce spray-dried material. Full characterization: PSD, SEM cross-section, BET, activity test. This is your decision gate.

**Week 4:** Based on results, commit to path. If spray drying works, scope capital or ongoing toll arrangement. If activity loss is unacceptable, advance co-precipitation.

The first three weeks cost maybe $5-10K total in toll processing and characterization, and tell you exactly which development path is viable. Don't spend six months optimizing calcination parameters in a solid-state process when liquid-phase size setting might solve your problem in one step.

---

## Challenge the Frame

Before committing to any path, pressure-test these assumptions:

**What if the real problem isn't particle size but particle strength?**
Your current particles might reach 40-50 μm during calcination but attrit during fluidization startup. If true, the solution is strengthening existing particles, not growing larger ones.
*Test: measure attrition index of current catalyst under fluidization conditions before and after the size-focused interventions.*

**What if the fluidization conditions are the degree of freedom?**
The problem assumes fixed reactor velocity. But startup velocity could potentially be reduced (slower ramp-up, different distributor) to retain current particles.
*Ask: what's the minimum velocity for adequate mixing during startup? Is there headroom below current operating point?*

**What if your 1-200 μm distribution is bimodal?**
If PSD shows distinct fines peak (<20 μm) and coarse peak (60-100 μm), air classification might separate acceptable coarse fraction from problematic fines immediately. No synthesis change required.
*Action: get high-resolution PSD measurement today, look for bimodality.*

**What if particle density is easier to change than particle size?**
Per Stokes law, doubling density has the same effect as increasing diameter by 40%. The flux concept (Spark) tests this directly. If your particles are highly porous, densification might be simpler than size growth.
*This is why the flux experiment runs in parallel—it's a genuine alternative frame.*

---

## Risks & Watchouts

### Activity-Size Tradeoff — Likely
Larger crystallites or denser particles may mean lower surface area and potential diffusion limitations.
**Mitigation:** Set activity floor (80% of baseline) as explicit kill criterion at every gate. Test early, not at the end.
**Trigger:** If spray drying shows >25% activity loss, evaluate co-precipitation or spray freeze before accepting tradeoff.

### Equipment Access — Timeline Risk
Spray drying requires specialized equipment not typically in catalyst labs.
**Mitigation:** Identify toll spray dryers or contract labs now. Line up access before you need it.
**Trigger:** If equipment access delays >4 weeks, pursue staged calcination + classification path in parallel.

### Scale-Up Surprises — Capital Risk
Lab spray dryers behave differently from production units. Atomizer design, residence time, and temperature profiles all change.
**Mitigation:** Validate at toll facility scale (kg quantities) before any capital decision.
**Trigger:** If toll results don't match lab results, investigate before committing.

### Co-Precipitation Metal Imbalance — Process Risk
Four metals with different precipitation kinetics may segregate, giving inconsistent composition.
**Mitigation:** ICP-OES and XRD at every stage to verify stoichiometry. Adjust pH and addition rate if metals segregate.
**Trigger:** If any metal deviates >10% from target, reformulate precipitation conditions.

---

## Next Steps

1. **Today:** Measure current PSD by laser diffraction. Confirm whether distribution is continuous or bimodal. Calculate fraction in 30-80 μm window.

2. **This week:** Run staged calcination comparison—one batch with staged profile vs. control with current profile. Parallel: run KNO₃ flux experiment on one batch.

3. **Week 2:** Contact toll spray dryer (examples: Spray Drying Systems, Niro, BRACE). Ship 500g nitrate solution for trial. Target: D50 and morphology validation.

4. **Week 3:** Calcine and reduce spray-dried samples. Full characterization: PSD, SEM, BET, activity test.

5. **Week 4:** Decision gate. Commit to development path based on data. If spray drying works, scope capital or ongoing toll arrangement. If blocked, advance co-precipitation with validated staged calcination.

**Decision point:** End of Week 4, you'll have data to commit to a path with confidence—not guesses about what might work.
`;

// Table of contents extracted from the report
// IDs must match the generateSectionId function in test-flow/page.tsx
export const MOCK_REPORT_TOC: TocItem[] = [
  { id: 'executive-summary', title: 'Executive Summary', level: 1 },
  { id: 'your-constraints', title: 'Your Constraints', level: 1 },
  { id: 'problem-analysis', title: 'Problem Analysis', level: 1 },
  { id: 'key-patterns', title: 'Key Patterns', level: 1 },
  { id: 'solution-concepts', title: 'Solution Concepts', level: 1 },
  { id: 'concept-comparison', title: 'Concept Comparison', level: 1 },
  { id: 'validation-summary', title: 'Validation Summary', level: 1 },
  { id: 'decision-architecture', title: 'Decision Architecture', level: 1 },
  { id: 'what-id-actually-do', title: "What I'd Actually Do", level: 1 },
  { id: 'challenge-the-frame', title: 'Challenge the Frame', level: 1 },
  { id: 'risks--watchouts', title: 'Risks & Watchouts', level: 1 },
  { id: 'next-steps', title: 'Next Steps', level: 1 },
];

export const MOCK_REPORT_METADATA = {
  title: 'Catalyst Particle Size Control for Fluidized Bed Retention',
  viability: 'GREEN' as const,
  viabilitySummary:
    "Multiple proven paths exist. The question isn't whether this is solvable—it's which path fits your capital and timeline constraints.",
  challenge:
    'Catalyst particle size distribution (1-200 μm) is too wide and too fine-shifted, causing unacceptable elutriation losses during fluidized bed startup.',
  coreInsight:
    'Decouple particle geometry from precipitation chemistry by forming particles in a separate templating step where droplet physics, not sintering kinetics, controls the outcome.',
  leadRecommendation:
    'Build spray-dried microspheres first—this is exactly how Grace and BASF make FCC catalysts in your target size range.',
  confidence: 'HIGH for D50 targets · MEDIUM for activity preservation',
  conceptCount: 6,
  recommendedCount: 2,
  generatedAt: new Date().toISOString(),
};

export const MOCK_REPORT_SUMMARY: ReportSummary = {
  title: MOCK_REPORT_METADATA.title,
  conceptCount: MOCK_REPORT_METADATA.conceptCount,
  recommendedCount: MOCK_REPORT_METADATA.recommendedCount,
  headlineFinding:
    'Spray drying achieves D50 = 40-60 μm with HIGH confidence—proven at industrial scale',
};

// Legacy structured report format (kept for compatibility)
export const MOCK_REPORT: FullReport = {
  id: 'test-001',
  title: MOCK_REPORT_METADATA.title,
  generatedAt: new Date(),
  challenge: MOCK_REPORT_METADATA.challenge,

  executiveSummary: {
    paragraphs: [
      MOCK_REPORT_METADATA.coreInsight,
      MOCK_REPORT_METADATA.leadRecommendation,
      MOCK_REPORT_METADATA.viabilitySummary,
    ],
  },

  viability: {
    level: 'GREEN',
    summary: MOCK_REPORT_METADATA.viabilitySummary,
  },

  analysis: {
    constraints: [
      {
        quote: 'Ni-Cu-Al-Mg oxide system required',
        note: 'Catalytic function',
      },
      { quote: 'H₂ reduction at 500°C needed', note: 'Activate catalyst' },
      { quote: 'Reactor type is fixed', note: 'Fluidized bed' },
      { quote: 'Nitrate salts as precursors', note: 'Cost/availability' },
      { quote: '1-200 microns → D50 of 40-50 microns', note: 'Target' },
    ],
    assumptions: [
      {
        item: 'Wide distribution with D50 below target',
        interpretation: 'Need PSD data to confirm',
      },
      {
        item: 'No current spray drying capability',
        interpretation: 'No pilot equipment specified',
      },
      {
        item: 'Activity retention ≥80% acceptable',
        interpretation: 'Given size improvement',
      },
      {
        item: 'Capital up to $300-500K discussable',
        interpretation: 'If justified by performance',
      },
    ],
    whatIsWrong:
      'Fine particles (<30 μm) entrain with fluidizing gas at startup velocities. Distribution has no controlled center—dominated by nucleation-driven fines and thermal fragmentation.',
    whyHard:
      'Current synthesis forces thermal decomposition to simultaneously transform chemistry, evolve NOx gas, consolidate particles, and control size distribution. These phenomena compete destructively.',
    rootCauses: [
      {
        title: 'Uncontrolled nucleation',
        description: 'High supersaturation creates many small crystallites',
        confidence: 'High',
      },
      {
        title: 'NOx fragmentation',
        description: 'Gas evolution fractures particles during calcination',
        confidence: 'High',
      },
      {
        title: 'No particle-forming step',
        description: "Natural agglomeration doesn't template geometry",
        confidence: 'High',
      },
      {
        title: 'Existing usable fraction',
        description: 'Some 40-80 μm material may exist',
        confidence: 'Medium',
      },
    ],
    successMetrics: [
      'D50: 40-50 μm',
      'Distribution span (D90-D10)/D50 < 1.5',
      'D10 > 20 μm',
      'Retention: <5% carryover in first 4 hours',
      'Activity: ≥80% of current baseline',
      'Attrition: <5% mass loss after 30 min tumbling',
    ],
  },

  concepts: {
    lead: [
      {
        id: 'c01',
        name: 'Direct Spray Drying of Nitrate Precursor Slurry',
        summary:
          'Atomize nitrate solution, dry into 40-60 μm spheres, calcine with staged profile',
        description:
          'Prepare 30-40 wt% solution, atomize through rotary atomizer into spray dryer. Droplets dry into microspheres that template final size.',
        confidence: 'High',
        metrics: [
          { label: 'D50 Achievable', value: '40-70 μm' },
          { label: 'Timeline', value: '4-6 weeks' },
          { label: 'Capital', value: 'Medium' },
          { label: 'Confidence', value: 'HIGH' },
        ],
        rationale:
          'Grace, BASF, and Albemarle use this exact approach. Multiple patents confirm 40-70 μm D50 with span <1.5 is routine.',
        risks: [
          'Hollow shell formation if drying too fast',
          'Surface area may drop 10-20%',
          'Scale-up requires atomizer redesign',
        ],
        testProtocol:
          'Gate 0: Benchtop trial. Gate 1: Staged calcination integrity. Gate 2: Activity validation.',
      },
      {
        id: 'c02',
        name: 'Staged Decomposition-Sintering Calcination',
        summary:
          'Two-stage calcination: slow ramp to 400°C, then faster to 700-750°C',
        description:
          'Replace current profile with staged approach to separate NOx evolution from sintering.',
        confidence: 'High',
        metrics: [
          { label: 'D50 Achievable', value: '30-45 μm' },
          { label: 'Timeline', value: '1 week' },
          { label: 'Capital', value: 'None' },
          { label: 'Confidence', value: 'HIGH' },
        ],
        rationale:
          'Addresses fragmentation directly. Uses existing equipment with zero cost.',
        risks: [
          'May be insufficient alone',
          'Longer cycle time (4-6 hours)',
          'Crystallite coarsening at 700-750°C',
        ],
        testProtocol:
          'Gate 0: Staged vs. control comparison. Gate 1: Activity retention check.',
      },
    ],
    other: [
      {
        id: 'c03',
        name: 'Post-Synthesis Classification',
        summary: 'Air classify into fines, product, and oversize fractions',
        description: 'Separate existing particles by size, recycle fines.',
        confidence: 'High',
        metrics: [
          { label: 'D50 Achievable', value: 'Recovers existing' },
          { label: 'Timeline', value: '2 weeks' },
          { label: 'Capital', value: 'Medium' },
        ],
        rationale:
          'Diagnostic priority—characterize current PSD to gate decisions.',
        risks: ['Yield depends entirely on current PSD'],
        testProtocol:
          'Characterize current PSD. GO if >30% in 30-80 μm window.',
      },
      {
        id: 'c04',
        name: 'Ammonia-Carbonate Co-Precipitation',
        summary:
          'Replace nitrate calcination with hydroxide/carbonate precipitation',
        description:
          'Control supersaturation and residence time. CO₂ evolves more gently than NOx.',
        confidence: 'Medium',
        metrics: [
          { label: 'D50 Achievable', value: '40-60 μm' },
          { label: 'Timeline', value: '6-8 weeks' },
          { label: 'Capital', value: 'Low' },
        ],
        rationale:
          'Alternative if spray drying capital blocked. Decouples size from thermal transformation.',
        risks: ['Four-metal kinetic mismatch'],
        testProtocol: 'GO if all metals within ±5% of target by ICP-OES.',
      },
      {
        id: 'c05',
        name: 'Seed-Templated Growth',
        summary: 'Recycle coarse fraction as seeds in precipitation',
        description: 'Seeds provide heterogeneous nucleation sites.',
        confidence: 'Medium',
        metrics: [
          { label: 'D50 Achievable', value: '40-60 μm' },
          { label: 'Timeline', value: '4 weeks' },
          { label: 'Capital', value: 'Low' },
        ],
        rationale:
          'Enables growth without new equipment if coarse fraction exists.',
        risks: ['Multi-metal affinity complexity'],
        testProtocol:
          'GO if precipitate deposits on seeds without independent fines.',
      },
    ],
    innovative: {
      id: 'spark',
      name: 'Density-Focused Retention via Sintering Flux',
      summary: 'Increase particle density instead of size using KNO₃ flux',
      description:
        'Add 0.5-1% KNO₃ for liquid-phase sintering, densifying from ~1500 to ~2500 kg/m³. Increases terminal velocity by 67%.',
      confidence: 'Low',
      metrics: [
        { label: 'D50 Achievable', value: 'Current size' },
        { label: 'Timeline', value: '2 weeks' },
        { label: 'Capital', value: 'None' },
      ],
      rationale:
        "Genuine first-principles reframe—physics doesn't care which variable you manipulate.",
      risks: [
        'No catalyst-specific precedent',
        'Alkali volatilization uncertain',
      ],
      testProtocol: 'GO if <100 ppm K remaining AND activity ≥90% baseline.',
    },
  },

  decisionArchitecture: [
    {
      condition: '>30% in 30-80 μm range',
      recommendation: 'Classification viable as primary path',
    },
    {
      condition: '<30% in target range + spray dryer access',
      recommendation: 'Spray drying + staged calcination',
    },
    {
      condition: '<30% + no spray dryer + can modify chemistry',
      recommendation: 'Co-precipitation route',
    },
    {
      condition: '<30% + no spray dryer + no chemistry change',
      recommendation: 'Staged calcination + classification',
    },
    {
      condition: 'All paths',
      recommendation: 'Run density flux experiment in parallel',
    },
  ],

  personalRecommendation: `**Today:** Run PSD characterization—two hours tells you whether classification alone works.

**Week 1:** Run staged calcination vs. control. Zero cost. Also run KNO₃ flux experiment.

**Week 2:** Get 200g to a toll spray dryer. One day of testing validates D50 target.

**Week 3:** Calcine and reduce spray-dried material. Full characterization.

**Week 4:** Decision gate. Commit to path based on data.

The first three weeks cost $5-10K total and tell you exactly which path is viable.`,

  challengeTheFrame: [
    {
      question:
        "What if the real problem isn't particle size but particle strength?",
      exploration:
        'Test: measure attrition index under fluidization conditions.',
    },
    {
      question:
        'What if the fluidization conditions are the degree of freedom?',
      exploration: "Ask: what's the minimum velocity for adequate mixing?",
    },
    {
      question: 'What if your distribution is bimodal?',
      exploration: 'Action: get high-resolution PSD measurement today.',
    },
    {
      question: 'What if particle density is easier to change than size?',
      exploration: 'This is why the flux experiment runs in parallel.',
    },
  ],

  risks: [
    {
      title: 'Activity-Size Tradeoff',
      description: 'Set activity floor (80%) as kill criterion at every gate.',
    },
    {
      title: 'Equipment Access',
      description: 'Identify toll spray dryers now. Line up access.',
    },
    {
      title: 'Scale-Up Surprises',
      description: 'Validate at toll facility scale before capital decision.',
    },
    {
      title: 'Co-Precipitation Metal Imbalance',
      description: 'ICP-OES and XRD at every stage to verify stoichiometry.',
    },
  ],

  nextSteps: [
    {
      action: 'Today: Measure current PSD',
      detail:
        'Confirm distribution shape. Calculate fraction in 30-80 μm window.',
    },
    {
      action: 'This week: Staged calcination comparison',
      detail: 'Plus KNO₃ flux experiment in parallel.',
    },
    {
      action: 'Week 2: Toll spray dryer trial',
      detail: 'Ship 500g nitrate solution. Validate D50 and morphology.',
    },
    {
      action: 'Week 3: Full characterization',
      detail: 'PSD, SEM, BET, activity test.',
    },
    {
      action: 'Week 4: Decision gate',
      detail: 'Commit to path based on data.',
    },
  ],

  testProtocols: [
    {
      conceptName: 'C-01 Spray Drying',
      steps: [
        'Gate 0: Benchtop spray dry trial (vary temp 150-180°C, solids 25-40%)',
        'Gate 1: Staged calcination (1-2°C/min to 400°C, hold 2h, 5°C/min to 700°C)',
        'Gate 2: Reduce and test activity vs. baseline',
      ],
      goNoGo:
        'D50 in 30-60 μm, span <1.5, solid particles, <15% D50 shift, activity >85% baseline',
    },
    {
      conceptName: 'C-02 Staged Calcination',
      steps: [
        'Gate 0: Single batch staged vs. control',
        'Gate 1: BET surface area and activity comparison',
      ],
      goNoGo: 'D50 increase >20%, fines reduction >40%, activity >85% baseline',
    },
  ],

  sources: [
    {
      type: 'Patent',
      title: 'Grace FCC catalyst process',
      reference: 'US4,677,084',
    },
    {
      type: 'Patent',
      title: 'BASF spray drying method',
      reference: 'US6,022,513',
    },
    {
      type: 'Patent',
      title: 'Engelhard catalyst precursors',
      reference: 'US4,906,603',
    },
    {
      type: 'Industry',
      title: 'Grace, BASF, Albemarle standard practice',
      reference: 'FCC catalyst manufacturing',
    },
    {
      type: 'Industry',
      title: 'Johnson Matthey, Clariant',
      reference: 'Ni-based precursor patents',
    },
  ],
};
