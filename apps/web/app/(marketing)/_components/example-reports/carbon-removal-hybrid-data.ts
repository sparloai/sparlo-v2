import type { HybridReportData } from '~/home/(user)/reports/_lib/types/hybrid-report-display.types';

/**
 * Carbon Removal Hybrid Report Example Data
 * Electrochemical Ocean Alkalinity Enhancement
 */
export const CARBON_REMOVAL_HYBRID_REPORT: HybridReportData = {
  title:
    'Electrochemical Ocean Alkalinity Enhancement: Marine Electrolyzer Architecture for 5+ Year Survival',
  brief:
    'Electrochemical ocean alkalinity enhancement produces NaOH at sea to absorb atmospheric CO2. But marine electrolysis faces severe corrosion, biofouling, and membrane fouling. Need electrolyzer architecture that survives 5+ years in marine environment at <$80/ton CO2 equivalent alkalinity cost.',

  executive_summary: {
    narrative_lead:
      "The desalination industry solved seawater fouling decades ago with electrodialysis reversal—polarity switching every 15-30 minutes that dissolves scale and kills biofilms before they mature. Mikhaylin & Bazinet's 2016 review documents 5-10x membrane life extension with this single intervention. The adaptation to alkalinity production isn't research; it's engineering integration with a philosophy shift: design for managed degradation with modular hot-swap electrodes rather than fighting for 5-year component survival in an environment that destroys everything.",
    viability: 'viable',
    viability_label: 'Viable with high confidence using proven technologies',
    primary_recommendation:
      'Implement polarity reversal (5-15 minute cycles for seawater) combined with modular cartridge electrodes designed for 6-12 month replacement. This approach uses proven EDR physics, accepts that seawater will degrade components, and optimizes for $/kg-NaOH-lifetime rather than component longevity. Target $60-80/ton CO2 equivalent with 70%+ capacity factor. First validation: 3-month seawater exposure test with reversal protocol optimization, $50-100K.',
  },

  problem_analysis: {
    whats_wrong: {
      prose:
        'Seawater destroys electrochemical systems through three simultaneous attack vectors: chloride ions corrode metals and degrade membranes within weeks; biofilms establish within 24-48 hours and mature into impermeable layers within weeks; and at cathode pH >10, Mg(OH)₂ and CaCO₃ precipitate directly onto electrode surfaces, creating insulating scale that kills efficiency. Current approaches designed for purified brine fail catastrophically—chlor-alkali membranes tolerate <50 ppb divalent cations while seawater contains 400 ppm Ca²⁺ and 1300 ppm Mg²⁺, a 10,000x mismatch.',
    },
    current_state_of_art: {
      benchmarks: [
        {
          entity: 'Equatic (UCLA spin-out)',
          approach:
            'Flow-through mesh electrodes accepting chlorine co-production, downstream mineral neutralization',
          current_performance:
            '$100-150/ton CO2 at pilot scale (disclosed in DOE ARPA-E documentation)',
          target_roadmap: '$50-70/ton CO2 at commercial scale by 2027',
          source:
            'DOE ARPA-E award documentation and company disclosures, 2022-2023',
        },
        {
          entity: 'Ebb Carbon',
          approach:
            'Electrochemical ocean alkalinity enhancement with proprietary electrode design',
          current_performance: 'Not disclosed; pilot operations in 2023',
          target_roadmap: 'Commercial deployment by 2026',
          source: 'Press releases, unverified',
        },
        {
          entity: 'Planetary Technologies',
          approach:
            'Electrochemical production of Mg(OH)₂ from industrial waste streams',
          current_performance: 'Pilot scale; cost not disclosed',
          target_roadmap: '1 Mt CO2/year capacity by 2030',
          source: 'Company announcements',
        },
        {
          entity: 'Kuang et al. (Stanford)',
          approach:
            'NiFe LDH catalyst achieving >99% OER selectivity in seawater',
          current_performance:
            '100+ hours stability at 400 mA/cm² demonstrated',
          target_roadmap: 'Academic research; no commercialization timeline',
          source: 'PNAS 2019',
        },
      ],
    },
    what_industry_does_today: [
      {
        approach:
          'Adapted chlor-alkali cells with Nafion membranes and DSA anodes',
        limitation:
          'Designed for purified brine; membranes foul in days-weeks with seawater; DSA anodes preferentially produce chlorine over oxygen',
      },
      {
        approach: 'Bipolar membrane electrodialysis (BPMED)',
        limitation:
          '30-40% lower energy than direct electrolysis but membrane life in seawater is weeks without aggressive pretreatment',
      },
      {
        approach: 'Heavy pretreatment to chlor-alkali standards',
        limitation:
          'Adds $20-40/ton NaOH equivalent; defeats the purpose of using seawater directly',
      },
      {
        approach: 'Selective OER catalysts (NiFe LDH)',
        limitation:
          'Lab-proven >99% selectivity but long-term stability in real seawater (with organics, suspended solids) unvalidated',
      },
    ],
    why_its_hard: {
      prose:
        'The fundamental challenge is thermodynamic: chlorine evolution (1.36V) is kinetically favored over oxygen evolution (1.23V) on most catalysts in chloride-rich solutions, despite oxygen being thermodynamically preferred. The 490mV window exists but requires precisely engineered catalyst surfaces to exploit. Simultaneously, the cathode operates at pH >10 where both Mg(OH)₂ (Ksp = 1.8×10⁻¹¹) and CaCO₃ (Ksp = 3.4×10⁻⁹) are supersaturated by orders of magnitude—precipitation is thermodynamically inevitable. And biofilm formation follows predictable kinetics: conditioning film (proteins, organics) in minutes, bacterial attachment in hours, mature community in days. You cannot thermodynamically prevent any of these; you can only manage them kinetically.',
      governing_equation: {
        equation:
          'E_cell = E°_OER - E°_cathode + η_OER + η_cathode + iR_solution + iR_membrane + iR_fouling',
        explanation:
          'Cell voltage includes thermodynamic minimum (1.23V for OER) plus overpotentials at each electrode plus ohmic losses. The fouling resistance term (iR_fouling) grows exponentially with time in seawater, eventually dominating. At 100 μm biofilm thickness, mass transport resistance increases 10-100x.',
      },
    },
    first_principles_insight: {
      headline: 'Optimize for $/kg-NaOH-lifetime, not component longevity',
      explanation:
        "The 5-year electrode life target may be self-imposed rather than economically optimal. If electrode replacement is cheap and fast enough (modular cartridges, quick-connect interfaces), designing for 6-12 month disposable electrodes might beat 5-year hardened electrodes on total cost. The offshore wind industry accepts regular blade inspections and component replacement; the question is whether the electrolyzer industry's longevity obsession reflects optimal economics or inherited assumptions from chlor-alkali plants that operate with purified brine.",
    },
  },

  constraints_and_metrics: {
    hard_constraints: [
      'Must operate in seawater (~19,000 ppm Cl⁻, ~400 ppm Ca²⁺, ~1300 ppm Mg²⁺)',
      'Must produce net alkalinity (NaOH, Mg(OH)₂, or equivalent)',
      'Cannot release significant chlorine to environment (<5% of current as Cl₂)',
      'Must be deployable offshore or coastal',
    ],
    soft_constraints: [
      '5+ year system life (component replacement acceptable)',
      '<$80/ton CO2 equivalent (may be negotiable with carbon credit pricing)',
      'Continuous operation preferred but intermittent acceptable',
      'Minimal pretreatment preferred but some acceptable if cost-effective',
    ],
    assumptions: [
      'Temperate coastal waters (~15°C average); tropical deployment would accelerate biofouling 2-3x',
      'Grid-connected or offshore wind power at $30-60/MWh',
      'Direct operational cost only; MRV costs excluded (would add $10-30/ton)',
      'Electrochemical approach required; mineral dissolution alternatives noted but not primary focus',
    ],
    success_metrics: [
      {
        metric: 'Alkalinity production cost',
        target: '<$60/ton CO2 equivalent',
        minimum_viable: '<$80/ton CO2 equivalent',
        stretch: '<$40/ton CO2 equivalent',
        unit: '$/ton CO2',
      },
      {
        metric: 'Mean time between maintenance',
        target: '>6 months',
        minimum_viable: '>3 months',
        stretch: '>12 months',
        unit: 'months',
      },
      {
        metric: 'Capacity factor',
        target: '>70%',
        minimum_viable: '>50%',
        stretch: '>85%',
        unit: 'percent',
      },
      {
        metric: 'Energy consumption',
        target: '<3.0 kWh/kg NaOH',
        minimum_viable: '<3.5 kWh/kg NaOH',
        stretch: '<2.5 kWh/kg NaOH',
        unit: 'kWh/kg',
      },
      {
        metric: 'Chlorine selectivity (OER vs CER)',
        target: '>95% OER',
        minimum_viable: '>80% OER (with downstream neutralization)',
        stretch: '>99% OER',
        unit: 'percent Faradaic efficiency',
      },
    ],
  },

  challenge_the_frame: [
    {
      assumption: 'Electrochemical approach is required',
      challenge:
        'Passive mineral dissolution (olivine spreading) or enhanced weathering may achieve similar alkalinity at lower cost without electricity',
      implication:
        'If passive approaches prove viable at scale, the entire electrochemical architecture may be unnecessary. Monitor Project Vesta and similar efforts.',
    },
    {
      assumption: '5+ year system life is the target',
      challenge:
        'If component replacement is cheap enough, 1-2 year system life with annual replacement may be more economical',
      implication:
        "The 'managed degradation' philosophy may extend further than we've proposed. Disposable electrolyzer cartridges replaced annually could beat hardened systems.",
    },
    {
      assumption: 'Direct seawater use is required',
      challenge:
        'If desalination costs continue falling, pretreating seawater to chlor-alkali standards may become economical',
      implication:
        'At $0.50/m³ desalination cost, pretreatment adds ~$5-10/ton NaOH—potentially acceptable if it enables proven chlor-alkali technology.',
    },
    {
      assumption: 'Chlorine must be prevented or neutralized',
      challenge:
        'Low-level chlorine release may be environmentally acceptable in open ocean where dilution is rapid',
      implication:
        'If regulatory framework permits <1 ppm Cl₂ in discharge, system design simplifies dramatically. This is a policy question, not a technical one.',
    },
  ],

  innovation_analysis: {
    domains_searched: [
      'Desalination (EDR polarity reversal)',
      'Geothermal (precipitation steering)',
      'Marine biology (Sharklet antifouling)',
      'Cathodic protection (sacrificial anodes)',
      'Chlor-alkali history (mercury cells)',
      'Battery industry (solid electrolytes)',
      'Microfluidics (membraneless flow cells)',
      'Pulp & paper (black liquor electrolysis)',
    ],
    reframe:
      "Instead of asking 'how do we make components survive 5 years in seawater,' we asked 'how do we make component replacement so cheap and fast that survival doesn't matter.'",
  },

  execution_track: {
    intro:
      'Solution concepts use proven technologies requiring integration, not invention. These represent the lowest-risk path to meeting the $80/ton CO2 target. Start here.',
    primary: {
      id: 'sol-primary',
      title: 'Polarity Reversal + Modular Cartridge Architecture',
      confidence: 85,
      source_type: 'CATALOG',
      bottom_line:
        'Combine proven EDR-style polarity reversal (5-15 minute cycles for seawater) with modular cartridge electrodes designed for 6-12 month hot-swap replacement. The system accepts that seawater will degrade components and optimizes for total cost of ownership rather than component longevity.',
      expected_improvement:
        '2.8-3.2 kWh/kg NaOH (5-15% energy penalty from reversal)',
      timeline: '6-12 months to pilot validation',
      investment: '$0.5-2M for pilot system',
      the_insight: {
        what: 'Periodic electrochemical stress disrupts fouling equilibrium before irreversible attachment occurs',
        where_we_found_it: {
          domain: 'Desalination industry (electrodialysis reversal)',
          how_they_use_it:
            'EDR systems reverse polarity every 15-30 minutes to prevent membrane fouling in brackish water treatment',
          why_it_transfers:
            'The physics is identical—scale dissolution at low pH, biofilm disruption from ionic oscillation. Seawater just requires more frequent reversal.',
        },
        why_industry_missed_it:
          "The electrolyzer industry inherited chlor-alkali assumptions about continuous operation with purified feed. EDR is standard in desalination but the communities don't overlap. The 5-year electrode life target may be self-imposed rather than economically optimal.",
      },
      what_it_is:
        "Polarity reversal works by periodically switching anode and cathode. When current reverses, the former cathode (where Mg(OH)₂ and CaCO₃ precipitated at high pH) becomes the anode (low pH), dissolving the scale. Biofilms lose the ion gradient cues they need for attachment and detach. The Mikhaylin & Bazinet 2016 review documents 5-10x membrane life extension with this single intervention in brackish water; seawater may require more frequent reversal (5-15 minutes vs. 15-30 minutes) due to higher divalent cation load.\n\nModular cartridges use standardized quick-connect interfaces allowing tool-free electrode stack replacement without cell disassembly. This follows the black liquor electrolysis philosophy of 'managed degradation'—accept that electrodes will wear, design for easy replacement, and optimize $/kg-NaOH-lifetime rather than $/year-operation. Cartridge materials can be simpler (carbon, nickel) rather than exotic alloys because they don't need to survive 5 years.",
      why_it_works:
        "CaCO₃ solubility increases ~100x from pH 10 to pH 4; Mg(OH)₂ dissolves completely below pH 9.5. When polarity reverses, the former cathode experiences acidic conditions that dissolve accumulated scale. Biofilm EPS matrix loses structural integrity when local ionic strength and pH oscillate—the Mikhaylin & Bazinet review documents 50-80% biofilm detachment per reversal cycle. The key is reversing frequently enough that scale and biofilm never reach the 'mature' stage where they become mechanically robust and difficult to remove.",
      why_it_might_fail: [
        'Polarity reversal frequency required for seawater may be so high that energy penalty exceeds 20%',
        'May not work in tropical/humid environments where drying is slow',
        'Capacity factor loss (5-15%) may exceed fouling-related gains',
      ],
      validation_gates: [
        {
          week: '12',
          test: '3-month seawater exposure test with polarity reversal protocol optimization',
          method:
            'Deploy test electrodes in real seawater; vary reversal frequency; measure electrode weight loss, surface morphology, electrochemical performance, fouling coverage',
          success_criteria:
            'Electrode performance degradation <30% over 3 months; scale thickness <50 μm; biofilm coverage <20% of surface area',
          cost: '$50-100K',
          decision_point:
            'If degradation >50% or scale >100 μm, increase reversal frequency or pivot to chlorine-accepting architecture',
        },
      ],
    },
    supporting_concepts: [
      {
        id: 'sol-support-1',
        title: 'Accept Chlorine + Downstream Mineral Neutralization',
        relationship: 'FALLBACK',
        one_liner:
          'Stop fighting chlorine evolution at the anode. Accept mixed Cl₂/O₂ production and react chlorine with olivine or limestone slurry downstream.',
        confidence: 75,
        what_it_is:
          'This is the Equatic approach, commercially validated at pilot scale. At the anode, seawater electrolysis produces both O₂ and Cl₂ (ratio depends on catalyst and conditions). Cl₂ hydrolysis produces HOCl/HCl. This acidic stream contacts olivine (Mg₂SiO₄): 2HCl + Mg₂SiO₄ → MgCl₂ + H₄SiO₄. The net reaction consumes acid and produces dissolved cations that represent alkalinity when discharged to the ocean.',
        why_it_works:
          'HOCl (pKa 7.5) and HCl from chlorine hydrolysis attack mineral surfaces. Olivine dissolution: Mg₂SiO₄ + 4H⁺ → 2Mg²⁺ + H₄SiO₄. Each mole of Cl₂ produces 2 moles of H⁺, which can dissolve ~1 mole of Mg from olivine. The Mg²⁺ released represents 2 equivalents of alkalinity. Net effect: chlorine becomes a positive contributor to alkalinity production.',
        when_to_use_instead:
          'If selective OER catalysts prove unreliable in real seawater, or if polarity reversal energy penalty is unacceptable, the chlorine-accepting architecture becomes primary. Also preferred if mineral co-benefits (silica for agriculture, Mg for ocean chemistry) have value.',
      },
      {
        id: 'sol-support-2',
        title: 'Geothermal-Inspired Precipitation Steering',
        relationship: 'COMPLEMENTARY',
        one_liner:
          "Install sacrificial 'scaling targets' upstream of electrodes that preferentially nucleate Mg(OH)₂ and CaCO₃.",
        confidence: 70,
        what_it_is:
          'Replace scaling targets on maintenance cycles while electrodes remain clean. This is standard practice in geothermal power plants like Wairakei (NZ), which has operated for 60+ years with severe silica and carbonate scaling. Heterogeneous nucleation of mineral scale preferentially occurs on surfaces with high surface area, surface defects/roughness, and favorable surface chemistry. By placing intentionally rough, high-surface-area targets in the flow path before electrodes, supersaturated Ca²⁺ and Mg²⁺ preferentially nucleate on these sacrificial surfaces.',
        why_it_works:
          'Nucleation theory: critical nucleus formation requires overcoming an energy barrier that depends on surface energy. Rough surfaces with high defect density provide low-energy nucleation sites. If scaling targets provide 10-100x more favorable nucleation sites than smooth electrode surfaces, >90% of precipitation occurs on targets rather than electrodes.',
        when_to_use_instead:
          'This is complementary to all other approaches—should be included in any system design regardless of primary architecture. Low cost, low risk, proven physics.',
      },
      {
        id: 'sol-support-3',
        title: 'Intermittent Drying Cycle Operation',
        relationship: 'COMPLEMENTARY',
        one_liner:
          'Optimize for intermittent operation with deliberate drying cycles rather than continuous submersion.',
        confidence: 65,
        what_it_is:
          'When electricity is unavailable (renewable intermittency) or during scheduled intervals, drain cells and allow surfaces to dry. Biofilms die without moisture (90-99% mortality after 4-8 hours drying); mineral scale becomes brittle and spalls from thermal expansion mismatch. This turns the weakness of intermittent renewables into a fouling management strategy. The intertidal zone demonstrates this naturally—organisms in the splash zone face much lower fouling pressure than continuously submerged surfaces.',
        why_it_works:
          'Biofilm EPS is 90%+ water; desiccation causes irreversible collapse of the hydrogel structure. Gram-negative bacteria (dominant marine foulers) are particularly sensitive. CaCO₃ scale has thermal expansion coefficient ~6×10⁻⁶/°C vs ~12×10⁻⁶/°C for metals; temperature cycling during drying creates interfacial stress that propagates cracks.',
        when_to_use_instead:
          'Complementary to polarity reversal. Particularly valuable for offshore wind-powered systems where intermittency is inherent. May become primary fouling management in tropical deployments where biofouling is most severe.',
      },
    ],
  },

  innovation_portfolio: {
    intro:
      'Innovation concepts offer higher ceilings with higher uncertainty. These are parallel bets on breakthrough outcomes that could transform the economics if successful.',
    recommended_innovation: {
      id: 'innov-recommended',
      title: 'Sacrificial Magnesium Anode Architecture',
      confidence: 50,
      innovation_type: 'CROSS_DOMAIN',
      source_domain: 'Cathodic protection industry',
      the_insight: {
        what: 'The electrode can BE the product—dissolution is production, not failure',
        where_we_found_it: {
          domain: 'Cathodic protection industry',
          how_they_use_it:
            'Magnesium sacrificial anodes protect ship hulls and pipelines by preferential dissolution',
          why_it_transfers:
            'The same dissolution chemistry that protects steel produces Mg(OH)₂ alkalinity directly',
        },
        why_industry_missed_it:
          "Cathodic protection is viewed as a corrosion prevention tool, not a production method. The 70+ years of Mg anode deployment data (DNV-RP-B401) was sitting in a different industry's literature.",
      },
      what_it_is:
        "Flip the paradigm: instead of protecting electrodes from corrosion, design the anode to corrode productively. Magnesium sacrificial anodes dissolve to produce Mg(OH)₂ directly—the anode IS the alkalinity product. No membrane needed because there's no chlorine production. Pair with inert cathode for hydrogen evolution.\n\nMagnesium metal spontaneously oxidizes in seawater: Mg → Mg²⁺ + 2e⁻. At the cathode, water reduces: 2H₂O + 2e⁻ → H₂ + 2OH⁻. The Mg²⁺ and OH⁻ combine to form Mg(OH)₂ (brucite), which is sparingly soluble and disperses as alkaline suspension.\n\nThis eliminates the membrane entirely—there's no chlorine to separate because there's no oxidation of water or chloride at the anode, only metal dissolution. It eliminates biofouling on the anode because the surface is constantly dissolving. It eliminates the chlorine selectivity problem because no chlorine can form.",
      why_it_works:
        "Magnesium dissolution proceeds through direct electrochemical oxidation: Mg → Mg²⁺ + 2e⁻ (E° = -2.37V vs SHE). In seawater, the reaction is spontaneous and fast. The Mg²⁺ immediately hydrolyzes: Mg²⁺ + 2OH⁻ → Mg(OH)₂. Each mole of Mg produces 2 moles of OH⁻ equivalents = 3.4 g OH⁻/g Mg. No chlorine can form because there's no oxidation reaction at the anode—only metal dissolution. Energy requirement is theoretically zero (galvanic); <0.5 kWh/kg NaOH equivalent with enhancement current.",
      breakthrough_potential: {
        if_it_works:
          'Eliminates membrane, chlorine, and fouling problems simultaneously. Simplest possible architecture.',
        estimated_improvement:
          'Energy consumption could drop from 2.5-3.5 kWh/kg to <0.5 kWh/kg (galvanic + enhancement)',
        industry_impact:
          'Could enable distributed ocean alkalinity enhancement with minimal infrastructure',
      },
      risks: {
        physics_risks: [
          'Sodium solubility in Mg alloys may limit practical dissolution rates',
          'Mg(OH)₂ passivation layer may slow dissolution below useful rates',
          'Mg supply chain and carbon footprint may limit scalability',
        ],
        implementation_challenges: [
          'Mg anode consumption rate needs precise control for predictable operations',
          'H₂ evolution at cathode needs safe venting in marine environment',
        ],
        mitigation: [
          'Use Mg alloys (AZ91, AM60) with controlled dissolution rates',
          'Periodic mechanical or chemical depassivation',
          'Source Mg from seawater extraction or recycled sources',
        ],
      },
      validation_path: {
        gating_question:
          'Can Mg(OH)₂ passivation be managed to sustain >5 mm/year dissolution with reasonable flow or current?',
        first_test:
          'Buy marine-grade Mg anodes from cathodic protection supplier, deploy in seawater with inert cathode, measure dissolution rate under various conditions',
        cost: '$20-40K',
        timeline: '8-12 weeks',
        go_no_go:
          'Sustained dissolution rate >5 mm/year with reasonable flow/current → proceed. Passivation kills dissolution → reject approach.',
      },
    },
    parallel_investigations: [
      {
        id: 'innov-parallel-1',
        title: 'Electrochemical Olivine Weathering Cell',
        confidence: 45,
        innovation_type: 'CROSS_DOMAIN',
        source_domain: 'Enhanced weathering research',
        one_liner:
          'Electrochemically accelerate olivine dissolution instead of splitting water',
        the_insight: {
          what: 'Electrochemistry can accelerate natural weathering 10-100x',
          where_we_found_it: {
            domain: 'Enhanced weathering research',
            how_they_use_it:
              'Rau et al. (PNAS 2013) demonstrated electrochemical acceleration of mineral weathering',
            why_it_transfers:
              'The mineral acts as both reactant and buffer, keeping local pH moderate and preventing chlorine evolution',
          },
          why_industry_missed_it:
            'Enhanced weathering and electrochemistry communities have minimal overlap',
        },
        ceiling:
          'Lower energy than direct electrolysis; complete elimination of chlorine problem; mineral acts as both feedstock and buffer',
        key_uncertainty:
          'Silica gel formation from H₄SiO₄ polymerization could clog reactors; mineral passivation by secondary precipitates could limit conversion',
        validation_approach: {
          test: 'Build simple electrochemical cell with olivine bed; measure dissolution rate, silica behavior, and energy consumption',
          cost: '$30-50K',
          timeline: '12-16 weeks',
          go_no_go:
            'Energy <2 kWh/kg alkalinity AND silica manageable → elevate to primary. Silica clogs system → reject.',
        },
        when_to_elevate:
          'If silica management proves straightforward and energy consumption is <2 kWh/kg, this becomes primary path due to lower energy than direct electrolysis and elimination of chlorine problem.',
      },
      {
        id: 'innov-parallel-2',
        title: 'NASICON Solid-State Membrane Architecture',
        confidence: 35,
        innovation_type: 'EMERGING_SCIENCE',
        source_domain: 'Battery industry',
        one_liner:
          'Replace polymer membranes with ceramic Na⁺ conductors impermeable to seawater',
        the_insight: {
          what: 'Ceramic ion conductors can completely separate seawater from product compartment',
          where_we_found_it: {
            domain: 'Solid-state battery research',
            how_they_use_it:
              'NASICON (Na₃Zr₂Si₂PO₁₂) used as solid electrolyte in Na-ion batteries',
            why_it_transfers:
              'Same Na⁺ conductivity works for electrochemical NaOH production',
          },
          why_industry_missed_it:
            'Solid-state battery and electrolyzer communities have different priorities; ceramic brittleness seen as disqualifying for large-area applications',
        },
        ceiling:
          'Eliminates biofouling, organic fouling, and chloride attack on cathode side entirely. Potential for very long membrane life.',
        key_uncertainty:
          'Mechanical brittleness of ceramics makes large-area membranes challenging; sealing ceramic to housing in seawater environment is unproven',
        validation_approach: {
          test: 'Procure small NASICON discs; test ionic conductivity and mechanical integrity in seawater exposure',
          cost: '$40-60K',
          timeline: '12-16 weeks',
          go_no_go:
            'Conductivity >1 mS/cm maintained after 1000 hours seawater exposure → proceed with scale-up. Cracking or conductivity loss → reject.',
        },
        when_to_elevate:
          'If polymer membrane costs or PFAS regulations become prohibitive, and if ceramic manufacturing scales, this becomes primary path for long-term durability.',
      },
    ],
    frontier_watch: [
      {
        id: 'frontier-1',
        title: 'Galinstan Liquid Metal Cathode',
        innovation_type: 'PARADIGM',
        one_liner:
          'Self-renewing liquid surface that cannot be permanently fouled',
        why_interesting:
          'Mercury cells operated reliably for 80+ years; abandonment was environmental, not technical. If Galinstan electrochemistry proves viable, this could be the ultimate fouling-resistant architecture.',
        why_not_now:
          'Sodium solubility in Galinstan (~0.5-1 at.%) may limit practical rates. Gallium embrittlement of structural metals requires careful material selection. Gallium and indium supply chains are constrained (~300 and ~800 tons/year respectively). Fundamental electrochemistry research needed.',
        trigger_to_revisit:
          'Publication demonstrating >1 at.% Na solubility in Ga-based alloy, or Ambri-style liquid metal battery commercialization proving large-scale liquid metal handling',
        who_to_monitor:
          'Prof. Michael Dickey, NC State (liquid metal electronics); Ambri (liquid metal batteries); Dr. Qian Wang, Chinese Academy of Sciences (gallium electrochemistry)',
        earliest_viability: '5-7 years',
        trl_estimate: 2,
        competitive_activity:
          'No direct activity in electrolyzer space. Ambri proving industrial liquid metal handling is relevant precedent.',
      },
      {
        id: 'frontier-2',
        title: 'Membraneless Laminar Co-Flow Electrolyzer Array',
        innovation_type: 'EMERGING_SCIENCE',
        one_liner:
          'Eliminate membrane by using laminar flow to keep products separate',
        why_interesting:
          'Eliminates membrane failure mode entirely. Kjeang et al. demonstrated >1 W/cm² in membraneless fuel cells. If manufacturing scales, this could be the ultimate membrane-free architecture.',
        why_not_now:
          "Manufacturing millions of parallel microchannels at acceptable cost is a major challenge. Clogging from seawater particles is serious concern. 3-5 year timeline and $5-20M development cost. The physics works; the manufacturing doesn't exist.",
        trigger_to_revisit:
          'Cost of microchannel arrays drops below $100/m² (currently ~$1000/m²), or 3D printing of metal microchannels becomes viable at scale',
        who_to_monitor:
          'Prof. Erik Kjeang, Simon Fraser University (membraneless fuel cells); Microchannel heat exchanger manufacturers (Heatric, Alfa Laval); MEMS foundries with high-volume capability',
        earliest_viability: '5-10 years',
        trl_estimate: 3,
        competitive_activity:
          'Academic research only. No commercial development for seawater electrochemistry.',
      },
      {
        id: 'frontier-3',
        title: 'NiFe LDH + ALD-Protected Electrodes',
        innovation_type: 'EMERGING_SCIENCE',
        one_liner:
          'Combine selective catalyst with atomic-layer protection for seawater durability',
        why_interesting:
          'Both components are independently proven. Kuang et al. demonstrated >99% OER selectivity for 100+ hours. Díaz et al. demonstrated 10,000+ hour corrosion protection with ALD. The combination could achieve chlor-alkali efficiency in seawater.',
        why_not_now:
          'Long-term NiFe LDH stability in real seawater (with organics, suspended solids) is less proven than lab demonstrations. ALD coating at electrode scale is more challenging than semiconductor wafers. Manufacturing integration is the gap.',
        trigger_to_revisit:
          'Publication demonstrating >1000 hours NiFe LDH stability in real seawater, or commercial ALD service offering electrode coating',
        who_to_monitor:
          'Prof. Hongjie Dai, Stanford (NiFe LDH catalyst development); Prof. Markus Antonietti, MPI Colloids (earth-abundant catalysts); ALD equipment manufacturers (Beneq, Picosun) for electrode-scale coating',
        earliest_viability: '2-3 years',
        trl_estimate: 4,
        competitive_activity:
          'Active academic research. Several groups pursuing similar combinations.',
      },
    ],
  },

  risks_and_watchouts: [
    {
      category: 'Technical',
      risk: 'Seawater variability (temperature, salinity, biology) may cause performance inconsistency across deployments',
      severity: 'medium',
      mitigation:
        'Design for operational flexibility; include sensors and adaptive control; test across multiple sites',
    },
    {
      category: 'Market',
      risk: 'Carbon credit pricing may not support $60-80/ton CO2 cost in near term',
      severity: 'high',
      mitigation:
        'Target voluntary carbon market premium buyers (tech companies, airlines); pursue government procurement; design for cost reduction pathway',
    },
    {
      category: 'Regulatory',
      risk: 'Ocean discharge of alkalinity or chlorine may face environmental permitting challenges',
      severity: 'high',
      mitigation:
        'Engage regulators early; develop robust MRV (monitoring, reporting, verification); start with pilot permits in favorable jurisdictions',
    },
    {
      category: 'Resource',
      risk: 'Offshore deployment and maintenance requires specialized marine operations capability',
      severity: 'medium',
      mitigation:
        'Partner with offshore wind or oil & gas operators; design for shore-based maintenance where possible',
    },
    {
      category: 'Technical',
      risk: 'Polarity reversal frequency required for seawater may be so high that energy penalty exceeds 20%',
      severity: 'medium',
      mitigation:
        'Validate reversal protocol early in pilot; have fallback to chlorine-accepting architecture if penalty is unacceptable',
    },
  ],

  self_critique: {
    confidence_level: 'medium',
    overall_confidence: 'medium',
    confidence_rationale:
      'High confidence in the physics of polarity reversal and precipitation steering (proven in adjacent industries). Medium confidence in the economics (seawater is harder than brackish water; energy penalty may be higher than estimated). Lower confidence in the paradigm-shifting concepts (sacrificial Mg, NASICON) which have clear mechanisms but unvalidated economics.',
    what_we_might_be_wrong_about: [
      'Seawater may be fundamentally harder than brackish water—10,000x higher divalent cation load may overwhelm polarity reversal',
      'The 5-15% energy penalty estimate for reversal may be optimistic; real penalty could be 20-30%',
      'Sacrificial Mg economics may never work due to Mg cost and carbon footprint constraints',
      'Regulatory barriers for ocean alkalinity enhancement may be higher than anticipated',
    ],
    unexplored_directions: [
      'Biological integration—cultivating beneficial biofilms rather than preventing all biofilms',
      'Hybrid thermal-electrochemical approaches using waste heat to accelerate reactions',
      'Capacitive deionization variants that shuffle ions without water splitting',
    ],
    validation_gaps: [
      {
        concern: 'Seawater may be fundamentally harder than brackish water',
        status: 'ADDRESSED',
        rationale:
          'First validation step explicitly tests in seawater, not brackish water. 3-month exposure will reveal if polarity reversal is sufficient.',
      },
      {
        concern: 'Energy penalty for reversal may be higher than estimated',
        status: 'ADDRESSED',
        rationale:
          'Validation protocol includes energy consumption measurement. If penalty exceeds 20%, fallback to chlorine-accepting architecture.',
      },
      {
        concern: 'Sacrificial Mg economics may never work',
        status: 'EXTENDED_NEEDED',
        rationale:
          'Parallel bench test on Mg anodes will validate dissolution rate, but full economics require lifecycle analysis including Mg sourcing. Recommend commissioning LCA if dissolution rate is promising.',
      },
      {
        concern: 'Regulatory barriers may be higher than anticipated',
        status: 'ACCEPTED_RISK',
        rationale:
          "Regulatory engagement is outside technical validation scope. Recommend parallel workstream on regulatory strategy, but this doesn't gate technical development.",
      },
    ],
  },

  what_id_actually_do:
    "If this were my project, I'd start with the boring stuff that works. Get an EDR system from Evoqua or Suez, modify it for seawater with more frequent polarity reversal (start at 15 minutes, optimize down to 5 if needed), and add precipitation steering targets upstream of the electrodes. This combination addresses both biofouling and mineral scaling with proven physics and minimal development risk. Run it for 3 months in real seawater and measure everything—electrode weight loss, surface morphology, electrochemical performance, fouling coverage. That's your baseline.\n\nWhile that's running, I'd set up a parallel bench test on sacrificial Mg anodes. This is the paradigm-shifting concept that could change everything, and it's cheap to test. Buy some marine-grade Mg anodes from a cathodic protection supplier, put them in seawater with a cathode, and measure dissolution rate under various conditions. The key question is whether Mg(OH)₂ passivation can be managed. If you can sustain >5 mm/year dissolution with reasonable flow or current, you've got something. If passivation kills it, you've spent $20K to learn that and can move on.\n\nThe one thing I would NOT do is chase the exotic materials (NASICON, Galinstan, membraneless microchannels) until the simpler approaches hit a wall. Those are 5-year bets with major manufacturing uncertainty. The polarity reversal + modular cartridge approach can probably hit $80/ton CO2 with existing technology—that's the near-term path. Save the paradigm shifts for the next generation.",

  follow_up_prompts: [
    'Design a detailed 6-month pilot plan for the polarity reversal + modular cartridge architecture',
    'What should I ask Evoqua or Suez about adapting EDR systems for seawater alkalinity production?',
    'Help me design the sacrificial Mg anode bench test protocol',
    'Compare total cost of ownership: polarity reversal vs. chlorine-accepting architecture at 1000 ton CO2/year scale',
    'What regulatory pathway should I pursue for ocean alkalinity enhancement in US waters?',
  ],
};
