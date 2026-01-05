/**
 * Test script to validate the DD Report schema against sample JSON
 * Run with: npx tsx test-schema.ts
 */
import { parseDDReport } from './schema';

// Sample JSON extracted from due-diligence-json.rtf
const sampleData = {
  result: {
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
          "The technology is real, the team is exceptional, and the market timing is favorable. However, the 100x scale-up risk is significant, and the investment case depends on multiple optimistic assumptions holding simultaneously. This is a reasonable bet with positive expected value (~5.8x), but requires careful structuring to manage downside.",
        key_conditions: [
          'Negotiate milestone-based funding tied to scale-up validation',
          'Require intermediate demonstration (5,000-10,000 kg/day) before full commercial commitment',
          'Request carbon offtake LOIs before close',
          'Require renewable electricity PPA execution for 45V qualification',
          'Model scenarios with $400-500/ton carbon and $0.60/kg 45V credit tier',
        ],
      },
    },
    one_page_summary: {
      company: 'PyroHydrogen',
      sector: 'Clean Hydrogen / Industrial Decarbonization',
      stage: 'Seed',
      ask: '$25M Series A (estimated)',
      one_sentence:
        "PyroHydrogen converts natural gas into clean hydrogen and solid carbon using molten metal technology, targeting $0.87/kg production cost—cheaper than any clean hydrogen alternative.",
      the_bet:
        'If you invest, you are betting that this exceptional team can execute an unprecedented 100x scale-up of unproven molten metal technology before green hydrogen costs fall enough to close the turquoise market window.',
      key_strength:
        'Exceptional team with directly relevant experience: CTO has 45 molten metal patents, CEO spent 25 years at Air Products, CFO has $2B+ in project finance experience.',
      key_risk:
        '100x scale-up from 500 kg/day pilot to 50,000 kg/day commercial facility in a single step—unprecedented for novel chemical processes and the highest technical risk in the proposal.',
      key_question:
        'What is the scale-up strategy—single large reactor or parallel units—and what intermediate validation exists between pilot and commercial scale?',
      closest_comparable:
        "Hazer Group — First-of-kind methane pyrolysis facility experienced 70% stock decline due to commissioning delays and cost overruns, illustrating the pattern PyroHydrogen must avoid.",
      expected_return:
        '5.8x weighted multiple (20% bull at 20x, 45% base at 6x, 35% bear at 1.5x)',
      bull_case_2_sentences:
        'In the best case, Beaumont achieves nameplate capacity by 2028, validating the technology and enabling rapid facility replication. Air Products acquires PyroHydrogen for $2B+ by 2030, delivering 15-25x returns.',
      bear_case_2_sentences:
        'The main risk is that 100x scale-up proves harder than anticipated, Beaumont struggles to 50-60% capacity, and green hydrogen costs fall faster than projected. The company becomes a single-facility business acquired at 1.5-3x for technology and team.',
      if_you_do_one_thing:
        'Request detailed scale-up engineering plan and negotiate milestone-based funding tied to intermediate demonstration (5,000-10,000 kg/day) before full commercial commitment.',
      verdict_box: {
        overall: 'CAUTION',
        technical_validity: { verdict: 'PLAUSIBLE', symbol: '⚠' },
        commercial_viability: { verdict: 'CHALLENGING', symbol: '⚠' },
        moat_strength: { verdict: 'MODERATE', symbol: '⚠' },
        timing: { verdict: 'RIGHT_TIME', symbol: '✓' },
      },
    },
    technical_thesis_assessment: {
      their_thesis:
        'Catalytic Molten Metal Pyrolysis using Sn-Ni alloy at 1000°C enables continuous hydrogen production without catalyst deactivation, achieving $0.87/kg cost at commercial scale.',
      thesis_validity: {
        verdict: 'PLAUSIBLE',
        confidence: 'MEDIUM',
        explanation:
          "The core thesis is scientifically sound. Molten metal pyrolysis genuinely solves the catalyst deactivation problem—carbon floats instead of fouling because of the density differential (C: 2.2 g/cm³ vs Sn: 6.5 g/cm³). This is validated by 25+ years of academic research and PyroHydrogen's 2,847 hours of continuous pilot operation.",
      },
      mechanism_assessment: {
        mechanism:
          'Methane bubbles through molten Sn-Ni alloy; dissolved Ni catalyzes C-H bond cleavage; carbon nucleates and floats to surface for continuous removal',
        physics_validity:
          'VALIDATED—the mechanism is well-documented in peer-reviewed literature and demonstrated at pilot scale',
        precedent:
          'KIT/BASF pilot, UC Santa Barbara research (Upham et al. Science 2017), multiple academic labs worldwide',
        key_uncertainty:
          'Carbon removal mechanics at commercial scale (150,000+ kg/day)—this is the critical engineering unknown',
      },
      performance_claims: [
        {
          claim: '92% methane conversion efficiency',
          theoretical_limit: '>99% at thermodynamic equilibrium at 1000°C',
          verdict: 'VALIDATED',
          explanation:
            'Consistent with peer-reviewed literature. Actually conservative relative to theoretical limits, which increases credibility.',
        },
        {
          claim: '99.7% H2 purity',
          theoretical_limit: '>99.9% achievable with standard separation',
          verdict: 'PLAUSIBLE',
          explanation:
            'Achievable with standard PSA purification. Need impurity composition data to confirm.',
        },
        {
          claim: '$0.87/kg commercial cost',
          theoretical_limit: '~$0.80/kg floor based on feedstock + energy',
          verdict: 'QUESTIONABLE',
          explanation:
            'Requires 62% cost reduction from pilot through assumptions that are individually reasonable but collectively optimistic. Realistic range is $1.10-1.60/kg.',
        },
      ],
    },
    claim_validation_summary: {
      overview:
        '4 of 12 technical claims validated, 5 plausible but need verification, 3 questionable',
      critical_claims: [
        {
          claim: '92% methane conversion',
          verdict: 'VALIDATED',
          confidence: 'HIGH',
          plain_english:
            'The conversion efficiency claim is consistent with peer-reviewed literature and thermodynamic limits.',
        },
        {
          claim: 'No catalyst deactivation',
          verdict: 'VALIDATED',
          confidence: 'HIGH',
          plain_english:
            'The molten metal approach genuinely solves the deactivation problem that killed earlier attempts.',
        },
        {
          claim: '$0.87/kg commercial cost',
          verdict: 'QUESTIONABLE',
          confidence: 'LOW',
          plain_english:
            'Requires multiple optimistic assumptions to hold simultaneously. Realistic range is $1.10-1.60/kg.',
        },
      ],
      triz_findings: {
        key_contradictions:
          'High temperature for kinetics vs. material degradation; continuous operation vs. carbon accumulation; catalytic activity vs. catalyst lifetime',
        resolution_quality:
          'PARTIAL—molten metal elegantly resolves the catalyst deactivation contradiction but creates new challenges (tin losses, scale-up complexity)',
      },
    },
    novelty_assessment: {
      verdict: 'INCREMENTAL',
      what_is_novel:
        "PyroHydrogen's genuine novelty lies in: (1) achieving 2,847 hours continuous operation—longer than any published molten metal pyrolysis run; (2) specific reactor engineering and carbon removal system design; (3) operational know-how from 18 months of pilot operation. These are meaningful engineering achievements but not scientific breakthroughs.",
      what_is_not_novel:
        'The core concept (molten metal methane pyrolysis), alloy chemistry (Sn-Ni catalysis), mechanism (carbon flotation), and basic reactor configuration are all documented in peer-reviewed literature dating to 1999-2017. This is implementation of established science, not invention.',
      key_prior_art: [
        {
          reference:
            "Upham et al. Science 2017 - 'Catalytic molten metals for the direct conversion of methane'",
          relevance:
            'Demonstrated >95% conversion with Ni-Bi alloys at 1065°C with clean carbon separation',
          impact:
            "Establishes that PyroHydrogen's approach is implementation of published science, not proprietary invention",
        },
        {
          reference:
            'US10322940B2 (BASF, 2019) - Bubble column reactor patent',
          relevance: 'Broad claims on molten metal bubble column configurations',
          impact:
            'Freedom-to-operate analysis required; potential licensing requirements',
        },
      ],
    },
    moat_assessment: {
      overall: {
        strength: 'MODERATE',
        durability_years: 4,
        primary_source:
          "Team expertise and first-mover advantage in securing offtake agreements. The technology is replicable; the execution lead is the real moat.",
      },
      breakdown: {
        technical: 'MODERATE',
        market: 'MODERATE',
        execution: 'STRONG',
      },
      vulnerabilities: [
        {
          vulnerability:
            'Team concentration—key person risk if CTO or CEO departs',
          severity: 'HIGH',
        },
        {
          vulnerability:
            'No blocking IP—competitors can work around patents',
          severity: 'MEDIUM',
        },
        {
          vulnerability:
            'Operational know-how is tacit and could walk out the door',
          severity: 'MEDIUM',
        },
      ],
    },
    risk_analysis: {
      key_risk_summary:
        "The 100x scale-up is the critical risk. If the technology works at commercial scale, the team can likely navigate commercial and execution challenges. If scale-up fails, nothing else matters.",
      technical_risks: [
        {
          risk: '100x scale-up fails to achieve projected performance',
          probability: 'MEDIUM',
          impact: 'HIGH',
          mitigation:
            'Negotiate intermediate demonstration milestone before full commercial commitment',
        },
        {
          risk: 'Carbon removal system cannot handle 150,000 kg/day throughput',
          probability: 'MEDIUM',
          impact: 'HIGH',
          mitigation:
            'Request detailed carbon removal engineering plan; consider electromagnetic stirring technology transfer from steel industry',
        },
      ],
      commercial_risks: [
        {
          risk: 'Carbon revenue at $400-500/ton instead of $1,000/ton',
          severity: 'HIGH',
        },
        {
          risk: '45V credit qualification at $0.60/kg tier instead of $1.50-3.00/kg',
          severity: 'HIGH',
        },
      ],
      competitive_risks: [
        {
          risk: 'Monolith/plasma captures market share if PyroHydrogen scale-up struggles',
          timeline: 'Already present',
        },
        {
          risk: 'C-Zero molten salt proves superior at scale',
          timeline: '18-24 months',
        },
      ],
    },
    scenario_analysis: {
      bull_case: {
        probability: '20%',
        narrative:
          'Beaumont achieves nameplate capacity within 6 months of commissioning, validating the 100x scale-up. Unit economics come in at $0.95/kg. Carbon sells at $900/ton. 45V credit qualifies at $1.50/kg tier with renewable PPA. By 2029, 4 facilities operational, generating $400M revenue. Air Products acquires for $2B.',
        return: '15-25x',
      },
      base_case: {
        probability: '45%',
        narrative:
          'Beaumont experiences 12-18 months of commissioning challenges, eventually reaching 70% of nameplate capacity. Unit economics are $1.30/kg. Carbon sells at $600/ton. 45V credit at $0.75/kg tier. By 2030, 2-3 facilities operational, generating $200M revenue. Linde acquires for $600M.',
        return: '4-8x',
      },
      bear_case: {
        probability: '35%',
        narrative:
          'Beaumont struggles with persistent scale-up issues—capacity factor stuck at 50%, costs at $1.60/kg. Green hydrogen reaches $2.50/kg by 2029. Unable to raise additional capital, PyroHydrogen sells Beaumont to Air Products for asset value.',
        return: '1-2x',
      },
      expected_value: {
        weighted_multiple: '5.8x',
        assessment:
          "Reasonable bet with positive expected value, but not a 'no-brainer.' High variance—outcome depends heavily on scale-up execution and market timing.",
      },
    },
    pre_mortem: {
      framing: "It's 2030 and the company has failed. What happened?",
      most_likely_failure: {
        probability: '35%',
        scenario:
          "Beaumont facility struggled through extended commissioning, achieving only 50-60% of nameplate capacity after 18 months of troubleshooting. Scale-up challenges in carbon removal and heat distribution proved more severe than anticipated. Costs came in at $1.40/kg instead of $0.87/kg. Meanwhile, green hydrogen costs fell faster than expected, reaching $2.50/kg in key markets by 2029. The turquoise value proposition eroded. Unable to raise additional capital at acceptable terms, PyroHydrogen sold the Beaumont facility to Air Products at a modest premium to invested capital. Investors received 1.5x return—not a loss, but not venture returns.",
        preventable_by:
          'Intermediate scale demonstration (5,000-10,000 kg/day) before full commercial commitment. More conservative financial projections. Milestone-based funding.',
        early_warnings: [
          'Beaumont commissioning delays beyond 6 months',
          'Capacity factor below 60% after 12 months',
          'Carbon removal system requiring frequent maintenance',
          'Unit costs 30%+ above projections',
          'Green hydrogen announcements below $3/kg',
        ],
      },
      second_most_likely: {
        probability: '25%',
        scenario:
          "Beaumont achieved technical success but commercial assumptions failed. Carbon sold at $400/ton instead of $1,000/ton as the market couldn't absorb volume at premium prices. 45V credit came in at $0.60/kg tier (lifecycle CI methodology stricter than expected). Unit economics were $1.30/kg instead of $0.87/kg. The business was profitable but not venture-scale. Eventually acquired by Linde for 3x invested capital.",
      },
      black_swan: {
        probability: '5%',
        scenario:
          "Geological hydrogen extraction proves viable at scale. A major discovery in the US Midwest reveals massive natural hydrogen reservoirs extractable at <$0.50/kg. All manufactured hydrogen becomes uncompetitive. PyroHydrogen's technology is obsolete before commercial scale is achieved.",
      },
    },
    verdict_and_recommendation: {
      overall_verdict: {
        verdict: 'PROMISING',
        confidence: 'MEDIUM',
      },
      technical_verdict: {
        verdict: 'PROMISING',
        confidence: 'MEDIUM',
        summary:
          'The core technology is built on sound physics with strong academic validation. The molten metal approach genuinely solves the catalyst deactivation problem. However, the 100x scale-up from pilot to commercial is unprecedented and represents the critical technical risk.',
      },
      commercial_verdict: {
        verdict: 'CHALLENGING',
        summary:
          'Clear market demand with signed offtake, but path to commercial scale faces compounding risks: unvalidated carbon revenue, uncertain 45V qualification, and potential green hydrogen competition. The business is viable but the margin of safety is thinner than presented.',
      },
      recommendation: {
        action: 'PROCEED_WITH_CAUTION',
        conditions: [
          'Negotiate milestone-based funding tied to scale-up validation',
          'Require intermediate demonstration (5,000-10,000 kg/day) before full commercial commitment or acceptance of higher risk premium',
          'Request carbon offtake LOIs before close',
          'Require renewable electricity PPA execution plan for 45V qualification',
          'Model investment case with $400-500/ton carbon and $0.60/kg 45V credit tier as base case',
        ],
        derisking_steps: [
          'Commission independent scale-up risk assessment ($30-50K)',
          'Site visit with technical expert',
          'Freedom-to-operate analysis vs. BASF patents',
          'Reference calls with Beaumont offtake counterparty and academic experts',
        ],
        timeline: '4-6 weeks for comprehensive diligence before term sheet',
      },
      final_word:
        "PyroHydrogen represents a legitimate shot at commercializing turquoise hydrogen with an exceptional team executing on sound science. The technology genuinely works at pilot scale, and the market timing is favorable. However, this is fundamentally a bet on execution—the moat is the team, not the technology. The 100x scale-up is the critical risk that determines whether this is a 15x winner or a 1.5x disappointment. The expected value is positive (~5.8x), but with high variance. If you believe this specific team can execute an unprecedented scale-up, the upside is significant. If you're skeptical about first-of-kind chemical process facilities, the bear case is real. Structure the investment to manage downside (milestone-based funding, intermediate validation requirements) while maintaining exposure to upside. This is a reasonable bet for investors with deep tech appetite and appropriate risk tolerance, but not a 'no-brainer' that should be funded on momentum alone.",
    },
  },
};

// Test parsing the sample data
console.log('Testing DD Report Schema...\n');

try {
  // The data is nested under "result" in the original JSON
  const report = parseDDReport(sampleData.result);

  console.log('✅ Schema parsing succeeded!\n');
  console.log('Header:', JSON.stringify(report.header, null, 2));
  console.log('\nExecutive Summary Verdict:', report.executive_summary?.verdict);
  console.log(
    'Executive Summary Confidence:',
    report.executive_summary?.verdict_confidence,
  );
  console.log(
    '\nScores:',
    JSON.stringify(report.executive_summary?.scores, null, 2),
  );
  console.log(
    '\nKey Findings Count:',
    report.executive_summary?.key_findings.length,
  );
  console.log(
    '\nOne Page Summary Company:',
    report.one_page_summary?.company,
  );
  console.log('One Page Summary Stage:', report.one_page_summary?.stage);
  console.log(
    '\nTechnical Thesis Verdict:',
    report.technical_thesis_assessment?.thesis_validity?.verdict,
  );
  console.log(
    'Novelty Assessment Verdict:',
    report.novelty_assessment?.verdict,
  );
  console.log('Moat Strength:', report.moat_assessment?.overall?.strength);
  console.log(
    '\nRisk Analysis - Technical Risks Count:',
    report.risk_analysis?.technical_risks.length,
  );
  console.log(
    'Scenario Analysis Bull Case Probability:',
    report.scenario_analysis?.bull_case?.probability,
  );
  console.log(
    '\nFinal Verdict:',
    report.verdict_and_recommendation?.overall_verdict?.verdict,
  );
  console.log(
    'Final Action:',
    report.verdict_and_recommendation?.recommendation?.action,
  );

  console.log('\n✅ All sections parsed successfully!');
} catch (error) {
  console.error('❌ Schema parsing failed:', error);
}

// Test antifragile behavior with malformed data
console.log('\n\n--- Testing Antifragile Behavior ---\n');

const malformedData = {
  header: {
    company_name: null, // should default
    date: undefined, // should default
  },
  executive_summary: {
    verdict: 'GOOD - very positive', // should parse to PROMISING
    verdict_confidence: 'strong', // should parse to HIGH
    scores: {
      technical_credibility: {
        score: '7.5 points', // should parse to 7.5
        out_of: '10',
      },
    },
    key_findings: [
      {
        finding: 'Test with RTF escapes: This is a dash\\\'97and more',
        type: 'positive', // should map to STRENGTH
        impact: 'major', // should map to HIGH
      },
      null, // should be filtered out
      {
        finding: 'Valid finding',
        type: 'WEAKNESS',
        impact: 'LOW',
      },
    ],
  },
  technical_thesis_assessment: {
    thesis_validity: {
      verdict: 'CONFIRMED (high probability)', // should parse to VALIDATED
      confidence: 'very_high', // should map to HIGH
    },
  },
};

try {
  const malformedReport = parseDDReport(malformedData);
  console.log('✅ Malformed data parsed successfully (antifragile)!\n');
  console.log('Header company_name (defaulted):', malformedReport.header.company_name);
  console.log('Header date (defaulted):', malformedReport.header.date);
  console.log(
    'Executive Summary Verdict (parsed from "GOOD - very positive"):',
    malformedReport.executive_summary?.verdict,
  );
  console.log(
    'Executive Summary Confidence (parsed from "strong"):',
    malformedReport.executive_summary?.verdict_confidence,
  );
  console.log(
    'Technical Score (parsed from "7.5 points"):',
    malformedReport.executive_summary?.scores?.technical_credibility?.score,
  );
  console.log(
    'Key Findings Count (null filtered):',
    malformedReport.executive_summary?.key_findings.length,
  );
  console.log(
    'Finding Type (parsed from "positive"):',
    malformedReport.executive_summary?.key_findings[0]?.type,
  );
  console.log(
    'Finding Impact (parsed from "major"):',
    malformedReport.executive_summary?.key_findings[0]?.impact,
  );
  console.log(
    '\nTechnical Thesis Verdict (parsed from "CONFIRMED (high probability)"):',
    malformedReport.technical_thesis_assessment?.thesis_validity?.verdict,
  );
  console.log(
    'Technical Thesis Confidence (parsed from "very_high"):',
    malformedReport.technical_thesis_assessment?.thesis_validity?.confidence,
  );

  console.log('\n✅ Antifragile parsing works correctly!');
} catch (error) {
  console.error('❌ Antifragile parsing failed:', error);
}
