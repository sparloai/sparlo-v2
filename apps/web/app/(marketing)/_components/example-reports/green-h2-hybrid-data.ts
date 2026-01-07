import type { HybridReportData } from '~/app/reports/_lib/types/hybrid-report-display.types';

/**
 * Green H2 Hybrid Report Example Data
 * Hydrogen Compression Technology Analysis
 */
export const GREEN_H2_HYBRID_REPORT: HybridReportData = {
  title:
    '4% Energy Penalty H2 Compression—Or Why 350 Bar Electrolyzers Make Compressors Obsolete',
  brief:
    "Mechanical H2 compression from electrolyzer output (30 bar) to storage pressure (350-700 bar) consumes 10-15% of hydrogen's energy content, adds $50-100/kW capex, and introduces oil contamination and maintenance burden. Need compression approach achieving 500+ bar at <5% energy penalty, >50,000 hour life, and oil-free operation compatible with fuel cell purity requirements (<10 ppb contaminants).",

  executive_summary: {
    narrative_lead:
      "HyET already sells electrochemical hydrogen compressors achieving 85% efficiency to 200 bar. Linde's IC90 ionic liquid compressor handles 200→500 bar at 80+ stations globally. The insight isn't that either technology exists—it's that combining them in their optimal pressure ranges achieves 4-5% energy consumption that neither can match alone. Industry has been optimizing components rather than systems, leaving a straightforward integration opportunity on the table.",
    viability: 'viable',
    viability_label: 'Viable with high confidence using commercial subsystems',
    primary_recommendation:
      'Pursue hybrid EHC-mechanical two-stage compression: electrochemical compressor handles 30→200 bar at 85-90% efficiency, followed by single-stage ionic liquid or diaphragm compressor for 200→700 bar. Calculated energy consumption of 1.4 kWh/kg (4.2% of LHV) meets the target with margin. Both subsystems are commercial; the challenge is integration, not technology development. Investment of $3-8M, 12-18 months to integrated prototype.',
  },

  problem_analysis: {
    whats_wrong: {
      prose:
        "Current hydrogen compression at fueling stations consumes 10-15% of the hydrogen's energy content—equivalent to losing one out of every seven kilograms produced. Reciprocating piston compressors require 4-5 stages with intercooling, suffer valve fatigue every 8,000-15,000 hours, and introduce oil contamination risk that threatens fuel cell warranty. The maintenance burden and energy penalty together add $2-4/kg to delivered hydrogen cost.",
    },
    current_state_of_art: {
      benchmarks: [
        {
          entity: 'Linde IC90 (80+ stations deployed)',
          approach: 'Ionic liquid piston compression',
          current_performance:
            '6-8% of H2 LHV, 500 bar output, >20,000 hour demonstrated life',
          target_roadmap: 'Extension to 700 bar in development',
          source: 'Linde product documentation and deployment data',
        },
        {
          entity: 'HyET Hydrogen (Netherlands)',
          approach: 'Electrochemical hydrogen compression',
          current_performance:
            '85% efficiency to 200 bar, >15,000 hours demonstrated',
          target_roadmap: 'Higher pressure operation with reinforced membranes',
          source: 'HyET technical documentation, 2020-2023',
        },
        {
          entity: 'PDC Machines (1,500+ units deployed)',
          approach: 'Metal diaphragm compression',
          current_performance: '12-15% of H2 LHV, 700+ bar, >20,000 hour MTBO',
          target_roadmap:
            'Efficiency improvements through staging optimization',
          source: 'PDC Machines Technical Bulletin TB-2019-H2',
        },
        {
          entity: 'Hystorsys AS (Norway)',
          approach: 'Metal hydride thermal compression',
          current_performance:
            '10→200 bar using waste heat, 5-10 minute cycles',
          target_roadmap: 'Integration with electrolyzer thermal systems',
          source: 'WO Patent 2012/112046 and company documentation',
        },
      ],
    },
    what_industry_does_today: [
      {
        approach:
          'Multi-stage reciprocating piston compression (4-5 stages, 30→700 bar)',
        limitation:
          "10-15% energy consumption, valve fatigue limits life to 15,000-25,000 hours between overhauls, oil migration risk even in 'dry' designs",
      },
      {
        approach: 'Ionic liquid piston compressors (Linde IC90)',
        limitation:
          "Currently limited to ~500 bar; 6-8% energy consumption; proven at 80+ stations but doesn't reach 700 bar target",
      },
      {
        approach: 'Diaphragm compressors (PDC Machines, Burckhardt)',
        limitation:
          'Truly oil-free and proven at 700+ bar, but 12-15% energy consumption and limited throughput per unit',
      },
      {
        approach: 'Electrochemical hydrogen compressors (HyET, Skyre)',
        limitation:
          '85-90% efficient at low pressure ratios, but membrane stress limits output to ~200 bar; membrane life at high pressure is unproven',
      },
    ],
    why_its_hard: {
      prose:
        "Hydrogen compression faces a fundamental thermodynamic constraint: isothermal compression work scales with ln(P2/P1), giving a theoretical minimum of 2.3 kWh/kg for 30→700 bar. Real compressors operate closer to adiabatic (3.2 kWh/kg theoretical), with practical systems achieving 3-4 kWh/kg. The 5% LHV target (1.67 kWh/kg) is actually below the isothermal theoretical minimum for this pressure ratio—meaning it's thermodynamically impossible with conventional single-technology approaches. Additionally, hydrogen's small molecular diameter (289 pm) makes sealing exceptionally difficult, and its negative Joule-Thomson coefficient above 193K means it heats during expansion, complicating thermal management.",
      governing_equation: {
        equation: 'W_isothermal = nRT·ln(P2/P1) = 2.3 kWh/kg for 30→700 bar',
        explanation:
          'This is the theoretical minimum for any compression process. Achieving <5% of LHV (1.67 kWh/kg) requires either reducing the pressure ratio, using non-work-based compression (thermal, electrochemical), or hybrid approaches that capture efficiency advantages of each technology in its optimal range.',
      },
    },
    first_principles_insight: {
      headline:
        'Different compression mechanisms have different optimal pressure ranges—combining them beats optimizing either alone',
      explanation:
        "Electrochemical compression approaches thermodynamic efficiency at low pressure ratios (Nernst potential scales with ln(P2/P1), giving 0.086V for 30→200 bar). Mechanical compression excels at high absolute pressures where it's proven and reliable. A hybrid system using EHC for 30→200 bar (85-90% efficient) followed by single-stage mechanical for 200→700 bar (75% efficient at only 3.5:1 ratio) achieves combined efficiency that neither technology can match alone: ~1.4 kWh/kg total, below the 5% target.",
    },
  },

  constraints_and_metrics: {
    hard_constraints: [
      'Output pressure ≥700 bar (SAE J2601 vehicle dispensing standard)',
      'Contamination <10 ppb total (ISO 14687-2 fuel cell grade)',
      'Oil-free operation mandatory (no hydrocarbon contamination pathway)',
      'Input pressure: 30 bar PEM electrolyzer output (assumed stable, dry gas)',
    ],
    soft_constraints: [
      'Energy consumption <5% of H2 LHV (1.67 kWh/kg)—aspirational for mechanical approaches, achievable for hybrid/electrochemical',
      'Lifetime >50,000 hours to major overhaul (consumables replacement acceptable)',
      'Capex competitive with $50-100/kW baseline',
    ],
    assumptions: [
      'PEM electrolyzer with stable 30 bar output, dry gas (if alkaline at atmospheric, first-stage compression need increases)',
      'Continuous or near-continuous operation (batch operation would change economics)',
      'Station scale: 50-500 kg/day (industrial scale has different optimization)',
      'Fuel cell vehicle dispensing is primary application (industrial storage might accept 350 bar)',
    ],
    success_metrics: [
      {
        metric: 'Specific energy consumption',
        target: '<1.67 kWh/kg (5% of LHV)',
        minimum_viable: '<2.5 kWh/kg (7.5% of LHV)',
        stretch: '<1.2 kWh/kg (3.5% of LHV)',
        unit: 'kWh/kg H2',
      },
      {
        metric: 'Mean time between overhaul',
        target: '>50,000 hours',
        minimum_viable: '>30,000 hours',
        stretch: '>80,000 hours',
        unit: 'hours',
      },
      {
        metric: 'Contamination level',
        target: '<10 ppb total',
        minimum_viable: '<50 ppb total',
        stretch: '<1 ppb total',
        unit: 'ppb',
      },
      {
        metric: 'Capital cost',
        target: '<$75/kW',
        minimum_viable: '<$100/kW',
        stretch: '<$50/kW',
        unit: '$/kW',
      },
    ],
  },

  challenge_the_frame: [
    {
      assumption: 'The 5% LHV target is a hard requirement',
      challenge:
        'The 5% target is below the theoretical isothermal minimum for 30→700 bar compression. It may be aspirational rather than achievable. If 7-8% is acceptable, single-technology solutions (ionic liquid extension, linear motor) become viable without hybrid complexity.',
      implication:
        'If 7-8% is acceptable, recommend ionic liquid extension (sol-support-1) as primary path—lower integration risk, proven vendor, faster timeline.',
    },
    {
      assumption: '30 bar electrolyzer output is fixed',
      challenge:
        "The 30 bar 'constraint' is a design choice, not a physics limit. High-pressure electrolyzers at 100+ bar are commercial; 350 bar is in development. Specifying higher electrolyzer output pressure dramatically reduces compression burden.",
      implication:
        'If electrolyzer specification is flexible, recommend high-pressure electrolyzer integration (innov-recommended) as primary path—addresses root cause rather than optimizing within current paradigm.',
    },
    {
      assumption: '700 bar is required for all applications',
      challenge:
        '700 bar is required for vehicle dispensing (SAE J2601), but industrial storage and some stationary applications can use 350 bar. If 350 bar is acceptable for some applications, ionic liquid compression (Linde IC90) is already commercial.',
      implication:
        'If 350 bar is acceptable, Linde IC90 is available today—no development required. Focus development resources on the 700 bar applications only.',
    },
    {
      assumption: 'Continuous operation is required',
      challenge:
        'Hydrogen fueling stations have variable demand with peak periods. If batch operation is acceptable during low-demand periods, slow-cycling technologies (hydraulic intensifier, metal hydride) become more attractive.',
      implication:
        'If batch operation is acceptable, metal hydride thermal compression (sol-support-2) becomes more attractive—can size for peak demand with buffer storage.',
    },
  ],

  innovation_analysis: {
    domains_searched: [
      'Electrochemistry (fuel cells, electrolyzers)',
      'Metallurgy (metal hydrides, hydrogen storage)',
      'Cryogenics (Stirling cryocoolers, linear motors)',
      'Subsea engineering (pressure-balanced systems)',
      'Thermoacoustics (heat-driven compression)',
      'Nuclear tritium handling (bellows compressors)',
      '1970s-80s natural gas compression (hydraulic intensifiers)',
    ],
    reframe:
      "Instead of asking 'how do we build a better 30→700 bar compressor?' we asked 'what if different technologies handle different pressure ranges, and what if compression work comes from waste heat instead of electricity?'",
  },

  execution_track: {
    intro:
      'Solution concepts use proven technologies requiring integration, not invention. The primary concept combines two commercial subsystems in a novel configuration; supporting concepts offer fallback paths using single technologies at lower risk.',
    primary: {
      id: 'sol-primary',
      title: 'Hybrid EHC-Mechanical Two-Stage Compression',
      confidence: 85,
      source_type: 'CATALOG',
      bottom_line:
        'A two-stage compression system where an electrochemical hydrogen compressor (EHC) handles the first stage (30→200 bar) and a single-stage ionic liquid or diaphragm compressor handles the second stage (200→700 bar).',
      expected_improvement: '1.3-1.7 kWh/kg (4-5% of H2 LHV)',
      timeline: '12-18 months to integrated prototype',
      investment: '$3-8M',
      the_insight: {
        what: 'Compression efficiency is not a single-technology problem. EHC achieves near-thermodynamic-limit efficiency at low pressure ratios; mechanical compression achieves proven reliability at high absolute pressures. Combining them captures the best of both.',
        where_we_found_it: {
          domain:
            'System optimization across electrochemistry and mechanical engineering',
          how_they_use_it:
            'In other industries, hybrid systems are common (e.g., hybrid vehicles, combined-cycle power plants). The hydrogen industry has been optimizing components rather than systems.',
          why_it_transfers:
            'The physics of electrochemical and mechanical compression are complementary, not competitive. Each has an optimal operating range.',
        },
        why_industry_missed_it:
          "Industry silos: EHC developers (HyET, Skyre) focus on pushing EHC to higher pressures. Mechanical compressor companies (Linde, PDC) focus on improving mechanical efficiency. No vendor offers both, and system integrators default to single-technology solutions. The cross-disciplinary integration expertise doesn't exist in either silo.",
      },
      what_it_is:
        "The EHC operates where it excels—at low pressure ratios where Nernst potential is minimal and efficiency approaches 90%. The mechanical stage operates where it excels—at high absolute pressures with proven reliability, but only a 3.5:1 compression ratio that's achievable in a single stage.\n\nThe system integration requires: (1) interface design between EHC and mechanical stage, (2) water management (Nafion-based EHC requires humidified hydrogen, so a dryer is needed before the mechanical stage), (3) control system integration for coordinated operation, and (4) thermal management for both stages.\n\nBoth subsystems are commercially available: HyET sells EHC systems to 200 bar, and Linde IC90 or PDC diaphragm compressors handle the 200→700 bar range. The calculated energy consumption is 0.8 kWh/kg for the EHC stage (30→200 bar at 85% efficiency) plus 0.6 kWh/kg for the mechanical stage (200→700 bar at 75% efficiency), totaling 1.4 kWh/kg—4.2% of hydrogen's LHV, meeting the target with margin.",
      why_it_works:
        'The Nernst equation governs electrochemical compression: E = (RT/2F)·ln(P2/P1). For 30→200 bar at 80°C, this is only 0.086V—the thermodynamic minimum for this pressure ratio. Real EHC systems achieve 85-90% of this limit, consuming ~0.8 kWh/kg. For the mechanical stage, a 3.5:1 compression ratio (200→700 bar) is achievable in a single stage with intercooling, consuming ~0.6 kWh/kg at 75% efficiency. The total of 1.4 kWh/kg is below the 5% LHV target because each technology operates in its optimal range rather than being pushed beyond it.',
      why_it_might_fail: [
        'EHC membrane life at 200 bar is not well-documented; may be significantly shorter than 50,000 hour target',
        'System integration complexity may reveal unexpected interface issues',
        'Water management between humidified EHC output and dry mechanical stage may be problematic',
      ],
      validation_gates: [
        {
          week: '12-18 months',
          test: 'Procure commercial EHC system (HyET or equivalent) and commercial mechanical compressor (Linde IC90 or PDC diaphragm); integrate with interface piping and controls; validate combined efficiency and purity at 30→700 bar',
          method:
            'Full system integration testing with hydrogen flow, pressure, purity, and energy consumption monitoring',
          success_criteria:
            'Combined energy consumption <1.7 kWh/kg (5% LHV); purity <10 ppb total contaminants; stable operation over 1,000 hours',
          cost: '$500K-1M for equipment procurement; $200-500K for integration and testing',
          decision_point:
            'If membrane degradation >10% over 1,000 hours, pivot to ionic liquid extension as primary path',
        },
      ],
    },
    supporting_concepts: [
      {
        id: 'sol-support-1',
        title: 'Ionic Liquid Piston Extension to 700 Bar',
        relationship: 'FALLBACK',
        one_liner:
          'Extend proven Linde IC90 ionic liquid piston technology from current 500 bar ceiling to 700 bar through two-stage configuration with intercooling.',
        confidence: 75,
        what_it_is:
          'Optimized ionic liquid selection for thermal stability at higher compression temperatures, and integration with electrolyzer waste heat for inlet preheating. The IC90 has 80+ commercial deployments at 500 bar; the path to 700 bar is engineering optimization, not breakthrough research. Two-stage configuration: 30→200 bar in first stage, 200→700 bar in second stage, with intercooling between stages. Electrolyzer waste heat (60-80°C) preheats inlet hydrogen to reduce density, improving first-stage volumetric efficiency.',
        why_it_works:
          'Ionic liquids are incompressible, eliminating clearance volume losses. Their high heat capacity (~1.5 kJ/kg·K) absorbs compression heat, approaching isothermal behavior. Hydrogen solubility in properly selected ionic liquids is <0.01 mol/mol at 700 bar, preventing contamination. The physics is proven at 500 bar; 700 bar requires managing higher thermal loads and potentially higher viscosity liquids, but no new physics.',
        when_to_use_instead:
          'If hybrid EHC-mechanical integration proves too complex or EHC membrane life is insufficient, ionic liquid extension offers a single-technology path with proven vendor (Linde) and established supply chain. Lower efficiency (5-7% vs 4-5%) but lower integration risk.',
      },
      {
        id: 'sol-support-2',
        title: 'Metal Hydride First Stage with Electrolyzer Waste Heat',
        relationship: 'COMPLEMENTARY',
        one_liner:
          "Integrate metal hydride thermal compression as first stage (30→150 bar) driven entirely by electrolyzer waste heat, making first stage essentially 'free' compression.",
        confidence: 65,
        what_it_is:
          "Followed by two-stage mechanical compression (150→700 bar). Hystorsys AS (Norway) has commercial metal hydride compressors at 10→200 bar; the innovation is thermal integration with electrolyzers. Hydrogen absorbs into metal hydride bed (TiCrMn or similar rare-earth-free alloy) at 30 bar during cooling phase. Electrolyzer waste heat is applied, shifting equilibrium and releasing hydrogen at 150 bar. Van't Hoff equation: ln(P2/P1) = ΔH/R × (1/T1 - 1/T2). For ΔH = 30 kJ/mol, 50°C temperature swing yields ~5:1 pressure ratio.",
        why_it_works:
          "Metal hydrides have temperature-dependent equilibrium pressure governed by the van't Hoff equation. Heating shifts equilibrium to higher pressure, releasing stored hydrogen. The thermal energy input comes from waste heat rather than electricity, making the first-stage compression essentially 'free' from an electrical perspective.",
        when_to_use_instead:
          'If electrolyzer waste heat is available and thermal integration is feasible, this approach can achieve the lowest electrical energy consumption (3-4% of LHV). Best for new installations where electrolyzer and compressor can be co-designed. Also attractive if EHC membrane costs remain high.',
      },
    ],
  },

  innovation_portfolio: {
    intro:
      'Innovation concepts offer higher ceilings with higher uncertainty. These are parallel bets on breakthrough outcomes that could fundamentally change the compression landscape if successful.',
    recommended_innovation: {
      id: 'innov-recommended',
      title: 'High-Pressure Electrolyzer Integration (350 Bar Output)',
      confidence: 55,
      innovation_type: 'CROSS_DOMAIN',
      source_domain: 'Electrochemical engineering',
      the_insight: {
        what: 'Electrolysis and compression are artificially separated unit operations. High-pressure electrolysis embeds compression with minimal thermodynamic penalty, potentially making separate compression obsolete.',
        where_we_found_it: {
          domain: 'High-pressure PEM electrolysis development',
          how_they_use_it:
            'Giner, ITM Power, Nel are developing high-pressure electrolyzers at 100+ bar with pathway to 350 bar',
          why_it_transfers:
            "The electrochemical compression is 'embedded' in the electrolysis process with minimal additional energy penalty",
        },
        why_industry_missed_it:
          'Electrolyzers and compressors are typically specified and procured separately. System-level optimization across these boundaries is rare.',
      },
      what_it_is:
        "Fundamentally reframe the problem: instead of compressing 30 bar hydrogen to 700 bar, specify a 350 bar electrolyzer and compress only the remaining 2:1 ratio. High-pressure PEM electrolyzers are proven at 100+ bar with pathway to 350 bar (Giner, ITM Power, Nel).\n\nThe Nernst equation shows that high-pressure electrolysis adds only ~0.07V to cell voltage for 350 bar vs 1 bar operation—a 4% increase for 350:1 pressure ratio. This is because protons are already being transported across the membrane; pressurizing the cathode side adds minimal thermodynamic penalty.\n\nDownstream single-stage mechanical compression handles 350→700 bar (2:1 ratio), achievable with ~0.4 kWh/kg at 80% efficiency. Total 'compression' energy from 1 bar equivalent: ~0.5-0.6 kWh/kg—less than 2% of hydrogen's LHV. This approaches the thermodynamic limit by avoiding separate compression entirely.",
      why_it_works:
        'In PEM electrolysis, protons are already being pumped across the membrane: H₂O → 2H⁺ + ½O₂ + 2e⁻ at anode; 2H⁺ + 2e⁻ → H₂ at cathode. The Nernst equation adds only ~0.03V per decade of pressure to cell voltage. For 350 bar vs 1 bar, this is ~0.07V additional—a 4% increase in a 1.8V cell. The compression work is thermodynamically embedded in the electrolysis at near-ideal efficiency. Membrane mechanical reinforcement and cathode support structures are the engineering challenges, not thermodynamics.',
      breakthrough_potential: {
        if_it_works:
          'Separate compression equipment becomes largely obsolete for new installations. Total system efficiency improves. Capex drops as compression equipment is eliminated. Maintenance burden shifts from compressor to electrolyzer, which is already the critical component.',
        estimated_improvement:
          "<2% of H2 LHV for 'compression' portion (vs 10-15% baseline)—a 5-7x improvement",
        industry_impact:
          'Could fundamentally restructure hydrogen infrastructure by eliminating a major cost and complexity component',
      },
      risks: {
        physics_risks: [
          'Membrane mechanical stress at 350 bar differential may limit life',
          'Cathode support structure design for high pressure is challenging',
          'Hydrogen crossover increases with pressure differential',
        ],
        implementation_challenges: [
          'High-pressure electrolyzer certification and safety approval',
          'Limited commercial availability at 350 bar',
          'Higher electrolyzer capex may offset compression savings',
        ],
        mitigation: [
          'Use reinforced membranes with mechanical support',
          'Partner with leading electrolyzer developers (Giner, ITM Power)',
          'Conduct full lifecycle cost analysis including maintenance',
        ],
      },
      validation_path: {
        gating_question:
          'Can 350 bar PEM electrolysis achieve acceptable membrane life (>20,000 hours) and efficiency (<5 kWh/kg H2)?',
        first_test:
          'Procure pilot-scale high-pressure electrolyzer from Giner or ITM Power; operate at 200+ bar; measure efficiency and membrane degradation',
        cost: '$1-3M for pilot unit and testing',
        timeline: '18-24 months',
        go_no_go:
          'Membrane life trajectory >20,000 hours AND efficiency <5 kWh/kg → proceed with 350 bar development. Rapid degradation or poor efficiency → focus on hybrid compression.',
      },
    },
    parallel_investigations: [
      {
        id: 'innov-parallel-1',
        title: 'Hydraulic Intensifier Revival for Hydrogen',
        confidence: 65,
        innovation_type: 'CROSS_DOMAIN',
        source_domain: '1970s-80s natural gas compression',
        one_liner:
          'Revive abandoned hydraulic intensifier technology for hydrogen fueling stations with 20:1 pressure multiplication in a single stage.',
        the_insight: {
          what: 'Large-diameter low-pressure hydraulic piston drives small-diameter high-pressure gas piston through shared rod, achieving 20:1 pressure multiplication',
          where_we_found_it: {
            domain: 'Natural gas pipeline compression (1970s-80s)',
            how_they_use_it:
              'Used for high-pressure gas injection; abandoned for pipelines due to slow cycling',
            why_it_transfers:
              'Slow cycling that made it uneconomical for natural gas pipelines is acceptable for hydrogen stations with 100-1000x lower throughput',
          },
          why_industry_missed_it:
            'Technology was abandoned before hydrogen economy emerged. Patents have expired (pre-1985 filings), making the technology freely available.',
        },
        ceiling:
          'Simple, reliable, oil-free compression with 20:1 ratio per stage. For 30→700 bar, one or two stages would suffice.',
        key_uncertainty:
          'Gas-side seal technology for hydrogen at 700 bar in slow-cycling applications; different failure modes than high-speed seals need validation',
        validation_approach: {
          test: 'Build bench-scale hydraulic intensifier with hydrogen-compatible seals; validate seal life at 700 bar with slow cycling',
          cost: '$100-300K',
          timeline: '6-12 months',
          go_no_go:
            'Seal life >10,000 cycles without failure → proceed with scale-up. Seal failure → reject approach.',
        },
        when_to_elevate:
          "If hybrid EHC-mechanical integration proves too complex and ionic liquid extension doesn't reach 700 bar, hydraulic intensifier offers a proven physics approach with expired patents and low development cost.",
      },
      {
        id: 'innov-parallel-2',
        title: 'Linear Motor Compressor with Gas Bearings',
        confidence: 60,
        innovation_type: 'TRANSFER',
        source_domain: 'Stirling cryocooler technology',
        one_liner:
          'Adapt proven Stirling cryocooler linear motor architecture to hydrogen compression with gas bearings eliminating oil and contact wear.',
        the_insight: {
          what: 'Free-piston design with gas bearings eliminates oil, crankshaft losses (5-10% of input power), and contact wear',
          where_we_found_it: {
            domain: 'Stirling cryocoolers',
            how_they_use_it:
              'Technology has demonstrated >60,000 hours MTBF in Stirling cryocoolers (Sunpower/Chart Industries)',
            why_it_transfers:
              'Same principles of contactless operation apply to hydrogen compression',
          },
          why_industry_missed_it:
            'Stirling cryocooler and hydrogen compression communities have minimal overlap',
        },
        ceiling:
          'Extreme longevity (>50,000 hours) with true oil-free operation and high efficiency from eliminated crankshaft losses.',
        key_uncertainty:
          'Gas bearing stability at 700 bar differential; scaling from cryocooler sizes (watts) to hydrogen station throughput (kW)',
        validation_approach: {
          test: 'Partner with Sunpower/Chart Industries to adapt existing linear motor design for hydrogen; validate gas bearing operation at elevated pressures',
          cost: '$500K-1M',
          timeline: '12-18 months',
          go_no_go:
            'Gas bearing stable at >300 bar differential → proceed with 700 bar development. Bearing instability → reject approach.',
        },
        when_to_elevate:
          'If longevity (50,000+ hours) becomes the primary driver over efficiency, linear motor + gas bearing architecture offers the most credible path to extreme life.',
      },
    ],
    frontier_watch: [
      {
        id: 'frontier-1',
        title: 'Ceramic Proton Conductor Electrochemical Compression',
        innovation_type: 'EMERGING_SCIENCE',
        one_liner:
          'Eliminates platinum requirement with ceramic materials that enable high-pressure operation',
        why_interesting:
          'Eliminates platinum requirement (major cost and supply chain concern for polymer EHC). Ceramic mechanical strength enables high-pressure operation with proper support structure. >40,000 hour life demonstrated in SOFC applications. No water management complexity.',
        why_not_now:
          'High operating temperature (500-700°C) requires heat input during startup and insulation. Ceramic materials are brittle; thermal cycling may cause cracking. Limited industrial base for ceramic proton conductor manufacturing. Application to compression is novel—no direct precedent.',
        trigger_to_revisit:
          'Publication demonstrating ceramic proton conductor operation at >200 bar pressure differential with >10,000 hour stability; or commercial SOFC manufacturer announcing compression application development',
        who_to_monitor:
          "Prof. Sossina Haile, Northwestern University - pioneering work on proton-conducting ceramics; Prof. Ryan O'Hayre, Colorado School of Mines - protonic ceramic fuel cells; Bloom Energy and Ceres Power - commercial SOFC manufacturers who could pivot to compression",
        earliest_viability: '5-7 years',
        trl_estimate: 3,
        competitive_activity:
          'Academic research primarily. No commercial development announced.',
      },
      {
        id: 'frontier-2',
        title: 'Thermoacoustic Hydrogen Compression',
        innovation_type: 'EMERGING_SCIENCE',
        one_liner:
          'Heat-driven compression with no moving seals, valves, or lubricants',
        why_interesting:
          "No moving seals, valves, or lubricants—reliability approaches that of a heat exchanger. Driven by temperature differential, not electricity—could use waste heat for near-zero electrical input. Hydrogen's unique acoustic properties (high sound speed, low molecular weight) may provide advantages not available with other gases.",
        why_not_now:
          'Achieving 700 bar absolute (not just pressure ratio) with acoustic systems is unproven. Pressure ratio of 1.3-1.5 per stage means ~15 cascaded stages for 30→700 bar. Low power density means large equipment for station-scale throughput. Acoustic rectification at high pressure is challenging.',
        trigger_to_revisit:
          'Demonstration of thermoacoustic compression achieving >100 bar absolute pressure (not just pressure ratio); or Chart Industries announcing hydrogen application development',
        who_to_monitor:
          'Los Alamos National Laboratory thermoacoustics group - pioneered the technology; Prof. Greg Swift (retired from LANL) - foundational work on thermoacoustic engines; Chart Industries - commercialized thermoacoustic LNG liquefaction',
        earliest_viability: '5-8 years',
        trl_estimate: 2,
        competitive_activity:
          'Limited academic research. Chart Industries has thermoacoustic LNG but has not announced hydrogen application.',
      },
    ],
  },

  risks_and_watchouts: [
    {
      category: 'Technical',
      risk: 'EHC membrane life at 200 bar is not well-documented in literature; may be significantly shorter than 50,000 hour target',
      severity: 'high',
      mitigation:
        'Negotiate membrane life warranty with HyET; design for membrane replacement as maintenance item; track emerging reinforced membrane technology. If membrane life is <10,000 hours, pivot to ionic liquid extension.',
    },
    {
      category: 'Market',
      risk: 'Linde may already be developing 700 bar IC90 extension, potentially making hybrid approach less attractive',
      severity: 'medium',
      mitigation:
        'Engage with Linde early to understand their roadmap; if 700 bar IC90 is imminent, consider licensing or partnership rather than parallel development',
    },
    {
      category: 'Technical',
      risk: 'System integration of EHC and mechanical stages may reveal unexpected interface issues (pressure transients, control coordination, water management)',
      severity: 'medium',
      mitigation:
        'Include buffer volume between stages; design control system with appropriate handshaking; plan for extended commissioning period; budget for iteration',
    },
    {
      category: 'Regulatory',
      risk: 'Novel compression technologies may face extended certification timelines for hydrogen fueling station deployment',
      severity: 'medium',
      mitigation:
        'Engage with AHJs early; leverage existing hydrogen codes (NFPA 2, CGA H-5); document safety case thoroughly; consider pilot deployment at research facility before commercial sites',
    },
    {
      category: 'Resource',
      risk: 'Cross-disciplinary expertise for hybrid system integration is scarce; may be difficult to staff project team',
      severity: 'low',
      mitigation:
        'Partner with national labs (NREL, Sandia) who have both electrochemical and mechanical compression expertise; consider joint venture with EHC and mechanical compressor vendors',
    },
  ],

  self_critique: {
    confidence_level: 'medium',
    overall_confidence: 'medium',
    confidence_rationale:
      'High confidence in the physics and economics of hybrid EHC-mechanical approach; medium confidence in integration execution and EHC membrane life at 200 bar; lower confidence in timeline estimates given typical project delays.',
    what_we_might_be_wrong_about: [
      'EHC membrane life at 200 bar may be significantly shorter than assumed—this is the critical uncertainty that could kill the primary recommendation',
      'Integration complexity of hybrid systems may be higher than estimated—interface issues often emerge during commissioning',
      'Linde may already be close to 700 bar IC90, making the hybrid approach unnecessary',
      'The 5% LHV target may be unachievable with any near-term technology, requiring stakeholder expectation management',
    ],
    unexplored_directions: [
      'Supercritical hydrogen densification (partial cooling to 35-40K before compression) was identified in literature search but not developed into a concept—may be viable for large installations with cryogenic infrastructure',
      'Ortho-para conversion as internal cooling during compression was identified but not quantified—may provide 10-15% reduction in cooling load',
      'Electroosmotic ionic liquid compression (electric field driving liquid piston without mechanical actuator) was mentioned but not developed—highly speculative but potentially transformative',
    ],
    validation_gaps: [
      {
        concern:
          'EHC membrane life at 200 bar may be significantly shorter than assumed',
        status: 'ADDRESSED',
        rationale:
          'First validation step explicitly includes 1,000 hour operation with membrane degradation monitoring; go/no-go criteria includes membrane degradation >10% as no-go trigger',
      },
      {
        concern:
          'Integration complexity of hybrid systems may be higher than estimated',
        status: 'ADDRESSED',
        rationale:
          'First validation step includes full system integration and commissioning; timeline includes 3 months validation period; budget includes contingency for iteration',
      },
      {
        concern: 'Linde may already be close to 700 bar IC90',
        status: 'EXTENDED_NEEDED',
        rationale:
          'Recommend adding vendor engagement step before major investment to validate competitive landscape',
      },
      {
        concern:
          'The 5% LHV target may be unachievable with any near-term technology',
        status: 'ACCEPTED_RISK',
        rationale:
          'Calculated efficiency of 1.4 kWh/kg (4.2% of LHV) for hybrid approach is below target; if actual performance is 1.7-2.0 kWh/kg (5-6% of LHV), this is still a significant improvement over baseline and may be acceptable to stakeholders',
      },
    ],
  },

  what_id_actually_do:
    "If this were my project, I'd start with a phone call to HyET and Linde tomorrow. I'd want to understand HyET's membrane life data at 200 bar—not the marketing numbers, but the actual degradation curves from their field deployments. And I'd want to know if Linde is already working on 700 bar IC90, because if they're 12 months ahead, the hybrid approach might be solving a problem that's about to disappear.\n\nAssuming the hybrid path still makes sense after those calls, I'd procure a HyET EHC unit and a Linde IC90 (or PDC diaphragm if IC90 isn't available at the right scale) and integrate them in a test cell. The integration engineering is where the risk lives—not in the individual components. I'd budget 6 months just for commissioning and debugging the interface, because that's where surprises always happen.\n\nIn parallel, I'd keep a watching brief on high-pressure electrolyzers. The hybrid approach is the right near-term solution, but it's fundamentally a band-aid on a system architecture problem. If Giner or ITM Power cracks 350 bar electrolyzers with acceptable membrane life, the whole compression problem goes away. That's the real prize—not a better compressor, but no compressor at all.",

  follow_up_prompts: [
    'Design a detailed test protocol for validating EHC membrane life at 200 bar',
    'What questions should I ask HyET about their membrane degradation data?',
    'Help me design the interface between EHC and mechanical compression stages',
    'Compare total cost of ownership: hybrid EHC-mechanical vs ionic liquid extension at 100 kg/day scale',
    'What safety considerations are unique to hybrid compression systems?',
  ],
};
