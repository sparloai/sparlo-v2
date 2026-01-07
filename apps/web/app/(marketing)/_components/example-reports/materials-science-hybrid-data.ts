import type { HybridReportData } from '~/app/app/reports/_lib/types/hybrid-report-display.types';

export const MATERIALS_SCIENCE_HYBRID_REPORT: HybridReportData = {
  title: '$40/ft² Transparent Wood: Continuous Processing for 2m² Panels',
  brief:
    'Transparent wood (delignified, polymer-infiltrated) has been demonstrated at lab scale with 80-90% optical transmittance, 5x the impact resistance of glass, and natural insulating properties (R-value 5x glass). But production requires 12-24 hour chemical delignification, expensive polymer infiltration, and produces pieces limited to ~1m². Architectural applications need 2-3m² panels, production at <$50/ft² (vs. ~$500/ft² current), and outdoor durability (UV, moisture). Need scalable process that maintains optical and mechanical properties while cutting cost 90% and enabling larger formats.',

  executive_summary: {
    narrative_lead:
      "Lignin's brown color comes from specific chromophoric structures that can be destroyed oxidatively without removing the lignin itself—preserving wood's mechanical properties while achieving transparency. The paper industry has operated continuous chemical processing at 1,000+ tons/day for decades; Mi et al. (2020) demonstrated roll-to-roll transparent wood processing at lab scale. Adapting continuous veneer tunnel processing (Kamyr digester architecture) to thin veneers (0.5-1mm) exploits diffusion scaling to achieve $25-40/ft² at 2-3m² panel sizes. Chromophore destruction chemistry, if UV stability validates, could push costs to $10-20/ft².",
    primary_recommendation:
      'Pursue continuous veneer tunnel processing (adapted from paper industry Kamyr digesters) as the primary path, with parallel validation of chromophore destruction chemistry that could eliminate delignification entirely. The continuous tunnel approach achieves $25-40/ft² with proven technology; chromophore destruction could reach $10-20/ft² if UV stability validates. Both paths use thin veneer (0.5-1mm) to exploit diffusion scaling—the single most important insight for cost reduction.',
    viability: 'uncertain',
    viability_label: 'Uncertain - requires validation',
  },

  problem_analysis: {
    whats_wrong: {
      prose:
        "Current transparent wood production is trapped in batch chemistry that doesn't scale. Each piece soaks for 12-24 hours in delignification chemicals, then hours more for polymer infiltration. The result: $500/ft² material that can only be made in small pieces. Architects want 2-3m² panels at $50/ft²—a 10x cost reduction and 2-3x size increase that batch processing fundamentally cannot deliver.",
    },
    why_its_hard: {
      prose:
        "Delignification is diffusion-limited. Chemical reagents must penetrate through cell walls to reach lignin in the middle lamella. The governing equation is Fick's second law: diffusion time scales with the square of thickness. A 10mm piece takes 100x longer than a 1mm piece. This physics cannot be circumvented—only exploited by processing thin material.",
      governing_equation: {
        equation:
          't ∝ L² / D (where t = time, L = thickness, D = diffusion coefficient)',
        explanation:
          'For 1mm veneer vs 10mm solid wood: diffusion time drops from 8-40 hours to 5-25 minutes. This is the fundamental insight enabling continuous processing.',
      },
    },
    first_principles_insight: {
      headline:
        'Process thin, laminate thick—diffusion physics makes batch processing of solid wood economically impossible at scale',
      explanation:
        'The industry assumed transparent wood must be made from solid pieces. But diffusion scaling means thin veneer processes 100x faster. Laminated veneer lumber (LVL) is already a $3B industry. Combine fast veneer processing with optical bonding from the display industry, and any final thickness becomes achievable.',
    },
    what_industry_does_today: [
      {
        approach:
          'Batch NaOH/Na₂SO₃ delignification (12-24 hours) followed by vacuum polymer infiltration',
        limitation:
          'Diffusion-limited: time scales with thickness². Cannot process large pieces economically',
      },
      {
        approach:
          'Focus on materials optimization (polymer selection, wood species) rather than process engineering',
        limitation:
          'Optimizing the wrong variable—process architecture dominates cost, not material choice',
      },
      {
        approach: 'Use balsa wood for fastest processing',
        limitation:
          'Balsa is expensive, limited supply, and soft—not ideal for structural glazing',
      },
    ],
    current_state_of_art: {
      benchmarks: [
        {
          entity: 'University of Maryland (Hu Lab)',
          approach: 'NaOH/Na₂SO₃ delignification + epoxy infiltration',
          current_performance:
            '80-90% transmittance, cm-scale samples, ~$500/ft² estimated',
          source: 'Zhu et al. 2016, Advanced Materials',
        },
        {
          entity: 'KTH Stockholm (Berglund Lab)',
          approach: 'NaClO₂ delignification + PMMA infiltration',
          current_performance: '90% transmittance, similar scale limitations',
          source: 'Li et al. 2016, Biomacromolecules',
        },
        {
          entity: 'Mi et al. (Maryland/Colorado)',
          approach: 'Roll-to-roll processing of thin veneer',
          current_performance:
            '85% transmittance, continuous processing demonstrated',
          source: 'Nature Communications 2020',
        },
      ],
    },
  },

  constraints_and_metrics: {
    hard_constraints: [
      'Refractive index matching Δn < 0.01 for low haze (physics requirement)',
      'Cellulose crystalline structure must be preserved for mechanical properties',
      'Complete void filling required—partial infiltration causes scattering',
    ],
    soft_constraints: [
      '80-90% transmittance (some haze acceptable for architectural diffuse lighting)',
      '2-3m² panels (could be achieved via lamination if joints are invisible)',
      '<$50/ft² (early premium markets may accept higher)',
    ],
    assumptions: [
      'Visible spectrum transparency (400-700nm), IR not critical',
      'Temperate climate deployment, 20+ year service life',
      'Low-lignin poplar feedstock available at scale',
    ],
    success_metrics: [
      {
        metric: 'Production cost',
        target: '<$50/ft²',
        minimum_viable: '<$75/ft²',
        stretch: '<$30/ft²',
        unit: '$/ft²',
      },
      {
        metric: 'Optical transmittance',
        target: '>85%',
        minimum_viable: '>75%',
        stretch: '>90%',
        unit: '%',
      },
      {
        metric: 'Panel size',
        target: '2-3 m²',
        minimum_viable: '1.5 m²',
        stretch: '>4 m²',
        unit: 'm²',
      },
      {
        metric: 'Processing throughput',
        target: '>10 m²/hour',
        minimum_viable: '>5 m²/hour',
        stretch: '>25 m²/hour',
        unit: 'm²/hour',
      },
      {
        metric: 'UV stability',
        target: '<10% yellowing at 5 years',
        minimum_viable: '<20% yellowing',
        stretch: '<5% yellowing',
        unit: '% color change',
      },
    ],
  },

  challenge_the_frame: [
    {
      assumption:
        'Thin veneer processing and lamination will achieve equivalent optical properties to monolithic transparent wood',
      challenge:
        'Interface effects, even with RI-matched adhesives, may create subtle optical artifacts visible in large panels or at certain angles',
      implication:
        'If lamination creates visible artifacts, monolithic processing becomes necessary, limiting panel size and increasing cost',
    },
    {
      assumption: 'Low-lignin poplar feedstock will be available at scale',
      challenge:
        'Transgenic poplar faces regulatory hurdles in many markets; naturally low-lignin varieties may have limited supply',
      implication:
        'If feedstock is constrained, must use standard species with full delignification, increasing processing time and cost',
    },
    {
      assumption:
        'UV stability of bleached lignin (chromophore destruction approaches) is achievable',
      challenge:
        'Chromophores may regenerate under UV exposure through radical mechanisms, causing yellowing over time',
      implication:
        'If UV stability fails, chromophore destruction approaches fail, and full delignification becomes necessary',
    },
    {
      assumption:
        'Market will accept transparent wood at $50-75/ft² price point',
      challenge:
        'Architectural glass is $15-40/ft²; premium may be too high for mainstream adoption',
      implication:
        'If market requires <$30/ft², only the most aggressive cost reduction approaches (chromophore destruction, parchmentizing) become viable',
    },
  ],

  innovation_analysis: {
    domains_searched: [
      'Paper/Pulp Industry (Kamyr continuous digesters)',
      'Display Industry (optical bonding)',
      'Aerospace Composites (RTM/VARTM)',
      'Ceramics (sol-gel processing)',
      'Biotechnology (lignin peroxidases)',
      'Food Industry (supercritical CO₂)',
      'Paper Industry (vegetable parchment)',
    ],
    reframe:
      "Instead of asking 'how do we remove lignin faster,' we asked 'do we need to remove lignin at all, and what industries already process wood continuously at scale?'",
  },

  execution_track: {
    intro:
      "Solution concepts use proven technologies requiring integration, not invention. These represent the lowest-risk path to commercial transparent wood, building on Mi et al.'s 2020 demonstration that continuous veneer processing works.",
    primary: {
      id: 'sol-primary',
      title: 'Continuous Veneer Tunnel with Paper Industry Architecture',
      confidence: 85,
      bottom_line:
        'Adapt Kamyr continuous digester architecture from paper mills for thin veneer processing to achieve 100x speedup over batch, enabling continuous production of transparent wood at $25-40/ft².',
      expected_improvement:
        '100x processing speedup (30-60 minutes vs 12-24 hours batch); $25-40/ft² production cost vs current $500+/ft²',
      timeline: '24-36 months to pilot production',
      investment: '$15-30M',
      what_it_is:
        "Adapt the Kamyr continuous digester architecture—proven at 1,000+ tons/day in paper mills—for thin veneer processing. Veneer sheets (0.5-1mm thick) move continuously through sequential zones: NaOH/Na₂SO₃ impregnation, delignification, washing, bleaching, drying, polymer infiltration, and UV curing. Each zone is optimized for residence time based on diffusion kinetics.\n\nThe key insight is that 1mm veneer processes 100x faster than 10mm solid wood due to diffusion scaling. What takes 12-24 hours in batch becomes 30-60 minutes in continuous flow. The paper industry has operated this exact chemistry at massive scale for decades—we're adapting their process architecture for a new product.\n\nFinal panels are assembled by laminating processed veneers using optical bonding adhesives from the display industry. This decouples processing speed from final product dimensions—any thickness from 3mm to 50mm+ becomes achievable from the same veneer line.",
      why_it_works:
        "Fick's second law governs diffusion: t ∝ L²/D. For wood delignification, the diffusion coefficient D is approximately 1-5 × 10⁻¹⁰ m²/s. At 1mm thickness, diffusion time is 5-25 minutes; at 10mm, it's 8-40 hours. This 100x speedup enables continuous processing with practical zone lengths.\n\nThe chemistry is identical to batch—NaOH swells cell walls while Na₂SO₃ cleaves β-O-4 lignin linkages via nucleophilic attack on quinone methide intermediates. What changes is geometry: thin veneer ensures all cell walls are accessible within minutes rather than hours.",
      the_insight: {
        what: "Diffusion-limited delignification can be converted from batch to continuous by processing thin veneer, exploiting the L² scaling of Fick's law",
        where_we_found_it: {
          domain: 'Paper/Pulp Industry',
          how_they_use_it:
            'Kamyr continuous digesters process wood chips through sequential chemical zones at 1,000+ tons/day with 2-4 hour residence time and >97% chemical recovery',
          why_it_transfers:
            'Same chemistry (NaOH/Na₂SO₃), same diffusion physics, but we preserve structure (they destroy it for fiber). Thin veneer is the geometric bridge.',
        },
        why_industry_missed_it:
          "Academic transparent wood researchers come from materials science, not process engineering. They optimized batch chemistry rather than questioning whether batch was necessary. The paper industry connection wasn't made because paper destroys wood structure while transparent wood preserves it.",
      },
      why_it_might_fail: [
        'Wet veneer handling at production speeds—paper handles pulp, not intact sheets',
        'Edge tearing and uniformity across veneer width',
        'Integration complexity of multi-zone system',
      ],
      validation_gates: [
        {
          week: '1-12',
          test: 'Continuous delignification of veneer at lab scale (10cm width, 1m length belt)',
          method:
            'Custom continuous belt reactor with NaOH/Na₂SO₃ zones; measure delignification via Kappa number (TAPPI T236)',
          success_criteria:
            '>80% delignification in <2 hours residence time with intact veneer structure',
          cost: '$50-100K',
          decision_point:
            '<60% delignification or significant veneer damage → evaluate thinner veneer or pre-treatment options',
        },
      ],
    },
    supporting_concepts: [
      {
        id: 'sol-support-1',
        title: 'Laminated Veneer Transparent Wood with Optical Bonding',
        relationship: 'COMPLEMENTARY',
        one_liner:
          'Use display-industry optical bonding adhesives to laminate thin processed veneers into panels of any thickness',
        what_it_is:
          'Process thin veneers through rapid delignification and infiltration, then laminate to any desired final thickness using display-industry optical bonding adhesives (OCAs). The display industry bonds millions of optical interfaces annually with invisible joints—same technology enables seamless transparent wood panels of any thickness.\n\nThis approach decouples processing speed from final product dimensions. A 25mm architectural panel becomes five 5mm processed veneers bonded together, each processed 25x faster than a monolithic piece.',
        why_it_works:
          'OCAs are acrylate-based adhesives with RI tunable from 1.47-1.55 by adjusting monomer composition. When RI matches the infiltrated wood (~1.53), the interface becomes optically invisible. Vacuum lamination eliminates air bubbles. The result is optically seamless multi-layer construction indistinguishable from monolithic material.',
        when_to_use_instead:
          'When final panel thickness exceeds what single-pass processing can achieve (>10mm), or when design requires varying thicknesses from same production line',
        confidence: 80,
        validation_summary:
          '$10-20M investment, 18-24 months to pilot. $30-45/ft² production cost. Risk: achieving invisible interfaces across large panel areas.',
      },
      {
        id: 'sol-support-2',
        title: 'RTM-Style Vacuum Infiltration with UV-Curable Resins',
        relationship: 'COMPLEMENTARY',
        one_liner:
          'Apply aerospace RTM methodology for pressure-driven polymer infiltration in minutes instead of hours',
        what_it_is:
          'Apply aerospace composites resin transfer molding (RTM) methodology to polymer infiltration. Vacuum conditioning removes air from delignified scaffold, low-viscosity UV-curable resin is injected at controlled pressure (1-5 bar), and rapid UV cure fixes the structure in 1-5 minutes.\n\nThis replaces passive capillary infiltration (hours) with active pressure-driven flow (minutes), dramatically improving the infiltration step that follows delignification.',
        why_it_works:
          "Darcy's law governs flow through porous media: Q ∝ ΔP × k / μL. Pressure-driven flow (ΔP = 1-5 bar) is orders of magnitude faster than capillary-driven flow. UV cure depth of 5-10mm per side enables rapid cycle times. Resin viscosity <500 mPa·s ensures nanopore penetration.",
        when_to_use_instead:
          'When infiltration is the bottleneck (delignification already optimized), or when UV-curable resin properties are preferred over thermal-cure epoxy',
        confidence: 78,
        validation_summary:
          '$5-15M investment, 12-18 months timeline. $20-35/ft² for infiltration step. Risk: optimizing resin rheology for nanopore filling.',
      },
    ],
  },

  innovation_portfolio: {
    intro:
      'Innovation concepts offer higher ceilings with higher uncertainty. These challenge fundamental assumptions about how transparent wood must be made. The recommended innovation—chromophore destruction—could eliminate delignification entirely if UV stability validates.',
    recommended_innovation: {
      id: 'innov-recommended',
      title: 'Chromophore Destruction via Ozone/Peracetic Acid Attack',
      what_it_is:
        "Instead of removing lignin, use highly oxidative chemistry (ozone, peracetic acid) to destroy all chromophoric structures in situ. Lignin's brown color comes from conjugated phenolic structures—quinones, stilbenes, coniferaldehyde end groups. Oxidative cleavage of these conjugated systems eliminates visible absorption without requiring lignin removal.\n\nThe lignin backbone remains intact, preserving cell wall structure. Processing time drops from hours to minutes because you're destroying milligrams of chromophores rather than removing grams of lignin. The paper industry uses this exact chemistry (ECF/TCF bleaching) at massive scale to achieve 90%+ brightness.\n\nIf this works, it obsoletes the entire delignification paradigm. No lignin removal means no black liquor waste stream, no chemical recovery infrastructure, and dramatically lower energy consumption.",
      why_it_works:
        'Ozone (O₃) undergoes 1,3-dipolar cycloaddition to aromatic rings, cleaving them to aldehydes and carboxylic acids. Peracetic acid (CH₃CO₃H) epoxidizes double bonds and oxidizes phenolic hydroxyl groups. Both destroy the conjugated π-systems responsible for visible light absorption.\n\nReaction rates with phenolics are extremely fast: k ~ 10³-10⁵ M⁻¹s⁻¹. Ozone consumption for bleaching is only 0.5-2% on wood basis—very low chemical consumption. The thermodynamic advantage is enormous: destroying a chromophore requires cleaving 2-4 bonds vs removing entire lignin macromolecule (thousands of bonds).',
      selection_rationale: {
        why_this_one:
          'Highest leverage paradigm insight. If chromophore destruction works, it obsoletes most current research direction. Worth prioritizing validation even at lower probability because success would be transformative. Fast, cheap validation (weeks, $10-30K) with asymmetric payoff.',
      },
      the_insight: {
        what: "Lignin's color comes from extended conjugation in specific structural motifs, not from lignin itself. Destroying conjugation eliminates color without mass removal.",
        where_we_found_it: {
          domain:
            'Paper Industry (ECF/TCF bleaching) + Water Treatment (ozonation)',
          how_they_use_it:
            'ECF/TCF bleaching achieves 90%+ brightness by destroying chromophores with ozone and peracetic acid. Water treatment uses ozone for organic destruction.',
          why_it_transfers:
            'Same chromophoric structures exist in wood lignin. Same oxidative chemistry applies. Paper industry proves it works at industrial scale.',
        },
        why_industry_missed_it:
          "The equation 'lignin = brown = must remove lignin' is so deeply embedded that researchers optimized removal efficiency rather than questioning whether removal was necessary. Gan et al. (2017) showed partial success with H₂O₂ bleaching, but aggressive oxidative bleaching hasn't been systematically tested.",
      },
      innovation_type: 'PARADIGM',
      confidence: 55,
      breakthrough_potential: {
        if_it_works:
          'Eliminates delignification step entirely. Processing time drops 10x. No black liquor waste stream. Chemical and energy inputs drop 80%+. Cost could reach $10-20/ft².',
        industry_impact:
          'Would redirect all transparent wood research away from delignification optimization. First-mover advantage of 5+ years as competitors rethink their approach.',
        estimated_improvement:
          '10x processing speed, 50%+ cost reduction, 80% lower environmental footprint (uncertainty: ±30%)',
      },
      risks: {
        physics_risks: [
          'Incomplete chromophore destruction leaves residual color',
          'UV-induced chromophore regeneration in service',
          'Cellulose damage at high oxidant levels',
        ],
        implementation_challenges: [
          'New chromophore formation from oxidation products during processing',
          'Optimizing ozone and peracetic acid concentrations for complete destruction',
        ],
        mitigation: [
          'Aggressive multi-stage treatment (ozone + peracetic acid + H₂O₂)',
          'Surface UV-blocking coating; accelerated weathering validation',
          'Process optimization for selectivity; paper industry achieves >90% color removal with <10% cellulose degradation',
        ],
      },
      validation_path: {
        gating_question:
          'Can aggressive oxidative bleaching achieve >70% transmittance while maintaining structural integrity and UV stability?',
        first_test:
          'Treat low-lignin poplar veneer (0.5-1mm) with ozone + peracetic acid at varying conditions. Measure transmittance, residual color, mechanical properties, and UV stability (accelerated weathering).',
        go_no_go:
          'GO: >70% transmittance with <20% strength loss and <10% yellowing after 500 hours UV exposure. NO-GO: <60% transmittance OR significant yellowing → proceed with delignification approaches.',
        cost: '$10-30K',
        timeline: '4-8 weeks',
      },
    },
    parallel_investigations: [
      {
        id: 'innov-parallel-1',
        title: 'Sol-Gel Silica Infiltration: Polymer-Free Transparent Wood',
        what_it_is:
          'Replace polymer infiltration entirely with sol-gel silica. Infiltrate delignified scaffold with tetraethyl orthosilicate (TEOS), trigger controlled hydrolysis and condensation to form silica network throughout scaffold. Result: transparent wood-silica composite with inherent UV stability, fire resistance, and low material cost.\n\nTEOS is low viscosity (excellent penetration), cheap ($2-5/kg vs $3-10/kg for polymers), and the resulting silica has tunable RI (1.46-1.55) that can match cellulose (1.53). Natural petrified wood proves silica-cellulose compatibility at geological timescales.',
        why_it_works:
          'Sol-gel chemistry: TEOS hydrolysis (Si(OC₂H₅)₄ + 4H₂O → Si(OH)₄ + 4C₂H₅OH) followed by condensation (2Si(OH)₄ → Si-O-Si network). Cellulose hydroxyl groups may participate in bonding. The cellulose scaffold templates silica deposition, potentially constraining shrinkage that normally causes cracking in bulk sol-gels.',
        the_insight: {
          what: 'Inorganic silica via sol-gel can achieve RI matching with inherent UV stability and fire resistance—properties polymer matrices cannot match',
          where_we_found_it: {
            domain: 'Geology + Ceramics',
            how_they_use_it:
              'Petrified wood demonstrates natural silica-cellulose compatibility. Tshabalala et al. (2007) demonstrated TEOS infiltration of wood structure using sol-gel processing.',
            why_it_transfers:
              'Same silica infiltration chemistry applies to delignified wood scaffolds.',
          },
          why_industry_missed_it:
            "Transparent wood community comes from materials science/wood science, not ceramics. The 'polymer infiltration' framing excluded inorganic options from consideration.",
        },
        innovation_type: 'PARADIGM',
        confidence: 45,
        key_uncertainty:
          "Controlling shrinkage during gelation/drying to prevent cracking. Silica gels shrink 20-50% during drying—the cellulose scaffold may constrain this, but it's uncertain.",
        ceiling:
          '$15-30/ft² production cost; unique value proposition for fire-rated glazing market',
        validation_approach: {
          test: 'TEOS sol-gel infiltration of delignified veneer. Optimize hydrolysis/condensation conditions. Measure transmittance, mechanical properties, crack formation.',
          go_no_go:
            'GO: >70% transmittance, crack-free samples. NO-GO: Pervasive cracking → shrinkage control is fundamental blocker.',
          cost: '$30-50K',
        },
        when_to_elevate:
          'If fire-rated glazing market emerges as priority application, or if polymer supply chain/sustainability concerns become dominant. Silica approach offers unique value proposition for these scenarios.',
      },
      {
        id: 'innov-parallel-2',
        title:
          'Low-Lignin Poplar + Aggressive H₂O₂ Bleaching (No Delignification)',
        what_it_is:
          'Use transgenic or naturally low-lignin poplar varieties (15-18% lignin vs 25-30% typical) with aggressive hydrogen peroxide bleaching to destroy chromophores without removing lignin. Skip the delignification step entirely.\n\nThis is a gentler version of the ozone/peracetic approach—H₂O₂ is less aggressive, potentially causing less cellulose damage, but may not achieve complete chromophore destruction.',
        why_it_works:
          'H₂O₂ under alkaline conditions generates HO₂⁻ and •OH radicals that attack conjugated phenolic structures, converting colored quinones to colorless alcohols. Low-lignin feedstock means fewer chromophores to destroy and gentler conditions required.',
        the_insight: {
          what: 'Low-lignin feedstock has 40-50% fewer chromophores to destroy, making bleaching-only approach more feasible',
          where_we_found_it: {
            domain: 'Transgenic plant research + transparent wood studies',
            how_they_use_it:
              'Pilate et al. (2002) demonstrated low-lignin transgenic poplar with 15-18% lignin. Gan et al. (2017) showed lignin modification achieves transparency.',
            why_it_transfers:
              'Same chromophore chemistry applies - fewer chromophores to destroy means gentler bleaching can achieve transparency.',
          },
          why_industry_missed_it:
            "Assumption that lignin must be removed is deeply embedded. Researchers haven't systematically combined low-lignin feedstock with aggressive bleaching.",
        },
        innovation_type: 'FIRST_PRINCIPLES',
        confidence: 50,
        key_uncertainty:
          'Maximum achievable transmittance with lignin retained; UV stability of bleached lignin; low-lignin feedstock availability at scale',
        ceiling: '$15-25/ft² production cost',
        validation_approach: {
          test: 'Process low-lignin poplar veneer (0.5mm) with H₂O₂ bleaching only (no delignification). Measure transmittance vs treatment intensity.',
          go_no_go:
            'GO: >75% transmittance achievable with bleaching alone. NO-GO: <65% transmittance → proceed with delignification approaches.',
          cost: '$10-20K',
        },
        when_to_elevate:
          'If ozone/peracetic approach shows cellulose damage concerns, or if low-lignin feedstock supply chain develops faster than expected. Gentler chemistry may be preferred for certain applications.',
      },
    ],
    frontier_watch: [
      {
        id: 'frontier-1',
        title: 'Enzymatic Delignification with Lignin Peroxidase Cocktails',
        one_liner:
          'White-rot fungi enzyme cocktails for ambient-temperature delignification—60-80% of work at 25-40°C with 50%+ chemical reduction',
        why_interesting:
          'Most sustainable delignification pathway. Ambient temperature processing eliminates heating energy. Enzymes are biodegradable catalysts. Lignin fragments may be higher quality for valorization. Could be integrated as pre-treatment zone in continuous tunnel.',
        why_not_now:
          'Process time still 2-8 hours even with enzymes. Enzyme cost ($10-50/kg protein) adds $3-8/ft². Scale-up of enzyme application to thin veneer not demonstrated. Enzyme immobilization for continuous use needs development.',
        innovation_type: 'EMERGING_SCIENCE',
        trl_estimate: 4,
        earliest_viability: '3-5 years',
        trigger_to_revisit:
          'Enzyme cost drops below $5/kg protein, OR continuous enzyme immobilization demonstrated at pilot scale, OR carbon pricing makes energy-intensive alternatives uncompetitive',
        who_to_monitor:
          'Novozymes (enzyme production leader), DSM (industrial enzymes), VTT Finland (bioprocess expertise), USDA Forest Products Lab (biopulping research)',
        recent_developments:
          'Novozymes announced 2024 expansion of industrial enzyme capacity. VTT published 2023 results on laccase-mediated lignin modification achieving 60% delignification at ambient temperature. USDA FPL continuing biopulping research with focus on enzyme recycling.',
        competitive_activity:
          'Novozymes and DSM both have enzyme products for pulp/paper. No specific transparent wood applications announced, but enzyme cocktails are commercially available.',
      },
      {
        id: 'frontier-2',
        title: 'Deep Eutectic Solvents (DES) for Green Delignification',
        one_liner:
          'Deep eutectic solvents achieve 80% lignin removal at 80°C—low-cost, recyclable, already demonstrated for transparent wood',
        why_interesting:
          'Greener chemistry than NaOH/Na₂SO₃. Solvent is recyclable (closed-loop). Higher-quality lignin co-product. Compatible with continuous processing. Already demonstrated for transparent wood specifically.',
        why_not_now:
          'Processing time still 6 hours—too long for economics. Solvent recovery at scale not fully proven. DES viscosity may limit penetration rate. Cost-effectiveness vs optimized aqueous chemistry unclear.',
        innovation_type: 'EMERGING_SCIENCE',
        trl_estimate: 5,
        earliest_viability: '2-3 years',
        trigger_to_revisit:
          'DES processing time reduced to <2 hours, OR solvent recovery demonstrated at >99% efficiency at pilot scale, OR DES cost drops below $10/kg',
        who_to_monitor:
          'KTH Stockholm (Berglund lab), University of Helsinki (DES research), Circa Group (commercial DES production), Chen et al. research group',
        recent_developments:
          'Chen et al. 2020 Nature Communications paper demonstrated DES transparent wood. Circa Group announced 2024 commercial DES production facility. Multiple academic groups publishing on DES optimization for wood processing.',
        competitive_activity:
          'KTH has patents on DES transparent wood. Circa Group commercializing DES for various applications. Academic competition intensifying.',
      },
    ],
  },

  risks_and_watchouts: [
    {
      risk: 'UV stability of lignin-retaining approaches is unvalidated—chromophores may regenerate under light exposure',
      category: 'Technical',
      severity: 'high',
      mitigation:
        'Prioritize UV stability testing in validation sequence; develop surface coating backup if bulk stability fails',
    },
    {
      risk: 'Regulatory pathway for novel building materials (fire testing, structural certification) could add 2-5 years to commercialization',
      category: 'Market',
      severity: 'high',
      mitigation:
        'Engage with building code officials early; pursue fire-rated applications where sol-gel silica approach provides advantage',
    },
    {
      risk: 'Wet veneer handling at production speeds—paper industry handles pulp, not intact sheets',
      category: 'Technical',
      severity: 'medium',
      mitigation:
        'Adapt tension control and support systems from textile industry; prototype handling system before full line investment',
    },
    {
      risk: 'Low-lignin poplar supply chain is unproven at commercial scale',
      category: 'Resource',
      severity: 'medium',
      mitigation:
        'Develop relationships with forestry companies; evaluate standard species with optimized processing as backup',
    },
    {
      risk: "Market acceptance of laminated vs monolithic transparent wood is unknown—'authenticity' narrative may matter",
      category: 'Market',
      severity: 'low',
      mitigation:
        'Develop both monolithic (thick veneer) and laminated options; let market determine preference',
    },
    {
      risk: 'Optical bonding at 2-3m² scale may have lower yield than display-scale applications',
      category: 'Technical',
      severity: 'medium',
      mitigation:
        'Develop QC protocols for large-area bonding; accept some yield loss in early production',
    },
  ],

  self_critique: {
    overall_confidence: 'medium',
    confidence_rationale:
      'High confidence in continuous veneer processing (proven technology transfer), but significant uncertainty around UV stability of lignin-retaining approaches and market acceptance at target price points.',
    what_we_might_be_wrong_about: [
      'UV stability of bleached lignin may be fundamentally problematic—chromophore regeneration could be unavoidable',
      'Wet veneer handling may be harder than paper pulp handling—intact sheet integrity requirements are different',
      'Market may require <$30/ft² for mainstream adoption, making only the most aggressive approaches viable',
      "Laminated construction may have optical artifacts visible in large panels that we're not anticipating",
      'Regulatory pathway may be longer than 2-3 years, especially for structural applications',
    ],
    validation_gaps: [
      {
        concern:
          'UV stability of bleached lignin may be fundamentally problematic',
        status: 'ADDRESSED',
        rationale:
          'Chromophore destruction validation includes UV stability testing (500 hours accelerated weathering) as explicit go/no-go criterion',
      },
      {
        concern: 'Wet veneer handling may be harder than paper pulp handling',
        status: 'EXTENDED_NEEDED',
        rationale:
          'Continuous tunnel validation should include explicit handling damage assessment; add textile industry consultation to de-risk',
      },
      {
        concern: 'Market may require <$30/ft² for mainstream adoption',
        status: 'ACCEPTED_RISK',
        rationale:
          'Current validation targets $25-40/ft²; if market requires lower, chromophore destruction or parchmentizing approaches become necessary. Early premium markets may accept higher prices.',
      },
      {
        concern: 'Laminated construction may have optical artifacts',
        status: 'EXTENDED_NEEDED',
        rationale:
          'Add large-panel (1m²+) optical bonding trials with viewing angle assessment before committing to laminated architecture',
      },
    ],
    unexplored_directions: [
      'Microwave-assisted delignification (5-10x acceleration reported in literature, but equipment complexity concerns)',
      'Parchmentizing approach (cellulose self-transparency via acid gelatinization)—very high risk but transformative if it works',
      'Hybrid structures (transparent wood skin on conventional core) for cost reduction in non-optical applications',
    ],
  },

  what_id_actually_do:
    "If this were my project, I'd run three parallel tracks with staged gates.\n\nFirst, I'd spend $10-30K over 6 weeks validating chromophore destruction. Get some low-lignin poplar veneer, hit it with ozone and peracetic acid at varying conditions, and measure transmittance and UV stability. This is the highest-leverage experiment—if it works, it changes everything. If chromophores regenerate under UV, we know to focus on delignification approaches.\n\nSecond, I'd start engineering the continuous veneer tunnel in parallel. This is the safe bet that works regardless of chromophore destruction results. Partner with a paper industry equipment supplier (Valmet, Voith) who already knows continuous chemical treatment. Build a lab-scale continuous belt reactor to prove the concept. The paper industry has solved this problem—we're adapting, not inventing.\n\nThird, I'd get samples to a contract lab for optical bonding trials at larger scale. The display industry does this routinely, but we need to prove it works at 2-3m² with wood substrates. This de-risks the lamination approach that enables any final thickness.\n\nThe key insight is that thin veneer is the unlock for everything. Whether you're doing delignification or chromophore destruction, diffusion physics means thin material processes 100x faster. Start there and the rest follows.\n\nI'd also start the regulatory conversation early. Building materials certification is slow. Get samples to fire testing labs, talk to code officials, understand the pathway. This could be the longest lead-time item.",

  follow_up_prompts: [
    'Create a detailed 18-month development plan with milestones and decision gates',
    'Help me design the chromophore destruction validation experiment in detail',
    'What should I ask paper industry equipment suppliers about adapting Kamyr digesters for veneer?',
    'Compare the regulatory pathways for transparent wood in US, EU, and Asia markets',
    'What are the best low-lignin wood species available commercially, and who supplies them?',
  ],
};
