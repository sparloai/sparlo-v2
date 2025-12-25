import type { HybridReportData } from '~/home/(user)/reports/_lib/types/hybrid-report-display.types';

export const ENERGY_HYBRID_REPORT: HybridReportData = {
  title: 'EV Fleet Thermal Management: Depot-Centric Pre-Conditioning for 40% Winter Range Recovery',
  brief:
    "Refrigerated delivery vans for groceries and pharmaceuticals run diesel-powered compressor units that consume 30-40% of total vehicle fuel. Electric vans eliminate the engine but refrigeration still drains 40-60% of battery capacity, cutting delivery range in half. Current solutions are eutectic plates (limited hold time), oversized batteries (cost/weight), or trailer-mounted diesel gensets (defeats the purpose). Need refrigeration approach that maintains -20°C to +5°C for 8-hour delivery routes while consuming <15% of a 60kWh EV battery. Must handle 50+ door openings per route. Retrofit path preferred—fleet operators won't buy new vehicles just for this.",

  executive_summary: {
    narrative_lead:
      "The transport refrigeration industry has spent decades optimizing the wrong variable. While manufacturers invest millions improving compressor efficiency from COP 1.8 to COP 2.2, door openings alone dump 15-20 kWh of thermal load into cargo spaces—more than your entire 9 kWh budget. The winning strategy isn't better refrigeration; it's eliminating the need for it. By combining supermarket-proven infiltration control (70-85% door loss reduction), step-change insulation (VIP at 5x conventional performance), and depot-charged thermal mass, we can achieve 5-8 kWh total consumption—well under your 9 kWh target—using technologies that exist today.",
    primary_recommendation:
      'Deploy air curtain + strip door systems fleet-wide immediately ($500-1,500/vehicle) for 30-50% thermal load reduction within weeks. Simultaneously pilot VIP-enhanced cargo bodies with optimized PCM on 5-10 vehicles to validate the integrated system achieving 5-8 kWh consumption. This phased approach de-risks the larger investment while capturing immediate savings.',
    viability: 'uncertain',
    viability_label: 'Uncertain - requires validation',
  },

  problem_analysis: {
    whats_wrong: {
      prose:
        'Drivers open rear doors 50+ times per route, each time dumping cold air onto the pavement while warm ambient air floods the cargo space. A single 45-second door opening in 35°C weather can inject 1-2 MJ of thermal load—equivalent to running the compressor at full power for 15-20 minutes just to recover. Meanwhile, the refrigeration unit cycles continuously at 2-4 kW, fighting both this infiltration and the steady heat seeping through mediocre foam insulation. The result: 25-35 kWh consumed over an 8-hour route, leaving EVs with half their expected range.',
    },
    why_its_hard: {
      prose:
        'The fundamental challenge is thermodynamic: maintaining a 55°C temperature differential (from -20°C cargo to 35°C ambient) requires continuous energy input to fight entropy. Vapor compression at these temperatures achieves COP of only 1.5-2.0, meaning every watt of cooling requires 0.5-0.7 watts of electrical input. But the real killer is transient loads—door openings inject massive thermal pulses that overwhelm steady-state calculations. A system designed for 500W steady-state heat ingress must handle 5-10 kW peaks during door recovery, forcing oversized equipment that runs inefficiently most of the time.',
      governing_equation: {
        equation: 'Q_total = U×A×ΔT + ṁ×cp×ΔT (infiltration) + Q_product',
        explanation:
          'Total thermal load combines wall conduction (U×A×ΔT ~500-1200W), air infiltration during door openings (dominant at 30-50% of total), and product heat load. Reducing any term helps, but infiltration offers the largest opportunity.',
      },
    },
    first_principles_insight: {
      headline: 'The vehicle should distribute cold, not generate it',
      explanation:
        'On-vehicle electricity costs $0.30-0.50/kWh equivalent (battery capacity × range value). Depot electricity costs $0.05-0.10/kWh off-peak. This 6-10x cost differential means every kWh of cooling generated at the depot instead of on-vehicle creates massive economic advantage. The vehicle should be a thermal distribution system carrying pre-manufactured cold, not a mobile refrigeration plant.',
    },
    what_industry_does_today: [
      {
        approach: 'Oversized vapor compression units (2-4 kW continuous)',
        limitation:
          'Sized for worst-case recovery, not steady-state. Runs inefficiently at partial load 80% of the time.',
      },
      {
        approach: 'Standard polyurethane foam insulation (50-100mm, R-6/inch)',
        limitation:
          "Allows 800-1,200W heat ingress through walls alone. 'Good enough' when diesel was cheap; devastating for EV range.",
      },
      {
        approach: 'Traditional eutectic plates (NaCl-water solutions)',
        limitation:
          'Limited to 150-180 kJ/kg latent heat. Insufficient capacity for 8 hours with 50+ door openings.',
      },
      {
        approach: 'Bare rear doors with no infiltration mitigation',
        limitation:
          'Door openings account for 30-50% of total thermal load. Supermarkets solved this 40 years ago.',
      },
    ],
    current_state_of_art: {
      benchmarks: [
        {
          entity: 'Lidl UK Fleet (500+ trailers)',
          approach:
            'Eutectic plates + minimal backup compressor, depot charging',
          current_performance:
            '45% energy reduction vs continuous vapor compression (~18 kWh/route)',
          source: 'Lidl UK 2021 Sustainability Report',
        },
        {
          entity: 'va-Q-tec (pharmaceutical containers)',
          approach: 'VIP + PCM passive containers',
          current_performance: '120+ hour temperature maintenance, zero power',
          source: 'va-Q-tec product documentation',
        },
        {
          entity: 'Carrier Transicold Lynx Fleet',
          approach: 'IoT thermal monitoring with conventional refrigeration',
          current_performance:
            '28-35 kWh per 8-hour route (frozen/chilled combo)',
          source: 'Carrier white paper, 2022',
        },
        {
          entity: 'Arktek (PATH/Global Good)',
          approach: 'VIP + ice passive vaccine storage',
          current_performance: '35 days at 2-8°C with zero power input',
          source: 'WHO/UNICEF product information sheet',
        },
      ],
    },
  },

  constraints_and_metrics: {
    hard_constraints: [
      'Temperature compliance: -20°C to +5°C throughout route (regulatory requirement)',
      'Energy budget: ≤9 kWh over 8 hours (15% of 60kWh battery)',
      'Retrofit capability: must work with existing van bodies',
      '50+ door openings per route (operational reality)',
    ],
    soft_constraints: [
      'Multi-zone operation (assumed 30% frozen, 70% chilled—actual ratio varies by route)',
      '8-hour continuous operation (some routes may have depot returns)',
      'Payload capacity preservation (some cargo volume loss may be acceptable for major efficiency gains)',
    ],
    assumptions: [
      'No mid-route charging opportunity available',
      'Rear door access (side access with compartmentalization would significantly ease the problem)',
      'Urban delivery with frequent stops (highway transport has different thermal profile)',
      'Roof-mount modifications acceptable for retrofit',
    ],
    success_metrics: [
      {
        metric: 'Total refrigeration energy consumption',
        target: '≤9 kWh over 8-hour route',
        minimum_viable: '≤12 kWh (20% of battery)',
        stretch: '≤6 kWh (10% of battery)',
        unit: 'kWh',
      },
      {
        metric: 'Temperature compliance',
        target: '100% of route within spec',
        minimum_viable:
          '99% (brief excursions during door recovery acceptable)',
        stretch: '100% with 2°C margin',
        unit: '% time in compliance',
      },
      {
        metric: 'Retrofit installation time',
        target: '<1 week per vehicle',
        minimum_viable: '<2 weeks',
        stretch: '<3 days',
        unit: 'days',
      },
      {
        metric: 'Payback period',
        target: '<3 years',
        minimum_viable: '<5 years',
        stretch: '<2 years',
        unit: 'years',
      },
    ],
  },

  challenge_the_frame: [
    {
      assumption: 'Multi-zone operation (30% frozen, 70% chilled) is required',
      challenge:
        'Actual cargo composition varies significantly by route type. Some routes may be 100% chilled (much easier problem); others may be 50%+ frozen (harder). A single solution may not be optimal.',
      implication:
        'If cargo composition analysis shows strong skew, fleet mix strategy with specialized vehicles may outperform universal multi-temp solution. Separated frozen vault concept becomes more attractive.',
    },
    {
      assumption: '50+ door openings are unavoidable operational reality',
      challenge:
        'Could route optimization, delivery consolidation, or customer pickup lockers reduce door opening frequency? Each eliminated door opening saves 0.3-0.5 kWh.',
      implication:
        'If operational changes could reduce door openings to 30, thermal management becomes dramatically easier. May be worth investing in route optimization software alongside hardware solutions.',
    },
    {
      assumption:
        "Retrofit path is required—fleet operators won't buy new vehicles",
      challenge:
        'If integrated thermal management adds $15,000-20,000 to vehicle cost but saves $3,000/year in energy and extends vehicle range by 60 miles, new-build economics may be compelling.',
      implication:
        'For fleet replacement cycles, purpose-built EV cold chain vehicles with integrated VIP bodies may be more cost-effective than retrofitting conventional vans.',
    },
    {
      assumption: '8-hour continuous operation without depot return',
      challenge:
        'Many urban delivery operations have hub-and-spoke patterns with midday depot returns. If 4-hour segments are acceptable, thermal mass requirements halve.',
      implication:
        'If depot return at 4 hours is possible, simpler eutectic-only solution may be sufficient. Route analysis should identify which routes truly require 8-hour continuous operation.',
    },
  ],

  innovation_analysis: {
    domains_searched: [
      'Supermarket refrigeration',
      'Pharmaceutical cold chain',
      'Mining industry thermal distribution',
      'LNG shipping boil-off management',
      'Building science (Passive House)',
      'Spacecraft thermal control',
      'Biological countercurrent exchange',
      'Abandoned 1960s-80s transport refrigeration',
    ],
    reframe:
      "Instead of asking 'how do we make on-vehicle refrigeration more efficient,' we asked 'how do we eliminate the need for on-vehicle refrigeration entirely.'",
  },

  execution_track: {
    intro:
      'Solution concepts use proven technologies requiring integration, not invention. These represent the lowest-risk path to meeting the 9 kWh target and should be the starting point for any fleet operator.',
    primary: {
      id: 'sol-primary',
      title:
        'Integrated Thermal Management System: VIP + High-Density PCM + Infiltration Control + Right-Sized Active',
      confidence: 78,
      bottom_line:
        'A defense-in-depth thermal architecture combining VIP insulation, high-density PCM thermal storage, air curtain + strip door infiltration control, and right-sized variable-speed compressor to reduce total refrigeration energy consumption to 5-8 kWh over an 8-hour route.',
      expected_improvement:
        '75-85% reduction in refrigeration energy consumption (5-8 kWh vs 25-35 kWh conventional)',
      timeline:
        '12-18 months for integrated prototype, 24-36 months for commercial deployment',
      investment: '$12,000-20,000 per vehicle',
      what_it_is:
        "A defense-in-depth thermal architecture combining four proven technologies into a coherent system. First, vacuum insulated panels (VIP) replace or supplement conventional foam insulation, achieving R-30 per inch versus R-6 for polyurethane—a 5x improvement that reduces wall heat ingress from 800-1,200W to 160-240W. Second, high-density salt hydrate phase change materials (CaCl2·6H2O at 192 kJ/kg for frozen, Na2SO4·10H2O at 254 kJ/kg for chilled buffering) provide 35-45 kWh of thermal storage capacity, handling all transient loads from door openings without active cooling intervention.\n\nThird, a retrofit air curtain + strip door system adapted from supermarket practice reduces door opening infiltration by 70-85%. The air curtain creates a laminar airflow barrier at 3-5 m/s across the door opening, while overlapping PVC strips provide a physical barrier that parts around packages. Fourth, a small variable-speed compressor (300-500W) sized for steady-state heat ingress only—not recovery—runs at optimal efficiency when needed rather than cycling inefficiently.\n\nThe system is orchestrated by IoT thermal monitoring that predicts temperature trajectory based on route data, ambient conditions, and door opening history. The compressor activates only when the thermal model predicts temperature will approach compliance limits, enabling 'thermal coasting' through most of the route.",
      why_it_works:
        'Each subsystem addresses a different thermal load component at its source. VIP reduces conduction through walls (Q = U×A×ΔT) by reducing U by 5-6x. PCM provides thermal mass to absorb transient loads (door openings) without temperature excursion, exploiting the 334 kJ/kg latent heat of phase change. Air curtains reduce infiltration mass flow (ṁ in Q = ṁ×cp×ΔT) by 70-85%. The small compressor then only needs to handle the residual steady-state load of ~200-400W rather than the 2-4 kW peaks that conventional systems must accommodate. Running a small compressor at optimal load is far more efficient than running an oversized compressor at partial load.',
      the_insight: {
        what: 'Multiplicative benefits from addressing each thermal load component optimally, rather than oversizing a single system to handle worst-case',
        where_we_found_it: {
          domain: 'Passive House building standard',
          how_they_use_it:
            'Buildings achieve 90% energy reduction through integrated design: extreme insulation, air-tightness, heat recovery ventilation, and minimal active systems',
          why_it_transfers:
            'Same physics apply—reduce thermal load through passive means, then right-size active systems for residual load',
        },
        why_industry_missed_it:
          'Vendor silos. VIP suppliers sell insulation. PCM suppliers sell thermal storage. Air curtain suppliers sell infiltration control. Refrigeration suppliers sell compressors. No one owns the integrated system optimization problem.',
      },
      why_it_might_fail: [
        'VIP panel puncture during cargo handling causes localized thermal bridging',
        'Integration complexity increases installation time beyond retrofit window',
        'PCM cycling degradation over 1000+ freeze-thaw cycles',
        'Driver bypass of air curtain if perceived as slowing deliveries',
      ],
      validation_gates: [
        {
          week: '1-6',
          test: 'Validate VIP + PCM thermal performance in static chamber test',
          method:
            'Environmental chamber per ASTM C1363 (hot box method) for wall assembly; PCM capacity per ASTM E793 (DSC method)',
          success_criteria:
            'Wall assembly U-value <0.04 W/m²·K (equivalent to R-25); PCM latent heat >180 kJ/kg with <10% degradation over 100 cycles',
          cost: '$15,000-25,000',
          decision_point:
            'U-value >0.06 W/m²·K or PCM degradation >20% → Investigate alternative VIP suppliers or PCM formulations before vehicle pilot',
        },
      ],
    },
    supporting_concepts: [
      {
        id: 'sol-support-1',
        title: 'Retrofit Air Curtain + Strip Door Hybrid System',
        relationship: 'COMPLEMENTARY',
        one_liner:
          'Adapt supermarket infiltration control technology to delivery vans for 75-90% reduction in door opening thermal losses',
        what_it_is:
          'Adapt proven supermarket infiltration control technology to delivery van rear doors. A low-velocity air curtain (battery-powered, 50-100W) activates on door opening, creating a laminar airflow barrier at 3-5 m/s. Heavy-duty PVC strip curtains (2mm thick, 200mm wide, overlapping) provide passive physical barrier when the air curtain is off and during package retrieval. Combined effectiveness: 75-90% infiltration reduction based on supermarket data from Foster et al. (2006).\n\nThis is the highest-impact, lowest-cost intervention available. It addresses the dominant thermal load (door openings at 30-50% of total) with proven technology requiring only mechanical installation. Can be deployed fleet-wide in weeks while longer-term solutions are developed.',
        why_it_works:
          'Air curtain creates momentum barrier (jet velocity × air density) that opposes buoyancy-driven infiltration (stack effect). At 3-5 m/s jet velocity, the momentum flux exceeds buoyancy forces for typical door dimensions and temperature differentials. Strip curtains add physical barrier that requires displacement to pass through, further reducing air exchange. Foster et al. documented 70-85% infiltration reduction with optimized parameters.',
        when_to_use_instead:
          "Deploy immediately to all vehicles regardless of other solution paths. This is not an alternative to the primary concept—it's a prerequisite. The 30-50% thermal load reduction from infiltration control makes all other solutions more effective.",
        confidence: 92,
        validation_summary:
          'Proven technology in supermarket applications for 40+ years. $500-1,500 per vehicle retrofit with 2-4 week installation.',
      },
      {
        id: 'sol-support-2',
        title: 'Optimized Eutectic Plate System with Salt Hydrate PCM',
        relationship: 'FALLBACK',
        one_liner:
          'Replace 1970s NaCl eutectic plates with modern salt hydrate PCMs providing 30-50% higher thermal capacity',
        what_it_is:
          "Replace conventional NaCl eutectic plates with higher-density salt hydrate PCM (calcium chloride hexahydrate at 192 kJ/kg for frozen zone, sodium sulfate decahydrate at 254 kJ/kg for chilled buffering). Increase plate volume by 30% using thinner but more numerous plates distributed throughout cargo space for improved heat transfer. Depot charging using existing electrical infrastructure overnight.\n\nThis represents optimization of existing technology rather than paradigm shift. It's the fallback if VIP integration proves too complex or expensive for retrofit, providing 35-45 kWh thermal storage capacity that extends passive operation duration.",
        why_it_works:
          'Latent heat of phase transition provides isothermal temperature maintenance—the PCM absorbs heat while melting without temperature rise. Higher latent heat per kg means more thermal capacity in same mass/volume. Distributed placement improves heat transfer coefficient by increasing surface area and reducing thermal resistance between air and PCM.',
        when_to_use_instead:
          'Use as primary thermal storage if VIP retrofit proves impractical due to cargo body constraints or cost. Also appropriate for fleet operators seeking lower upfront investment with proven technology, accepting that active cooling backup will be needed more frequently than with full integrated system.',
        confidence: 85,
        validation_summary:
          '$3,000-5,000 per vehicle. 35-45 kWh thermal storage capacity extending passive operation to 6-8 hours.',
      },
    ],
  },

  innovation_portfolio: {
    intro:
      'Innovation concepts offer higher ceilings with higher uncertainty. These represent parallel bets on breakthrough outcomes that could exceed the 9 kWh target significantly or enable entirely new operational models.',
    recommended_innovation: {
      id: 'innov-recommended',
      title: 'Depot-Charged Ice Slurry Thermal Distribution',
      what_it_is:
        'Fundamentally reframe the vehicle as a thermal distribution system, not a refrigeration plant. Load pre-made ice slurry (30% ice fraction in water/glycol mixture) at the depot into an insulated tank. Circulate slurry through heat exchangers distributed in the cargo space using a small pump (~100W). Zero on-board refrigeration—all cold is manufactured at the depot using cheap grid electricity.\n\nThe depot ice slurry generator operates overnight using off-peak electricity at $0.05-0.10/kWh, compared to on-vehicle electrical equivalent of $0.30-0.50/kWh (accounting for battery capacity value and range impact). This 6-10x cost differential fundamentally changes the economics of cold chain logistics.\n\nThe vehicle carries 200-300 kg of ice slurry providing 60-100 kWh of thermal capacity—far exceeding the 8-hour requirement even with 50+ door openings. The only on-vehicle electrical consumption is the circulation pump and fans, totaling 0.8-1.5 kWh over an 8-hour route. This preserves virtually all EV range for driving.',
      why_it_works:
        'Ice slurry exploits the highest latent heat of any practical thermal storage medium: 334 kJ/kg for the water-ice phase transition. Unlike solid ice, slurry is pumpable, enabling distributed cooling throughout the cargo space via circulation. The depot generates ice using efficient industrial equipment (COP 3-4) with cheap off-peak electricity, rather than inefficient mobile equipment (COP 1.5-2) with expensive on-vehicle electricity. The vehicle only needs to circulate the pre-made cold, not generate it.',
      selection_rationale: {
        why_this_one:
          'This concept represents the most fundamental reframe of the problem—questioning whether on-vehicle refrigeration is necessary at all. The 6-10x cost differential between depot and mobile electricity creates compelling economics for any fleet with fixed depot infrastructure. If successful, this architecture could become the industry standard for EV cold chain, similar to how containerization transformed shipping logistics.',
      },
      the_insight: {
        what: 'Cold can be manufactured centrally and distributed as a commodity, just like the pre-mechanical refrigeration ice harvesting industry that moved 25 million tons annually',
        where_we_found_it: {
          domain: 'Mining industry deep mine cooling',
          how_they_use_it:
            'Atlas Copco and Howden pump ice slurry kilometers underground to cool mine faces at 40°C+ ambient temperatures',
          why_it_transfers:
            'Same physics—ice slurry provides 334 kJ/kg latent heat with pumpable distribution. Scale is different but principles are identical.',
        },
        why_industry_missed_it:
          'Industry focused on improving on-board refrigeration efficiency rather than questioning whether on-board generation is necessary. Diesel economics made on-board generation acceptable. EV constraints create new calculus.',
      },
      innovation_type: 'PARADIGM',
      confidence: 55,
      breakthrough_potential: {
        if_it_works:
          'Vehicle electrical consumption drops to <2 kWh for refrigeration—essentially solving the EV cold chain problem completely. Full battery capacity available for driving range.',
        industry_impact:
          'Could become dominant architecture for EV cold chain, similar to how containerization transformed shipping. Depot infrastructure investment creates barriers to entry and competitive moats.',
        estimated_improvement:
          '85-95% reduction in vehicle electrical consumption vs conventional systems (0.8-1.5 kWh vs 25-35 kWh)',
      },
      risks: {
        physics_risks: [
          'Ice blockage in circulation system during operation if ice fraction exceeds optimal range',
          'Slurry capacity may be insufficient for extreme hot days (40°C+ ambient)',
        ],
        implementation_challenges: [
          'Depot infrastructure requirement limits flexibility and requires $50-100K capital per depot',
          'Vehicle weight increases by 250-350 kg from slurry tank and contents',
        ],
        mitigation: [
          'Maintain ice fraction <35% with glycol additive; proven circulation designs from mining industry',
          'Size for worst-case with 50% margin; backup small compressor for emergency cooling',
          'Start with largest depots serving highest-volume routes; demonstrate ROI before broader rollout',
        ],
      },
      validation_path: {
        gating_question:
          'Can ice slurry circulation maintain cargo temperature through simulated delivery route with door openings?',
        first_test:
          'Bench-scale thermal simulation: 50-liter insulated chamber with ice slurry circulation, simulated door openings (heated air injection), temperature monitoring',
        go_no_go:
          'GO if chamber maintains -18°C through 8-hour simulation with 50 thermal shock events. NO-GO if temperature excursions exceed 3°C or slurry consumption exceeds 150% of calculated requirement',
        cost: '$5,000-10,000',
        timeline: '6-8 weeks',
      },
    },
    parallel_investigations: [
      {
        id: 'innov-parallel-1',
        title: 'Separated Frozen Vault + Passive Chilled Architecture',
        what_it_is:
          'Challenge the assumption that frozen and chilled must share a compartment. Create a small, heavily optimized frozen vault (50-100 liters, VIP walls at R-150 effective, dedicated PCM at -29°C) for the ~20% of cargo requiring -20°C. The main cargo space operates as passive chilled using standard insulation, PCM buffering at +4°C, and minimal intervention. Right-size each zone for actual thermal requirements rather than designing the entire space for worst-case frozen.\n\nThe frozen vault achieves heat ingress of <20W due to small surface area and extreme insulation. With 20 kg of eutectic plates at -29°C providing 1.1 kWh thermal capacity, the vault can maintain temperature for 15+ hours passively. The chilled zone at +4°C has much lower thermal gradient to ambient (31°C vs 55°C for frozen), making passive operation far more practical.',
        why_it_works:
          'Thermal load scales with temperature differential (Q ∝ ΔT). Maintaining -20°C vs 35°C ambient (ΔT=55°C) requires 3-4x the energy of maintaining +4°C (ΔT=31°C). By separating zones and optimizing each independently, the frozen vault can be made extremely efficient through small size and extreme insulation, while the chilled zone can operate passively most of the time.',
        the_insight: {
          what: 'Current multi-temp vehicles massively over-provision frozen capacity—maintaining the entire cargo space at -20°C when only 20% of cargo requires it',
          where_we_found_it: {
            domain: 'Grocery delivery and pharmaceutical cold chain',
            how_they_use_it:
              'Grocery delivery composition data shows frozen is typically minority of volume; pharmaceutical cold chain uses nested thermal zones',
            why_it_transfers:
              'Same principle of matching thermal investment to actual cargo requirements',
          },
          why_industry_missed_it:
            'Industry prioritizes flexibility over efficiency. Multi-zone vehicles exist but both zones are actively cooled. The concept of a passive chilled zone is counter to industry instinct.',
        },
        innovation_type: 'FIRST_PRINCIPLES',
        confidence: 65,
        key_uncertainty:
          'Frozen vault capacity may be insufficient for frozen-heavy routes (>30% frozen cargo). Requires fleet mix planning with some conventional multi-temp vehicles for outlier routes.',
        ceiling:
          '1-3 kWh total consumption (backup compressor only for hot days)',
        validation_approach: {
          test: 'Analyze 30 days of delivery manifest data to determine actual frozen:chilled ratio across route types',
          go_no_go:
            'GO if >70% of routes have <30% frozen cargo volume. NO-GO if >50% of routes exceed 30% frozen → separated architecture has limited applicability',
          cost: '$2,000-5,000',
        },
        when_to_elevate:
          'Elevate to primary innovation if cargo composition analysis shows strong skew toward chilled (>80% of routes with <25% frozen). This architecture becomes optimal when frozen is truly minority use case.',
      },
      {
        id: 'innov-parallel-2',
        title: 'Thermal Budget Management with Predictive Coasting',
        what_it_is:
          "Adopt LNG shipping's boil-off management philosophy: accept gradual temperature drift and intervene minimally. Use IoT sensors and route data to predict thermal trajectory. Allow temperature to drift within compliance band (-25°C to -18°C for frozen), activating cooling only when approaching limits. Start routes with cargo pre-cooled to -25°C, providing 7°C thermal buffer for passive coasting.\n\nThe system uses a thermal model incorporating ambient conditions, cargo mass, insulation performance, and door opening history to predict temperature trajectory 2 hours ahead. Compressor activates only when the model predicts temperature will exceed -19°C within 30 minutes, enabling 'just-in-time' cooling rather than continuous operation.",
        why_it_works:
          "Thermal mass provides natural buffering—temperature changes slowly when cargo has significant mass. By starting at -25°C instead of -20°C, the system has 7°C of 'thermal runway' before reaching compliance limits. Predictive control uses this runway intelligently, running the compressor at optimal efficiency when needed rather than cycling inefficiently to maintain exact setpoint.",
        the_insight: {
          what: 'Compliance requires staying within a band, not maintaining exact temperature. Over-cooling is waste.',
          where_we_found_it: {
            domain: 'LNG shipping and building HVAC',
            how_they_use_it:
              'LNG shipping accepts 0.1-0.15% daily boil-off; building HVAC uses model predictive control for 20-40% energy savings',
            why_it_transfers:
              'Same thermal management principles apply to vehicle cold chain',
          },
          why_industry_missed_it:
            "Industry culture of 'always-on' cooling for safety margin. Liability concerns about temperature excursions. Lack of confidence in predictive models.",
        },
        innovation_type: 'CROSS_DOMAIN',
        confidence: 70,
        key_uncertainty:
          'Prediction errors could cause compliance violations. Requires robust fallback to conventional control and extensive validation across route types.',
        ceiling:
          '30-50% reduction in active cooling energy through smarter control',
        validation_approach: {
          test: 'Develop thermal model and validate prediction accuracy on 10 instrumented routes',
          go_no_go:
            'GO if model achieves ±1°C prediction accuracy over 2-hour horizon on >90% of test routes. NO-GO if prediction errors exceed ±2°C → model needs refinement before deployment',
          cost: '$10,000-20,000',
        },
        when_to_elevate:
          'Elevate to primary if fleet already has IoT infrastructure and thermal monitoring. This is a software upgrade that can be deployed rapidly to existing systems, providing immediate savings while hardware solutions are developed.',
      },
    ],
    frontier_watch: [
      {
        id: 'frontier-1',
        title: 'Magnetocaloric Refrigeration',
        one_liner:
          'Magnetocaloric materials heat up when magnetized and cool when demagnetized—COP of 5-10 with no compressor or refrigerant gases',
        why_interesting:
          'If commercialized for transport scale, magnetocaloric could provide 50-75% efficiency improvement over vapor compression with zero refrigerant emissions. The solid-state nature (no compressor, no refrigerant) offers reliability advantages.',
        why_not_now:
          'Technology readiness level 4-5. Laboratory prototypes exist but commercial systems are limited to wine coolers and small appliances. Cost per watt of cooling is 10-20x vapor compression. Rare earth material supply chain concerns for gadolinium-based systems.',
        innovation_type: 'EMERGING_SCIENCE',
        trl_estimate: 5,
        earliest_viability: '5-7 years for transport applications',
        trigger_to_revisit:
          'Commercial magnetocaloric system >500W cooling capacity at <$50/W cost announced; or major automotive OEM announces magnetocaloric development program for vehicle applications',
        who_to_monitor:
          'Cooltech Applications (France), Astronautics Corporation (NASA contractor), Prof. Karl Sandeman at Imperial College London, BASF (La-Fe-Si materials)',
        recent_developments:
          'Haier launched magnetocaloric wine cooler in 2022 (first consumer product). Cooltech raised €15M Series B in 2023 for commercial refrigeration applications. BASF published 2024 paper on La-Fe-Si materials achieving 95% of gadolinium performance without rare earth dependency.',
        competitive_activity:
          'Haier (consumer products), Cooltech (commercial refrigeration), Astronautics (aerospace). No announced programs for transport refrigeration specifically.',
      },
      {
        id: 'frontier-2',
        title: 'Radiative Sky Cooling Roof Integration',
        one_liner:
          'Metamaterial films that emit infrared radiation to the cold sky, providing 250-800W passive cooling from van roof area',
        why_interesting:
          'Zero electrical consumption. Provides supplemental cooling that reduces active system load by 10-20%. Technology is commercializing for buildings (SkyCool Systems) and could transfer to vehicles.',
        why_not_now:
          'Performance varies significantly with humidity and cloud cover—800W in Arizona, 200W in Florida. Moving vehicle complicates thermal coupling to cargo space. Film durability under vehicle conditions (vibration, UV, dirt) unproven. Economics are marginal except in dry climates.',
        innovation_type: 'EMERGING_SCIENCE',
        trl_estimate: 6,
        earliest_viability: '2-3 years',
        trigger_to_revisit:
          'SkyCool or competitor announces vehicle-specific product; or cost drops below $25/m² enabling broader economic viability',
        who_to_monitor:
          'SkyCool Systems (Stanford spinout), Prof. Shanhui Fan at Stanford, 3M (building applications)',
        recent_developments:
          'SkyCool deployed first commercial building installation in 2023. 3M announced radiative cooling film product line in early 2024. Academic papers in 2024 demonstrate improved performance in humid conditions through optimized emissivity spectrum.',
        competitive_activity:
          'SkyCool (buildings), 3M (films), multiple academic groups. No announced vehicle applications.',
      },
      {
        id: 'frontier-3',
        title: 'Liquid Nitrogen Cryogenic Reservoir Revival',
        one_liner:
          'Revival of 1960s LN2 spray cooling—50-100 kg LN2 provides 40-60 kWh cooling with zero electrical consumption',
        why_interesting:
          'Zero vehicle electrical consumption for frozen zone. LN2 infrastructure already exists at many food processing depots. Proven technology requiring integration, not invention. Could be combined with passive chilled zone for complete solution.',
        why_not_now:
          'Requires depot LN2 supply infrastructure. Safety systems needed for oxygen displacement risk (proven solutions exist from food industry). LN2 production consumes ~0.5 kWh/kg, so lifecycle energy benefit depends on depot electricity source. Best suited for frozen-only or frozen-dominant routes.',
        innovation_type: 'PARADIGM',
        trl_estimate: 7,
        earliest_viability: '18-24 months',
        trigger_to_revisit:
          'Major food retailer announces LN2 cold chain pilot; or industrial gas supplier launches transport refrigeration product',
        who_to_monitor:
          'Linde/Praxair (LN2 suppliers with food industry relationships), Air Liquide, Dearman/Highview Power (liquid air technology)',
        recent_developments:
          'Highview Power (Dearman successor) raised £70M in 2023 for liquid air energy storage, though focus shifted from transport to grid storage. Linde expanded food-grade LN2 distribution network in 2024. No recent transport refrigeration announcements.',
        competitive_activity:
          'Technology is mature but no active commercial programs for transport refrigeration. Opportunity for first mover.',
      },
    ],
  },

  risks_and_watchouts: [
    {
      risk: 'VIP durability under commercial delivery abuse is unproven at scale',
      category: 'Technical',
      severity: 'high',
      mitigation:
        'Pilot program on 5-10 vehicles with intensive monitoring before fleet rollout; develop protective facing and modular replacement system; establish inspection protocols',
    },
    {
      risk: 'Fleet operators may resist capital investment given uncertain EV adoption timelines',
      category: 'Market',
      severity: 'medium',
      mitigation:
        'Offer leasing/service models; demonstrate ROI with pilot data; align with regulatory pressure for zero-emission urban delivery zones',
    },
    {
      risk: 'Multi-vendor integration requires coordination across VIP, PCM, air curtain, and compressor suppliers',
      category: 'Resource',
      severity: 'medium',
      mitigation:
        'Identify or become system integrator; develop standardized retrofit kits for common van models; consider partnership with cargo body manufacturer',
    },
    {
      risk: 'Temperature compliance documentation requirements may not accommodate predictive coasting approach',
      category: 'Regulatory',
      severity: 'medium',
      mitigation:
        'Engage with food safety regulators early; demonstrate continuous monitoring provides better compliance evidence than periodic checks; pilot with progressive customers',
    },
    {
      risk: 'Driver bypass of infiltration control systems if perceived as slowing deliveries',
      category: 'Technical',
      severity: 'medium',
      mitigation:
        'Automatic activation tied to door sensors; clear training on energy/range benefits; consider incentive programs; design for minimal delivery time impact',
    },
    {
      risk: 'Depot infrastructure investment for ice slurry or LN2 approaches requires significant capital',
      category: 'Resource',
      severity: 'high',
      mitigation:
        'Start with largest depots serving highest-volume routes; demonstrate ROI before broader rollout; consider shared infrastructure models',
    },
  ],

  self_critique: {
    overall_confidence: 'medium',
    confidence_rationale:
      'High confidence in physics and component-level performance based on literature; medium confidence in integrated system performance and real-world durability due to limited fleet-scale validation data',
    what_we_might_be_wrong_about: [
      'VIP durability under commercial delivery abuse—no fleet-scale data exists; pharmaceutical containers operate in gentler environments',
      'Ice slurry handling operational complexity—mining industry operates at larger scale with different constraints; vehicle integration may surface unexpected issues',
      'Driver adoption of door management systems—behavioral change is harder than technical change; resistance could undermine theoretical savings',
      'Thermal model accuracy for predictive control—building HVAC data may not transfer to mobile applications with frequent door openings',
      'PCM cycling stability over 5+ years—accelerated testing may not capture real-world degradation patterns',
    ],
    validation_gaps: [
      {
        concern: 'VIP durability under commercial delivery abuse',
        status: 'ADDRESSED',
        rationale:
          'First validation step includes 6-month pilot with intensive monitoring; protective facing and modular replacement system specified in concept',
      },
      {
        concern: 'Driver adoption of door management systems',
        status: 'ACCEPTED_RISK',
        rationale:
          'Mitigated through automatic activation and training, but behavioral change remains inherent risk. Monitoring driver compliance during pilot will provide data.',
      },
      {
        concern: 'PCM cycling stability over 5+ years',
        status: 'EXTENDED_NEEDED',
        rationale:
          'First validation step covers 100 cycles; should extend to 500+ cycle accelerated aging test before fleet commitment',
      },
      {
        concern: 'Ice slurry handling operational complexity',
        status: 'ADDRESSED',
        rationale:
          'Bench-scale validation specified before vehicle integration; depot infrastructure investment gated on vehicle-side proof',
      },
    ],
    unexplored_directions: [
      'Thermoelectric spot cooling for frozen vault—modern materials achieve COP 1.0-1.5; may be viable for small frozen compartment where solid-state reliability is valued',
      'Adsorption refrigeration using EV waste heat—EVs generate waste heat from power electronics that is currently rejected; could potentially drive absorption cycle for supplemental cooling',
      'Compartmentalized access (side doors with curtained sections)—if operational changes are acceptable, never opening full cargo space could reduce infiltration by 80%+',
    ],
  },

  what_id_actually_do:
    "If this were my fleet, I'd move in three parallel tracks starting tomorrow.\n\nFirst, I'd order air curtain + strip door kits for every vehicle in the fleet. This is a no-brainer—$500-1,500 per vehicle, 2-week installation, 30-50% thermal load reduction. The ROI is measured in months, not years. I'd make this mandatory and track compliance through driver feedback and energy monitoring. This alone might get some vehicles close to the 9 kWh target on mild days.\n\nSecond, I'd select 5-10 vehicles for a VIP + PCM pilot. I'd work with va-Q-tec or a similar supplier to develop a retrofit kit for my most common van model. The goal is to validate the integrated system achieving 5-8 kWh consumption over a real 8-hour route with 50+ door openings. I'd instrument these vehicles heavily—temperature sensors throughout the cargo space, energy monitoring on every component, GPS-correlated door opening logs. Six months of data would tell me whether to roll out fleet-wide or iterate on the design.\n\nThird, I'd commission a cargo composition analysis across all routes. If the data shows that 80% of routes have <25% frozen cargo, I'd seriously consider the separated frozen vault architecture. This could be even simpler and cheaper than the full integrated system while achieving similar energy performance.\n\nThe ice slurry concept is the most exciting long-term, but I wouldn't bet the fleet on it without proving the vehicle-side system works first. Once I have depot infrastructure investment on the table, I need confidence that the thermal distribution approach actually delivers. I'd run a bench-scale validation in parallel with the vehicle pilots.\n\nWhat I would not do is wait for perfect information. The air curtain intervention is so obviously positive that delaying it to study more options is just leaving money on the table. Start there, learn fast, and iterate.",

  follow_up_prompts: [
    'Create a detailed implementation plan for the air curtain + strip door fleet rollout, including supplier selection, installation training, and compliance monitoring',
    'Help me design the VIP + PCM pilot program: vehicle selection criteria, instrumentation requirements, success metrics, and decision gates',
    'Analyze the economics of ice slurry depot infrastructure at different fleet sizes (10, 50, 200 vehicles)',
    'What questions should I ask VIP suppliers about durability, warranty, and retrofit integration?',
    'Compare the total cost of ownership for integrated thermal management vs oversized battery approach over 5-year vehicle life',
  ],
};
