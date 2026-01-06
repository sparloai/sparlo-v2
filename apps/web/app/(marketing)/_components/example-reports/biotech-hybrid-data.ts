import type { HybridReportData } from '~/app/reports/_lib/types/hybrid-report-display.types';

/**
 * Biotech Hybrid Report Example Data
 * Protein A-Free mAb Purification
 */
export const BIOTECH_HYBRID_REPORT: HybridReportData = {
  title:
    'Protein A-Free mAb Purification: Achieving <$5/g Through Validated Non-Affinity Capture',
  brief:
    "Biologic drug purification uses Protein A chromatography resin at $15,000/L that lasts 100-200 cycles. Chromatography is 50-70% of mAb downstream cost. Capacity can't scale with upstream titer improvements. Need purification approach achieving 99%+ purity at <$10/g product cost without Protein A dependency.",

  executive_summary: {
    narrative_lead:
      "Continuous cation exchange chromatography with flocculation pre-treatment already achieves 95%+ purity at $3-5/g—Pall and Cytiva sell the equipment, and Genentech has validated the precipitation chemistry. The barrier isn't finding the solution; it's integration and execution. For the 70% of mAbs with pI >7, this combination eliminates Protein A entirely while using commercial, FDA-validated platforms.",
    primary_recommendation:
      'Implement continuous 4-column CEX capture (Pall Cadence or Cytiva ÄKTA pcc) with polyelectrolyte flocculation pre-treatment. Investment of $2-4M yields $3-5/g purification cost—a 3-10x improvement over Protein A. For acidic mAbs, use mixed-mode chromatography (Capto MMC) as the capture platform. Both approaches use commercial equipment with established regulatory precedent.',
    viability: 'viable',
    viability_label:
      'Viable with high confidence for basic mAbs (pI >7); conditionally viable for acidic mAbs requiring mixed-mode alternatives',
  },

  problem_analysis: {
    whats_wrong: {
      prose:
        'Protein A resin at $15,000/L dominates 50-70% of downstream cost, creating a hard ceiling on mAb manufacturing economics. As upstream titers improve (now 5-10+ g/L), column capacity becomes the bottleneck—you can make more antibody than you can purify. The industry is optimizing an inherently expensive process rather than questioning whether Protein A is necessary at all.',
    },
    current_state_of_art: {
      benchmarks: [
        {
          entity: 'Cytiva (MabSelect SuRe LX)',
          approach: 'Alkali-stable Protein A with high capacity',
          current_performance:
            '50-60 g/L dynamic binding capacity, 300+ cycles with 0.5M NaOH CIP',
          target_roadmap:
            'Incremental capacity improvements; no fundamental cost reduction',
          source: 'Cytiva technical documentation',
        },
        {
          entity: 'Pall Cadence BioSMB',
          approach: 'Continuous multi-column chromatography',
          current_performance:
            '3-5x productivity improvement over batch; validated for mAb capture',
          target_roadmap:
            'Integration with non-affinity resins for Protein A-free platform',
          source: 'Pall technical notes and conference presentations',
        },
        {
          entity: 'Genentech/Amgen',
          approach: 'Caprylic acid precipitation pre-treatment',
          current_performance:
            '>99% HCP removal, >95% mAb recovery at pilot scale',
          target_roadmap: 'Not disclosed; patents suggest commercial interest',
          source: 'Brodsky et al. 2012; US Patent 8,044,017 B2',
        },
        {
          entity: 'Plasma fractionation industry (CSL, Grifols, Takeda)',
          approach: 'Cohn precipitation process',
          current_performance:
            'Pharmaceutical-grade IgG at $2-5/g, ton scale, no chromatography',
          target_roadmap: 'Mature technology; no significant changes planned',
          source: 'Industry standard for 80+ years',
        },
      ],
    },
    what_industry_does_today: [
      {
        approach: 'Protein A affinity chromatography as primary capture',
        limitation:
          "Resin costs $15,000/L, lasts 100-200 cycles, and capacity (~40 g/L) can't keep pace with upstream improvements",
      },
      {
        approach: 'Three-column platform (Protein A → CEX → AEX)',
        limitation:
          'Each step adds cost and yield loss; total downstream cost $15-50/g',
      },
      {
        approach: 'Alkali-stable Protein A variants (MabSelect SuRe)',
        limitation:
          "Extends lifetime to 200+ cycles but doesn't address fundamental resin cost",
      },
      {
        approach: 'Mixed-mode or CEX capture for specific molecules',
        limitation:
          'Requires molecule-specific optimization; not a true platform',
      },
    ],
    why_its_hard: {
      prose:
        'Protein A achieves extraordinary selectivity (Ka ~10⁸ M⁻¹) through a precisely evolved binding interface with the Fc region. This single-step selectivity is difficult to replicate with synthetic ligands or non-affinity mechanisms. The fundamental challenge is achieving 3-4 log HCP reduction (from ~100,000 ppm to <100 ppm) while maintaining >90% yield and avoiding aggregation. Chromatography capacity is limited by diffusion into porous beads—larger beads enable faster flow but lower capacity, creating an inherent tradeoff.',
      governing_equation: {
        equation:
          'Purity = f(selectivity^stages); for batch chromatography, stages ≈ 1-2',
        explanation:
          'Protein A achieves high purity in one stage due to extreme selectivity. Lower-selectivity alternatives require more stages (continuous operation) or pre-treatment (flocculation/precipitation) to match performance.',
      },
    },
    first_principles_insight: {
      headline:
        'Chromatography is not physically required for pharmaceutical-grade IgG—the plasma industry has proven this for 80 years',
      explanation:
        'The Cohn process (1946) purifies plasma-derived IgG to pharmaceutical specifications using only precipitation and centrifugation. CSL Behring, Grifols, and Takeda operate at ton scale without any chromatography. The assumption that recombinant mAbs require Protein A is historical accident, not physical necessity. The barrier is organizational (different industries, different regulatory frameworks) not technical.',
    },
  },

  constraints_and_metrics: {
    hard_constraints: [
      'Must achieve >99% monomeric IgG purity',
      'HCP <100 ppm (regulatory requirement)',
      'DNA <10 pg/dose (regulatory requirement)',
      'Must maintain antibody integrity (no aggregation, denaturation, fragmentation)',
      'Must be validatable for GMP manufacturing',
    ],
    soft_constraints: [
      'Target cost <$10/g (user stated; $3-5/g achievable with recommended approach)',
      'Yield >85% (Protein A achieves 95%+; some tradeoff acceptable for cost reduction)',
      'Process time competitive with 4-6 hour Protein A cycle (continuous operation changes this metric)',
    ],
    assumptions: [
      'Commercial scale >500 kg/year (economics differ at smaller scale)',
      'Basic mAbs (pI >7) represent primary target (70% of approved mAbs)',
      'Regulatory pathway exists via precedent (continuous chromatography, precipitation pre-treatment both validated)',
      'Freedom to operate for caprylic acid precipitation (Genentech patents may require licensing or have expired)',
    ],
    success_metrics: [
      {
        metric: 'Purification cost',
        target: '<$5/g',
        minimum_viable: '<$10/g',
        stretch: '<$3/g',
        unit: '$/g product',
      },
      {
        metric: 'Purity (monomeric IgG)',
        target: '>99%',
        minimum_viable: '>95% (with polishing)',
        stretch: '>99.5%',
        unit: '% monomer',
      },
      {
        metric: 'HCP clearance',
        target: '<50 ppm',
        minimum_viable: '<100 ppm',
        stretch: '<10 ppm',
        unit: 'ppm',
      },
      {
        metric: 'Yield',
        target: '>90%',
        minimum_viable: '>85%',
        stretch: '>95%',
        unit: '% recovery',
      },
      {
        metric: 'Resin/consumable lifetime',
        target: '>500 cycles',
        minimum_viable: '>300 cycles',
        stretch: '>1000 cycles or single-use economics',
        unit: 'cycles',
      },
    ],
  },

  challenge_the_frame: [
    {
      assumption: '70% of mAbs have pI >7 and are suitable for CEX capture',
      challenge:
        'This estimate comes from analysis of approved mAbs, which may not represent future pipeline. Engineered mAbs increasingly have modified Fc regions that could shift pI distribution.',
      implication:
        'If <50% of pipeline mAbs are suitable for CEX, mixed-mode chromatography becomes the primary platform rather than fallback',
    },
    {
      assumption:
        'Continuous chromatography is operationally feasible for typical biopharma organizations',
      challenge:
        'Continuous operation requires different skills, different QA/QC approaches, and 24/7 staffing. Many organizations may lack these capabilities.',
      implication:
        'If continuous operation is too complex, batch CEX with flocculation pre-treatment may be more practical, though with somewhat higher cost',
    },
    {
      assumption: 'Regulatory pathway exists via precedent',
      challenge:
        'While continuous chromatography and precipitation pre-treatment have been validated separately, the specific combination may require additional regulatory interaction',
      implication:
        'Budget additional 6-12 months for regulatory strategy; engage FDA/EMA early in development',
    },
    {
      assumption: 'Plasma industry precedent translates to recombinant mAbs',
      challenge:
        'CHO HCPs are different from plasma proteins; CHO cell culture conditions create different impurity profiles. The chemistry may not transfer directly.',
      implication:
        'Extensive validation required before assuming plasma fractionation methods work for CHO-derived mAbs; caprylic acid validation by Genentech is encouraging but not comprehensive',
    },
  ],

  innovation_analysis: {
    reframe:
      "Instead of asking 'how do we make Protein A cheaper?', we asked 'what does the plasma industry know that recombinant biopharma has ignored for 80 years?'",
    domains_searched: [
      'Plasma fractionation (Cohn process)',
      'Dairy whey protein purification',
      'Petrochemical continuous chromatography (SMB)',
      'Wastewater treatment (flocculation, electrocoagulation)',
      'Mineral processing (flotation)',
      'Polymer chemistry (stimulus-responsive materials)',
      'Crystallography (protein crystallization)',
      'Chemical industry (liquid-liquid extraction)',
    ],
  },

  execution_track: {
    intro:
      'Solution concepts use proven technologies requiring integration, not invention. These approaches use commercial equipment with established regulatory precedent. Start here for lowest risk and fastest implementation.',
    primary: {
      id: 'sol-primary',
      title:
        'Continuous Multi-Column CEX Capture with Flocculation Pre-treatment',
      confidence: 88,
      source_type: 'TRANSFER',
      bottom_line:
        'Combine two validated technologies—polyelectrolyte flocculation for 90%+ HCP removal followed by continuous 4-column periodic counter-current cation exchange chromatography.',
      expected_improvement: '$3-5/g purification cost',
      timeline: '12-18 months to GMP implementation',
      investment: '$2-4M',
      the_insight: {
        what: 'Sequential exploitation of charge differences: HCPs are predominantly acidic (average pI ~5.5) and bind cationic flocculants; mAbs are predominantly basic (pI 7-9) and bind cation exchangers at low pH',
        where_we_found_it: {
          domain:
            'Combination of wastewater treatment (flocculation) and petrochemical (continuous chromatography)',
          how_they_use_it:
            'Wastewater uses polyelectrolyte flocculation to remove proteins and colloids; petrochemical uses SMB chromatography to achieve >99.5% purity with selectivity factors of only 1.5-2.0',
          why_it_transfers:
            'mAb/HCP separation is fundamentally a charge-based separation problem; continuous operation mathematics are identical regardless of the molecules being separated',
        },
        why_industry_missed_it:
          "Organizational silos—flocculation experts and continuous chromatography experts rarely collaborate. Each technology validated separately but integration not systematically pursued. Protein A works 'well enough' that there's been limited pressure to optimize alternatives.",
      },
      what_it_is:
        "Combine two validated technologies—polyelectrolyte flocculation for 90%+ HCP removal followed by continuous 4-column periodic counter-current cation exchange chromatography. The flocculation step (using pDADMAC or chitosan at 0.01-0.05% concentration, pH 5-6) electrostatically complexes with negatively charged HCPs, forming flocs removed by depth filtration. The clarified, HCP-depleted stream then feeds a continuous CEX system (Pall Cadence BioSMB or Cytiva ÄKTA pcc) where mAb binds at pH 5-6 while remaining impurities flow through. Four columns cycle through load-wash-elute-regenerate phases, maintaining constant feed flow and achieving steady-state purity of 95%+ through accumulation of 15-25 theoretical stages.\n\nThis integrated approach uses commercial equipment with cheap CEX resin ($500/L vs $15,000/L for Protein A) to achieve Protein A-equivalent purity at <10% of resin cost. The key insight is that flocculation handles the 'heavy lifting' of HCP removal (1-2 log reduction at <$0.10/g), allowing the CEX step to operate on a much cleaner feed. This compensates for CEX's lower inherent selectivity compared to Protein A. The continuous operation then provides the additional theoretical stages needed to achieve final purity.",
      why_it_works:
        'The physics is straightforward: polycations (quaternary ammonium groups, pKa >12) remain fully charged at process pH, binding acidic HCP surface residues (Asp, Glu, pKa 3.9-4.3). This forms insoluble complexes while basic mAbs remain soluble due to electrostatic repulsion. Subsequent CEX binding occurs via electrostatic interaction between protonated mAb surface residues (Lys ε-amino, pKa 10.5; Arg guanidinium, pKa 12.5) and sulfonate groups (pKa <1) on the resin. The selectivity factor α = 3-10 for mAb over remaining HCPs is lower than Protein A (α >100), but continuous operation with 15-25 theoretical stages achieves equivalent purity: Purity = f(α^stages).',
      why_it_might_fail: [
        'Flocculation optimization is molecule-specific and may require significant development for each new mAb',
        'Novel process combinations may face additional regulatory scrutiny even when individual components are validated',
        'Continuous chromatography requires new operational capabilities (24/7 operation, different QC approach)',
      ],
      validation_gates: [
        {
          week: 'Week 4-6',
          test: 'Flocculation optimization + CEX binding capacity for lead mAb molecule',
          method:
            'DoE-based optimization of pDADMAC concentration, pH, temperature; CEX breakthrough analysis',
          success_criteria:
            'Flocculation achieves >90% HCP reduction with >95% mAb recovery; CEX binding capacity >40 mg/mL at 300 cm/hr; combined purity >90%',
          cost: '$15-25K (labor + analytics)',
          decision_point:
            'If HCP reduction <80% or mAb recovery <90%, troubleshoot flocculation conditions. If CEX capacity <30 mg/mL, evaluate alternative resins. Proceed to continuous validation only if both criteria met.',
        },
      ],
    },
    supporting_concepts: [
      {
        id: 'sol-support-1',
        title: 'Mixed-Mode Chromatography Platform (Capto MMC/adhere)',
        relationship: 'FALLBACK',
        one_liner:
          'Molecule-specific optimization required; 85-92% single-step purity means additional polishing step needed',
        confidence: 75,
        what_it_is:
          "Adopt mixed-mode chromatography as primary capture using commercial resins (Capto MMC, Capto adhere, MEP HyperCel) that combine hydrophobic, ionic, and hydrogen-bonding interactions. These resins provide pseudo-affinity selectivity at 70-80% lower cost than Protein A ($3,000-5,000/L), tolerate aggressive CIP (1M NaOH), and are already validated in commercial mAb manufacturing. The multi-point attachment mechanism engages the Fc region's unique surface chemistry—clustered hydrophobic residues adjacent to basic residues—providing selectivity approaching affinity chromatography through cumulative weak interactions.",
        why_it_works:
          "The Fc region presents a unique surface chemistry: the CH2-CH3 interface has clustered hydrophobic residues (Leu, Ile, Val) adjacent to basic residues (Lys, His). Mixed-mode ligands (e.g., N-benzyl-N-methyl ethanolamine for Capto MMC) engage both simultaneously. HCPs with different surface patterns don't achieve the same multi-point engagement, providing selectivity.",
        when_to_use_instead:
          "Use for acidic mAbs (pI <7) where CEX capture doesn't work; use as backup if flocculation optimization proves difficult for specific molecule",
      },
      {
        id: 'sol-support-2',
        title: 'Caprylic Acid Precipitation + Mixed-Mode Polishing',
        relationship: 'COMPLEMENTARY',
        one_liner:
          'Freedom to operate—Genentech US Patent 8,044,017 B2 may require licensing. Some mAbs with lower conformational stability may be damaged.',
        confidence: 70,
        what_it_is:
          'Replace Protein A capture entirely with caprylic acid precipitation (validated in plasma fractionation for 50+ years and adapted to CHO mAbs by Genentech/Amgen). Caprylic (octanoic) acid at 0.5-2% concentration and pH 4.5-5.0 selectively denatures and precipitates non-IgG proteins while mAbs remain soluble due to their compact, stable Fc region structure. The precipitate is removed by centrifugation or depth filtration. The clarified supernatant (85-95% pure) undergoes mixed-mode chromatography for final polishing to >99% purity. Total process: two unit operations, zero affinity resin, <$2/g capture cost.',
        why_it_works:
          "Caprylic acid's hydrophobic tail inserts into hydrophobic pockets of proteins, disrupting tertiary structure. HCPs, with exposed hydrophobic cores and lower conformational stability, denature and aggregate. IgG's Fc region has evolved exceptional stability, and its hydrophobic residues are buried in the CH2-CH3 interface, protected from fatty acid insertion. Additionally, IgG's glycosylation at Asn297 provides steric protection.",
        when_to_use_instead:
          'Use when maximum cost reduction is priority and freedom to operate is confirmed; use as pre-treatment before any chromatography step to reduce HCP burden',
      },
    ],
  },

  innovation_portfolio: {
    intro:
      'Higher-risk explorations with breakthrough potential. Innovation concepts offer higher ceilings with higher uncertainty. These are parallel bets on breakthrough outcomes that could transform the economics of mAb purification if successful.',
    recommended_innovation: {
      id: 'innov-recommended',
      title: 'Chromatography-Free Precipitation Cascade (Modern Cohn Process)',
      confidence: 55,
      innovation_type: 'CROSS_DOMAIN',
      source_domain: 'Plasma fractionation industry',
      the_insight: {
        what: 'Sequential exploitation of differential solubility achieves pharmaceutical-grade purity without any chromatography',
        where_we_found_it: {
          domain: 'Plasma fractionation (Cohn process, 1946)',
          how_they_use_it:
            'CSL Behring, Grifols, and Takeda purify plasma-derived IgG to pharmaceutical specifications using only precipitation and centrifugation at ton scale',
          why_it_transfers:
            'Same 150 kDa protein, same fundamental solubility physics. The barrier is organizational (different industries, different regulatory frameworks) not technical.',
        },
        why_industry_missed_it:
          "Recombinant biopharma and plasma fractionation are separate industries with separate conferences, separate journals, separate regulatory frameworks. Knowledge transfer hasn't occurred despite 80 years of plasma industry experience.",
      },
      what_it_is:
        'Eliminate chromatography entirely by adapting plasma fractionation principles with modern process control. The approach uses sequential precipitation steps, each exploiting a different physical property:\n\n**Step 1 - Caprylic acid precipitation (pH 4.5-5.0, 0.5-2% caprylic acid):** Selectively denatures and precipitates HCPs while mAb remains soluble. Achieves >99% HCP removal in a single step. Precipitate removed by centrifugation or depth filtration.\n\n**Step 2 - PEG or ammonium sulfate precipitation:** After HCP removal, PEG 6000 (12-18%) or ammonium sulfate (40-50% saturation) precipitates mAb while remaining impurities stay soluble. This exploits the Cohn equation: log S = β - K_s × I, where larger proteins (IgG at 150 kDa) precipitate at lower precipitant concentration.\n\n**Step 3 - Resolubilization and crystallization or membrane polish:** mAb precipitate is resolubilized in formulation buffer. For molecules that crystallize, crystallization provides final polish to >99.9% purity. For others, a single membrane chromatography step achieves final purity.\n\nThe result: zero resin cost, continuous operation for consistency, target <$2/g total purification cost.',
      why_it_works:
        "PEG precipitation mechanism: PEG (MW 6000) is excluded from protein surfaces due to steric exclusion, creating an 'effective concentration' of protein in the remaining water volume. When this effective concentration exceeds solubility, precipitation occurs. IgG precipitates at lower PEG concentration than small proteins because larger proteins have lower solubility (log S ∝ -MW^(2/3)). At 12-18% PEG 6000, IgG (150 kDa) precipitates while proteins <50 kDa remain soluble.\n\nAmmonium sulfate mechanism: Kosmotropic sulfate ion competes for water of hydration, reducing protein solubility. IgG precipitates at 40-50% saturation (2.4-3.0 M) following the Cohn equation.\n\nCrystallization mechanism: Only molecules fitting the crystal lattice incorporate; impurities face ΔΔG > 5 kJ/mol penalty, making incorporation thermodynamically unfavorable by factor of exp(ΔΔG/RT) > 10.",
      breakthrough_potential: {
        if_it_works:
          'Eliminates all chromatography resin cost—the dominant expense in current processes. Enables true continuous processing from harvest to formulation.',
        estimated_improvement:
          '5-10x cost reduction: from $15-50/g to $1-2/g. Uncertainty range $1-4/g depending on process complexity.',
        industry_impact:
          'Would fundamentally reshape mAb manufacturing economics and enable biosimilar competition at unprecedented cost points',
      },
      validation_path: {
        gating_question:
          'Can sequential precipitation achieve >99% purity with >85% yield for CHO-derived mAbs?',
        first_test:
          'Test caprylic acid + PEG precipitation sequence on lead mAb molecule; measure purity, yield, aggregation at each step',
        cost: '$20-40K (labor + analytics + small-scale equipment)',
        timeline: '3-4 months',
        go_no_go:
          'GO if combined purity >95% with yield >85% and <5% aggregation. NO-GO if aggregation >10% or yield <75%.',
      },
      risks: {
        physics_risks: [
          'CHO HCP profile may respond differently than plasma proteins to precipitation',
          'Some mAbs may aggregate during precipitation steps',
        ],
        implementation_challenges: [
          'Precipitation processes are less familiar to biopharma organizations',
          'Regulatory pathway for chromatography-free process may require additional validation',
        ],
        mitigation: [
          'Screen conformational stability (DSF/DSC) early; exclude molecules with Tm <60°C',
          'Partner with plasma fractionation experts (CSL, Grifols) for technology transfer',
          'Engage regulators early with precedent from plasma industry',
        ],
      },
    },
    parallel_investigations: [
      {
        id: 'innov-parallel-1',
        title: 'Crystallization-First Purification for Suitable mAbs',
        confidence: 45,
        innovation_type: 'CROSS_DOMAIN',
        source_domain: 'Protein crystallography',
        one_liner:
          'Screen crystallization conditions during process development and, for mAbs that crystallize (estimated 20-30%), use crystallization as the primary purification step',
        the_insight: {
          what: 'A single crystallization achieves >99.9% purity by thermodynamically excluding impurities from the crystal lattice',
          where_we_found_it: {
            domain:
              'Protein crystallography and small molecule pharmaceutical manufacturing',
            how_they_use_it:
              'Multiple commercial mAbs have been crystallized (infliximab, trastuzumab, adalimumab); Merck holds patents on mAb crystallization for purification',
            why_it_transfers:
              'Crystallization provides ultimate selectivity—only molecules fitting the lattice incorporate. Zero resin cost, single unit operation.',
          },
          why_industry_missed_it:
            'Crystallization is viewed as an analytical/structural biology technique, not a manufacturing operation. Different communities, different mindsets.',
        },
        ceiling:
          'Zero resin cost, single unit operation, >99.9% purity for crystallizable mAbs',
        key_uncertainty:
          'Fraction of mAbs that crystallize under practical conditions (estimated 20-30% but could be higher with systematic screening)',
        when_to_elevate:
          'Elevate to primary innovation if >50% of pipeline mAbs crystallize; elevate for specific molecule if crystallization achieves >99% purity with >80% yield',
        validation_approach: {
          test: 'Systematic crystallization screening for lead mAb using commercial sparse matrix screens',
          cost: '$10-20K',
          timeline: '2-3 months',
          go_no_go:
            'GO if crystals form with >80% yield and dissolve cleanly. NO-GO if no crystallization conditions found after comprehensive screening.',
        },
      },
      {
        id: 'innov-parallel-2',
        title:
          'Dairy Industry Technology Transfer: Chitosan Precipitation + Ceramic Membrane Cascade',
        confidence: 40,
        innovation_type: 'CROSS_DOMAIN',
        source_domain: 'Dairy whey protein purification',
        one_liner:
          'Import the dairy whey IgG purification process directly—same 150 kDa protein, 100x lower cost',
        the_insight: {
          what: 'The dairy industry purifies bovine IgG from whey at pharmaceutical grade for <$5/g using chitosan precipitation and ceramic membrane cascades',
          where_we_found_it: {
            domain: 'Dairy processing industry',
            how_they_use_it:
              'Chitosan precipitation of non-IgG proteins, ceramic membrane ultrafiltration cascade for concentration and fractionation, ion exchange polishing',
            why_it_transfers:
              'Bovine and human IgG have nearly identical structure and properties. Same purification physics should apply.',
          },
          why_industry_missed_it:
            'Dairy processing and biopharma are completely separate industries with no cross-pollination of ideas or personnel.',
        },
        ceiling:
          '<$5/g purification cost using proven dairy industry equipment and chemistry',
        key_uncertainty:
          'CHO HCP profile may not respond to chitosan as favorably as whey proteins; human IgG-chitosan interaction not validated',
        when_to_elevate:
          'Elevate if chitosan validation succeeds AND ceramic membrane economics are favorable at target scale',
        validation_approach: {
          test: 'Test chitosan precipitation on CHO harvest; validate bovine-to-human IgG translation',
          cost: '$15-25K',
          timeline: '2-3 months',
          go_no_go:
            'GO if >90% HCP reduction with >90% mAb recovery. NO-GO if mAb loss >20% or HCP reduction <70%.',
        },
      },
    ],
    frontier_watch: [
      {
        id: 'frontier-1',
        title: 'High-Capacity Magnetic Bead Capture',
        innovation_type: 'EMERGING_SCIENCE',
        trl_estimate: 5,
        one_liner:
          'Eliminates all column-related limitations—binding occurs in solution phase at maximum diffusion-limited rate',
        why_interesting:
          'Could process unclarified harvest directly, eliminating clarification step. Truly continuous operation straightforward. No diffusion limitations.',
        why_not_now:
          'Scale-up of magnetic separation not well established—field gradient decreases with distance. Particle cost and lifetime at manufacturing scale unknown. No regulatory precedent for magnetic capture in mAb manufacturing.',
        trigger_to_revisit:
          'Commercial demonstration at >100L scale with published particle lifetime >200 cycles; OR regulatory approval for magnetic capture in any biologic manufacturing',
        who_to_monitor:
          'JSR Life Sciences (Amsphere products), Miltenyi Biotec (MACS technology), Academic groups: Prof. Matthias Franzreb (KIT), Prof. Owen Thomas (Birmingham)',
        earliest_viability: '3-5 years',
        competitive_activity:
          'JSR Life Sciences advancing Amsphere magnetic bead products. Limited commercial traction to date but technology advancing.',
      },
      {
        id: 'frontier-2',
        title:
          'Stimulus-Responsive Polymer Affinity Capture (Smart Precipitation)',
        innovation_type: 'EMERGING_SCIENCE',
        trl_estimate: 3,
        one_liner:
          'Combines affinity selectivity with precipitation simplicity—no columns, no packing, no diffusion limits',
        why_interesting:
          'Binding occurs in solution phase. Could enable single-step capture with affinity-like purity. Polymer precipitates above LCST, carrying bound mAb.',
        why_not_now:
          'Remains largely academic—no commercial development. Polymer synthesis and ligand conjugation are complex. Heat transfer at manufacturing scale challenging. Polymer recyclability unproven. No regulatory precedent.',
        trigger_to_revisit:
          'Demonstration of >100 cycle polymer recyclability with maintained binding capacity; OR commercial development announcement from major supplier',
        who_to_monitor:
          'Prof. Patrick Stayton (University of Washington), Prof. Allan Hoffman (University of Washington) - foundational work, Phase Bioscience (ELP-based systems)',
        earliest_viability: '5-7 years',
        competitive_activity:
          'Academic activity only. No commercial development programs known.',
      },
    ],
  },

  risks_and_watchouts: [
    {
      category: 'Technical',
      risk: 'Flocculation optimization is molecule-specific and may require significant development for each new mAb',
      severity: 'medium',
      mitigation:
        'Develop DoE-based optimization protocol; most mAbs respond to similar conditions. Build internal expertise through first few implementations.',
    },
    {
      category: 'Regulatory',
      risk: 'Novel process combinations may face additional scrutiny even when individual components are validated',
      severity: 'medium',
      mitigation:
        'Engage regulators early; prepare extensive comparability data; leverage existing precedent for each component',
    },
    {
      category: 'Resource',
      risk: 'Continuous chromatography requires new operational capabilities (24/7 operation, different QC approach)',
      severity: 'medium',
      mitigation:
        'Partner with experienced CDMO for initial implementation; Pall and Cytiva offer training and support',
    },
    {
      category: 'Market',
      risk: 'Protein A suppliers (Cytiva) may respond with aggressive pricing to defend market position',
      severity: 'low',
      mitigation:
        'Even with 50% Protein A price reduction, non-affinity approaches remain economically superior. Proceed with confidence.',
    },
    {
      category: 'Technical',
      risk: 'Caprylic acid precipitation may damage some mAbs with lower conformational stability',
      severity: 'high',
      mitigation:
        'Screen thermal stability (DSF/DSC) early in development; exclude molecules with Tm <60°C from precipitation approaches. This is a fundamental limitation for some molecules.',
    },
    {
      category: 'Regulatory',
      risk: 'Freedom to operate for caprylic acid precipitation—Genentech patents may require licensing',
      severity: 'high',
      mitigation:
        'Conduct patent landscape analysis before significant investment; evaluate licensing options; patents expire 2028',
    },
  ],

  self_critique: {
    confidence_level: 'high',
    overall_confidence: 'high',
    confidence_rationale:
      'Primary recommendation uses commercial equipment with established precedent; economics are well-supported by component analysis and industry benchmarks',
    what_we_might_be_wrong_about: [
      'The 70% of mAbs with pI >7 estimate may not hold for future pipeline molecules with engineered Fc regions',
      'Continuous operation may be more operationally complex than we estimate for typical biopharma organizations',
      'CHO HCP response to flocculation/precipitation may be more variable than plasma proteins',
      'Regulatory pathway may require more bridging studies than we anticipate despite component-level precedent',
      'Caprylic acid patent landscape may be more restrictive than initial search suggests',
    ],
    unexplored_directions: [
      'Electrocoagulation for selective HCP precipitation—unexplored in biopharma despite extensive wastewater use',
      'Counter-current chromatography (no solid phase)—eliminates all bead limitations but unfamiliar to industry',
      'Acoustic separation for initial enrichment—could provide 10x concentration without consumables',
      'Foam fractionation (flotation for proteins)—if Fc hydrophobicity enables selective flotation, very cheap pre-enrichment',
    ],
    validation_gaps: [
      {
        concern:
          'CEX capture may not achieve adequate purity for all basic mAbs',
        status: 'ADDRESSED',
        rationale:
          'First validation step includes purity measurement; go/no-go criteria require >90% purity. If not achieved, mixed-mode fallback is specified.',
      },
      {
        concern: 'Continuous operation complexity for typical organizations',
        status: 'ACCEPTED_RISK',
        rationale:
          'Mitigation via CDMO partnership and vendor support is specified. Operational complexity is real but manageable with proper training.',
      },
      {
        concern:
          'CHO HCP response to flocculation may differ from published data',
        status: 'ADDRESSED',
        rationale:
          'First validation step explicitly tests flocculation with lead molecule; go/no-go criteria specified',
      },
      {
        concern: 'Caprylic acid patent freedom to operate',
        status: 'EXTENDED_NEEDED',
        rationale:
          'Patent landscape analysis recommended before significant investment; flagged as HIGH severity risk requiring resolution',
      },
    ],
  },

  what_id_actually_do:
    "If this were my project, I'd start with continuous CEX plus flocculation for the next molecule entering process development—not as a research project, but as the actual manufacturing process. The technology is commercial, the equipment is available, and the economics are compelling. I'd call Pall and Cytiva this week to get application scientists involved.\n\nFor the caprylic acid precipitation approach, I'd commission a patent landscape analysis immediately. If freedom to operate exists (or licensing is feasible), this becomes the primary path because the economics are even better. The Brodsky 2012 paper gives you the recipe; it's a matter of optimization, not invention.\n\nThe paradigm shift to chromatography-free purification is the strategic play. I'd fund a small team (2-3 people) to systematically adapt Cohn process principles to CHO mAbs. This is a 3-5 year program, but the payoff is transformative. The plasma industry has been doing this for 80 years—we're not inventing anything, we're transferring knowledge across an organizational boundary.\n\nWhat I would not do is wait for the 'perfect' solution. The continuous CEX approach is good enough to implement now, and it's 3-10x better than Protein A. Perfect is the enemy of good, and in this case, 'good' is a $10-40M annual savings at commercial scale.",

  follow_up_prompts: [
    'Design a DoE protocol for optimizing polyelectrolyte flocculation conditions for my specific mAb',
    'Help me build a business case comparing continuous CEX vs. Protein A for our manufacturing scale',
    'What should I ask Pall and Cytiva about continuous chromatography implementation?',
    'Create a regulatory strategy for introducing flocculation pre-treatment into an existing validated process',
    'Analyze the patent landscape for caprylic acid precipitation in mAb purification',
  ],
};
