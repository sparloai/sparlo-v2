import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

// Import legacy types for backward compatibility
import type {
  ConceptRecommendation as LegacyConceptRecommendation,
  ExecutiveSummary as LegacyExecutiveSummary,
  ProblemAnalysis as LegacyProblemAnalysis,
  RiskItem,
} from '~/home/(user)/reports/_lib/types/report-data.types';

import type { ReportForPDF } from '../_lib/types';
// Import hybrid types for new report format
import type {
  ExecutionTrackPrimary,
  ConceptRecommendation as HybridConceptRecommendation,
  ProblemAnalysis as HybridProblemAnalysis,
  HybridReportData,
  RecommendedInnovation,
  RiskAndWatchout,
  StructuredExecutiveSummary,
  SupportingConcept,
} from '../_lib/types';

// Union types to handle both legacy and hybrid formats
type ExecutiveSummaryData =
  | string
  | StructuredExecutiveSummary
  | LegacyExecutiveSummary;
type ProblemAnalysisData = HybridProblemAnalysis | LegacyProblemAnalysis;
type ConceptRecommendation =
  | HybridConceptRecommendation
  | LegacyConceptRecommendation;
type RiskData = RiskAndWatchout | RiskItem;

// ============================================
// Aura-Inspired PDF Styles
// ============================================

const colors = {
  zinc950: '#09090b',
  zinc800: '#27272a',
  zinc700: '#3f3f46',
  zinc600: '#52525b',
  zinc500: '#71717a',
  zinc400: '#a1a1aa',
  zinc300: '#d4d4d8',
  zinc200: '#e4e4e7',
  zinc100: '#f4f4f5',
  zinc50: '#fafafa',
  white: '#ffffff',
  green600: '#16a34a',
  green100: '#dcfce7',
  amber600: '#d97706',
  amber100: '#fef3c7',
  red600: '#dc2626',
  red100: '#fee2e2',
  blue600: '#2563eb',
  blue100: '#dbeafe',
  violet600: '#7c3aed',
  violet100: '#ede9fe',
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: colors.white,
  },
  // Header
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.zinc200,
  },
  logo: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: colors.zinc950,
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: colors.zinc950,
    marginBottom: 6,
    lineHeight: 1.2,
  },
  headline: {
    fontSize: 12,
    color: colors.zinc600,
    lineHeight: 1.4,
  },
  // Sections
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: colors.zinc950,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: colors.zinc950,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: colors.zinc800,
    marginBottom: 8,
    marginTop: 12,
  },
  // Content
  paragraph: {
    fontSize: 10,
    lineHeight: 1.6,
    color: colors.zinc700,
    marginBottom: 8,
  },
  // Cards
  card: {
    backgroundColor: colors.zinc50,
    borderWidth: 1,
    borderColor: colors.zinc200,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  cardHighlight: {
    backgroundColor: colors.zinc50,
    borderWidth: 1,
    borderColor: colors.zinc200,
    borderLeftWidth: 4,
    borderLeftColor: colors.zinc950,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: colors.zinc950,
    marginBottom: 6,
  },
  cardLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: colors.zinc500,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardContent: {
    fontSize: 10,
    lineHeight: 1.5,
    color: colors.zinc600,
  },
  // Badges
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  // Confidence colors
  badgeHigh: {
    backgroundColor: colors.green100,
  },
  badgeHighText: {
    color: colors.green600,
  },
  badgeMedium: {
    backgroundColor: colors.amber100,
  },
  badgeMediumText: {
    color: colors.amber600,
  },
  badgeLow: {
    backgroundColor: colors.red100,
  },
  badgeLowText: {
    color: colors.red600,
  },
  badgeInfo: {
    backgroundColor: colors.blue100,
  },
  badgeInfoText: {
    color: colors.blue600,
  },
  badgePrimary: {
    backgroundColor: colors.violet100,
  },
  badgePrimaryText: {
    color: colors.violet600,
  },
  // Lists
  listItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 4,
  },
  listBullet: {
    width: 16,
    fontSize: 10,
    color: colors.zinc950,
  },
  listNumber: {
    width: 20,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.zinc950,
  },
  listContent: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.5,
    color: colors.zinc700,
  },
  // Grid
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  col2: {
    width: '50%',
    paddingRight: 8,
  },
  // Metadata
  metaItem: {
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: colors.zinc500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 10,
    color: colors.zinc700,
  },
  // Insight box
  insightBox: {
    backgroundColor: colors.zinc100,
    borderRadius: 6,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  insightLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: colors.zinc500,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.zinc950,
    lineHeight: 1.4,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.zinc200,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: colors.zinc400,
  },
  pageNumber: {
    fontSize: 8,
    color: colors.zinc400,
  },
});

// ============================================
// Helper Components
// ============================================

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function ConfidenceBadge({ level }: { level?: string }) {
  const normalizedLevel = level?.toLowerCase() ?? 'medium';
  const isHigh = normalizedLevel === 'high' || normalizedLevel.includes('high');
  const isLow = normalizedLevel === 'low' || normalizedLevel.includes('low');

  return (
    <View
      style={[
        styles.badge,
        isHigh
          ? styles.badgeHigh
          : isLow
            ? styles.badgeLow
            : styles.badgeMedium,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          isHigh
            ? styles.badgeHighText
            : isLow
              ? styles.badgeLowText
              : styles.badgeMediumText,
        ]}
      >
        {level ?? 'Medium'} Confidence
      </Text>
    </View>
  );
}

function TrackBadge({ track }: { track?: string }) {
  if (!track) return null;

  const label = track
    .replace(/_/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  return (
    <View style={[styles.badge, styles.badgeInfo]}>
      <Text style={[styles.badgeText, styles.badgeInfoText]}>{label}</Text>
    </View>
  );
}

// ============================================
// Section Components
// ============================================

function ExecutiveSummarySection({ data }: { data?: ExecutiveSummaryData }) {
  if (!data) return null;

  // Handle string format
  if (typeof data === 'string') {
    return (
      <View style={styles.section}>
        <SectionHeader title="Executive Summary" />
        <Text style={styles.paragraph}>{data}</Text>
      </View>
    );
  }

  // Helper to check if step is legacy format (step_number, content)
  const isLegacyStep = (
    step: unknown,
  ): step is { step_number: number; content: string } => {
    return (
      typeof step === 'object' &&
      step !== null &&
      'step_number' in step &&
      'content' in step
    );
  };

  // Handle structured format (both legacy and hybrid)
  return (
    <View style={styles.section}>
      <SectionHeader title="Executive Summary" />

      {/* Narrative Lead */}
      {data.narrative_lead && (
        <Text style={[styles.paragraph, { fontFamily: 'Helvetica-Oblique' }]}>
          {data.narrative_lead}
        </Text>
      )}

      {/* Core Insight */}
      {data.core_insight && (
        <View style={styles.insightBox}>
          <Text style={styles.insightLabel}>Core Insight</Text>
          {data.core_insight.headline && (
            <Text style={styles.insightText}>{data.core_insight.headline}</Text>
          )}
          {data.core_insight.explanation && (
            <Text style={[styles.cardContent, { marginTop: 4 }]}>
              {data.core_insight.explanation}
            </Text>
          )}
        </View>
      )}

      {/* The Problem */}
      {data.the_problem && (
        <View style={{ marginTop: 8 }}>
          <Text style={styles.sectionSubtitle}>The Problem</Text>
          <Text style={styles.paragraph}>{data.the_problem}</Text>
        </View>
      )}

      {/* Primary Recommendation */}
      {data.primary_recommendation && (
        <View style={{ marginTop: 8 }}>
          <Text style={styles.sectionSubtitle}>Primary Recommendation</Text>
          <Text style={styles.paragraph}>{data.primary_recommendation}</Text>
        </View>
      )}

      {/* Recommended Path - handles both legacy and hybrid formats */}
      {data.recommended_path && data.recommended_path.length > 0 && (
        <View style={{ marginTop: 8 }}>
          <Text style={styles.sectionSubtitle}>Recommended Path</Text>
          {data.recommended_path.map((step, i) => {
            // Handle legacy format: {step_number, content}
            if (isLegacyStep(step)) {
              return (
                <View key={i} style={styles.listItem}>
                  <Text style={styles.listNumber}>{step.step_number}.</Text>
                  <Text style={styles.listContent}>{step.content}</Text>
                </View>
              );
            }
            // Handle hybrid format: {step?, action?, rationale?}
            return (
              <View key={i} style={styles.listItem}>
                <Text style={styles.listNumber}>{step.step ?? i + 1}.</Text>
                <Text style={styles.listContent}>{step.action ?? ''}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function ProblemAnalysisSection({ data }: { data?: ProblemAnalysisData }) {
  if (!data) return null;

  // Type guard for hybrid first_principles_insight (only exists in hybrid format)
  const hasFirstPrinciplesInsight = (
    d: ProblemAnalysisData,
  ): d is HybridProblemAnalysis => {
    return (
      'first_principles_insight' in d && d.first_principles_insight != null
    );
  };

  // Render factor - handles both string and object formats
  const renderFactor = (factor: unknown, i: number) => {
    let content: string;
    if (typeof factor === 'string') {
      content = factor;
    } else if (
      typeof factor === 'object' &&
      factor !== null &&
      'factor' in factor
    ) {
      const f = factor as { factor?: string; explanation?: string };
      content = f.explanation
        ? `${f.factor}: ${f.explanation}`
        : (f.factor ?? '');
    } else {
      return null;
    }

    return (
      <View key={i} style={styles.listItem}>
        <Text style={styles.listBullet}>•</Text>
        <Text style={styles.listContent}>{content}</Text>
      </View>
    );
  };

  return (
    <View style={styles.section}>
      <SectionHeader title="Problem Analysis" />

      {/* What's Wrong */}
      {data.whats_wrong?.prose && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>What&apos;s Wrong</Text>
          <Text style={styles.cardContent}>{data.whats_wrong.prose}</Text>
        </View>
      )}

      {/* Why It's Hard */}
      {data.why_its_hard?.prose && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Why It&apos;s Hard</Text>
          <Text style={styles.cardContent}>{data.why_its_hard.prose}</Text>

          {data.why_its_hard.factors &&
            data.why_its_hard.factors.length > 0 && (
              <View style={{ marginTop: 8 }}>
                {data.why_its_hard.factors.map((factor, i) =>
                  renderFactor(factor, i),
                )}
              </View>
            )}
        </View>
      )}

      {/* First Principles Insight (hybrid format only) */}
      {hasFirstPrinciplesInsight(data) && (
        <View style={styles.insightBox}>
          <Text style={styles.insightLabel}>First Principles Insight</Text>
          {data.first_principles_insight?.headline && (
            <Text style={styles.insightText}>
              {data.first_principles_insight.headline}
            </Text>
          )}
          {data.first_principles_insight?.explanation && (
            <Text style={[styles.cardContent, { marginTop: 4 }]}>
              {data.first_principles_insight.explanation}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

function RecommendationCard({
  recommendation,
  type,
}: {
  recommendation: ConceptRecommendation;
  type: 'primary' | 'fallback';
}) {
  const isPrimary = type === 'primary';

  // Safely extract hybrid-only properties using type guards
  const track = 'track' in recommendation ? recommendation.track : undefined;
  const keyRisks =
    'key_risks' in recommendation
      ? (recommendation.key_risks as
          | Array<{ risk?: string; mitigation?: string }>
          | undefined)
      : undefined;

  return (
    <View style={isPrimary ? styles.cardHighlight : styles.card}>
      {/* Label */}
      <View style={styles.badgeRow}>
        <View style={[styles.badge, styles.badgePrimary]}>
          <Text style={[styles.badgeText, styles.badgePrimaryText]}>
            {isPrimary ? 'Primary Recommendation' : 'Fallback Strategy'}
          </Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.cardTitle}>{recommendation.title ?? 'Untitled'}</Text>

      {/* Badges */}
      <View style={styles.badgeRow}>
        <TrackBadge track={track} />
        <ConfidenceBadge level={recommendation.confidence_level} />
      </View>

      {/* Executive Summary */}
      {recommendation.executive_summary && (
        <Text style={styles.cardContent}>
          {recommendation.executive_summary}
        </Text>
      )}

      {/* Why It Wins */}
      {recommendation.why_it_wins && (
        <View style={[styles.insightBox, { marginTop: 8 }]}>
          <Text style={styles.insightLabel}>Why This Wins</Text>
          <Text style={styles.cardContent}>{recommendation.why_it_wins}</Text>
        </View>
      )}

      {/* Timeline & Investment */}
      {(recommendation.estimated_timeline ||
        recommendation.estimated_investment) && (
        <View style={[styles.row, { marginTop: 8 }]}>
          {recommendation.estimated_timeline && (
            <View style={styles.col2}>
              <Text style={styles.metaLabel}>Timeline</Text>
              <Text style={styles.metaValue}>
                {recommendation.estimated_timeline}
              </Text>
            </View>
          )}
          {recommendation.estimated_investment && (
            <View style={styles.col2}>
              <Text style={styles.metaLabel}>Investment</Text>
              <Text style={styles.metaValue}>
                {recommendation.estimated_investment}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Key Risks (hybrid format only) */}
      {keyRisks && keyRisks.length > 0 && (
        <View style={{ marginTop: 8 }}>
          <Text style={styles.cardLabel}>Key Risks</Text>
          {keyRisks.slice(0, 3).map((risk, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.listBullet}>⚠</Text>
              <Text style={styles.listContent}>
                {risk.risk ?? ''}
                {risk.mitigation && ` → ${risk.mitigation}`}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function DecisionArchitectureSection({
  primary,
  fallback,
}: {
  primary?: ConceptRecommendation;
  fallback?: ConceptRecommendation;
}) {
  if (!primary && !fallback) return null;

  return (
    <View style={styles.section}>
      <SectionHeader title="Decision Architecture" />

      {primary && (
        <RecommendationCard recommendation={primary} type="primary" />
      )}
      {fallback && (
        <RecommendationCard recommendation={fallback} type="fallback" />
      )}
    </View>
  );
}

function ExecutionTrackSection({ data }: { data?: ExecutionTrackPrimary }) {
  if (!data) return null;

  return (
    <View style={styles.section}>
      <SectionHeader title="Execution Track" />

      <View style={styles.cardHighlight}>
        {/* Title & Badges */}
        <Text style={styles.cardTitle}>{data.title ?? 'Primary Track'}</Text>

        <View style={styles.badgeRow}>
          {data.source_type && (
            <View style={[styles.badge, styles.badgeInfo]}>
              <Text style={[styles.badgeText, styles.badgeInfoText]}>
                {data.source_type.replace(/_/g, ' ')}
              </Text>
            </View>
          )}
          {data.confidence !== undefined && (
            <ConfidenceBadge
              level={
                data.confidence >= 70
                  ? 'High'
                  : data.confidence >= 40
                    ? 'Medium'
                    : 'Low'
              }
            />
          )}
        </View>

        {/* Bottom Line */}
        {data.bottom_line && (
          <Text style={[styles.paragraph, { marginTop: 8 }]}>
            {data.bottom_line}
          </Text>
        )}

        {/* Key Metrics */}
        {(data.timeline || data.investment || data.expected_improvement) && (
          <View style={[styles.row, { marginTop: 8 }]}>
            {data.expected_improvement && (
              <View style={styles.col2}>
                <Text style={styles.metaLabel}>Expected Improvement</Text>
                <Text style={styles.metaValue}>
                  {data.expected_improvement}
                </Text>
              </View>
            )}
            {data.timeline && (
              <View style={styles.col2}>
                <Text style={styles.metaLabel}>Timeline</Text>
                <Text style={styles.metaValue}>{data.timeline}</Text>
              </View>
            )}
          </View>
        )}

        {/* Why It Works */}
        {data.why_it_works && (
          <View style={{ marginTop: 8 }}>
            <Text style={styles.cardLabel}>Why It Works</Text>
            <Text style={styles.cardContent}>{data.why_it_works}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function SupportingConceptsSection({ data }: { data?: SupportingConcept[] }) {
  if (!data || data.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionHeader title="Supporting Concepts" />

      {data.map((concept, i) => (
        <View key={concept.id ?? i} style={styles.card}>
          <Text style={styles.cardTitle}>
            {concept.title ?? `Concept ${i + 1}`}
          </Text>

          {concept.relationship && (
            <View style={styles.badgeRow}>
              <View style={[styles.badge, styles.badgeInfo]}>
                <Text style={[styles.badgeText, styles.badgeInfoText]}>
                  {concept.relationship}
                </Text>
              </View>
            </View>
          )}

          {concept.one_liner && (
            <Text style={styles.cardContent}>{concept.one_liner}</Text>
          )}

          {concept.when_to_use_instead && (
            <View style={{ marginTop: 6 }}>
              <Text style={styles.metaLabel}>When to Use Instead</Text>
              <Text style={styles.cardContent}>
                {concept.when_to_use_instead}
              </Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

function InnovationPortfolioSection({
  recommended,
}: {
  recommended?: RecommendedInnovation;
}) {
  if (!recommended) return null;

  return (
    <View style={styles.section}>
      <SectionHeader title="Innovation Portfolio" />

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Recommended Innovation</Text>
        <Text style={styles.cardTitle}>
          {recommended.title ?? 'Innovation'}
        </Text>

        {recommended.innovation_type && (
          <View style={styles.badgeRow}>
            <View style={[styles.badge, styles.badgePrimary]}>
              <Text style={[styles.badgeText, styles.badgePrimaryText]}>
                {recommended.innovation_type.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>
        )}

        {recommended.what_it_is && (
          <Text style={styles.cardContent}>{recommended.what_it_is}</Text>
        )}

        {/* Breakthrough Potential */}
        {recommended.breakthrough_potential?.if_it_works && (
          <View style={[styles.insightBox, { marginTop: 8 }]}>
            <Text style={styles.insightLabel}>If It Works</Text>
            <Text style={styles.cardContent}>
              {recommended.breakthrough_potential.if_it_works}
            </Text>
          </View>
        )}

        {/* Validation Path */}
        {recommended.validation_path && (
          <View style={{ marginTop: 8 }}>
            <Text style={styles.cardLabel}>Validation Path</Text>
            {recommended.validation_path.first_test && (
              <Text style={styles.cardContent}>
                First Test: {recommended.validation_path.first_test}
              </Text>
            )}
            {recommended.validation_path.timeline && (
              <Text style={styles.cardContent}>
                Timeline: {recommended.validation_path.timeline}
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

function KeyInsightsSection({ insights }: { insights?: string[] }) {
  if (!insights || insights.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionHeader title="Key Insights" />

      {insights.map((insight, i) => (
        <View key={i} style={styles.listItem}>
          <Text style={styles.listBullet}>💡</Text>
          <Text style={styles.listContent}>{insight}</Text>
        </View>
      ))}
    </View>
  );
}

function NextStepsSection({ steps }: { steps?: string[] }) {
  if (!steps || steps.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionHeader title="Next Steps" />

      {steps.map((step, i) => (
        <View key={i} style={styles.listItem}>
          <Text style={styles.listNumber}>{i + 1}.</Text>
          <Text style={styles.listContent}>{step}</Text>
        </View>
      ))}
    </View>
  );
}

function RisksSection({ risks }: { risks?: RiskData[] }) {
  if (!risks || risks.length === 0) return null;

  const getSeverityStyle = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return { badge: styles.badgeLow, text: styles.badgeLowText };
      case 'medium':
        return { badge: styles.badgeMedium, text: styles.badgeMediumText };
      default:
        return { badge: styles.badgeHigh, text: styles.badgeHighText };
    }
  };

  // Helper to extract risk text (handles both legacy and hybrid formats)
  const getRiskText = (r: RiskData): string => {
    // Hybrid format has 'risk', legacy has 'name' + 'description'
    if ('risk' in r && r.risk) return r.risk;
    if ('name' in r && 'description' in r) {
      return r.description ? `${r.name}: ${r.description}` : r.name;
    }
    return '';
  };

  // Helper to get severity (only in hybrid format)
  const getSeverity = (r: RiskData): string | undefined => {
    return 'severity' in r ? r.severity : undefined;
  };

  // Helper to get category (only in hybrid format)
  const getCategory = (r: RiskData): string | undefined => {
    return 'category' in r ? r.category : undefined;
  };

  // Helper to get mitigation
  const getMitigation = (r: RiskData): string | undefined => {
    return 'mitigation' in r ? r.mitigation : undefined;
  };

  return (
    <View style={styles.section}>
      <SectionHeader title="Risks & Watchouts" />

      {risks.map((risk, i) => {
        const severity = getSeverity(risk);
        const category = getCategory(risk);
        const severityStyles = getSeverityStyle(severity);

        return (
          <View key={i} style={styles.card}>
            <View style={styles.badgeRow}>
              {category && (
                <View style={[styles.badge, styles.badgeInfo]}>
                  <Text style={[styles.badgeText, styles.badgeInfoText]}>
                    {category}
                  </Text>
                </View>
              )}
              {severity && (
                <View style={[styles.badge, severityStyles.badge]}>
                  <Text style={[styles.badgeText, severityStyles.text]}>
                    {severity.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.cardContent}>{getRiskText(risk)}</Text>

            {getMitigation(risk) && (
              <View style={{ marginTop: 6 }}>
                <Text style={styles.metaLabel}>Mitigation</Text>
                <Text style={styles.cardContent}>{getMitigation(risk)}</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ============================================
// Main Document Component
// ============================================

interface Props {
  report: ReportForPDF;
}

export function ReportPDFDocument({ report }: Props) {
  // Type guard for hybrid report data
  const isHybridReport = (
    data: unknown,
  ): data is { mode: string; report?: HybridReportData } => {
    return (
      typeof data === 'object' &&
      data !== null &&
      'mode' in data &&
      (data as { mode: string }).mode === 'hybrid'
    );
  };

  const reportData = report.report_data;

  // Extract data based on report structure
  let hybridData: HybridReportData | undefined;
  let executiveSummary: ExecutiveSummaryData | undefined;
  let problemAnalysis: ProblemAnalysisData | undefined;
  let decisionArchitecture:
    | {
        primary?: ConceptRecommendation;
        fallback?: ConceptRecommendation;
      }
    | undefined;
  let executionTrack: ExecutionTrackPrimary | undefined;
  let supportingConcepts: SupportingConcept[] | undefined;
  let recommendedInnovation: RecommendedInnovation | undefined;
  let keyInsights: string[] | undefined;
  let nextSteps: string[] | undefined;
  let risksAndWatchouts: RiskData[] | undefined;

  if (isHybridReport(reportData)) {
    hybridData = reportData.report;
    executiveSummary = hybridData?.executive_summary;
    problemAnalysis = hybridData?.problem_analysis;
    decisionArchitecture = hybridData?.decision_architecture;
    executionTrack = hybridData?.execution_track?.primary;
    supportingConcepts = hybridData?.execution_track?.supporting_concepts;
    recommendedInnovation =
      hybridData?.innovation_portfolio?.recommended_innovation;
    keyInsights = hybridData?.key_insights;
    nextSteps = hybridData?.next_steps;
    risksAndWatchouts = hybridData?.risks_and_watchouts;
  } else if (reportData) {
    // Handle legacy/standard report format
    executiveSummary = reportData.executive_summary;
    problemAnalysis = reportData.problem_analysis;
    decisionArchitecture = reportData.report?.decision_architecture;
    keyInsights = reportData.report?.key_insights;
    nextSteps = reportData.report?.next_steps;
    risksAndWatchouts = reportData.risks_and_watchouts;
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>SPARLO</Text>
          <Text style={styles.title}>{report.title}</Text>
          {report.headline && (
            <Text style={styles.headline}>{report.headline}</Text>
          )}
        </View>

        {/* Executive Summary */}
        <ExecutiveSummarySection data={executiveSummary} />

        {/* Problem Analysis */}
        <ProblemAnalysisSection data={problemAnalysis} />

        {/* Decision Architecture */}
        <DecisionArchitectureSection
          primary={decisionArchitecture?.primary}
          fallback={decisionArchitecture?.fallback}
        />

        {/* Execution Track */}
        <ExecutionTrackSection data={executionTrack} />

        {/* Supporting Concepts */}
        <SupportingConceptsSection data={supportingConcepts} />

        {/* Innovation Portfolio */}
        <InnovationPortfolioSection recommended={recommendedInnovation} />

        {/* Key Insights */}
        <KeyInsightsSection insights={keyInsights} />

        {/* Next Steps */}
        <NextStepsSection steps={nextSteps} />

        {/* Risks */}
        <RisksSection risks={risksAndWatchouts} />

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Generated by Sparlo |{' '}
            {new Date(report.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
