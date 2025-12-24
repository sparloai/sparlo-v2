'use client';

import {
  Beaker,
  BookOpen,
  ChevronRight,
  ClipboardList,
  Lightbulb,
  Search,
  Sparkles,
} from 'lucide-react';

import { Badge } from '@kit/ui/badge';

/**
 * Discovery Report Display Component
 *
 * Renders discovery mode reports with their unique structure:
 * - Discovery brief
 * - What industry missed
 * - Discovery concepts
 * - Validation roadmap
 * - Executive summary
 */

interface DiscoveryReportDisplayProps {
  reportData: {
    mode: 'discovery';
    report?: {
      header?: {
        title?: string;
        tagline?: string;
      };
      discovery_brief?: {
        original_problem?: string;
        industry_blind_spot?: string;
        discovery_thesis?: string;
        hunting_grounds?: string[];
        key_finding?: string;
      };
      what_industry_missed?: {
        conventional_approaches?: string[];
        why_they_do_it?: string;
        blind_spots?: Array<{
          assumption?: string;
          challenge?: string;
          opportunity?: string;
        }>;
        unexplored_territories?: string[];
      };
      discovery_concepts?: Array<{
        id?: string;
        name?: string;
        category?: string;
        source_domain?: string;
        the_insight?: {
          what_we_found?: string;
          why_its_new?: string;
          the_physics?: string;
        };
        novelty_claim?: {
          genuinely_novel?: boolean;
          novelty_level?: string;
          not_same_as?: string;
        };
        how_it_works?: {
          mechanism?: string;
          key_components?: string[];
          enabling_factors?: string;
        };
        breakthrough_potential?: {
          if_works?: string;
          improvement?: string;
          industry_impact?: string;
        };
        validation_path?: {
          first_test?: string;
          go_no_go?: string;
          timeline?: string;
          cost?: string;
        };
        risks_and_unknowns?: {
          physics_risks?: string[];
          implementation_challenges?: string[];
          mitigation_ideas?: string[];
        };
        priority?: string;
      }>;
      validation_roadmap?: {
        immediate_actions?: Array<{
          action?: string;
          concept?: string;
          timeline?: string;
          cost?: string;
          expected_outcome?: string;
        }>;
        phase_1?: {
          objective?: string;
          timeline?: string;
          budget?: string;
        };
        phase_2?: {
          objective?: string;
          timeline?: string;
          budget?: string;
        };
        phase_3?: {
          objective?: string;
          timeline?: string;
          budget?: string;
        };
      };
      executive_summary?: {
        one_liner?: string;
        key_discovery?: string;
        recommended_action?: string;
        timeline_to_validation?: string;
        investment_required?: string;
      };
      why_this_matters?: {
        if_we_succeed?: string;
        competitive_advantage?: string;
        industry_implications?: string;
        risk_of_not_pursuing?: string;
      };
    };
  };
}

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="mb-8 flex items-center gap-3">
      <div className="rounded-lg bg-emerald-100 p-2">
        <Icon className="h-5 w-5 text-emerald-700" />
      </div>
      <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
        {title}
      </h2>
    </div>
  );
}

function CategoryBadge({ category }: { category?: string }) {
  const categoryLabels: Record<string, string> = {
    biological_transfer: 'Biological Transfer',
    geological: 'Geological',
    abandoned_tech: 'Abandoned Tech',
    frontier_material: 'Frontier Material',
    combination: 'Combination',
  };

  const categoryColors: Record<string, string> = {
    biological_transfer: 'bg-green-100 text-green-800 border-green-200',
    geological: 'bg-amber-100 text-amber-800 border-amber-200',
    abandoned_tech: 'bg-purple-100 text-purple-800 border-purple-200',
    frontier_material: 'bg-blue-100 text-blue-800 border-blue-200',
    combination: 'bg-pink-100 text-pink-800 border-pink-200',
  };

  if (!category) return null;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${categoryColors[category] || 'border-zinc-200 bg-zinc-100 text-zinc-700'}`}
    >
      {categoryLabels[category] || category}
    </span>
  );
}

function PriorityBadge({ priority }: { priority?: string }) {
  const priorityColors: Record<string, string> = {
    must_pursue: 'bg-emerald-600 text-white',
    should_explore: 'bg-blue-600 text-white',
    worth_investigating: 'bg-amber-500 text-white',
    park: 'bg-zinc-400 text-white',
  };

  const priorityLabels: Record<string, string> = {
    must_pursue: 'Must Pursue',
    should_explore: 'Should Explore',
    worth_investigating: 'Worth Investigating',
    park: 'Park',
  };

  if (!priority) return null;

  return (
    <Badge
      className={priorityColors[priority] || 'bg-zinc-100 text-zinc-700'}
      variant="default"
    >
      {priorityLabels[priority] || priority}
    </Badge>
  );
}

function NoveltyBadge({ level }: { level?: string }) {
  const colors: Record<string, string> = {
    breakthrough: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    significant: 'bg-blue-100 text-blue-800 border-blue-200',
    moderate: 'bg-amber-100 text-amber-800 border-amber-200',
  };

  if (!level) return null;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors[level] || 'bg-zinc-100 text-zinc-700'}`}
    >
      <Sparkles className="mr-1 h-3 w-3" />
      {level.charAt(0).toUpperCase() + level.slice(1)} Novelty
    </span>
  );
}

export function DiscoveryReportDisplay({
  reportData,
}: DiscoveryReportDisplayProps) {
  const report = reportData.report;

  if (!report) {
    return (
      <div className="rounded-lg bg-amber-50 p-6 text-amber-800">
        <p>Discovery report data is not available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header */}
      <header className="border-b border-emerald-100 pb-10">
        <Badge
          className="mb-4 bg-emerald-100 text-emerald-800"
          variant="outline"
        >
          Discovery Mode
        </Badge>
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-zinc-900 lg:text-5xl">
          {report.header?.title || 'Discovery Report'}
        </h1>
        {report.header?.tagline && (
          <p className="text-xl leading-relaxed text-zinc-600">
            {report.header.tagline}
          </p>
        )}
      </header>

      {/* Executive Summary */}
      {report.executive_summary && (
        <section
          id="executive-summary"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-6"
        >
          <SectionHeader icon={Sparkles} title="Executive Summary" />
          {report.executive_summary.one_liner && (
            <p className="mb-6 text-xl leading-relaxed font-medium text-emerald-900">
              {report.executive_summary.one_liner}
            </p>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {report.executive_summary.key_discovery && (
              <div className="rounded-lg bg-white p-5">
                <p className="mb-2 text-base font-semibold text-emerald-700">
                  Key Discovery
                </p>
                <p className="text-lg leading-relaxed text-zinc-700">
                  {report.executive_summary.key_discovery}
                </p>
              </div>
            )}
            {report.executive_summary.recommended_action && (
              <div className="rounded-lg bg-white p-5">
                <p className="mb-2 text-base font-semibold text-emerald-700">
                  Recommended Action
                </p>
                <p className="text-lg leading-relaxed text-zinc-700">
                  {report.executive_summary.recommended_action}
                </p>
              </div>
            )}
            {report.executive_summary.timeline_to_validation && (
              <div className="rounded-lg bg-white p-5">
                <p className="mb-2 text-base font-semibold text-emerald-700">
                  Timeline to Validation
                </p>
                <p className="text-lg leading-relaxed text-zinc-700">
                  {report.executive_summary.timeline_to_validation}
                </p>
              </div>
            )}
            {report.executive_summary.investment_required && (
              <div className="rounded-lg bg-white p-5">
                <p className="mb-2 text-base font-semibold text-emerald-700">
                  Investment Required
                </p>
                <p className="text-lg leading-relaxed text-zinc-700">
                  {report.executive_summary.investment_required}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Discovery Brief */}
      {report.discovery_brief && (
        <section id="discovery-brief">
          <SectionHeader icon={BookOpen} title="Discovery Brief" />
          <div className="space-y-4">
            {report.discovery_brief.original_problem && (
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                <p className="mb-1 text-sm font-medium text-zinc-500">
                  Original Problem
                </p>
                <p className="text-zinc-800">
                  {report.discovery_brief.original_problem}
                </p>
              </div>
            )}
            {report.discovery_brief.industry_blind_spot && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="mb-1 text-sm font-medium text-amber-700">
                  Industry Blind Spot
                </p>
                <p className="text-zinc-800">
                  {report.discovery_brief.industry_blind_spot}
                </p>
              </div>
            )}
            {report.discovery_brief.discovery_thesis && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="mb-1 text-sm font-medium text-emerald-700">
                  Discovery Thesis
                </p>
                <p className="text-zinc-800">
                  {report.discovery_brief.discovery_thesis}
                </p>
              </div>
            )}
            {report.discovery_brief.hunting_grounds &&
              report.discovery_brief.hunting_grounds.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-zinc-500">
                    Hunting Grounds
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {report.discovery_brief.hunting_grounds.map((ground, i) => (
                      <Badge key={i} variant="outline">
                        {ground}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            {report.discovery_brief.key_finding && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="mb-1 text-sm font-medium text-blue-700">
                  Key Finding
                </p>
                <p className="text-zinc-800">
                  {report.discovery_brief.key_finding}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* What Industry Missed */}
      {report.what_industry_missed && (
        <section id="what-industry-missed">
          <SectionHeader icon={Search} title="What Industry Missed" />
          <div className="space-y-8">
            {report.what_industry_missed.conventional_approaches &&
              report.what_industry_missed.conventional_approaches.length >
                0 && (
                <div>
                  <p className="mb-3 text-base font-semibold text-zinc-600">
                    Conventional Approaches
                  </p>
                  <ul className="list-inside list-disc space-y-2 text-lg leading-relaxed text-zinc-700">
                    {report.what_industry_missed.conventional_approaches.map(
                      (approach, i) => (
                        <li key={i}>{approach}</li>
                      ),
                    )}
                  </ul>
                </div>
              )}
            {report.what_industry_missed.why_they_do_it && (
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5">
                <p className="mb-2 text-base font-semibold text-zinc-600">
                  Why They Do It
                </p>
                <p className="text-lg leading-relaxed text-zinc-700">
                  {report.what_industry_missed.why_they_do_it}
                </p>
              </div>
            )}
            {report.what_industry_missed.blind_spots &&
              report.what_industry_missed.blind_spots.length > 0 && (
                <div>
                  <p className="mb-3 text-base font-semibold text-zinc-600">
                    Blind Spots
                  </p>
                  <div className="space-y-4">
                    {report.what_industry_missed.blind_spots.map((spot, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-amber-200 bg-amber-50 p-5"
                      >
                        {spot.assumption && (
                          <p className="mb-2 text-base leading-relaxed">
                            <span className="font-semibold text-amber-800">
                              Assumption:
                            </span>{' '}
                            {spot.assumption}
                          </p>
                        )}
                        {spot.challenge && (
                          <p className="mb-2 text-base leading-relaxed">
                            <span className="font-semibold text-amber-800">
                              Challenge:
                            </span>{' '}
                            {spot.challenge}
                          </p>
                        )}
                        {spot.opportunity && (
                          <p className="text-base leading-relaxed">
                            <span className="font-semibold text-emerald-700">
                              Opportunity:
                            </span>{' '}
                            {spot.opportunity}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            {report.what_industry_missed.unexplored_territories &&
              report.what_industry_missed.unexplored_territories.length > 0 && (
                <div>
                  <p className="mb-3 text-base font-semibold text-zinc-600">
                    Unexplored Territories
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {report.what_industry_missed.unexplored_territories.map(
                      (territory, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="bg-white px-3 py-1 text-base"
                        >
                          {territory}
                        </Badge>
                      ),
                    )}
                  </div>
                </div>
              )}
          </div>
        </section>
      )}

      {/* Discovery Concepts */}
      {report.discovery_concepts && report.discovery_concepts.length > 0 && (
        <section id="discovery-concepts">
          <SectionHeader icon={Lightbulb} title="Discovery Concepts" />
          <div className="space-y-6">
            {report.discovery_concepts.map((concept, i) => (
              <div
                key={concept.id || i}
                className="rounded-xl border border-zinc-200 bg-white p-6"
              >
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-zinc-400">
                    {concept.id}
                  </span>
                  <h3 className="text-lg font-semibold text-zinc-900">
                    {concept.name}
                  </h3>
                  <CategoryBadge category={concept.category} />
                  <NoveltyBadge level={concept.novelty_claim?.novelty_level} />
                  <PriorityBadge priority={concept.priority} />
                </div>

                {concept.source_domain && (
                  <p className="mb-4 text-sm text-zinc-500">
                    Source Domain: {concept.source_domain}
                  </p>
                )}

                {concept.the_insight && (
                  <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                    <p className="mb-2 text-sm font-medium text-emerald-700">
                      The Insight
                    </p>
                    {concept.the_insight.what_we_found && (
                      <p className="mb-2 text-zinc-800">
                        {concept.the_insight.what_we_found}
                      </p>
                    )}
                    {concept.the_insight.why_its_new && (
                      <p className="mb-2 text-sm text-zinc-600">
                        <span className="font-medium">Why it&apos;s new:</span>{' '}
                        {concept.the_insight.why_its_new}
                      </p>
                    )}
                    {concept.the_insight.the_physics && (
                      <p className="text-sm text-zinc-600">
                        <span className="font-medium">Physics:</span>{' '}
                        {concept.the_insight.the_physics}
                      </p>
                    )}
                  </div>
                )}

                {concept.how_it_works && (
                  <div className="mb-4">
                    <p className="mb-2 text-sm font-medium text-zinc-500">
                      How It Works
                    </p>
                    {concept.how_it_works.mechanism && (
                      <p className="mb-2 text-zinc-700">
                        {concept.how_it_works.mechanism}
                      </p>
                    )}
                    {concept.how_it_works.key_components &&
                      concept.how_it_works.key_components.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-1">
                          {concept.how_it_works.key_components.map(
                            (comp, j) => (
                              <Badge
                                key={j}
                                variant="secondary"
                                className="text-xs"
                              >
                                {comp}
                              </Badge>
                            ),
                          )}
                        </div>
                      )}
                    {concept.how_it_works.enabling_factors && (
                      <p className="text-sm text-zinc-600">
                        <span className="font-medium">Enabling factors:</span>{' '}
                        {concept.how_it_works.enabling_factors}
                      </p>
                    )}
                  </div>
                )}

                {concept.breakthrough_potential && (
                  <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <p className="mb-2 text-sm font-medium text-blue-700">
                      Breakthrough Potential
                    </p>
                    {concept.breakthrough_potential.if_works && (
                      <p className="mb-1 text-zinc-700">
                        <span className="font-medium">If it works:</span>{' '}
                        {concept.breakthrough_potential.if_works}
                      </p>
                    )}
                    {concept.breakthrough_potential.improvement && (
                      <p className="mb-1 text-zinc-700">
                        <span className="font-medium">Improvement:</span>{' '}
                        {concept.breakthrough_potential.improvement}
                      </p>
                    )}
                    {concept.breakthrough_potential.industry_impact && (
                      <p className="text-zinc-700">
                        <span className="font-medium">Industry impact:</span>{' '}
                        {concept.breakthrough_potential.industry_impact}
                      </p>
                    )}
                  </div>
                )}

                {concept.validation_path && (
                  <div className="mb-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                    <p className="mb-2 text-sm font-medium text-zinc-700">
                      Validation Path
                    </p>
                    <div className="grid gap-2 text-sm sm:grid-cols-2">
                      {concept.validation_path.first_test && (
                        <p>
                          <span className="font-medium">First test:</span>{' '}
                          {concept.validation_path.first_test}
                        </p>
                      )}
                      {concept.validation_path.go_no_go && (
                        <p>
                          <span className="font-medium">Go/No-Go:</span>{' '}
                          {concept.validation_path.go_no_go}
                        </p>
                      )}
                      {concept.validation_path.timeline && (
                        <p>
                          <span className="font-medium">Timeline:</span>{' '}
                          {concept.validation_path.timeline}
                        </p>
                      )}
                      {concept.validation_path.cost && (
                        <p>
                          <span className="font-medium">Cost:</span>{' '}
                          {concept.validation_path.cost}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {concept.risks_and_unknowns && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="mb-2 text-sm font-medium text-red-700">
                      Risks & Unknowns
                    </p>
                    {concept.risks_and_unknowns.physics_risks &&
                      concept.risks_and_unknowns.physics_risks.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-red-600">
                            Physics Risks
                          </p>
                          <ul className="list-inside list-disc text-sm text-zinc-700">
                            {concept.risks_and_unknowns.physics_risks.map(
                              (risk, j) => (
                                <li key={j}>{risk}</li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}
                    {concept.risks_and_unknowns.implementation_challenges &&
                      concept.risks_and_unknowns.implementation_challenges
                        .length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-amber-600">
                            Implementation Challenges
                          </p>
                          <ul className="list-inside list-disc text-sm text-zinc-700">
                            {concept.risks_and_unknowns.implementation_challenges.map(
                              (challenge, j) => (
                                <li key={j}>{challenge}</li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}
                    {concept.risks_and_unknowns.mitigation_ideas &&
                      concept.risks_and_unknowns.mitigation_ideas.length >
                        0 && (
                        <div>
                          <p className="text-xs font-medium text-emerald-600">
                            Mitigation Ideas
                          </p>
                          <ul className="list-inside list-disc text-sm text-zinc-700">
                            {concept.risks_and_unknowns.mitigation_ideas.map(
                              (idea, j) => (
                                <li key={j}>{idea}</li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Validation Roadmap */}
      {report.validation_roadmap && (
        <section id="validation-roadmap">
          <SectionHeader icon={ClipboardList} title="Validation Roadmap" />
          <div className="space-y-6">
            {report.validation_roadmap.immediate_actions &&
              report.validation_roadmap.immediate_actions.length > 0 && (
                <div>
                  <h3 className="mb-3 text-lg font-medium text-zinc-800">
                    Immediate Actions
                  </h3>
                  <div className="space-y-2">
                    {report.validation_roadmap.immediate_actions.map(
                      (action, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-4"
                        >
                          <ChevronRight className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                          <div className="flex-1">
                            <p className="font-medium text-zinc-800">
                              {action.action}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-2 text-sm text-zinc-500">
                              {action.concept && (
                                <span>Concept: {action.concept}</span>
                              )}
                              {action.timeline && (
                                <span>Timeline: {action.timeline}</span>
                              )}
                              {action.cost && <span>Cost: {action.cost}</span>}
                            </div>
                            {action.expected_outcome && (
                              <p className="mt-1 text-sm text-zinc-600">
                                Expected: {action.expected_outcome}
                              </p>
                            )}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

            <div className="grid gap-4 md:grid-cols-3">
              {report.validation_roadmap.phase_1 && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <h4 className="mb-2 font-medium text-emerald-800">Phase 1</h4>
                  {report.validation_roadmap.phase_1.objective && (
                    <p className="mb-1 text-sm text-zinc-700">
                      {report.validation_roadmap.phase_1.objective}
                    </p>
                  )}
                  <div className="mt-2 flex gap-3 text-xs text-zinc-500">
                    {report.validation_roadmap.phase_1.timeline && (
                      <span>{report.validation_roadmap.phase_1.timeline}</span>
                    )}
                    {report.validation_roadmap.phase_1.budget && (
                      <span>{report.validation_roadmap.phase_1.budget}</span>
                    )}
                  </div>
                </div>
              )}
              {report.validation_roadmap.phase_2 && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <h4 className="mb-2 font-medium text-blue-800">Phase 2</h4>
                  {report.validation_roadmap.phase_2.objective && (
                    <p className="mb-1 text-sm text-zinc-700">
                      {report.validation_roadmap.phase_2.objective}
                    </p>
                  )}
                  <div className="mt-2 flex gap-3 text-xs text-zinc-500">
                    {report.validation_roadmap.phase_2.timeline && (
                      <span>{report.validation_roadmap.phase_2.timeline}</span>
                    )}
                    {report.validation_roadmap.phase_2.budget && (
                      <span>{report.validation_roadmap.phase_2.budget}</span>
                    )}
                  </div>
                </div>
              )}
              {report.validation_roadmap.phase_3 && (
                <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                  <h4 className="mb-2 font-medium text-purple-800">Phase 3</h4>
                  {report.validation_roadmap.phase_3.objective && (
                    <p className="mb-1 text-sm text-zinc-700">
                      {report.validation_roadmap.phase_3.objective}
                    </p>
                  )}
                  <div className="mt-2 flex gap-3 text-xs text-zinc-500">
                    {report.validation_roadmap.phase_3.timeline && (
                      <span>{report.validation_roadmap.phase_3.timeline}</span>
                    )}
                    {report.validation_roadmap.phase_3.budget && (
                      <span>{report.validation_roadmap.phase_3.budget}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Why This Matters */}
      {report.why_this_matters && (
        <section
          id="why-this-matters"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-6"
        >
          <SectionHeader icon={Beaker} title="Why This Matters" />
          <div className="grid gap-4 md:grid-cols-2">
            {report.why_this_matters.if_we_succeed && (
              <div className="rounded-lg bg-white p-4">
                <p className="mb-1 text-sm font-medium text-emerald-700">
                  If We Succeed
                </p>
                <p className="text-zinc-700">
                  {report.why_this_matters.if_we_succeed}
                </p>
              </div>
            )}
            {report.why_this_matters.competitive_advantage && (
              <div className="rounded-lg bg-white p-4">
                <p className="mb-1 text-sm font-medium text-emerald-700">
                  Competitive Advantage
                </p>
                <p className="text-zinc-700">
                  {report.why_this_matters.competitive_advantage}
                </p>
              </div>
            )}
            {report.why_this_matters.industry_implications && (
              <div className="rounded-lg bg-white p-4">
                <p className="mb-1 text-sm font-medium text-emerald-700">
                  Industry Implications
                </p>
                <p className="text-zinc-700">
                  {report.why_this_matters.industry_implications}
                </p>
              </div>
            )}
            {report.why_this_matters.risk_of_not_pursuing && (
              <div className="rounded-lg bg-white p-4">
                <p className="mb-1 text-sm font-medium text-amber-700">
                  Risk of Not Pursuing
                </p>
                <p className="text-zinc-700">
                  {report.why_this_matters.risk_of_not_pursuing}
                </p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
