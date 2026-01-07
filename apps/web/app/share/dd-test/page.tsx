import { DDReportDisplay } from '../../app/reports/[id]/_components/dd-report-v2';

// Sample PyroHydrogen DD Report data for testing
const sampleReportData = {
  header: {
    classification: 'Confidential',
    company_name: 'PyroHydrogen',
    date: '2024-01-15',
    report_type: 'Technical Due Diligence Report',
    technology_domain: 'Methane Pyrolysis for Hydrogen Production',
    version: '2.0.0',
  },
  executive_summary: {
    one_paragraph_summary:
      "PyroHydrogen's molten tin-nickel pyrolysis technology is built on sound physics with 25+ years of academic validation—the core mechanism genuinely solves the catalyst deactivation problem that blocked earlier commercialization attempts. The team is exceptionally well-matched to the challenge (CTO with 45 patents, CEO with 25 years at Air Products). However, the commercial projections compress multiple unvalidated assumptions: 100x scale-up in a single step (unprecedented for novel chemical processes), $1,000/ton carbon revenue at scale (unproven market), and lifecycle CI achievable with Texas operations (appears inconsistent with grid electricity). The technology is real; the question is whether the economics and timeline are achievable. Proceed with caution, with milestone-based funding tied to scale-up validation.",
    key_findings: [
      {
        finding:
          'Core molten metal mechanism is scientifically sound and validated by 2,847 hours continuous pilot operation',
        impact: 'HIGH',
        type: 'STRENGTH',
      },
      {
        finding:
          'Team has exceptional directly relevant experience—CTO 45 patents, CEO 25 years Air Products, CFO $2B+ project finance',
        impact: 'HIGH',
        type: 'STRENGTH',
      },
      {
        finding:
          '100x scale-up from pilot to commercial in single step exceeds standard engineering practice',
        impact: 'HIGH',
        type: 'WEAKNESS',
      },
      {
        finding:
          'Carbon revenue assumption ($1,000/ton) is critical to economics but unvalidated at commercial volume',
        impact: 'HIGH',
        type: 'THREAT',
      },
    ],
    scores: {
      technical_credibility: {
        score: 7,
        out_of: 10,
        one_liner:
          'Sound physics, validated pilot, but 100x scale-up is unproven',
      },
      commercial_viability: {
        score: 6,
        out_of: 10,
        one_liner:
          'Clear demand and signed offtake, but carbon revenue and 45V qualification uncertain',
      },
      team_signals: {
        score: 9,
        out_of: 10,
        one_liner:
          'Exceptional team with directly relevant deep experience across all key functions',
      },
      moat_strength: {
        score: 5,
        out_of: 10,
        one_liner:
          'Execution-based moat with 3-5 year durability; no structural barriers',
      },
    },
    verdict: 'PROMISING',
    verdict_confidence: 'MEDIUM',
    recommendation: {
      action: 'PROCEED_WITH_CAUTION',
      rationale:
        'The technology is real, the team is exceptional, and the market timing is favorable.',
      key_conditions: [
        'Negotiate milestone-based funding tied to scale-up validation',
        'Require intermediate demonstration (5,000-10,000 kg/day) before full commercial commitment',
        'Request carbon offtake LOIs before close',
      ],
    },
  },
  one_page_summary: {
    company: 'PyroHydrogen',
    sector: 'Clean Hydrogen / Industrial Decarbonization',
    stage: 'Seed',
    ask: '$25M Series A (estimated)',
    one_sentence:
      'PyroHydrogen converts natural gas into clean hydrogen and solid carbon using molten metal technology.',
    the_bet:
      'If you invest, you are betting that this exceptional team can execute an unprecedented 100x scale-up.',
    key_strength:
      'Exceptional team with directly relevant experience: CTO has 45 molten metal patents.',
    key_risk:
      '100x scale-up from 500 kg/day pilot to 50,000 kg/day commercial facility in a single step.',
    key_question:
      'What is the scale-up strategy—single large reactor or parallel units?',
    closest_comparable:
      'Hazer Group — 70% stock decline due to commissioning delays.',
    expected_return: '5.8x weighted multiple',
    bull_case_2_sentences:
      'Beaumont achieves nameplate capacity by 2028. Air Products acquires for $2B+.',
    bear_case_2_sentences:
      '100x scale-up proves harder than anticipated. Company acquired at 1.5-3x.',
    if_you_do_one_thing: 'Request detailed scale-up engineering plan.',
    verdict_box: {
      overall: 'CAUTION',
      technical_validity: { verdict: 'PLAUSIBLE', symbol: '⚠' },
      commercial_viability: { verdict: 'CHALLENGING', symbol: '⚠' },
      moat_strength: { verdict: 'MODERATE', symbol: '⚠' },
      timing: { verdict: 'RIGHT_TIME', symbol: '✓' },
    },
  },
  problem_primer: {
    one_paragraph_summary:
      'The world needs clean hydrogen for industrial decarbonization.',
    why_this_matters: 'Hydrogen demand is projected to triple by 2050.',
    key_terms: [
      {
        term: 'Turquoise Hydrogen',
        definition: 'Hydrogen produced via methane pyrolysis.',
      },
      {
        term: 'Methane Pyrolysis',
        definition:
          'Thermal decomposition of methane into hydrogen and carbon.',
      },
      {
        term: '45V Tax Credit',
        definition: 'US IRA tax credit for clean hydrogen production.',
      },
    ],
    market_context: 'The global hydrogen market is $150B today.',
    investment_thesis_context:
      'If turquoise hydrogen can achieve $1/kg production costs at scale.',
  },
  technical_thesis_assessment: {
    their_thesis:
      'Catalytic Molten Metal Pyrolysis using Sn-Ni alloy at 1000°C enables continuous hydrogen production.',
    thesis_validity: {
      verdict: 'PLAUSIBLE',
      confidence: 'MEDIUM',
      explanation:
        'The core thesis is scientifically sound. Molten metal pyrolysis genuinely solves the catalyst deactivation problem.',
    },
    mechanism_assessment: {
      mechanism:
        'Methane bubbles through molten Sn-Ni alloy; carbon floats to surface.',
      physics_validity:
        'VALIDATED—well-documented in peer-reviewed literature.',
      precedent: 'KIT/BASF pilot, UC Santa Barbara research.',
      key_uncertainty: 'Carbon removal mechanics at commercial scale.',
    },
    performance_claims: [
      {
        claim: '92% methane conversion',
        theoretical_limit: '>99% at equilibrium',
        verdict: 'VALIDATED',
        explanation: 'Consistent with literature.',
      },
      {
        claim: '99.7% H2 purity',
        theoretical_limit: '>99.9% achievable',
        verdict: 'PLAUSIBLE',
        explanation: 'Achievable with PSA.',
      },
      {
        claim: '$0.87/kg cost',
        theoretical_limit: '~$0.80/kg floor',
        verdict: 'QUESTIONABLE',
        explanation: 'Requires 62% cost reduction.',
      },
    ],
  },
  claim_validation_summary: {
    overview: '4 of 12 technical claims validated, 5 plausible, 3 questionable',
    critical_claims: [
      {
        claim: '92% methane conversion',
        verdict: 'VALIDATED',
        confidence: 'HIGH',
        plain_english: 'Consistent with literature.',
      },
      {
        claim: 'No catalyst deactivation',
        verdict: 'VALIDATED',
        confidence: 'HIGH',
        plain_english: 'Molten metal solves this.',
      },
      {
        claim: '$0.87/kg commercial cost',
        verdict: 'QUESTIONABLE',
        confidence: 'LOW',
        plain_english: 'Requires optimistic assumptions.',
      },
    ],
    triz_findings: {
      key_contradictions:
        'High temperature vs. material degradation; continuous operation vs. carbon accumulation.',
      resolution_quality:
        'PARTIAL—molten metal resolves catalyst deactivation but creates new challenges.',
    },
  },
  solution_landscape: {
    summary: 'PyroHydrogen operates in a competitive turquoise hydrogen space.',
    competitors: [
      {
        name: 'Monolith',
        approach: 'Plasma pyrolysis',
        stage: 'Commercial',
        funding: '$300M+',
        differentiation: 'Higher energy requirements.',
      },
      {
        name: 'C-Zero',
        approach: 'Molten salt',
        stage: 'Pilot',
        funding: '$34M',
        differentiation: 'Different chemistry.',
      },
      {
        name: 'Hazer Group',
        approach: 'Iron ore catalyst',
        stage: 'Commissioning',
        funding: 'Public',
        differentiation: 'Cautionary tale.',
      },
    ],
    market_position:
      'PyroHydrogen differentiates on cost structure and team experience.',
    key_insight:
      'Speed to commercial scale matters—first movers lock up offtake.',
  },
  novelty_assessment: {
    verdict: 'INCREMENTAL',
    what_is_novel:
      '2,847 hours continuous operation; specific reactor engineering.',
    what_is_not_novel:
      'Core concept documented in peer-reviewed literature since 1999-2017.',
    key_prior_art: [
      {
        reference: 'Upham et al. Science 2017',
        relevance: '>95% conversion demonstrated',
        impact: 'Implementation of published science.',
      },
      {
        reference: 'US10322940B2 (BASF, 2019)',
        relevance: 'Bubble column reactor patent',
        impact: 'FTO analysis required.',
      },
    ],
  },
  moat_assessment: {
    overall: {
      strength: 'MODERATE',
      durability_years: 4,
      primary_source: 'Team expertise and first-mover advantage.',
    },
    breakdown: {
      technical: 'MODERATE',
      market: 'MODERATE',
      execution: 'STRONG',
    },
    vulnerabilities: [
      { vulnerability: 'Team concentration—key person risk', severity: 'HIGH' },
      { vulnerability: 'No blocking IP', severity: 'MEDIUM' },
      { vulnerability: 'Tacit operational know-how', severity: 'MEDIUM' },
    ],
  },
  commercialization_reality: {
    summary:
      "PyroHydrogen's path depends on successful Beaumont commissioning.",
    verdict: 'The commercial opportunity is real but the path is challenging.',
    market_readiness: {
      market_exists: true,
      vitamin_or_painkiller: 'Painkiller',
      customer_evidence: 'Signed offtake with Air Products.',
    },
    unit_economics: {
      today: '$2.30/kg at pilot',
      claimed_at_scale: '$0.87/kg',
      credibility: 'Requires 62% cost reduction.',
    },
    path_to_revenue: {
      timeline: 'Q3 2027 from Beaumont',
      capital_required: '$150M+',
      fits_vc_timeline: true,
    },
    scale_up_risk: {
      valley_of_death: '18-24 months commissioning risk',
      stranding_risk: 'Difficult to raise follow-on if underperformance.',
    },
    the_hard_truth: {
      even_if_physics_works:
        'Success depends on carbon pricing and 45V qualification.',
      critical_commercial_question:
        'Can PyroHydrogen achieve competitive economics?',
    },
  },
  risk_analysis: {
    key_risk_summary: 'The 100x scale-up is the critical risk.',
    technical_risks: [
      {
        risk: '100x scale-up fails',
        probability: 'MEDIUM',
        impact: 'HIGH',
        mitigation: 'Intermediate demonstration milestone.',
      },
      {
        risk: 'Carbon removal cannot handle throughput',
        probability: 'MEDIUM',
        impact: 'HIGH',
        mitigation: 'Detailed engineering plan.',
      },
    ],
    commercial_risks: [
      { risk: 'Carbon revenue at $400-500/ton', severity: 'HIGH' },
      { risk: '45V credit at $0.60/kg tier', severity: 'HIGH' },
    ],
    competitive_risks: [
      { risk: 'Monolith captures market share', timeline: 'Already present' },
      { risk: 'C-Zero proves superior', timeline: '18-24 months' },
    ],
  },
  scenario_analysis: {
    bull_case: {
      probability: '20%',
      narrative: 'Beaumont achieves nameplate capacity within 6 months.',
      return: '15-25x',
    },
    base_case: {
      probability: '45%',
      narrative: 'Beaumont reaches 70% capacity after 18 months.',
      return: '4-8x',
    },
    bear_case: {
      probability: '35%',
      narrative: 'Beaumont stuck at 50% capacity.',
      return: '1-2x',
    },
    expected_value: {
      weighted_multiple: '5.8x',
      assessment: 'Reasonable bet with positive expected value.',
    },
  },
  pre_mortem: {
    framing: "It's 2030 and the company has failed. What happened?",
    most_likely_failure: {
      probability: '35%',
      scenario:
        'Beaumont struggled to 50-60% capacity. Green hydrogen costs fell faster than expected.',
      preventable_by:
        'Intermediate scale demonstration. More conservative projections.',
      early_warnings: [
        'Commissioning delays beyond 6 months',
        'Capacity factor below 60%',
        'Unit costs 30%+ above projections',
      ],
    },
    second_most_likely: {
      probability: '25%',
      scenario: 'Technical success but commercial assumptions failed.',
    },
    black_swan: {
      probability: '5%',
      scenario: 'Geological hydrogen extraction proves viable at <$0.50/kg.',
    },
  },
  confidence_calibration: {
    overall_confidence: 'MEDIUM',
    confidence_drivers: [
      {
        factor: 'Physics/mechanism',
        confidence: 'HIGH',
        rationale: '25+ years of academic research.',
      },
      {
        factor: 'Team execution',
        confidence: 'HIGH',
        rationale: 'Directly relevant experience.',
      },
      {
        factor: 'Scale-up success',
        confidence: 'LOW',
        rationale: '100x scale-up unprecedented.',
      },
      {
        factor: 'Commercial assumptions',
        confidence: 'LOW',
        rationale: 'Carbon pricing uncertain.',
      },
    ],
    what_would_change_assessment: {
      upgrade_triggers: [
        'Intermediate demonstration success',
        'Carbon offtake LOIs at $800+',
      ],
      downgrade_triggers: ['Pilot technical issues', 'Key person departure'],
    },
  },
  comparable_analysis: {
    summary: 'Three comparable companies provide context.',
    comparables: [
      {
        name: 'Monolith',
        relevance: 'Direct competitor',
        outcome: '$300M+ raised',
        lesson: 'Execution matters.',
      },
      {
        name: 'Hazer Group',
        relevance: 'Cautionary tale',
        outcome: '70% stock decline',
        lesson: 'First facility is highest risk.',
      },
      {
        name: 'C-Zero',
        relevance: 'Similar approach',
        outcome: '$34M raised',
        lesson: 'Competition validates market.',
      },
    ],
    valuation_context:
      'PyroHydrogen could justify $50-100M pre-money valuation.',
  },
  founder_questions: {
    intro: 'Key questions to explore with the team.',
    questions: [
      {
        question: 'What is the scale-up strategy?',
        why_it_matters: 'Critical risk.',
        good_answer_looks_like: 'Clear rationale.',
        red_flag_answer: 'Dismissive of risk.',
      },
      {
        question: 'Carbon offtake pipeline?',
        why_it_matters: 'Unit economics.',
        good_answer_looks_like: 'Multiple LOIs.',
        red_flag_answer: 'Vague hand-waving.',
      },
      {
        question: 'Renewable electricity strategy?',
        why_it_matters: '45V credit value.',
        good_answer_looks_like: 'Specific PPA discussions.',
        red_flag_answer: 'Assumes highest tier.',
      },
    ],
  },
  diligence_roadmap: {
    summary: 'Recommended diligence activities.',
    activities: [
      {
        activity: 'Scale-up risk assessment',
        purpose: 'Validate feasibility',
        estimated_cost: '$30-50K',
        timeline: '2-3 weeks',
        priority: 'HIGH',
      },
      {
        activity: 'Site visit',
        purpose: 'Observe pilot',
        estimated_cost: '$5-10K',
        timeline: '1-2 days',
        priority: 'HIGH',
      },
      {
        activity: 'FTO analysis',
        purpose: 'Assess IP risk',
        estimated_cost: '$15-25K',
        timeline: '2-4 weeks',
        priority: 'MEDIUM',
      },
      {
        activity: 'Reference calls',
        purpose: 'Validate relationships',
        estimated_cost: '$0',
        timeline: '1 week',
        priority: 'HIGH',
      },
    ],
    total_estimated_cost: '$50-85K',
    recommended_timeline: '4-6 weeks',
  },
  why_we_might_be_wrong: {
    intro: 'Key assumptions and potential blind spots.',
    bull_case_for_skeptics:
      'Exceptional team. Technology is real. Market timing favorable.',
    bear_case_for_optimists:
      '100x scale-up almost never works first try. Carbon markets unproven.',
    key_uncertainties: [
      {
        uncertainty: 'Scale-up execution',
        our_assumption: '70% probability of 70%+ capacity',
        alternative_view: '50% probability historically',
        impact_if_wrong: 'Bear case more likely.',
      },
      {
        uncertainty: 'Carbon pricing',
        our_assumption: '$600/ton base case',
        alternative_view: '$400-500/ton more realistic',
        impact_if_wrong: 'Unit economics deteriorate.',
      },
    ],
    what_we_might_be_missing: 'Team may have insights from pilot operation.',
  },
  verdict_and_recommendation: {
    overall_verdict: { verdict: 'PROMISING', confidence: 'MEDIUM' },
    technical_verdict: {
      verdict: 'PROMISING',
      confidence: 'MEDIUM',
      summary: 'Sound physics. 100x scale-up is the risk.',
    },
    commercial_verdict: {
      verdict: 'CHALLENGING',
      summary: 'Clear demand but compounding risks.',
    },
    recommendation: {
      action: 'PROCEED_WITH_CAUTION',
      conditions: [
        'Milestone-based funding',
        'Intermediate demonstration',
        'Carbon offtake LOIs',
      ],
      derisking_steps: [
        'Independent risk assessment',
        'Site visit',
        'FTO analysis',
        'Reference calls',
      ],
      timeline: '4-6 weeks for comprehensive diligence',
    },
    final_word:
      'PyroHydrogen represents a legitimate shot at commercializing turquoise hydrogen. The technology works at pilot scale. This is fundamentally a bet on execution—the moat is the team, not the technology. Expected value is positive (~5.8x), but with high variance. Structure the investment to manage downside while maintaining exposure to upside.',
  },
};

export default function DDTestPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-lg font-medium text-zinc-900">
            DD Report v2 Test Page
          </h1>
          <p className="text-sm text-zinc-500">
            Testing the antifragile DD report rendering system
          </p>
        </div>
      </div>
      <DDReportDisplay data={sampleReportData} reportId="test-pyrohydrogen" />
    </div>
  );
}

export const metadata = {
  title: 'DD Report v2 Test',
  description: 'Testing the DD Report v2 rendering system',
};
