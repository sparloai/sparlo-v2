/**
 * Strategic Integration Section
 *
 * Air Company Aesthetic - Technical Monograph
 *
 * How execution track and innovation portfolio work together.
 * Resource allocation, decision architecture, and action plan.
 */
import { memo } from 'react';

import type { StrategicIntegration } from '~/app/app/reports/_lib/types/hybrid-report-display.types';

import {
  AccentBorder,
  ArticleBlock,
  BodyText,
  ContentBlock,
  MonoLabel,
  Section,
  SectionSubtitle,
  SectionTitle,
} from '../primitives';

interface StrategicIntegrationSectionProps {
  data?: StrategicIntegration;
}

export const StrategicIntegrationSection = memo(
  function StrategicIntegrationSection({
    data,
  }: StrategicIntegrationSectionProps) {
    if (!data) return null;

    const hasContent =
      data.portfolio_view ||
      data.resource_allocation ||
      data.decision_architecture ||
      (data.action_plan && data.action_plan.length > 0);

    if (!hasContent) return null;

    return (
      <Section id="strategic-integration" className="mt-20">
        <SectionTitle size="lg">Strategic Integration</SectionTitle>
        <SectionSubtitle>How it all fits together</SectionSubtitle>

        <ArticleBlock className="mt-10">
          {/* Portfolio view */}
          {data.portfolio_view && (
            <div className="max-w-[65ch]">
              <MonoLabel variant="muted">Portfolio View</MonoLabel>
              <div className="mt-4 space-y-4">
                {data.portfolio_view.execution_track_role && (
                  <div>
                    <span className="text-[14px] font-medium text-zinc-500">
                      Execution Track
                    </span>
                    <p className="mt-1 text-[18px] leading-[1.3] tracking-[-0.02em] text-[#1e1e1e]">
                      {data.portfolio_view.execution_track_role}
                    </p>
                  </div>
                )}
                {data.portfolio_view.innovation_portfolio_role && (
                  <div>
                    <span className="text-[14px] font-medium text-zinc-500">
                      Innovation Portfolio
                    </span>
                    <p className="mt-1 text-[18px] leading-[1.3] tracking-[-0.02em] text-[#1e1e1e]">
                      {data.portfolio_view.innovation_portfolio_role}
                    </p>
                  </div>
                )}
                {data.portfolio_view.combined_strategy && (
                  <AccentBorder className="mt-4">
                    <p className="text-[18px] leading-[1.3] font-medium tracking-[-0.02em] text-zinc-900">
                      {data.portfolio_view.combined_strategy}
                    </p>
                  </AccentBorder>
                )}
              </div>
            </div>
          )}

          {/* Resource allocation */}
          {data.resource_allocation && (
            <ContentBlock withBorder className="max-w-[50ch]">
              <MonoLabel variant="muted">Resource Allocation</MonoLabel>
              <div className="mt-4 space-y-3">
                <AllocationBar
                  label="Execution Track"
                  percent={data.resource_allocation.execution_track_percent}
                  primary
                />
                <AllocationBar
                  label="Recommended Innovation"
                  percent={
                    data.resource_allocation.recommended_innovation_percent
                  }
                />
                <AllocationBar
                  label="Parallel Investigations"
                  percent={
                    data.resource_allocation.parallel_investigations_percent
                  }
                />
                <AllocationBar
                  label="Frontier Watch"
                  percent={data.resource_allocation.frontier_watch_percent}
                />
              </div>
              {data.resource_allocation.rationale && (
                <BodyText className="mt-4" variant="secondary">
                  {data.resource_allocation.rationale}
                </BodyText>
              )}
            </ContentBlock>
          )}

          {/* Decision architecture */}
          {data.decision_architecture?.primary_tradeoff && (
            <ContentBlock withBorder className="max-w-[70ch]">
              <MonoLabel variant="muted">Key Decision</MonoLabel>
              {data.decision_architecture.primary_tradeoff.question && (
                <p className="mt-3 text-[20px] leading-[1.3] font-medium tracking-[-0.02em] text-zinc-900">
                  {data.decision_architecture.primary_tradeoff.question}
                </p>
              )}

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {data.decision_architecture.primary_tradeoff.option_a && (
                  <TradeoffOption
                    label="Option A"
                    option={
                      data.decision_architecture.primary_tradeoff.option_a
                    }
                  />
                )}
                {data.decision_architecture.primary_tradeoff.option_b && (
                  <TradeoffOption
                    label="Option B"
                    option={
                      data.decision_architecture.primary_tradeoff.option_b
                    }
                  />
                )}
              </div>

              {data.decision_architecture.primary_tradeoff.if_uncertain && (
                <div className="mt-4 border-t border-zinc-200 pt-4">
                  <span className="text-[14px] font-medium text-zinc-500">
                    If Uncertain
                  </span>
                  <p className="mt-1 text-[16px] leading-[1.3] text-zinc-600">
                    {data.decision_architecture.primary_tradeoff.if_uncertain}
                  </p>
                </div>
              )}

              {data.decision_architecture.summary && (
                <BodyText className="mt-4" variant="secondary">
                  {data.decision_architecture.summary}
                </BodyText>
              )}
            </ContentBlock>
          )}

          {/* Action plan */}
          {data.action_plan && data.action_plan.length > 0 && (
            <ContentBlock withBorder>
              <MonoLabel variant="muted">Action Plan</MonoLabel>
              <div className="mt-6 space-y-6">
                {data.action_plan.map((phase, idx) => (
                  <div
                    key={idx}
                    className="md:border-l-2 md:border-zinc-200 md:pl-6"
                  >
                    <span className="text-[14px] font-medium tracking-wider text-zinc-500 uppercase">
                      {phase.timeframe}
                    </span>
                    {phase.actions && phase.actions.length > 0 && (
                      <ul className="mt-2 space-y-2">
                        {phase.actions.map((action, actionIdx) => (
                          <li
                            key={actionIdx}
                            className="flex items-start gap-2 text-[16px] text-[#1e1e1e]"
                          >
                            <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-zinc-400" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    )}
                    {phase.decision_gate && (
                      <p className="mt-2 text-[14px] text-zinc-500">
                        <span className="font-medium">Gate:</span>{' '}
                        {phase.decision_gate}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ContentBlock>
          )}
        </ArticleBlock>
      </Section>
    );
  },
);

const AllocationBar = memo(function AllocationBar({
  label,
  percent,
  primary,
}: {
  label: string;
  percent?: number;
  primary?: boolean;
}) {
  if (!percent) return null;

  return (
    <div>
      <div className="flex items-center justify-between text-[14px]">
        <span
          className={primary ? 'font-medium text-zinc-900' : 'text-zinc-600'}
        >
          {label}
        </span>
        <span
          className={primary ? 'font-semibold text-zinc-900' : 'text-zinc-500'}
        >
          {percent}%
        </span>
      </div>
      <div className="mt-1 h-2 w-full bg-zinc-100">
        <div
          className={`h-full ${primary ? 'bg-zinc-900' : 'bg-zinc-400'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
});

const TradeoffOption = memo(function TradeoffOption({
  label,
  option,
}: {
  label: string;
  option: {
    condition?: string;
    path?: string;
    what_you_get?: string;
    what_you_give_up?: string;
  };
}) {
  return (
    <div className="border border-zinc-200 p-4">
      <span className="text-[12px] font-medium tracking-wider text-zinc-400 uppercase">
        {label}
      </span>
      {option.condition && (
        <p className="mt-2 text-[14px] font-medium text-zinc-700">
          {option.condition}
        </p>
      )}
      {option.path && (
        <p className="mt-1 text-[16px] leading-[1.3] text-[#1e1e1e]">
          {option.path}
        </p>
      )}
      <div className="mt-3 space-y-1 text-[14px]">
        {option.what_you_get && (
          <p className="text-zinc-600">
            <span className="font-medium text-zinc-700">Get:</span>{' '}
            {option.what_you_get}
          </p>
        )}
        {option.what_you_give_up && (
          <p className="text-zinc-500">
            <span className="font-medium">Give up:</span>{' '}
            {option.what_you_give_up}
          </p>
        )}
      </div>
    </div>
  );
});

export default StrategicIntegrationSection;
