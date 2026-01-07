import type { HybridReportData } from '~/home/(user)/reports/_lib/types/hybrid-report-display.types';

/**
 * Food Waste Processing Hybrid Report Example Data
 * Source: food_json from GitHub
 */
export const FOOD_HYBRID_REPORT: HybridReportData = {
  title: '15 kWh/ton Food Waste Processing with Off-the-Shelf Equipment',
  brief:
    "Commercial kitchens, hospitals, and universities generate 1-5 tons/week of food waste. Hauling costs $150-300/ton and rising. Composting requires space and management. Anaerobic digestion needs scale (100+ tons/day) to be economical. On-site dehydrators exist but consume 800-1200 kWh/ton, take 12-24 hours per batch, produce output that's not consistently compostable, and cost $30-50K for a 200 lb/day unit. Need on-site solution that reduces food waste volume by 80%+, processes 500+ lbs/day, uses <200 kWh/ton, produces stable output (compostable or fuel), and costs <$15K installed.",

  executive_summary: {
    narrative_lead:
      'Mechanical dewatering removes 50-70% of food waste moisture at 10-15 kWh/ton—a fraction of the 600+ kWh/ton floor for thermal evaporation. Agricultural screw presses and olive oil centrifuges have operated at this efficiency for decades. The path to <200 kWh/ton combines a Vincent CP-4 screw press ($6-8K) with either solar cabinet finishing for sunny climates (15-30 kWh/ton) or a compact drum dryer with heat recovery for year-round operation (150-200 kWh/ton). Total installed cost: $8-18K using equipment that ships next week.',
    primary_recommendation:
      'Deploy a Vincent CP-4 screw press ($6-8K) with solar cabinet finishing for $8-12K total installed cost, achieving 15-30 kWh/ton electrical consumption in sunny climates. For year-round reliability in variable climates, add a compact drum dryer with heat recovery for $12-18K total, targeting 150-200 kWh/ton. Both approaches use off-the-shelf equipment requiring only integration engineering, not invention.',
    viability: 'viable',
  },

  problem_analysis: {
    whats_wrong: {
      prose:
        "Current on-site food waste processors are expensive ($30-50K), energy-intensive (800-1200 kWh/ton), and slow (12-24 hours per batch). Commercial kitchens generating 500+ lbs/day face a choice between hauling costs that keep rising, composting programs that require space and expertise they don't have, or capital equipment that doesn't pencil out. The result is that most food waste still goes to landfill, where it generates methane and costs $150-300/ton in tipping fees.",
    },
    current_state_of_art: {
      benchmarks: [
        {
          entity: 'Oklin International (GG Series)',
          approach: 'Accelerated aerobic composting with heat recovery',
          current_performance: '400-600 kWh/ton, 24-hour cycle',
          target_roadmap: 'Not disclosed',
          source: 'Oklin technical specifications, 2023',
        },
        {
          entity: 'BioHiTech (Revolution Series)',
          approach: 'Aerobic digestion with cloud monitoring',
          current_performance: '800-1000 kWh/ton estimated, 24-hour cycle',
          target_roadmap: 'Focus on data/monitoring, not energy reduction',
          source: 'Company website and press releases',
        },
        {
          entity: 'Vincent Corporation',
          approach:
            'Screw press mechanical dewatering (not marketed for food waste finishing)',
          current_performance: '10-15 kWh/ton for dewatering step only',
          target_roadmap:
            'Agricultural focus; not pursuing food waste market integration',
          source: 'Vincent Corporation product catalog, 2024',
        },
      ],
    },
    what_industry_does_today: [
      {
        approach: 'Thermal dehydrators (Eco-Digesters, BioHiTech)',
        limitation:
          '800-1200 kWh/ton energy consumption; $30-50K capital cost; 12-24 hour batch cycles',
      },
      {
        approach: 'Accelerated aerobic digesters (Oklin, WISErg)',
        limitation:
          '400-600 kWh/ton best case; 48-72 hour cycles; requires careful C:N management',
      },
      {
        approach: 'Grinders with sewer discharge',
        limitation:
          'Banned in many jurisdictions; transfers problem to wastewater treatment',
      },
      {
        approach: 'Compaction only',
        limitation:
          '40-60% volume reduction but no stabilization—output still rots',
      },
    ],
    first_principles_insight: {
      headline:
        "50-70% of water in food waste is 'free water' held by weak capillary forces—it can be mechanically pressed out at 1/50th the energy cost of evaporation",
      explanation:
        'Free water is held at 0.1-10 kPa; screw presses apply 200-500 kPa. Mechanical separation at 10-15 kWh/ton removes the majority of water, leaving only bound water (hydrogen-bonded to food polymers) for thermal treatment. This transforms a 627 kWh/ton problem into a 150-250 kWh/ton problem.',
    },
    why_its_hard: {
      prose:
        'Food waste is 60-80% water. Evaporating water requires overcoming the latent heat of vaporization—2,260 kJ/kg, which translates to a theoretical minimum of 627 kWh/ton just for the phase change. Real systems lose 30-50% additional energy to exhaust, radiation, and inefficient heat transfer. At small scale (500 lb/day), surface-to-volume ratios make heat retention even worse. The physics creates a floor that no amount of insulation or control optimization can break through if evaporation is the only water removal mechanism.',
      governing_equation: {
        equation: 'Q = m × ΔH_vap = m × 2,260 kJ/kg',
        explanation:
          'Minimum energy to evaporate water. For 70% moisture food waste, this means 440 kWh/ton theoretical minimum for complete drying via evaporation alone.',
      },
    },
  },

  constraints_and_metrics: {
    hard_constraints: [
      'On-site operation (no off-site transport of wet waste)',
      'Output must be stable (no rot, no pests, no odor for 30+ days)',
      'Must handle mixed institutional food waste (variable composition)',
    ],
    soft_constraints: [
      '<$15K installed cost (could flex to $18-20K for significantly better performance)',
      '<200 kWh/ton (could accept 250 kWh/ton if other benefits compelling)',
      '80%+ volume reduction (mass reduction may be acceptable alternative)',
      'Compostable output (fuel or soil amendment pathways may be acceptable)',
    ],
    assumptions: [
      '24-hour operation acceptable with minimal supervision',
      'Standard 240V electrical service available',
      'Typical institutional waste mix: 50% fruit/veg, 20% grains, 15% meat/dairy, 15% other',
      'Press liquid can be discharged to sewer (verify local regulations)',
      'Some operator involvement acceptable (not fully autonomous)',
    ],
    success_metrics: [
      {
        metric: 'Energy consumption',
        target: '<200 kWh/ton',
        minimum_viable: '<400 kWh/ton',
        stretch: '<100 kWh/ton',
        unit: 'kWh/ton processed',
      },
      {
        metric: 'Installed cost',
        target: '<$15,000',
        minimum_viable: '<$20,000',
        stretch: '<$10,000',
        unit: 'USD',
      },
      {
        metric: 'Throughput',
        target: '500 lbs/day',
        minimum_viable: '300 lbs/day',
        stretch: '1000 lbs/day',
        unit: 'lbs/day',
      },
      {
        metric: 'Volume reduction',
        target: '80%',
        minimum_viable: '70%',
        stretch: '90%',
        unit: 'percent',
      },
      {
        metric: 'Output stability',
        target: '30 days shelf-stable',
        minimum_viable: '14 days',
        stretch: '90+ days',
        unit: 'days without degradation',
      },
    ],
  },

  challenge_the_frame: [
    {
      assumption: 'Output must be dry or compost-compatible',
      challenge:
        'If wet-stable output (fermented, acidified) can find a disposal pathway, drying becomes unnecessary. AD facilities, regenerative farms, and direct soil incorporation are growing markets.',
      implication:
        'If disposal pathways exist, fermentation (innov-recommended) becomes the clear winner at 98% energy reduction. Worth investing time to explore local AD facilities and farm partnerships before committing to thermal approach.',
    },
    {
      assumption: 'On-site processing is required',
      challenge:
        "If hauling costs are the driver, and a local AD facility or composting operation would accept wet waste at lower cost, the best 'solution' might be a partnership rather than equipment purchase.",
      implication:
        'Before investing $10-20K in equipment, verify that no local AD facility will accept wet food waste at <$100/ton. Some facilities pay for quality feedstock.',
    },
    {
      assumption: '500 lbs/day throughput is required',
      challenge:
        'If waste generation is variable, a smaller system with buffer capacity might be more economical than sizing for peak load.',
      implication:
        'Audit actual waste generation over 2-4 weeks before specifying equipment. A 300 lb/day system at $8K might serve better than a 500 lb/day system at $15K if peaks can be buffered.',
    },
    {
      assumption: 'Fully autonomous operation is required',
      challenge:
        'Commercial kitchens already have staff doing waste handling. 10-15 minutes/day of simple operation (loading press, spreading trays) might be acceptable and enables much simpler, cheaper systems.',
      implication:
        'Semi-manual systems (screw press + solar cabinet) at $8-12K may be preferable to fully automated systems at $25-40K if staff time is available.',
    },
  ],

  innovation_analysis: {
    reframe:
      "Instead of asking 'how do we evaporate water more efficiently,' we asked 'how do we avoid evaporating most of the water entirely.'",
    domains_searched: [
      'Agricultural manure handling',
      'Olive oil extraction',
      'Silage fermentation',
      'HVAC dehumidification',
      'Insect farming',
      'Biomass torrefaction',
      'Freeze concentration',
      'Sewage sludge treatment',
    ],
  },

  execution_track: {
    intro:
      'Solution concepts use proven technologies requiring integration, not invention. These represent the lowest-risk paths to meeting specifications. Start here.',
    primary: {
      id: 'sol-primary',
      title: 'Screw Press + Solar Cabinet Hybrid',
      confidence: 88,
      what_it_is:
        'An agricultural screw press designed for manure and food processing dewatering, combined with a passive solar drying cabinet for final moisture removal. The Vincent Corporation CP-4 screw press ($6-8K) handles 500+ lbs/day of food waste, using increasing compression along a tapered screw to squeeze free water through a perforated screen. Press cake exits at 40-50% solids—already a 50-60% mass reduction.\n\nThe press cake is spread on mesh trays in an insulated solar cabinet with a black absorber plate and passive convection chimney. Solar heating raises interior temperature to 50-70°C above ambient, completing drying to <15% moisture in 2-4 sunny days. Total electrical consumption is 15-30 kWh/ton (press motor and feeding system only); solar provides the thermal energy for free.\n\nThe system requires 3-5 days of buffer capacity to handle cloudy periods. For facilities in consistently sunny climates (Southwest US, Mediterranean), this is the simplest and cheapest path to meeting all specifications. For variable climates, the solar cabinet can be supplemented with a small electric heater for backup, adding 50-100 kWh/ton during cloudy periods.',
      why_it_works:
        "The physics are straightforward. Free water is held in the food matrix by capillary forces—surface tension effects in the pores and interstices of the material. These forces are weak (0.1-10 kPa). A screw press applies 200-500 kPa of pressure, easily overcoming capillary retention and forcing water through the screen.\n\nThe remaining 'bound water' is hydrogen-bonded to food polymers (starches, proteins, cellulose). These bonds are stronger (10-100 kJ/mol) and require thermal energy to break. But by this point, you've already removed 50-70% of the water mechanically. Solar radiation provides 800-1000 W/m² in sunny conditions; a 10 m² collector can deliver 6-8 kWh/day of thermal energy—enough to evaporate the remaining moisture from 200-300 lbs of press cake.",
      the_insight: {
        what: 'Free water in food waste (50-70% of total moisture) is held by capillary forces of 0.1-10 kPa, easily overcome by mechanical pressure of 200-500 kPa. This water can be removed at 1/50th the energy cost of evaporation.',
        where_we_found_it: {
          domain: 'Agricultural manure handling and food processing',
          how_they_use_it:
            'Screw presses dewater manure, citrus pulp, and food processing waste at industrial scale. Vincent Corporation has been building these since 1929.',
          why_it_transfers:
            'Food waste has similar moisture content and mechanical properties to the substrates these presses were designed for. The CP-4 is already rated for food waste applications.',
        },
        why_industry_missed_it:
          "Food waste equipment is sold through foodservice equipment distributors to facility managers. Agricultural equipment is sold through farm equipment dealers to farmers. The sales channels don't overlap, and neither side has incentive to cross-market.",
      },
      investment: '$8,000-12,000',
      expected_improvement:
        '15-30 kWh/ton electrical + free solar thermal vs 800-1200 kWh/ton baseline',
      timeline: '2-4 weeks to operational',
      validation_gates: [
        {
          week: 'Week 1-2',
          test: 'Rent or borrow a screw press and test on actual facility waste stream',
          method: 'Trial rental from Vincent Corporation',
          success_criteria:
            'Press cake at 40-50% solids; press liquid clear enough for sewer discharge; no screen clogging with typical waste mix',
          cost: '$500-1,500',
          decision_point:
            'Press cake >60% moisture OR frequent screen clogging → consider decanter centrifuge alternative',
        },
      ],
      why_safe: {
        track_record:
          'Vincent Corporation has been building screw presses since 1929. Solar food drying is traditional technology.',
        precedent: [
          'Agricultural manure dewatering at industrial scale',
          'Food processing waste dewatering',
          'Traditional solar food drying worldwide',
        ],
        failure_modes_understood: true,
      },
      why_it_might_fail: [
        'Weather dependence in cloudy climates limits throughput',
        'Press screen clogging with fibrous waste (corn husks, celery)',
        'Press liquid disposal may require sewer discharge permit',
      ],
    },
    supporting_concepts: [
      {
        id: 'sol-support-1',
        title: 'Two-Stage Mechanical-Thermal Hybrid with Heat Recovery',
        relationship: 'FALLBACK',
        confidence: 82,
        what_it_is:
          'Screw press dewatering to 45% solids, followed by a compact heated drum dryer with vapor heat recovery. The press removes 50-60% of water mechanically at 15 kWh/ton. Press cake enters a jacketed auger conveyor at 120-150°C. Evaporated moisture passes through a plate heat exchanger, preheating incoming press cake. Condensate (clean water) is discharged. Dry output (<15% moisture) exits continuously.\n\nThis system achieves 150-200 kWh/ton regardless of weather, making it the right choice for facilities in variable climates or those requiring consistent throughput. The integration requires custom engineering but uses standard industrial components.',
        why_it_works:
          'Mechanical removal eliminates 50-60% of water at 10-15 kWh/ton. The remaining 35-40% moisture requires thermal energy, but plate heat exchangers capture 50-60% of the latent heat from exhaust vapor and return it to the process. Net thermal consumption: 0.35 × (2260 kJ/kg ÷ 3.6 MJ/kWh) × (1 - 0.5 recovery) = 110 kWh/ton. Add mechanical and fan energy: total 150-200 kWh/ton.',
        when_to_use_instead:
          'Choose this over primary when: (1) climate is too cloudy for reliable solar drying, (2) consistent daily throughput is required regardless of weather, (3) space constraints prevent solar cabinet installation, or (4) budget allows for higher capital cost in exchange for operational reliability.',
        validation_summary:
          'Investment $12,000-18,000. Achieves 150-200 kWh/ton, weather-independent. Timeline: 3-6 months. Key risk: integration complexity and heat exchanger maintenance requiring monthly cleaning.',
      },
      {
        id: 'sol-support-2',
        title: 'Screw Press + Lime Stabilization',
        relationship: 'COMPLEMENTARY',
        confidence: 85,
        what_it_is:
          'Mechanical dewatering followed by quicklime (CaO) addition for chemical stabilization. Press cake is mixed with 5-10% quicklime by weight. The exothermic hydration reaction (CaO + H2O → Ca(OH)2) generates heat, driving off additional moisture while raising pH to 12-13. High pH denatures enzymes, kills pathogens, and prevents microbial activity. Output is stable calcium-enriched soil amendment.\n\nThis is the fastest and cheapest path to stable output—operational in 1-2 weeks at $7-10K capital cost. The tradeoff: output is NOT compost-compatible and requires finding an end-user for lime-stabilized material (farms, landscapers, or direct soil incorporation).',
        why_it_works:
          'CaO hydration releases 65 kJ/mol (1160 kJ/kg CaO). At 10% addition rate, this provides ~116 kJ/kg waste—enough to evaporate 50g water/kg and raise temperature 30-40°C. pH >12 denatures proteins and lyses microbial cell membranes, creating biological stability without drying.',
        when_to_use_instead:
          'Choose this when: (1) speed to deployment is critical, (2) a farm or landscaper partner exists who will take lime-stabilized output, (3) budget is tight and simplicity is valued, or (4) as a bridge solution while developing more sophisticated system.',
        validation_summary:
          'Investment $7,000-10,000. Achieves 15-20 kWh/ton + $10-15/ton lime cost. Timeline: 1-2 weeks to operational. Key risk: output is not compost-compatible (high pH), requires end-user for lime-stabilized material.',
      },
    ],
  },

  innovation_portfolio: {
    intro:
      'Innovation concepts offer higher ceilings with higher uncertainty. These challenge industry assumptions and could transform the economics of food waste processing—but require more validation and may need alternative disposal pathways.',
    recommended_innovation: {
      id: 'innov-recommended',
      title: 'Rapid Lactic Fermentation for Wet Stability',
      confidence: 75,
      innovation_type: 'PARADIGM',
      what_it_is:
        "This approach challenges the fundamental assumption that food waste must be dried to be stable. Instead, it uses lactic acid bacteria (LAB) to rapidly drop pH to 4.0, creating shelf-stable wet output—the same principle that makes sauerkraut, kimchi, and silage stable for months without refrigeration.\n\nFood waste is ground and mixed with 1-2% Lactobacillus inoculant (commercially available silage additives work well). The mixture is compacted into sealed containers to create anaerobic conditions. Within 48-72 hours, LAB ferment available sugars to lactic acid, dropping pH from 6-7 to 3.8-4.2. At this pH, putrefactive bacteria cannot grow, proteolytic enzymes are denatured, and the material is biologically stable.\n\nThe output is wet but stable—it won't rot, won't smell, won't attract pests. It's ideal feedstock for anaerobic digesters (AD facilities pay for high-quality feedstock), can be used for animal feed in some jurisdictions, or can be directly incorporated into soil. Energy consumption is near-zero: just grinding at 5-15 kWh/ton. Capital cost is minimal: grinder, sealed containers, and inoculant.\n\nThe catch: this produces wet output (no volume reduction beyond compaction), and you need a disposal pathway that accepts wet-stable material. If your local AD facility will take it, or you have a farm partnership, this is the most efficient solution by far. If you need dry output for conventional compost or landfill, this doesn't fit.",
      why_it_works:
        'Lactobacillus converts glucose to lactic acid via glycolysis: C₆H₁₂O₆ → 2 CH₃CHOHCOOH (ΔG = -197 kJ/mol). This is an exergonic reaction—it releases energy rather than consuming it. The process is self-sustaining once inoculated.\n\nLactic acid dissociates (pKa 3.86), dropping pH. Below pH 4.5, several things happen: proteolytic enzymes denature and stop breaking down proteins (which would release ammonia and cause odor); Clostridium species (the main putrefactive bacteria) cannot germinate; and Lactobacillus dominates the microbiome through competitive exclusion.\n\nFood waste typically contains 10-20% fermentable sugars—far more than the 3% minimum needed for successful fermentation. The 48-72 hour timeline is conservative; well-inoculated, high-sugar waste can reach pH 4.0 in 24-36 hours.',
      the_insight: {
        what: 'Stability requires either dryness (<15% moisture) OR acidity (pH <4.5). The industry chose drying; fermentation achieves the same stability at 1/100th the energy.',
        where_we_found_it: {
          domain:
            'Agricultural silage fermentation, traditional food preservation',
          how_they_use_it:
            'Farmers have preserved wet forage as silage for centuries. The global silage industry processes billions of tons annually using LAB inoculation.',
          why_it_transfers:
            'Food waste has higher sugar content than forage crops, making it even easier to ferment. The microbiology is identical.',
        },
        why_industry_missed_it:
          "Western waste management infrastructure (landfills, compost facilities) expects dry or composted material. Wet fermented output doesn't fit existing disposal pathways. The paradigm 'stable = dry' is so entrenched that alternatives weren't considered.",
      },
      selection_rationale: {
        why_this_one:
          'This is the highest-impact paradigm shift identified. If the disposal pathway constraint can be satisfied, it delivers 98% energy reduction and 85% capital reduction vs. conventional approaches. The risk is entirely in market/infrastructure fit, not technology—the biology is proven at massive scale in the silage industry.',
        ceiling_if_works:
          'Net-positive economics if output has value. AD facilities pay $20-50/ton for quality feedstock. Even at zero output value, the 98% energy reduction and 85% capital reduction make this economically superior if disposal pathway exists.',
        vs_execution_track:
          'Investment $3,000-6,000 vs $8,000-12,000 for execution track. Simpler equipment (grinder + containers) but requires non-standard disposal pathway.',
      },
      breakthrough_potential: {
        if_it_works:
          'Eliminates 95%+ of energy consumption for food waste stabilization. Transforms waste processing from energy-intensive industrial operation to simple biological process.',
        estimated_improvement:
          '5-15 kWh/ton vs. 800-1200 kWh/ton baseline = 98% reduction. Capital cost $3-6K vs. $30-50K = 85% reduction.',
        industry_impact:
          'If disposal pathways develop (AD expansion, regenerative agriculture growth), this could obsolete thermal dehydration for most applications.',
      },
      validation_path: {
        gating_question:
          'Can we achieve pH <4.2 within 72 hours with actual facility waste, and does a local disposal pathway exist?',
        first_test:
          'Ferment 50-100 lbs of actual facility waste in sealed 5-gallon buckets with commercial silage inoculant. Measure pH at 24, 48, 72 hours.',
        cost: '$200-500 (inoculant, pH meter, containers, phone calls)',
        timeline: '2-3 weeks (fermentation test + partner outreach)',
        go_no_go:
          'GO: pH <4.2 at 72 hours AND at least one disposal partner interested. NO-GO: pH >5.0 at 72 hours (fermentation failure) OR no disposal pathway within 50 miles.',
      },
      risks: {
        physics_risks: [
          'Low-sugar waste streams (mostly meat/dairy) ferment poorly',
        ],
        implementation_challenges: [
          'No local disposal pathway accepts wet fermented material',
          'Operator error creates aerobic conditions, causing spoilage instead of fermentation',
        ],
        mitigation: [
          'Identify AD facility or farm partner BEFORE committing',
          'Training on anaerobic technique (compaction, sealing). Use containers with airlocks',
          'Test actual waste stream composition. Add molasses or other sugar source if needed',
        ],
      },
      relationship_to_execution_track: {
        run_in_parallel: true,
        when_to_elevate:
          'Elevate to primary when local AD facility or farm partner confirms they will accept wet fermented output at economical terms.',
        complementary: false,
      },
    },
    parallel_investigations: [
      {
        id: 'innov-parallel-1',
        title: 'Black Soldier Fly Bioconversion',
        confidence: 70,
        innovation_type: 'CROSS_DOMAIN',
        what_it_is:
          'Use Hermetia illucens (Black Soldier Fly) larvae as self-replicating biological processors. Larvae consume food waste at 50-100 mg/larva/day, achieving 50-70% mass reduction in 10-14 days with near-zero energy input. Outputs are valuable: larvae (40% protein, 35% fat) for animal feed, and frass (stable, nutrient-rich fertilizer).\n\nFood waste is spread in shallow bins (2-4 inch depth). BSF larvae (5,000-10,000 per kg waste) are introduced. Larvae consume waste continuously, growing from 1mm to 25mm over 10-14 days. Mature larvae self-harvest by crawling up ramps into collection containers. The system is essentially self-operating once established.',
        why_it_works:
          'BSF larvae secrete digestive enzymes (proteases, lipases, amylases) into the food matrix, externally digesting it. Nutrients are assimilated into larval biomass at 15-25% conversion efficiency. Metabolic heat from larval activity (larvae maintain 30-35°C body temperature) drives moisture evaporation. Frass output is essentially pre-digested, microbially-stabilized material.',
        the_insight: {
          what: 'Biological conversion transforms waste processing from cost center to potential profit center',
          where_we_found_it: {
            domain: 'Insect farming industry',
            how_they_use_it:
              'EnviroFlight, Enterra, Protix process thousands of tons/year at industrial scale. Asia has used BSF for decades.',
            why_it_transfers:
              'Food waste has similar nutrient profile to agricultural waste that BSF larvae already process commercially.',
          },
          why_industry_missed_it:
            'Cultural unfamiliarity with insect processing in Western food service. Regulatory uncertainty around larvae as animal feed. Requires biological husbandry skills different from equipment operation.',
        },
        key_uncertainty:
          'Regulatory approval for larvae as animal feed varies by jurisdiction. FDA has approved BSF larvae for poultry and aquaculture feed; state regulations vary. Operator skill requirements are different from equipment operation—this is farming, not machine tending.',
        when_to_elevate:
          "Elevate to recommended if: (1) regulatory pathway for larvae as feed is clear in your jurisdiction, (2) local market exists for larvae (aquaculture, poultry farms), (3) operator is comfortable with biological system management, or (4) you're willing to invest 3-6 months in colony establishment and optimization.",
        ceiling:
          'Revenue-positive: larvae sell for $1,000-3,000/ton as animal feed ingredient; frass sells for $50-100/ton as fertilizer',
        investment_recommendation:
          '$8,000-15,000 for bin system, environmental controls, and starter colony. Circular system creates value from waste.',
        validation_approach: {
          test: 'Small-scale BSF trial with 50-100 lbs waste; verify larvae consumption rate and output quality',
          cost: '$500-1,000 (starter colony from Symton BSF or similar, bins, environmental monitoring)',
          go_no_go:
            'GO: >50% mass reduction in 14 days, healthy larvae harvest. NO-GO: Colony crash, <30% reduction, or regulatory barrier in jurisdiction.',
        },
      },
      {
        id: 'innov-parallel-2',
        title: 'Torrefaction to Biochar',
        confidence: 55,
        innovation_type: 'PARADIGM',
        what_it_is:
          'Mild pyrolysis at 250-300°C converts food waste to hydrophobic biochar with 70% mass reduction. Pre-dried food waste (30-40% moisture via mechanical pressing) enters an insulated reactor in an oxygen-limited environment. Held for 30-60 minutes, volatiles (water, acetic acid, tars) are driven off and partially combusted to sustain reactor temperature. Output is biologically inert biochar with fuel value or soil amendment properties.\n\nThe process becomes partially self-sustaining after startup—combustion of released volatiles provides 30-40% of required heat. Net energy consumption is 200-350 kWh/ton including pre-drying.',
        why_it_works:
          'At 200-300°C, hemicellulose decomposes first (220-315°C), releasing acetic acid, furfural, and water. Cellulose begins degrading above 280°C. Lignin partially carbonizes. Resulting biochar is 50-70% fixed carbon with hydrophobic surface due to loss of hydroxyl groups. Aromatization creates stable polycyclic structures resistant to biological attack.',
        the_insight: {
          what: 'Carbonization creates the most stable possible output (100-1000 year half-life in soil) while sequestering carbon from the fast cycle',
          where_we_found_it: {
            domain: 'Biomass energy industry',
            how_they_use_it:
              'Charcoal production has been practiced for millennia; modern torrefaction used for biomass pre-treatment.',
            why_it_transfers:
              'Food waste has similar organic composition to other biomass feedstocks used in torrefaction.',
          },
          why_industry_missed_it:
            "Torrefaction is 'energy industry' technology, not waste management. Fire/explosion risk concerns. Biochar market is emerging, not established.",
        },
        key_uncertainty:
          'Capital cost exceeds target. Safety systems for oxygen exclusion and temperature control add complexity. Air permitting may be required. Biochar market is less developed than compost market.',
        when_to_elevate:
          'Elevate if: (1) biochar market develops locally, (2) carbon credit mechanisms mature, (3) capital budget is flexible, or (4) carbon sequestration is a strategic priority for the organization.',
        ceiling:
          'Biochar sells for $200-500/ton vs. compost at $20-50/ton. Carbon credit potential as markets mature. Each ton produces ~100 kg biochar with 50-70 kg fixed carbon stored for centuries.',
        investment_recommendation:
          '$15,000-25,000 (exceeds target). Consider if carbon sequestration is a strategic priority.',
        validation_approach: {
          test: 'Lab-scale torrefaction of press cake; verify biochar quality and energy balance',
          cost: '$2,000-5,000 (university lab partnership or contract research)',
          go_no_go:
            'GO: Biochar meets quality specs, energy balance confirms partial self-sustaining operation. NO-GO: Excessive tar production, poor energy balance, or permitting barriers.',
        },
      },
    ],
    frontier_watch: [
      {
        id: 'frontier-1',
        title: 'Desiccant Wheel Drying with Solar Regeneration',
        innovation_type: 'EMERGING_SCIENCE',
        trl_estimate: 4,
        one_liner:
          'Rotary desiccant wheel system adapted from HVAC dehumidification for food waste drying, achieving near-zero electrical consumption (20-50 kWh/ton) in sunny climates.',
        why_interesting:
          'If desiccant contamination from food volatiles can be managed, this offers 90%+ energy reduction in sunny climates with proven HVAC technology. Munters and Bry-Air have mature desiccant wheel products; the gap is application to food waste.',
        why_not_now:
          'No commercial system designed for food waste exists. Desiccant contamination from food volatiles (oils, acids) is uncharacterized. Custom engineering required. 4-8 month development timeline.',
        earliest_viability: '2-3 years',
        trigger_to_revisit:
          'Publication demonstrating desiccant stability with food waste volatiles (target journals: Drying Technology, Applied Thermal Engineering) OR commercial pilot announcement by Munters or similar.',
        who_to_monitor:
          'Munters (desiccant dehumidification leader), Bry-Air, NREL solar desiccant cooling research, Fraunhofer ISE',
        recent_developments:
          'NREL and Fraunhofer ISE have active research programs on solar-regenerated desiccant systems for HVAC applications. No food waste-specific work identified in 2024 literature search.',
        competitive_activity:
          "No commercial entities currently targeting food waste desiccant drying. Adjacent: Munters and Bry-Air serve industrial drying markets but haven't announced food waste applications.",
      },
      {
        id: 'frontier-2',
        title: 'Decanter Centrifuge Adaptation from Olive Oil Industry',
        innovation_type: 'EMERGING_SCIENCE',
        trl_estimate: 6,
        one_liner:
          'Two-phase decanter centrifuges from olive oil processing adapted for food waste dewatering at 15-25 kWh/ton.',
        why_interesting:
          'Alfa Laval, GEA, and Pieralisi make small decanters (100-500 L/hr) in the $15-30K range used. Technology is mature and proven for organic slurries. Could offer better performance than screw press for certain waste streams.',
        why_not_now:
          'Food waste heterogeneity (bones, plastics, fibrous materials) may cause rapid wear or jamming. Used equipment availability is uncertain. Higher maintenance requirements than screw press. Capital cost likely exceeds target.',
        earliest_viability: '1-2 years',
        trigger_to_revisit:
          'Successful pilot of decanter on mixed food waste demonstrating >6 month operation without major maintenance issues.',
        who_to_monitor:
          'Alfa Laval, GEA Westfalia, Pieralisi, used olive equipment dealers (particularly in Mediterranean regions)',
        recent_developments:
          'Guillen et al. (2021) in Journal of Cleaner Production documented 10-25 kWh/ton for olive processing decanters. No food waste-specific applications published.',
        competitive_activity:
          'No manufacturers currently marketing decanters for food waste. Opportunity for equipment dealer or integrator to develop this market.',
      },
    ],
  },

  self_critique: {
    overall_confidence: 'high',
    confidence_level: 'medium',
    confidence_rationale:
      'Primary recommendation uses proven, commercial equipment with extensive prior art. Physics are well-understood. Main uncertainties are site-specific (climate, disposal pathways) rather than technical.',
    what_we_might_be_wrong_about: [
      'We may be underestimating the difficulty of finding end-use pathways for non-compost outputs. Market development is often harder than technology development.',
      "We may be overestimating operator willingness to manage semi-manual systems. Commercial kitchens want 'set and forget' solutions, and the screw press + solar cabinet requires daily attention.",
      'Press liquid disposal pathway is assumed but not validated. Some jurisdictions may have stricter limits than expected.',
      "Solar drying performance in variable climates may be worse than estimated. We've assumed 'sunny climate' but haven't quantified the boundary conditions.",
    ],
    validation_gaps: [
      {
        concern: 'Press liquid disposal pathway',
        status: 'EXTENDED_NEEDED',
        rationale:
          'First validation step should include sewer discharge permit verification. Add to validation protocol: contact local water authority to confirm food waste press liquid is acceptable.',
      },
      {
        concern: 'Solar drying performance in variable climates',
        status: 'ACCEPTED_RISK',
        rationale:
          'Mitigated by buffer capacity sizing and electric backup heater option. For consistently cloudy climates, thermal hybrid (sol-support-1) is the appropriate choice.',
      },
      {
        concern: 'Operator willingness for semi-manual systems',
        status: 'ACCEPTED_RISK',
        rationale:
          "This is a site-specific factor that the user must assess. We've noted that 10-15 min/day operation is required. If fully autonomous is required, budget increases to $25-40K for commercial dehydrators.",
      },
      {
        concern: 'End-use pathways for innovation concepts',
        status: 'ADDRESSED',
        rationale:
          "First validation step for fermentation (innov-recommended) explicitly requires identifying disposal partner before proceeding. NO-GO criteria includes 'no disposal pathway within 50 miles.'",
      },
    ],
    unexplored_directions: [
      'Osmotic dehydration (salt/sugar solution pre-treatment) could remove 30-50% of water with zero thermal energy, but adds operational complexity and solution management. Worth investigating if mechanical dewatering alone is insufficient.',
      'Mycelium colonization of food waste for stabilization—proven in packaging industry but not validated for food waste. Could produce value-added output but requires controlled substrate.',
      'Supercritical CO2 extraction—could remove water and valuable compounds simultaneously. Equipment cost historically prohibitive but declining. Long-shot but potentially transformative.',
    ],
  },

  risks_and_watchouts: [
    {
      category: 'Regulatory',
      severity: 'medium',
      risk: 'Press liquid discharge may require sewer permit or exceed BOD/TSS limits in some jurisdictions',
      mitigation:
        'Verify local sewer discharge regulations before purchase. Most jurisdictions permit food waste liquids; some may require grease trap or settling tank.',
    },
    {
      category: 'Market',
      severity: 'high',
      risk: 'No local disposal pathway for non-compost outputs (fermented, lime-stabilized, biochar)',
      mitigation:
        'Identify disposal partners BEFORE committing to innovation concepts. If no pathway exists within economical hauling distance, stick with solution concepts that produce compost-compatible output.',
    },
    {
      category: 'Technical',
      severity: 'medium',
      risk: 'Food waste heterogeneity causes equipment issues (screen clogging, centrifuge wear, fermentation failure)',
      mitigation:
        'Test actual facility waste stream before purchase. Most equipment handles typical institutional waste; unusual compositions (high fat, high fiber) may require pre-treatment or different approach.',
    },
    {
      category: 'Resource',
      severity: 'medium',
      risk: 'Integration engineering for hybrid systems exceeds budget or timeline',
      mitigation:
        "Start with simpler systems (press + solar, press + lime) that require minimal integration. Graduate to thermal hybrid only if simpler approaches don't meet needs.",
    },
    {
      category: 'Technical',
      severity: 'medium',
      risk: 'Solar drying is too slow in cloudy climates, creating throughput bottleneck',
      mitigation:
        'Size buffer capacity for 5-7 days of press cake accumulation. Add electric backup heater for extended cloudy periods. Or choose thermal hybrid (sol-support-1) for consistent throughput.',
    },
  ],

  what_id_actually_do:
    "If this were my project, I'd start with a phone call to Vincent Corporation and ask about their trial program. For a few hundred dollars and a few weeks, you can test a screw press on your actual waste stream and know exactly what you're dealing with. That's the foundation for everything else.\n\nAssuming the press works (it almost certainly will—these things have been dewatering organic slurries since 1929), my next question would be about climate and disposal pathways. If you're in Phoenix or LA with reliable sun, build the solar cabinet and you're done for under $12K. If you're in Seattle or Boston, budget for the thermal hybrid at $15-18K.\n\nBut before I spent a dime on equipment, I'd make some phone calls to local AD facilities and farms. If someone within 30 miles will take wet fermented food waste—or better yet, pay you for it—the fermentation approach is a no-brainer. You're looking at $5K in equipment and essentially zero operating cost. The catch is finding that partner, but it's worth a week of phone calls to find out.\n\nThe innovation concepts (fermentation, BSF, torrefaction) are genuinely interesting, but they require either a non-standard disposal pathway or a higher risk tolerance. I wouldn't pursue them unless the simpler approaches don't fit your specific situation, or unless you're strategically interested in being early to a market that might grow significantly. The fermentation approach in particular could be transformative if AD infrastructure continues to expand—but that's a bet on infrastructure development, not just technology.",

  follow_up_prompts: [
    'Help me design the solar drying cabinet—what dimensions, materials, and configuration for my climate?',
    'Create a detailed implementation plan for the screw press + thermal hybrid system',
    'What questions should I ask Vincent Corporation about their trial program?',
    'Help me find and evaluate local AD facilities that might accept fermented food waste',
    'Compare the 10-year total cost of ownership for the top 3 approaches',
    'What operational changes could reduce our food waste generation before we invest in processing equipment?',
  ],
};
