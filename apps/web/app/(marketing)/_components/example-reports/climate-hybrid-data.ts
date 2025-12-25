import type { HybridReportData } from '~/home/(user)/reports/_lib/types/hybrid-report-display.types';

/**
 * Climate Tech Hybrid Report Example Data
 * Source: composite_example_json from GitHub
 */
export const CLIMATE_HYBRID_REPORT: HybridReportData = {
  title: 'Recyclable High-Performance Composites: Repurposing Polyurethane Glycolysis at Industrial Scale',
  brief:
    "Carbon fiber reinforced thermosets dominate aerospace and automotive lightweighting, but end-of-life is landfill or energy-intensive pyrolysis that destroys the fiber. Thermoplastic composites are recyclable but can't match thermoset performance at high temperatures and lack creep resistance. Industry produces 500K+ tons of composite waste annually, growing rapidly. Need composite system with thermoset-like performance (Tg >180°C, creep resistance, processability) that can be chemically or thermally recycled to recover fibers at >90% property retention. Must work with existing manufacturing processes (autoclave, RTM, filament winding).",

  executive_summary: {
    narrative_lead:
      "The composite recycling problem has been framed as a materials chemistry challenge, but the real breakthrough lies in recognizing that industrial glycolysis infrastructure already exists at scale—BASF and others process millions of tons of polyurethane annually using the exact transesterification chemistry needed for polyester thermoset recycling. By designing an aromatic polyester matrix optimized for aerospace Tg rather than the historical boat-hull applications that gave polyesters a 'low-performance' reputation, we can achieve Tg >180°C with a recycling pathway that recovers both fiber AND monomer feedstock using proven industrial equipment.",
    primary_recommendation:
      'Pursue glycolyzable aromatic polyester thermoset development as primary path, with locked-catalyst vitrimer as parallel track. Investment of $3-8M over 3-4 years to aerospace qualification. Begin with formulation screening for Tg vs. processability tradeoff, validate glycolysis kinetics on cured samples within 6 months.',
    viability: 'uncertain',
  },

  problem_analysis: {
    whats_wrong: {
      prose:
        'Composite manufacturers face a growing waste crisis with no good options. Pyrolysis destroys 10-30% of fiber value through thermal damage and burns the matrix entirely—$15-30 MJ/kg of energy input to produce degraded fiber and zero chemical recovery. Landfilling wastes $20-40/kg fiber and faces increasing regulatory prohibition. The industry has accepted this as the cost of thermoset performance, but 500K+ tons annually represents billions in stranded value.',
    },
    current_state_of_art: {
      benchmarks: [
        {
          entity: 'Mallinda Inc.',
          approach: 'Vinylogous urethane vitrimer composites',
          current_performance:
            'Tg up to 200°C demonstrated; in aerospace qualification',
          target_roadmap: 'Full aerospace certification by 2026',
          source: 'US Patent 10,723,847; company announcements',
        },
        {
          entity: 'Connora/Aditya Birla (Recyclamine)',
          approach: 'Acid-cleavable amine hardeners for epoxy',
          current_performance:
            'Tg ~150°C maximum; >95% fiber recovery demonstrated',
          target_roadmap: 'Targeting higher Tg formulations',
          source: 'Garcia et al. Science 2014; technical data sheets',
        },
        {
          entity: 'Adherent Technologies',
          approach: 'Proprietary solvolysis process',
          current_performance:
            '>95% fiber property retention; 2-6 hour processing',
          target_roadmap: 'Expanding capacity for aerospace scrap',
          source: 'Company technical bulletins',
        },
        {
          entity: 'Boeing',
          approach: 'Subcritical/supercritical fluid solvolysis',
          current_performance:
            '>90% fiber retention demonstrated at pilot scale',
          target_roadmap: 'Integration with manufacturing waste streams',
          source: 'US Patent 8,747,676',
        },
      ],
    },
    what_industry_does_today: [
      {
        approach: 'Pyrolysis at 500-700°C in inert atmosphere',
        limitation:
          '10-30% fiber strength loss, complete matrix destruction, high energy cost (15-30 MJ/kg)',
      },
      {
        approach:
          'Solvolysis with aggressive solvents (supercritical fluids, strong acids)',
        limitation:
          'Hours to days processing time, solvent recovery adds cost, limited to specific chemistries',
      },
      {
        approach: 'Mechanical grinding to filler',
        limitation:
          'Destroys fiber length and value; only suitable for low-value applications',
      },
      {
        approach: 'Thermoplastic composites (PEEK, PEKK)',
        limitation:
          'Processing >350°C damages sizing, limited creep resistance, 3-5x material cost',
      },
    ],
    why_its_hard: {
      prose:
        "The fundamental challenge is that the same crosslink density providing high Tg and creep resistance also makes the network resistant to dissolution. Thermoset networks are designed to be permanent—that's the point. Any bond labile enough for easy recycling is potentially labile during service. This creates an apparent tradeoff: either accept lower Tg (vitrimers with exchange reactions) or accept harsh recycling conditions (pyrolysis, aggressive solvolysis).",
      governing_equation: {
        equation: 'Tg ≈ Tg∞ - K/ρx where ρx = crosslink density',
        explanation:
          'Glass transition temperature increases with crosslink density. High Tg requires dense, permanent networks—exactly what resists dissolution.',
      },
    },
    first_principles_insight: {
      headline:
        "The recycling trigger must be orthogonal to service conditions—not just 'harder to activate' but chemically impossible to activate during service.",
      explanation:
        'Vitrimers fail this test because exchange reactions that enable recycling also enable creep under sustained load. Thermal triggers (Diels-Alder) fail because retro-reaction temperature overlaps service temperature. The solution is a chemical trigger (pH, electrochemistry, specific reagent) that cannot occur during normal service but is easily applied during recycling.',
    },
  },

  constraints_and_metrics: {
    hard_constraints: [
      'Tg >180°C (dry) - aerospace thermal soak requirement',
      'Fiber tensile strength retention >90% after recycling',
      'Compatible with carbon fiber sizing (epoxy-compatible standard sizing)',
      'No regulatory-prohibited substances (REACH, TSCA compliant)',
    ],
    soft_constraints: [
      'Existing manufacturing process compatibility (autoclave, RTM, filament winding) - minor parameter adjustments acceptable',
      'Recycling energy <50% of pyrolysis baseline - target, not absolute',
      'Creep resistance matching current epoxy systems - quantified testing required',
      'Matrix cost within 2x of aerospace epoxy - premium acceptable for recyclability',
    ],
    assumptions: [
      'Dry Tg specification (wet Tg 20-40°C lower is acceptable)',
      'Mixed waste stream (carbon + glass fiber, various sources)',
      'Manufacturing scrap is primary initial target (clean, known composition)',
      'Fiber sizing may need reapplication after recycling (acceptable)',
    ],
    success_metrics: [
      {
        metric: 'Glass transition temperature (dry)',
        target: '>200°C',
        minimum_viable: '>180°C',
        stretch: '>220°C',
        unit: '°C by DMA',
      },
      {
        metric: 'Fiber tensile strength retention',
        target: '>95%',
        minimum_viable: '>90%',
        stretch: '>98%',
        unit: '% of virgin fiber',
      },
      {
        metric: 'Recycling energy consumption',
        target: '<5 MJ/kg',
        minimum_viable: '<10 MJ/kg',
        stretch: '<3 MJ/kg',
        unit: 'MJ/kg fiber recovered',
      },
      {
        metric: 'Recycling cycle time',
        target: '<4 hours',
        minimum_viable: '<8 hours',
        stretch: '<2 hours',
        unit: 'hours for complete matrix dissolution',
      },
      {
        metric: 'Monomer recovery rate',
        target: '>80%',
        minimum_viable: '>60%',
        stretch: '>90%',
        unit: '% of theoretical monomer yield',
      },
    ],
  },

  challenge_the_frame: [
    {
      assumption: 'Tg >180°C is a hard requirement',
      challenge:
        'Many aerospace applications have lower actual service temperatures. The Tg spec may include safety margin that could be traded for recyclability.',
      implication:
        'If Tg 150-160°C is acceptable for some applications, Recyclamine-type chemistry (already commercial) becomes viable. Segment the market rather than seeking universal solution.',
    },
    {
      assumption: 'Existing manufacturing processes cannot be modified',
      challenge:
        'If recyclability provides sufficient value, manufacturers may accept process modifications. The constraint may be softer than stated.',
      implication:
        'Opens inorganic matrix approaches (CAC, geopolymer) if processing innovation is acceptable. Also enables novel cure cycles for catechol-metal systems.',
    },
    {
      assumption: 'Fiber recovery is the primary value driver',
      challenge:
        'For some waste streams, composite-level recycling (reshaping entire part) may be more valuable than fiber recovery. Vitrimer thermoforming enables this.',
      implication:
        'Vitrimer approach becomes more attractive if reshaping value exceeds fiber recovery value. Different solution for different waste streams.',
    },
    {
      assumption: 'Chemical recycling must be centralized',
      challenge:
        'If recycling conditions are mild enough (room temperature, dilute acid), distributed recycling becomes possible. This changes the economics entirely.',
      implication:
        'Catechol-metal approach with room-temperature acid dissolution could enable regional or on-site recycling, dramatically expanding addressable market.',
    },
  ],

  innovation_analysis: {
    domains_searched: [
      'Polyurethane glycolysis infrastructure',
      'Mussel byssus metal-coordination chemistry',
      'Electrochemistry of disulfide bonds',
      'Thermophilic protein stability mechanisms',
      'Polybenzoxazine Mannich bridge chemistry',
      'Calcium aluminate cement dissolution',
      'Fiber sizing as interface engineering',
    ],
    reframe:
      "Instead of asking 'how do we make thermosets recyclable?' we asked 'what industrial-scale chemical recycling already exists and how do we design a thermoset to fit it?'",
  },

  execution_track: {
    intro:
      'Solution concepts use proven technologies requiring integration, not invention. The glycolyzable polyester approach leverages 40+ years of industrial transesterification chemistry and existing recycling infrastructure. Start here for lowest risk and fastest path to qualification.',
    primary: {
      id: 'sol-primary',
      title: 'Glycolyzable Aromatic Polyester Thermoset',
      confidence: 78,
      bottom_line:
        'Design a thermoset matrix using aromatic diacids (isophthalic acid, 2,6-naphthalenedicarboxylic acid) and rigid diols (isosorbide, tricyclodecanedimethanol) with high crosslink density achieved through multifunctional monomers.',
      expected_improvement:
        'Recycling cost $2-5/kg fiber recovered, plus $1-3/kg oligomer value',
      timeline: '3-4 years to aerospace qualification',
      investment: '$3-8M',
      the_insight: {
        what: 'Transesterification with excess glycol fragments any ester-containing network into soluble oligomers under conditions mild enough to preserve carbon fiber properties',
        where_we_found_it: {
          domain: 'Industrial polyurethane recycling',
          how_they_use_it:
            'BASF and others glycolyze PU foam at 180-220°C to recover polyol feedstock for new foam production',
          why_it_transfers:
            'The chemistry is identical—nucleophilic attack of glycol hydroxyl on ester/urethane carbonyl. Aromatic polyesters require slightly higher temperature but same mechanism.',
        },
        why_industry_missed_it:
          "Polyester thermosets were abandoned for aerospace in the 1970s-80s due to inferior properties vs. epoxy. The recycling advantage wasn't valued then, and the 'polyester = low performance' reputation persisted even as aromatic polyester chemistry (PEN, LCP) demonstrated high-performance capability.",
      },
      what_it_is:
        'Design a thermoset matrix using aromatic diacids (isophthalic acid, 2,6-naphthalenedicarboxylic acid) and rigid diols (isosorbide, tricyclodecanedimethanol) with high crosslink density achieved through multifunctional monomers (trimellitic anhydride, glycerol). The aromatic backbone provides Tg >180°C while ester linkages throughout the network enable glycolysis recycling.\n\nDuring service, the hydrophobic aromatic matrix limits water access to ester bonds—uncatalyzed hydrolysis rate is ~10^-10 s^-1, meaning effectively zero degradation over 20-year service life. For recycling, immersion in excess ethylene glycol at 180-200°C with transesterification catalyst (zinc acetate at 0.1-0.5 wt%, titanium isopropoxide) drives ester exchange, fragmenting the network into soluble oligomers within 2-4 hours.',
      why_it_works:
        'Transesterification equilibrium is driven by glycol concentration. At 10-100x molar excess of ethylene glycol, the equilibrium strongly favors network fragmentation into glycol-terminated oligomers. The reaction proceeds through nucleophilic attack of glycol hydroxyl on ester carbonyl, catalyzed by Lewis acid coordination to carbonyl oxygen.\n\nCritically, the same reaction is negligibly slow at service conditions. Without catalyst and excess glycol, ester hydrolysis at neutral pH and 80°C has a half-life of centuries. The trigger is truly orthogonal—you cannot accidentally glycolyze your wing spar.',
      why_it_might_fail: [
        'Achieving Tg >180°C while maintaining processable viscosity for RTM',
        'Glycolysis rate may be slower for highly aromatic networks than for PU',
        'Fiber-matrix adhesion with polyester matrix may differ from epoxy baseline',
      ],
      validation_gates: [
        {
          week: '8-12',
          test: 'Synthesize model aromatic polyester network; measure Tg and glycolysis kinetics',
          method:
            'DSC/DMA for Tg (ASTM E1640); GPC for molecular weight after glycolysis; gravimetric for dissolution rate',
          success_criteria:
            'Tg >180°C AND complete network dissolution in <4 hours at 200°C with 0.5 wt% zinc acetate catalyst',
          cost: '$30-50K',
          decision_point:
            'Tg <160°C OR dissolution time >12 hours → reformulate with higher aromatic content or different crosslinker',
        },
      ],
    },
    supporting_concepts: [
      {
        id: 'sol-support-1',
        title: 'Toughened Polybenzoxazine with Acid-Cleavable Mannich Bridges',
        relationship: 'FALLBACK',
        one_liner:
          'Polybenzoxazines achieve Tg >250°C through ring-opening polymerization with acid-labile Mannich bridges',
        confidence: 68,
        what_it_is:
          'Polybenzoxazines achieve Tg >250°C through ring-opening polymerization of benzoxazine monomers, forming a network of phenolic-amine Mannich base linkages.',
        why_it_works:
          'Under acidic conditions (pH <4), the tertiary amine of the Mannich bridge is protonated, making the methylene carbon electrophilic. Water attacks this carbon, cleaving the C-N bond.',
        when_to_use_instead:
          'If polyester Tg/viscosity tradeoff proves intractable, or if even higher Tg (>220°C) is required.',
      },
      {
        id: 'sol-support-2',
        title: 'Vinylogous Urethane Vitrimer with Locked Catalyst',
        relationship: 'COMPLEMENTARY',
        one_liner:
          'Mallinda-type vinylogous urethane chemistry with catalyst encapsulation for creep control',
        confidence: 72,
        what_it_is:
          'Adopt Mallinda-type vinylogous urethane chemistry which has demonstrated Tg up to 200°C in aerospace qualification programs. Address the creep concern through catalyst encapsulation.',
        why_it_works:
          'Vinylogous urethane exchange proceeds through transamination, catalyzed by free amine or Lewis acid. Without catalyst, activation energy is ~100 kJ/mol and exchange half-life at 180°C is years.',
        when_to_use_instead:
          'If chemical recycling (glycolysis, acid dissolution) is undesirable due to solvent handling or infrastructure requirements.',
      },
    ],
  },

  innovation_portfolio: {
    intro:
      'Innovation concepts offer higher ceilings with higher uncertainty. The catechol-metal coordination approach provides a truly orthogonal pH trigger that cannot be accidentally activated during service—a significant advantage over thermal triggers that overlap with service conditions.',
    recommended_innovation: {
      id: 'innov-recommended',
      title:
        'Catechol-Aluminum Coordination Network with Rigid Polybenzoxazine Backbone',
      confidence: 52,
      innovation_type: 'CROSS_DOMAIN',
      source_domain: 'Mussel byssus biology',
      the_insight: {
        what: 'Metal-coordination bonds can achieve near-covalent mechanical strength while remaining pH-reversible',
        where_we_found_it: {
          domain: 'Mussel byssus biology',
          how_they_use_it:
            'Mussels use Fe3+-catechol coordination to create byssal threads with remarkable toughness and self-healing capability. The bonds are strong enough for structural function but can be remodeled.',
          why_it_transfers:
            'The same coordination chemistry works with synthetic catechol-containing polymers. Al3+ provides similar binding strength to Fe3+ with less color (brown vs. purple).',
        },
        why_industry_missed_it:
          'Catechol-metal research focused on self-healing and underwater adhesion—applications where lower Tg is acceptable. Combining with high-Tg polybenzoxazine backbone for aerospace applications is novel.',
      },
      what_it_is:
        'Combine catechol-metal coordination chemistry—inspired by mussel byssus threads—with a high-Tg polybenzoxazine backbone. Synthesize benzoxazine monomers with pendant catechol groups (dopamine-benzoxazine or caffeic acid-benzoxazine).\n\nFor recycling, immersion in 0.1M HCl at room temperature protonates catechol groups, releasing Al3+ and fragmenting the network. The recycling conditions are remarkably mild: room temperature, dilute food-grade acid, complete dissolution in hours.',
      why_it_works:
        'Catechol (1,2-benzenediol) forms a bidentate chelate with Al3+ through both oxygen atoms. At neutral pH, catechol is deprotonated and binding is extremely strong—log K ~37 for the tris complex. At pH <4, protonation competes with metal binding; at pH <2, catechol is fully protonated and Al3+ is released.',
      breakthrough_potential: {
        if_it_works:
          'Room-temperature recycling of aerospace-grade composites using dilute food-grade acid. Complete orthogonality between service conditions and recycling trigger.',
        estimated_improvement:
          'Recycling energy <1 MJ/kg (vs. 15-30 MJ/kg for pyrolysis). Recycling at 25°C vs. 500-700°C.',
        industry_impact:
          'Could enable distributed recycling infrastructure—any facility with acid handling capability could process composites.',
      },
      risks: {
        physics_risks: [
          'Catechol oxidation during high-temperature cure (>200°C) destroys functionality',
          'Custom monomer synthesis may be difficult to scale economically',
          'Metal crosslink density may be difficult to control uniformly',
        ],
        implementation_challenges: [],
        mitigation: [
          'Inert atmosphere cure; add antioxidant (ascorbic acid, phosphite stabilizers)',
          'Partner with specialty chemical company; explore bio-based catechol sources',
          'Optimize Al3+ diffusion during post-cure treatment',
        ],
      },
      validation_path: {
        gating_question:
          'Can catechol-functionalized benzoxazine be synthesized and cured without oxidative degradation?',
        first_test:
          'Synthesize dopamine-benzoxazine model compound; cure under nitrogen; characterize catechol integrity by UV-Vis and FTIR; measure Tg; test pH-triggered dissolution',
        cost: '$40-60K',
        timeline: '12-16 weeks',
        go_no_go:
          'Catechol peak retention >80% after cure AND Tg >160°C AND dissolution in 0.1M HCl within 4 hours → proceed.',
      },
    },
    parallel_investigations: [
      {
        id: 'innov-parallel-1',
        title:
          'Electrochemical Disulfide Cleavage Using Carbon Fiber as Electrode',
        confidence: 45,
        innovation_type: 'CROSS_DOMAIN',
        source_domain:
          'Electrochemistry literature on disulfide reduction; carbon fiber electrode applications',
        one_liner:
          'Carbon fiber conductivity enables in-situ electrochemical triggering of bond cleavage',
        the_insight: {
          what: 'Carbon fiber conductivity enables in-situ electrochemical triggering of bond cleavage',
          where_we_found_it: {
            domain:
              'Electrochemistry literature on disulfide reduction; carbon fiber electrode applications in fuel cells and batteries',
            how_they_use_it: '',
            why_it_transfers: '',
          },
          why_industry_missed_it:
            "Composite recycling and electrochemistry communities haven't intersected. Carbon fiber conductivity is typically viewed as a problem, not an opportunity.",
        },
        ceiling:
          'Extremely low recycling cost—electricity + salt water. Potentially <$1/kg fiber if electrolyte penetration challenge solved.',
        key_uncertainty:
          'Electrolyte penetration into dense crosslinked matrix. May require pre-swelling or surface damage to enable ion transport.',
        validation_approach: {
          test: 'Synthesize disulfide-containing epoxy film on carbon fiber electrode; measure electrochemical reduction current and network fragmentation',
          cost: '$25-40K',
          timeline: '8-12 weeks',
          go_no_go:
            'Measurable reduction current AND network fragmentation observed → proceed. No reduction current OR electrolyte cannot penetrate → reject approach.',
        },
        when_to_elevate:
          'If electrolyte penetration can be achieved through matrix design (hydrophilic channels, swellable domains) or pre-treatment.',
      },
    ],
    frontier_watch: [
      {
        id: 'frontier-1',
        title: 'Inorganic Calcium Aluminate Matrix with Polymer Toughening',
        innovation_type: 'PARADIGM',
        one_liner:
          'Replace organic polymer matrix entirely with calcium aluminate cement modified for composite processing',
        why_interesting:
          'Eliminates the fundamental polymer physics tradeoff. No Tg, no creep, no thermal degradation. Acid dissolution is proven chemistry.',
        why_not_now:
          'Processing is completely incompatible with existing infrastructure—cannot use autoclave, RTM, or filament winding. Fiber-cement interface chemistry is underdeveloped.',
        trigger_to_revisit:
          'Publication demonstrating carbon fiber-CAC composite with interfacial shear strength >40 MPa',
        who_to_monitor:
          'Dr. Karen Scrivener (EPFL), Dr. Joseph Davidovits (Geopolymer Institute), Kerneos (Imerys)',
        earliest_viability: '5-7 years',
        trl_estimate: 2,
        competitive_activity:
          'Limited direct activity. Academic groups exploring geopolymer composites for construction, not aerospace.',
      },
      {
        id: 'frontier-2',
        title:
          'Enzyme-Cleavable Ester Crosslinks with Surface Erosion Recycling',
        innovation_type: 'EMERGING_SCIENCE',
        one_liner:
          'Incorporate aliphatic ester crosslinks cleavable by lipase enzymes',
        why_interesting:
          'Ultimately mild recycling conditions—aqueous buffer at 30-50°C with biodegradable enzyme catalyst. No hazardous chemicals.',
        why_not_now:
          'Recycling timescale is impractical—surface erosion at 1-10 μm/day means weeks to months for mm-thick composites.',
        trigger_to_revisit:
          'Publication demonstrating enzyme degradation rate >100 μm/day in crosslinked thermoset',
        who_to_monitor:
          'Prof. Kristi Anseth (CU Boulder), Prof. Jeffrey Hubbell (U Chicago), Novozymes',
        earliest_viability: '7-10 years',
        trl_estimate: 1,
        competitive_activity:
          'Academic research only. No commercial development for structural composites.',
      },
    ],
  },

  risks_and_watchouts: [
    {
      category: 'Technical',
      risk: 'Achieving Tg >180°C with processable viscosity in aromatic polyester system',
      severity: 'high',
      mitigation:
        'Screen reactive diluents; optimize monomer ratios; consider prepreg route if RTM infusion problematic',
    },
    {
      category: 'Technical',
      risk: 'Fiber-matrix adhesion with non-epoxy matrices may require sizing reformulation',
      severity: 'medium',
      mitigation:
        'Engage fiber manufacturer early; validate interfacial shear strength with candidate sizings',
    },
    {
      category: 'Market',
      risk: 'Aerospace qualification timeline (3-5 years) may exceed investor patience',
      severity: 'medium',
      mitigation:
        'Target manufacturing scrap recycling first (lower qualification barrier); automotive applications as parallel market',
    },
    {
      category: 'Regulatory',
      risk: 'Novel chemistries may face extended regulatory review for aerospace certification',
      severity: 'medium',
      mitigation:
        'Engage certification bodies early; document chemistry similarity to approved materials',
    },
    {
      category: 'Resource',
      risk: 'Specialty monomer supply chain may be fragile for novel chemistries',
      severity: 'low',
      mitigation:
        'Identify multiple suppliers; consider backward integration for critical monomers',
    },
    {
      category: 'Technical',
      risk: 'Glycolysis kinetics for highly aromatic polyester networks may be slower than PU baseline',
      severity: 'medium',
      mitigation:
        'Early kinetic studies on model compounds; optimize catalyst loading; accept longer cycle time if fiber quality maintained',
    },
  ],

  self_critique: {
    confidence_level: 'medium',
    overall_confidence: 'medium',
    confidence_rationale:
      'High confidence in chemistry feasibility; moderate uncertainty in formulation optimization and qualification timeline; low confidence in cost projections until pilot scale.',
    what_we_might_be_wrong_about: [
      'Aromatic polyester viscosity may be fundamentally incompatible with RTM infusion, forcing prepreg-only route',
      'Glycolysis kinetics for highly aromatic networks may be much slower than PU baseline, requiring uneconomic cycle times',
      'Fiber-matrix adhesion with polyester sizing may be significantly inferior to epoxy baseline',
      'Vitrimer capsule stability over 20-year service life is completely unproven',
      'Catechol oxidation during cure may be more severe than anticipated',
    ],
    unexplored_directions: [
      'Supramolecular crosslinks (UPy, salt bridges) for higher Tg than current H-bonded systems',
      'Cleavable fiber sizing as primary recycling mechanism—could retrofit recyclability onto existing thermosets',
      'Photocleavable crosslinks with near-IR triggers for better penetration',
      'Hybrid organic-inorganic matrices (sol-gel, POSS) that might bridge polymer and ceramic properties',
    ],
    validation_gaps: [
      {
        concern: 'Aromatic polyester viscosity may be incompatible with RTM',
        status: 'ADDRESSED',
        rationale:
          'First validation step includes viscosity measurement; reactive diluent screening planned; prepreg fallback identified',
      },
      {
        concern: 'Glycolysis kinetics may be slower than PU baseline',
        status: 'ADDRESSED',
        rationale:
          'First validation step includes kinetics measurement; catalyst optimization planned',
      },
      {
        concern: 'Fiber-matrix adhesion with polyester sizing',
        status: 'EXTENDED_NEEDED',
        rationale:
          'Should add interfacial shear strength testing to validation protocol; engage fiber manufacturer for sizing compatibility',
      },
      {
        concern: 'Vitrimer capsule 20-year stability',
        status: 'ACCEPTED_RISK',
        rationale:
          'Cannot fully validate before proceeding; plan accelerated aging studies but accept residual uncertainty',
      },
      {
        concern: 'Catechol oxidation during cure',
        status: 'ADDRESSED',
        rationale:
          'First validation step specifically measures catechol retention after cure; go/no-go criteria defined',
      },
    ],
  },

  what_id_actually_do:
    "If this were my project, I'd start with the glycolyzable aromatic polyester—not because it's the most innovative, but because it has the clearest path to success. The chemistry is proven at industrial scale for PU recycling, the monomers are commercial, and we're essentially asking 'can we make a high-Tg version of something that already works?' That's a formulation optimization problem, not a science problem.\n\nI'd run the polyester and vitrimer tracks in parallel for the first 12 months. The vitrimer has Mallinda as a reference point showing aerospace Tg is achievable, and the locked-catalyst concept addresses the creep concern that's been the main industry objection. If either track hits a wall, I have a fallback.\n\nThe catechol-metal approach is genuinely exciting—room-temperature recycling with dilute acid would be transformative—but I'd keep it as a longer-term bet. The custom monomer synthesis and oxidation sensitivity add risk that I wouldn't want on the critical path. Fund it at 20% of the portfolio and let it mature while the polyester track de-risks the business case.\n\nOne thing I'd do differently than most: I'd engage a fiber manufacturer (Toray, Hexcel, Toho Tenax) from day one. The fiber-matrix interface is going to matter, and having sizing compatibility validated early avoids a nasty surprise at composite scale. Plus, they have the most to gain from a recyclable composite—their fiber currently goes to landfill at end of life.",

  follow_up_prompts: [
    'Create a detailed 18-month development plan for the glycolyzable aromatic polyester approach with milestones and decision gates',
    'Help me design the first composite-scale validation experiment after model compound screening',
    'Compare the total cost of ownership for glycolysis vs. vitrimer thermoforming recycling at 1000 ton/year scale',
    'What should I ask Toray or Hexcel about polyester-compatible carbon fiber sizing?',
    'Draft a technology licensing term sheet for approaching Mallinda about vitrimer collaboration',
  ],
};
