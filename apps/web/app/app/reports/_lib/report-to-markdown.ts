import 'server-only';

import type {
  ChallengeTheFrame,
  ExecutionTrack,
  FrontierWatch,
  HybridReportData,
  InnovationPortfolio,
  ParallelInvestigation,
  ProblemAnalysis,
  RiskAndWatchout,
  SelfCritique,
  StructuredExecutiveSummary,
} from './types/hybrid-report-display.types';

/**
 * Convert HybridReportData to markdown for chat context.
 * Matches the sections rendered in BrandSystemReport.
 */
export function reportToMarkdown(
  data: HybridReportData,
  options?: { title?: string; brief?: string },
): string {
  const sections: string[] = [];

  // Title
  const title = options?.title || data.title;
  if (title) {
    sections.push(`# ${title}`);
  }

  // The Brief
  const brief = options?.brief || data.brief;
  if (brief) {
    sections.push('\n## The Brief');
    sections.push(brief);
  }

  // Executive Summary
  if (data.executive_summary) {
    sections.push('\n## Executive Summary');
    if (typeof data.executive_summary === 'string') {
      sections.push(data.executive_summary);
    } else {
      const es = data.executive_summary as StructuredExecutiveSummary;
      if (es.the_problem) sections.push(`**The Problem:** ${es.the_problem}`);
      if (es.core_insight) {
        sections.push(`\n**Core Insight:** ${es.core_insight.headline}`);
        if (es.core_insight.explanation)
          sections.push(es.core_insight.explanation);
      }
      if (es.viability)
        sections.push(
          `\n**Viability:** ${es.viability}${es.viability_label ? ` - ${es.viability_label}` : ''}`,
        );
      if (es.recommended_path?.length) {
        sections.push('\n**Recommended Path:**');
        es.recommended_path.forEach((step) => {
          sections.push(
            `${step.step}. ${step.action}${step.rationale ? ` - ${step.rationale}` : ''}`,
          );
        });
      }
    }
  }

  // Problem Analysis
  if (data.problem_analysis) {
    sections.push('\n## Problem Analysis');
    const pa = data.problem_analysis as ProblemAnalysis;

    if (pa.whats_wrong?.prose) {
      sections.push(`**What's Wrong:** ${pa.whats_wrong.prose}`);
    }

    if (pa.why_its_hard?.prose) {
      sections.push(`\n**Why It's Hard:** ${pa.why_its_hard.prose}`);
      if (pa.why_its_hard.governing_equation?.equation) {
        sections.push(
          `\nGoverning equation: ${pa.why_its_hard.governing_equation.equation}`,
        );
      }
    }

    if (pa.first_principles_insight) {
      sections.push(
        `\n**First Principles Insight:** ${pa.first_principles_insight.headline}`,
      );
      if (pa.first_principles_insight.explanation) {
        sections.push(pa.first_principles_insight.explanation);
      }
    }

    if (pa.root_cause_hypotheses?.length) {
      sections.push('\n**Root Cause Hypotheses:**');
      pa.root_cause_hypotheses.forEach((h) => {
        sections.push(
          `- ${h.name} (${h.confidence_percent ?? h.confidence}% confidence): ${h.explanation ?? h.hypothesis}`,
        );
      });
    }
  }

  // Constraints
  if (data.constraints_and_metrics) {
    sections.push('\n## Constraints');
    const c = data.constraints_and_metrics;

    if (c.hard_constraints?.length) {
      sections.push('**Hard Constraints:**');
      c.hard_constraints.forEach((con) => sections.push(`- ${con}`));
    }
    if (c.soft_constraints?.length) {
      sections.push('\n**Soft Constraints:**');
      c.soft_constraints.forEach((con) => sections.push(`- ${con}`));
    }
    if (c.assumptions?.length) {
      sections.push('\n**Assumptions:**');
      c.assumptions.forEach((a) => sections.push(`- ${a}`));
    }
  }

  // Challenge the Frame
  if (data.challenge_the_frame?.length) {
    sections.push('\n## Challenge the Frame');
    (data.challenge_the_frame as ChallengeTheFrame[]).forEach((c) => {
      sections.push(`\n**${c.assumption}**`);
      if (c.challenge) sections.push(`Challenge: ${c.challenge}`);
      if (c.implication) sections.push(`Implication: ${c.implication}`);
    });
  }

  // Innovation Analysis
  if (data.innovation_analysis) {
    sections.push('\n## Innovation Analysis');
    if (data.innovation_analysis.reframe) {
      sections.push(`**Reframe:** ${data.innovation_analysis.reframe}`);
    }
    if (data.innovation_analysis.domains_searched?.length) {
      sections.push(
        '\n**Domains Searched:** ' +
          data.innovation_analysis.domains_searched.join(', '),
      );
    }
  }

  // Solution Concepts (Execution Track)
  // Handle both old schema (execution_track) and v12 schema (solution_concepts)
  const executionTrackData =
    data.execution_track ?? (data as Record<string, unknown>).solution_concepts;
  if (executionTrackData) {
    sections.push('\n## Solution Concepts');
    const et = executionTrackData as ExecutionTrack;

    if (et.intro) sections.push(et.intro);

    if (et.primary) {
      sections.push(`\n### Primary Recommendation: ${et.primary.title}`);
      if (et.primary.bottom_line)
        sections.push(`**Bottom Line:** ${et.primary.bottom_line}`);
      if (et.primary.what_it_is)
        sections.push(`**What It Is:** ${et.primary.what_it_is}`);
      if (et.primary.why_it_works)
        sections.push(`**Why It Works:** ${et.primary.why_it_works}`);
      if (et.primary.expected_improvement)
        sections.push(
          `**Expected Improvement:** ${et.primary.expected_improvement}`,
        );
      if (et.primary.timeline)
        sections.push(`**Timeline:** ${et.primary.timeline}`);
      if (et.primary.investment)
        sections.push(`**Investment:** ${et.primary.investment}`);
      if (et.primary.confidence)
        sections.push(`**Confidence:** ${et.primary.confidence}%`);

      if (et.primary.the_insight) {
        sections.push('\n**The Insight:**');
        if (et.primary.the_insight.what)
          sections.push(`- ${et.primary.the_insight.what}`);
        if (et.primary.the_insight.where_we_found_it?.domain) {
          sections.push(
            `- Source: ${et.primary.the_insight.where_we_found_it.domain}`,
          );
        }
        if (et.primary.the_insight.why_industry_missed_it) {
          sections.push(
            `- Why industry missed it: ${et.primary.the_insight.why_industry_missed_it}`,
          );
        }
      }

      if (et.primary.validation_gates?.length) {
        sections.push('\n**Validation Gates:**');
        et.primary.validation_gates.forEach((g) => {
          sections.push(`- ${g.week ?? g.test}: ${g.test ?? g.method}`);
        });
      }
    }

    if (et.supporting_concepts?.length) {
      sections.push('\n### Supporting Concepts');
      et.supporting_concepts.forEach((s) => {
        sections.push(`\n**${s.title}** (${s.relationship})`);
        if (s.what_it_is) sections.push(s.what_it_is);
        if (s.when_to_use_instead)
          sections.push(`When to use: ${s.when_to_use_instead}`);
      });
    }
  }

  // Innovation Concepts
  // Handle both old schema (innovation_portfolio) and v12 schema (innovation_concepts)
  const innovationData =
    data.innovation_portfolio ??
    (data as Record<string, unknown>).innovation_concepts;
  if (innovationData) {
    const ip = innovationData as InnovationPortfolio & {
      // v12 schema uses 'recommended' instead of 'recommended_innovation'
      recommended?: InnovationPortfolio['recommended_innovation'];
      // v12 schema uses 'parallel' instead of 'parallel_investigations'
      parallel?: InnovationPortfolio['parallel_investigations'];
    };

    // Handle both old (recommended_innovation) and v12 (recommended) field names
    const recommendedInnovation = ip.recommended_innovation ?? ip.recommended;
    // Handle both old (parallel_investigations) and v12 (parallel) field names
    const parallelInvestigations = ip.parallel_investigations ?? ip.parallel;

    // Only add Innovation Concepts header if we have content
    const hasInnovationContent =
      recommendedInnovation ||
      parallelInvestigations?.length ||
      ip.frontier_watch?.length;
    if (hasInnovationContent) {
      sections.push('\n## Innovation Concepts');
      if (ip.intro) sections.push(ip.intro);
    }

    if (recommendedInnovation) {
      const ri = recommendedInnovation;
      sections.push(`\n### Recommended: ${ri.title}`);
      if (ri.what_it_is) sections.push(`**What It Is:** ${ri.what_it_is}`);
      if (ri.why_it_works)
        sections.push(`**Why It Works:** ${ri.why_it_works}`);
      if (ri.innovation_type) sections.push(`**Type:** ${ri.innovation_type}`);
      if (ri.source_domain)
        sections.push(`**Source Domain:** ${ri.source_domain}`);

      if (ri.breakthrough_potential) {
        sections.push('\n**Breakthrough Potential:**');
        if (ri.breakthrough_potential.if_it_works)
          sections.push(
            `- If it works: ${ri.breakthrough_potential.if_it_works}`,
          );
        if (ri.breakthrough_potential.estimated_improvement)
          sections.push(
            `- Estimated improvement: ${ri.breakthrough_potential.estimated_improvement}`,
          );
      }
    }

    // Parallel Investigations
    if (parallelInvestigations?.length) {
      sections.push('\n### Parallel Investigations');
      (parallelInvestigations as ParallelInvestigation[]).forEach((p) => {
        sections.push(`\n**${p.title}**`);
        if (p.one_liner) sections.push(p.one_liner);
        if (p.what_it_is) sections.push(`What it is: ${p.what_it_is}`);
        if (p.ceiling) sections.push(`Ceiling: ${p.ceiling}`);
        if (p.key_uncertainty)
          sections.push(`Key uncertainty: ${p.key_uncertainty}`);
        if (p.when_to_elevate)
          sections.push(`When to elevate: ${p.when_to_elevate}`);
      });
    }

    // Frontier Technologies
    if (ip.frontier_watch?.length) {
      sections.push('\n### Frontier Technologies');
      (ip.frontier_watch as FrontierWatch[]).forEach((f) => {
        sections.push(`\n**${f.title}**`);
        if (f.one_liner) sections.push(f.one_liner);
        if (f.why_interesting)
          sections.push(`Why interesting: ${f.why_interesting}`);
        if (f.why_not_now) sections.push(`Why not now: ${f.why_not_now}`);
        if (f.trigger_to_revisit)
          sections.push(`Trigger to revisit: ${f.trigger_to_revisit}`);
        if (f.earliest_viability)
          sections.push(`Earliest viability: ${f.earliest_viability}`);
        if (f.who_to_monitor)
          sections.push(`Who to monitor: ${f.who_to_monitor}`);
      });
    }
  }

  // Risks & Watchouts
  if (data.risks_and_watchouts?.length) {
    sections.push('\n## Risks & Watchouts');
    (data.risks_and_watchouts as RiskAndWatchout[]).forEach((r) => {
      sections.push(`\n**${r.risk}** (${r.severity ?? r.category})`);
      if (r.mitigation) sections.push(`Mitigation: ${r.mitigation}`);
    });
  }

  // Self-Critique
  if (data.self_critique) {
    sections.push('\n## Self-Critique');
    const sc = data.self_critique as SelfCritique;

    if (sc.overall_confidence || sc.confidence_level) {
      sections.push(
        `**Confidence:** ${sc.overall_confidence ?? sc.confidence_level}`,
      );
    }
    if (sc.confidence_rationale) {
      sections.push(`**Rationale:** ${sc.confidence_rationale}`);
    }
    if (sc.what_we_might_be_wrong_about?.length) {
      sections.push('\n**What we might be wrong about:**');
      sc.what_we_might_be_wrong_about.forEach((w) => sections.push(`- ${w}`));
    }
    if (sc.unexplored_directions?.length) {
      sections.push('\n**Unexplored directions:**');
      sc.unexplored_directions.forEach((u) => sections.push(`- ${u}`));
    }
  }

  // Recommendation (What I'd Actually Do)
  if (data.what_id_actually_do) {
    sections.push('\n## Recommendation');
    sections.push(data.what_id_actually_do);
  }

  // Strategic Integration personal recommendation
  if (data.strategic_integration?.personal_recommendation) {
    const pr = data.strategic_integration.personal_recommendation;
    if (!data.what_id_actually_do) {
      sections.push('\n## Recommendation');
    }
    if (pr.intro) sections.push(pr.intro);
    if (pr.key_insight) sections.push(`\n**Key Insight:** ${pr.key_insight}`);
  }

  return sections.join('\n');
}
