import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';

import type { ReportForPDF } from '../_lib/types';

// Register Roboto font - has comprehensive Unicode support including Greek, Cyrillic, etc.
// Using full TTF files from Google Fonts static directory which contain all character sets
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/roboto/v32/KFOmCnqEu92Fr1Me5Q.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://fonts.gstatic.com/s/roboto/v32/KFOlCnqEu92Fr1MmWUlvAw.ttf',
      fontWeight: 700,
    },
  ],
});

// Disable hyphenation to prevent awkward word breaks
Font.registerHyphenationCallback((word) => [word]);
import type {
  ChallengeTheFrame,
  ConstraintsAndMetrics,
  CrossDomainSearch,
  ExecutionTrack,
  ExecutionTrackPrimary,
  FrontierWatch,
  HybridReportData,
  InnovationAnalysis,
  InnovationPortfolio,
  InsightBlock,
  ParallelInvestigation,
  ProblemAnalysis,
  ProblemAnalysisBenchmark,
  RecommendedInnovation,
  RiskAndWatchout,
  SelfCritique,
  StructuredExecutiveSummary,
  SupportingConcept,
  ValidationGap,
  ValidationGate,
} from '../_lib/types';

// ============================================
// Brand System PDF Styles
// Air Company Aesthetic - Technical Monograph
// Typography-driven, near-monochrome (zinc palette only)
// ============================================

const colors = {
  zinc950: '#09090b',
  zinc900: '#18181b',
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
};

const styles = StyleSheet.create({
  // Page setup
  page: {
    padding: 48,
    paddingBottom: 64,
    fontSize: 10,
    fontFamily: 'Roboto',
    backgroundColor: colors.white,
  },
  // Header - minimal, typography-driven
  header: {
    marginBottom: 32,
  },
  logo: {
    fontSize: 11,
    fontFamily: 'Roboto',
    fontWeight: 700,
    color: colors.zinc400,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Roboto',
    fontWeight: 700,
    color: colors.zinc900,
    marginBottom: 8,
    lineHeight: 1.1,
    letterSpacing: -0.5,
  },
  headline: {
    fontSize: 12,
    color: colors.zinc500,
    lineHeight: 1.4,
    letterSpacing: -0.2,
  },
  // Sections - clean spacing
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Roboto',
    fontWeight: 700,
    color: colors.zinc900,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 10,
    color: colors.zinc500,
    letterSpacing: -0.2,
  },
  subsectionTitle: {
    fontSize: 13,
    fontFamily: 'Roboto',
    fontWeight: 700,
    color: colors.zinc800,
    marginBottom: 8,
    marginTop: 16,
    letterSpacing: -0.2,
  },
  // Content - typography baseline
  paragraph: {
    fontSize: 10,
    lineHeight: 1.5,
    color: colors.zinc700,
    marginBottom: 8,
    letterSpacing: -0.1,
  },
  // Article block - left border accent (brand system pattern)
  articleBlock: {
    borderLeftWidth: 2,
    borderLeftColor: colors.zinc900,
    paddingLeft: 16,
    marginBottom: 16,
  },
  // Cards - minimal, no rounded corners (brand system)
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.zinc200,
    padding: 16,
    marginBottom: 12,
  },
  cardHighlight: {
    backgroundColor: colors.white,
    borderLeftWidth: 3,
    borderLeftColor: colors.zinc900,
    paddingLeft: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 12,
    fontFamily: 'Roboto',
    fontWeight: 700,
    color: colors.zinc900,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  cardLabel: {
    fontSize: 9,
    fontFamily: 'Roboto',
    fontWeight: 700,
    color: colors.zinc500,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  cardContent: {
    fontSize: 10,
    lineHeight: 1.5,
    color: colors.zinc600,
    letterSpacing: -0.1,
  },
  // Mono Label (matches web MonoLabel - 13px uppercase tracking wide)
  monoLabel: {
    fontSize: 9,
    fontFamily: 'Roboto',
    fontWeight: 700,
    color: colors.zinc500,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  // Tags - minimal monochrome only (no colored badges)
  tag: {
    backgroundColor: colors.zinc100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 8,
    fontFamily: 'Roboto',
    fontWeight: 700,
    color: colors.zinc600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  // Strong tag variant
  tagStrong: {
    backgroundColor: colors.zinc900,
  },
  tagStrongText: {
    color: colors.white,
  },
  // Muted tag variant
  tagMuted: {
    backgroundColor: colors.zinc50,
    borderWidth: 1,
    borderColor: colors.zinc200,
  },
  tagMutedText: {
    color: colors.zinc500,
  },
  // Lists - clean typography
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  listBullet: {
    width: 12,
    fontSize: 10,
    color: colors.zinc400,
  },
  listNumber: {
    width: 24,
    fontSize: 10,
    fontFamily: 'Roboto',
    fontWeight: 700,
    color: colors.zinc300,
  },
  listContent: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.5,
    color: colors.zinc600,
    letterSpacing: -0.1,
  },
  // Constraint dots - monochrome only
  dotHard: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.zinc900,
    marginRight: 10,
    marginTop: 5,
  },
  dotSoft: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.zinc400,
    marginRight: 10,
    marginTop: 5,
  },
  dotAssumption: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.zinc300,
    marginRight: 10,
    marginTop: 5,
  },
  // Tables - minimal borders
  table: {
    borderTopWidth: 1,
    borderTopColor: colors.zinc200,
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.zinc200,
    paddingVertical: 8,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 9,
    fontFamily: 'Roboto',
    fontWeight: 700,
    color: colors.zinc500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.zinc100,
    paddingVertical: 8,
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
    color: colors.zinc600,
  },
  tableCellBold: {
    flex: 1,
    fontSize: 9,
    fontFamily: 'Roboto',
    fontWeight: 700,
    color: colors.zinc900,
  },
  tableCellHighlight: {
    flex: 1,
    fontSize: 9,
    fontFamily: 'Roboto',
    fontWeight: 700,
    color: colors.zinc700,
  },
  // Grid
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  col2: {
    width: '50%',
    paddingRight: 12,
  },
  col3: {
    width: '33%',
    paddingRight: 12,
  },
  // Metadata
  metaItem: {
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 9,
    fontFamily: 'Roboto',
    fontWeight: 700,
    color: colors.zinc400,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  metaValue: {
    fontSize: 10,
    color: colors.zinc700,
    marginTop: 2,
  },
  // Insight box - left border accent
  insightBox: {
    borderLeftWidth: 3,
    borderLeftColor: colors.zinc900,
    paddingLeft: 16,
    paddingVertical: 8,
    marginTop: 12,
    marginBottom: 12,
  },
  insightLabel: {
    fontSize: 9,
    fontFamily: 'Roboto',
    fontWeight: 700,
    color: colors.zinc400,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  insightText: {
    fontSize: 11,
    fontFamily: 'Roboto',
    fontWeight: 700,
    color: colors.zinc900,
    lineHeight: 1.4,
    letterSpacing: -0.2,
  },
  // Warning/note box - lighter border
  warningBox: {
    borderLeftWidth: 2,
    borderLeftColor: colors.zinc300,
    paddingLeft: 16,
    paddingVertical: 8,
    marginTop: 12,
    marginBottom: 12,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.zinc200,
    paddingTop: 12,
  },
  footerText: {
    fontSize: 8,
    color: colors.zinc400,
    letterSpacing: 0.3,
  },
  pageNumber: {
    fontSize: 8,
    color: colors.zinc400,
  },
});

// ============================================
// Helper Components
// ============================================

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.sectionHeader} wrap={false}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
  );
}

function MonoLabel({ children }: { children: string }) {
  return <Text style={styles.monoLabel}>{children}</Text>;
}

// Confidence displayed as text, not colored badge (brand system)
function ConfidenceTag({ level }: { level?: number | string }) {
  let label: string;

  if (typeof level === 'number') {
    label = `${level}% confidence`;
  } else {
    label = `${level ?? 'Medium'} confidence`;
  }

  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

function SourceTypeTag({ type }: { type?: string }) {
  if (!type) return null;
  const label = type.replace(/_/g, ' ');
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

function InsightBlockDisplay({ insight }: { insight?: InsightBlock }) {
  if (!insight) return null;

  return (
    <View style={styles.insightBox} wrap={false}>
      <MonoLabel>The Insight</MonoLabel>
      {insight.what && <Text style={styles.insightText}>{insight.what}</Text>}
      {insight.where_we_found_it && (
        <View style={{ marginTop: 8 }}>
          <Text style={styles.cardContent}>
            <Text style={{ fontFamily: 'Roboto', fontWeight: 700 }}>Domain: </Text>
            {insight.where_we_found_it.domain}
          </Text>
          {insight.where_we_found_it.how_they_use_it && (
            <Text style={styles.cardContent}>
              <Text style={{ fontFamily: 'Roboto', fontWeight: 700 }}>
                How they use it:{' '}
              </Text>
              {insight.where_we_found_it.how_they_use_it}
            </Text>
          )}
          {insight.where_we_found_it.why_it_transfers && (
            <Text style={styles.cardContent}>
              <Text style={{ fontFamily: 'Roboto', fontWeight: 700 }}>
                Why it transfers:{' '}
              </Text>
              {insight.where_we_found_it.why_it_transfers}
            </Text>
          )}
        </View>
      )}
      {insight.why_industry_missed_it && (
        <View style={{ marginTop: 8 }}>
          <Text style={styles.cardContent}>
            <Text style={{ fontFamily: 'Roboto', fontWeight: 700 }}>
              Why industry missed it:{' '}
            </Text>
            {insight.why_industry_missed_it}
          </Text>
        </View>
      )}
    </View>
  );
}

// ============================================
// 1. Brief Section
// ============================================

function BriefSection({ brief }: { brief?: string }) {
  if (!brief) return null;

  return (
    <View style={styles.section}>
      <SectionHeader title="The Brief" subtitle="Original problem statement" />
      <View style={styles.card} wrap={false}>
        <Text style={styles.paragraph}>{brief}</Text>
      </View>
    </View>
  );
}

// ============================================
// 2. Problem Analysis Section
// ============================================

function ProblemAnalysisSection({ analysis }: { analysis?: ProblemAnalysis }) {
  if (!analysis) return null;

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Problem Analysis"
        subtitle="Understanding the challenge"
      />

      {/* What's Wrong */}
      {analysis.whats_wrong?.prose && (
        <View style={styles.card} wrap={false}>
          <MonoLabel>What&apos;s Wrong</MonoLabel>
          <Text style={styles.paragraph}>{analysis.whats_wrong.prose}</Text>
        </View>
      )}

      {/* Why It's Hard */}
      {analysis.why_its_hard && (
        <View style={styles.card} wrap={false}>
          <MonoLabel>Why It&apos;s Hard</MonoLabel>
          {analysis.why_its_hard.prose && (
            <Text style={styles.paragraph}>{analysis.why_its_hard.prose}</Text>
          )}
          {analysis.why_its_hard.governing_equation && (
            <View style={[styles.insightBox, { marginTop: 8 }]}>
              <Text
                style={[styles.cardContent, { fontFamily: 'Roboto', fontWeight: 700 }]}
              >
                {analysis.why_its_hard.governing_equation.equation}
              </Text>
              {analysis.why_its_hard.governing_equation.explanation && (
                <Text style={[styles.cardContent, { marginTop: 4 }]}>
                  {analysis.why_its_hard.governing_equation.explanation}
                </Text>
              )}
            </View>
          )}
          {analysis.why_its_hard.factors &&
            analysis.why_its_hard.factors.length > 0 && (
              <View style={{ marginTop: 8 }}>
                {analysis.why_its_hard.factors.map((f, i) => (
                  <View key={i} style={styles.listItem}>
                    <Text style={styles.listBullet}>•</Text>
                    <Text style={styles.listContent}>
                      {typeof f === 'string'
                        ? f
                        : `${f.factor}: ${f.explanation}`}
                    </Text>
                  </View>
                ))}
              </View>
            )}
        </View>
      )}

      {/* First Principles Insight */}
      {analysis.first_principles_insight && (
        <View style={styles.insightBox} wrap={false}>
          <MonoLabel>First Principles Insight</MonoLabel>
          {analysis.first_principles_insight.headline && (
            <Text style={styles.insightText}>
              {analysis.first_principles_insight.headline}
            </Text>
          )}
          {analysis.first_principles_insight.explanation && (
            <Text style={[styles.cardContent, { marginTop: 4 }]}>
              {analysis.first_principles_insight.explanation}
            </Text>
          )}
        </View>
      )}

      {/* Current State of Art - Benchmarks */}
      {analysis.current_state_of_art?.benchmarks &&
        analysis.current_state_of_art.benchmarks.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.subsectionTitle}>Current State of Art</Text>
            <View style={styles.table} wrap={false}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderCell}>Entity</Text>
                <Text style={styles.tableHeaderCell}>Approach</Text>
                <Text style={styles.tableHeaderCell}>Performance</Text>
              </View>
              {analysis.current_state_of_art.benchmarks.map(
                (b: ProblemAnalysisBenchmark, i: number) => (
                  <View key={i} style={styles.tableRow}>
                    <Text style={styles.tableCellBold}>{b.entity}</Text>
                    <Text style={styles.tableCell}>{b.approach}</Text>
                    <Text style={styles.tableCell}>
                      {b.current_performance}
                    </Text>
                  </View>
                ),
              )}
            </View>
          </View>
        )}

      {/* What Industry Does Today */}
      {analysis.what_industry_does_today &&
        analysis.what_industry_does_today.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.subsectionTitle}>What Industry Does Today</Text>
            {analysis.what_industry_does_today.map((item, i) => (
              <View key={i} style={[styles.card, { marginBottom: 8 }]}>
                <Text
                  style={[styles.cardContent, { fontFamily: 'Roboto', fontWeight: 700 }]}
                >
                  {item.approach}
                </Text>
                {item.limitation && (
                  <Text style={[styles.cardContent, { color: colors.zinc600 }]}>
                    Limitation: {item.limitation}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

      {/* Root Cause Hypotheses */}
      {analysis.root_cause_hypotheses &&
        analysis.root_cause_hypotheses.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.subsectionTitle}>Root Cause Hypotheses</Text>
            {analysis.root_cause_hypotheses.map((h, i) => (
              <View key={i} style={styles.card} wrap={false}>
                <View style={styles.row}>
                  <Text style={styles.cardTitle}>
                    {h.name ?? h.hypothesis ?? `Hypothesis ${i + 1}`}
                  </Text>
                </View>
                {(h.confidence_percent || h.confidence) && (
                  <View style={styles.tagRow}>
                    <ConfidenceTag
                      level={h.confidence_percent ?? h.confidence}
                    />
                  </View>
                )}
                {h.explanation && (
                  <Text style={styles.cardContent}>{h.explanation}</Text>
                )}
                {h.evidence && (
                  <Text style={[styles.cardContent, { marginTop: 4 }]}>
                    <Text style={{ fontFamily: 'Roboto', fontWeight: 700 }}>
                      Evidence:{' '}
                    </Text>
                    {h.evidence}
                  </Text>
                )}
                {h.implication && (
                  <Text style={[styles.cardContent, { marginTop: 4 }]}>
                    <Text style={{ fontFamily: 'Roboto', fontWeight: 700 }}>
                      Implication:{' '}
                    </Text>
                    {h.implication}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

      {/* Success Metrics */}
      {analysis.success_metrics && analysis.success_metrics.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Text style={styles.subsectionTitle}>Success Metrics</Text>
          <View style={styles.table} wrap={false}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderCell}>Metric</Text>
              <Text style={styles.tableHeaderCell}>Target</Text>
              <Text style={styles.tableHeaderCell}>Min Viable</Text>
              <Text style={styles.tableHeaderCell}>Stretch</Text>
            </View>
            {analysis.success_metrics.map((m, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.tableCellBold}>{m.metric}</Text>
                <Text style={styles.tableCellHighlight}>{m.target}</Text>
                <Text style={styles.tableCell}>{m.minimum_viable}</Text>
                <Text style={styles.tableCell}>{m.stretch}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// ============================================
// 3. Executive Summary Section
// ============================================

function ExecutiveSummarySection({
  summary,
}: {
  summary?: string | StructuredExecutiveSummary;
}) {
  if (!summary) return null;

  if (typeof summary === 'string') {
    return (
      <View style={styles.section}>
        <SectionHeader title="Executive Summary" subtitle="The bottom line" />
        <View style={styles.card} wrap={false}>
          <Text style={[styles.paragraph, { fontSize: 12 }]}>{summary}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <SectionHeader title="Executive Summary" subtitle="The bottom line" />
      <View style={styles.card} wrap={false}>
        {/* Narrative Lead */}
        {summary.narrative_lead && (
          <Text
            style={[
              styles.paragraph,
              { fontSize: 12, fontFamily: 'Roboto' },
            ]}
          >
            {summary.narrative_lead}
          </Text>
        )}

        {/* Core Insight */}
        {summary.core_insight && (
          <View style={styles.insightBox} wrap={false}>
            <MonoLabel>Core Insight</MonoLabel>
            {summary.core_insight.headline && (
              <Text style={styles.insightText}>
                {summary.core_insight.headline}
              </Text>
            )}
            {summary.core_insight.explanation && (
              <Text style={[styles.cardContent, { marginTop: 4 }]}>
                {summary.core_insight.explanation}
              </Text>
            )}
          </View>
        )}

        {/* Viability */}
        {summary.viability && (
          <View style={[styles.row, { marginTop: 8 }]}>
            <MonoLabel>Viability</MonoLabel>
            <View style={[styles.tag, { marginLeft: 8 }]}>
              <Text style={styles.tagText}>
                {summary.viability_label ?? summary.viability}
              </Text>
            </View>
          </View>
        )}

        {/* Primary Recommendation */}
        {summary.primary_recommendation && (
          <View style={[styles.cardHighlight, { marginTop: 12 }]}>
            <MonoLabel>Primary Recommendation</MonoLabel>
            <Text style={[styles.paragraph, { fontFamily: 'Roboto', fontWeight: 700 }]}>
              {summary.primary_recommendation}
            </Text>
          </View>
        )}

        {/* Recommended Path */}
        {summary.recommended_path && summary.recommended_path.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <MonoLabel>Recommended Path</MonoLabel>
            {summary.recommended_path.map((step, i) => {
              const stepNum =
                'step_number' in step
                  ? (step as { step_number: number }).step_number
                  : (step.step ?? i + 1);
              const action =
                'content' in step
                  ? (step as { content: string }).content
                  : (step.action ?? '');
              return (
                <View key={i} style={styles.listItem}>
                  <Text style={styles.listNumber}>{stepNum}.</Text>
                  <Text style={styles.listContent}>{action}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

// ============================================
// 4. Solution Concepts Section (formerly Execution Track)
// ============================================

function SolutionConceptsSection({ track }: { track?: ExecutionTrack }) {
  if (!track) return null;

  const primary = track.primary;
  const supporting = track.supporting_concepts;

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Solution Concepts"
        subtitle="Proven approaches and alternatives"
      />

      {/* Intro */}
      {track.intro && (
        <Text style={[styles.paragraph, { marginBottom: 12 }]}>
          {track.intro}
        </Text>
      )}

      {/* Primary Solution */}
      {primary && (
        <View style={styles.cardHighlight}>
          {/* Header section - keep together */}
          <View wrap={false}>
            <View style={styles.tagRow}>
              <View style={[styles.tag, styles.tagStrong]}>
                <Text style={[styles.tagText, styles.tagStrongText]}>
                  Primary
                </Text>
              </View>
              <SourceTypeTag type={primary.source_type} />
              {primary.confidence !== undefined && (
                <ConfidenceTag level={primary.confidence} />
              )}
            </View>

            <Text style={styles.cardTitle}>{primary.title}</Text>

            {primary.bottom_line && (
              <Text style={[styles.paragraph, { marginTop: 4 }]}>
                {primary.bottom_line}
              </Text>
            )}
          </View>

          {primary.what_it_is && (
            <View style={{ marginTop: 8 }} wrap={false}>
              <MonoLabel>What It Is</MonoLabel>
              <Text style={styles.cardContent}>{primary.what_it_is}</Text>
            </View>
          )}

          {primary.why_it_works && (
            <View style={{ marginTop: 8 }} wrap={false}>
              <MonoLabel>Why It Works</MonoLabel>
              <Text style={styles.cardContent}>{primary.why_it_works}</Text>
            </View>
          )}

          {/* The Insight */}
          <InsightBlockDisplay insight={primary.the_insight} />

          {/* Economics */}
          {(primary.expected_improvement ||
            primary.investment ||
            primary.timeline) && (
            <View style={[styles.row, { marginTop: 12 }]} wrap={false}>
              {primary.expected_improvement && (
                <View style={styles.col3}>
                  <MonoLabel>Expected Improvement</MonoLabel>
                  <Text style={styles.metaValue}>
                    {primary.expected_improvement}
                  </Text>
                </View>
              )}
              {primary.investment && (
                <View style={styles.col3}>
                  <MonoLabel>Investment</MonoLabel>
                  <Text style={styles.metaValue}>{primary.investment}</Text>
                </View>
              )}
              {primary.timeline && (
                <View style={styles.col3}>
                  <MonoLabel>Timeline</MonoLabel>
                  <Text style={styles.metaValue}>{primary.timeline}</Text>
                </View>
              )}
            </View>
          )}

          {/* Validation Gates */}
          {primary.validation_gates && primary.validation_gates.length > 0 && (
            <View style={{ marginTop: 12 }}>
              <MonoLabel>Validation Gates</MonoLabel>
              {primary.validation_gates.map(
                (gate: ValidationGate, i: number) => (
                  <View key={i} style={[styles.card, { marginTop: 6 }]} wrap={false}>
                    {gate.week && (
                      <Text
                        style={[
                          styles.cardContent,
                          { fontFamily: 'Roboto', fontWeight: 700 },
                        ]}
                      >
                        {gate.week}
                      </Text>
                    )}
                    {gate.test && (
                      <Text style={styles.cardContent}>{gate.test}</Text>
                    )}
                    {gate.success_criteria && (
                      <Text
                        style={[styles.cardContent, { color: colors.zinc700 }]}
                      >
                        Success: {gate.success_criteria}
                      </Text>
                    )}
                  </View>
                ),
              )}
            </View>
          )}

          {/* Why It Might Fail */}
          {primary.why_it_might_fail &&
            primary.why_it_might_fail.length > 0 && (
              <View style={[styles.warningBox, { marginTop: 12 }]} wrap={false}>
                <MonoLabel>Why It Might Fail</MonoLabel>
                {primary.why_it_might_fail.map((reason, i) => (
                  <View key={i} style={styles.listItem}>
                    <Text style={styles.listBullet}>•</Text>
                    <Text style={styles.listContent}>{reason}</Text>
                  </View>
                ))}
              </View>
            )}
        </View>
      )}

      {/* Supporting Concepts */}
      {supporting && supporting.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.subsectionTitle}>Supporting Concepts</Text>
          {supporting.map((concept: SupportingConcept, i: number) => (
            <View key={concept.id ?? i} style={styles.card} wrap={false}>
              <View style={styles.tagRow}>
                {concept.relationship && (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{concept.relationship}</Text>
                  </View>
                )}
                {concept.confidence !== undefined && (
                  <ConfidenceTag level={concept.confidence} />
                )}
              </View>

              <Text style={styles.cardTitle}>{concept.title}</Text>

              {concept.one_liner && (
                <Text style={styles.cardContent}>{concept.one_liner}</Text>
              )}

              {concept.what_it_is && (
                <View style={{ marginTop: 6 }}>
                  <MonoLabel>What It Is</MonoLabel>
                  <Text style={styles.cardContent}>{concept.what_it_is}</Text>
                </View>
              )}

              {concept.when_to_use_instead && (
                <View style={{ marginTop: 6 }}>
                  <MonoLabel>When to Use Instead</MonoLabel>
                  <Text style={styles.cardContent}>
                    {concept.when_to_use_instead}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Fallback Trigger */}
      {track.fallback_trigger && (
        <View style={[styles.warningBox, { marginTop: 12 }]}>
          <MonoLabel>Fallback Trigger</MonoLabel>
          {track.fallback_trigger.conditions &&
            track.fallback_trigger.conditions.length > 0 && (
              <View style={{ marginTop: 4 }}>
                {track.fallback_trigger.conditions.map((c, i) => (
                  <View key={i} style={styles.listItem}>
                    <Text style={styles.listBullet}>•</Text>
                    <Text style={styles.listContent}>{c}</Text>
                  </View>
                ))}
              </View>
            )}
          {track.fallback_trigger.pivot_to && (
            <Text style={[styles.cardContent, { marginTop: 4 }]}>
              <Text style={{ fontFamily: 'Roboto', fontWeight: 700 }}>Pivot to: </Text>
              {track.fallback_trigger.pivot_to}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

// ============================================
// 5. Innovation Concepts Section
// ============================================

function InnovationConceptsSection({
  portfolio,
}: {
  portfolio?: InnovationPortfolio;
}) {
  if (!portfolio) return null;

  const recommended = portfolio.recommended_innovation;
  const parallel = portfolio.parallel_investigations;

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Innovation Concepts"
        subtitle="Higher-risk, higher-reward approaches"
      />

      {/* Intro */}
      {portfolio.intro && (
        <Text style={[styles.paragraph, { marginBottom: 12 }]}>
          {portfolio.intro}
        </Text>
      )}

      {/* Recommended Innovation */}
      {recommended && (
        <View style={styles.cardHighlight}>
          {/* Header section - keep together */}
          <View wrap={false}>
            <View style={styles.tagRow}>
              <View style={[styles.tag, styles.tagStrong]}>
                <Text style={[styles.tagText, styles.tagStrongText]}>
                  Recommended
                </Text>
              </View>
              {recommended.innovation_type && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>
                    {recommended.innovation_type.replace(/_/g, ' ')}
                  </Text>
                </View>
              )}
              {recommended.confidence !== undefined && (
                <ConfidenceTag level={recommended.confidence} />
              )}
            </View>

            <Text style={styles.cardTitle}>{recommended.title}</Text>
          </View>

          {recommended.what_it_is && (
            <View style={{ marginTop: 8 }} wrap={false}>
              <MonoLabel>What It Is</MonoLabel>
              <Text style={styles.cardContent}>{recommended.what_it_is}</Text>
            </View>
          )}

          {recommended.why_it_works && (
            <View style={{ marginTop: 8 }} wrap={false}>
              <MonoLabel>Why It Works</MonoLabel>
              <Text style={styles.cardContent}>{recommended.why_it_works}</Text>
            </View>
          )}

          {/* The Insight */}
          <InsightBlockDisplay insight={recommended.the_insight} />

          {/* Breakthrough Potential */}
          {recommended.breakthrough_potential && (
            <View style={[styles.insightBox, { marginTop: 12 }]} wrap={false}>
              <MonoLabel>Breakthrough Potential</MonoLabel>
              {recommended.breakthrough_potential.if_it_works && (
                <Text style={styles.insightText}>
                  {recommended.breakthrough_potential.if_it_works}
                </Text>
              )}
              {recommended.breakthrough_potential.estimated_improvement && (
                <Text style={[styles.cardContent, { marginTop: 4 }]}>
                  Estimated improvement:{' '}
                  {recommended.breakthrough_potential.estimated_improvement}
                </Text>
              )}
            </View>
          )}

          {/* Validation Path */}
          {recommended.validation_path && (
            <View style={{ marginTop: 12 }} wrap={false}>
              <MonoLabel>Validation Path</MonoLabel>
              {recommended.validation_path.first_test && (
                <Text style={styles.cardContent}>
                  First test: {recommended.validation_path.first_test}
                </Text>
              )}
              {recommended.validation_path.timeline && (
                <Text style={styles.cardContent}>
                  Timeline: {recommended.validation_path.timeline}
                </Text>
              )}
              {recommended.validation_path.cost && (
                <Text style={styles.cardContent}>
                  Cost: {recommended.validation_path.cost}
                </Text>
              )}
            </View>
          )}

          {/* Risks */}
          {recommended.risks && (
            <View style={[styles.warningBox, { marginTop: 12 }]} wrap={false}>
              <MonoLabel>Risks</MonoLabel>
              {recommended.risks.physics_risks?.map((r, i) => (
                <View key={i} style={styles.listItem}>
                  <Text style={styles.listBullet}>•</Text>
                  <Text style={styles.listContent}>{r}</Text>
                </View>
              ))}
              {recommended.risks.implementation_challenges?.map((r, i) => (
                <View key={i} style={styles.listItem}>
                  <Text style={styles.listBullet}>•</Text>
                  <Text style={styles.listContent}>{r}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Parallel Investigations */}
      {parallel && parallel.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.subsectionTitle}>Parallel Investigations</Text>
          {parallel.map((inv: ParallelInvestigation, i: number) => (
            <View key={inv.id ?? i} style={styles.card} wrap={false}>
              <View style={styles.tagRow}>
                {inv.innovation_type && (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>
                      {inv.innovation_type.replace(/_/g, ' ')}
                    </Text>
                  </View>
                )}
                {inv.confidence !== undefined && (
                  <ConfidenceTag level={inv.confidence} />
                )}
              </View>

              <Text style={styles.cardTitle}>{inv.title}</Text>

              {inv.one_liner && (
                <Text style={styles.cardContent}>{inv.one_liner}</Text>
              )}

              {inv.what_it_is && (
                <View style={{ marginTop: 6 }}>
                  <MonoLabel>What It Is</MonoLabel>
                  <Text style={styles.cardContent}>{inv.what_it_is}</Text>
                </View>
              )}

              {inv.ceiling && (
                <View style={{ marginTop: 6 }}>
                  <MonoLabel>Ceiling</MonoLabel>
                  <Text style={styles.cardContent}>{inv.ceiling}</Text>
                </View>
              )}

              {inv.key_uncertainty && (
                <View style={{ marginTop: 6 }}>
                  <MonoLabel>Key Uncertainty</MonoLabel>
                  <Text style={styles.cardContent}>{inv.key_uncertainty}</Text>
                </View>
              )}

              <InsightBlockDisplay insight={inv.the_insight} />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ============================================
// 6. Frontier Watch Section
// ============================================

function FrontierWatchSection({ items }: { items?: FrontierWatch[] }) {
  if (!items || items.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Frontier Watch"
        subtitle="Emerging technologies to monitor"
      />

      {items.map((item: FrontierWatch, i: number) => (
        <View key={item.id ?? i} style={styles.card} wrap={false}>
          <View style={styles.tagRow}>
            {item.innovation_type && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>
                  {item.innovation_type.replace(/_/g, ' ')}
                </Text>
              </View>
            )}
            {item.trl_estimate !== undefined && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>TRL {item.trl_estimate}</Text>
              </View>
            )}
          </View>

          <Text style={styles.cardTitle}>{item.title}</Text>

          {item.one_liner && (
            <Text style={styles.cardContent}>{item.one_liner}</Text>
          )}

          {item.why_interesting && (
            <View style={{ marginTop: 6 }}>
              <MonoLabel>Why Interesting</MonoLabel>
              <Text style={styles.cardContent}>{item.why_interesting}</Text>
            </View>
          )}

          {item.why_not_now && (
            <View style={{ marginTop: 6 }}>
              <MonoLabel>Why Not Now</MonoLabel>
              <Text style={styles.cardContent}>{item.why_not_now}</Text>
            </View>
          )}

          {item.trigger_to_revisit && (
            <View style={{ marginTop: 6 }}>
              <MonoLabel>Trigger to Revisit</MonoLabel>
              <Text style={styles.cardContent}>{item.trigger_to_revisit}</Text>
            </View>
          )}

          {item.earliest_viability && (
            <View style={{ marginTop: 6 }}>
              <MonoLabel>Earliest Viability</MonoLabel>
              <Text style={styles.cardContent}>{item.earliest_viability}</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

// ============================================
// 7. Constraints & Metrics Section
// ============================================

function ConstraintsSection({
  constraints,
}: {
  constraints?: ConstraintsAndMetrics;
}) {
  if (!constraints) return null;

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Constraints & Metrics"
        subtitle="Requirements and success criteria"
      />

      {/* Hard Constraints */}
      {constraints.hard_constraints &&
        constraints.hard_constraints.length > 0 && (
          <View style={styles.card} wrap={false}>
            <MonoLabel>Hard Constraints</MonoLabel>
            {constraints.hard_constraints.map((c, i) => (
              <View
                key={i}
                style={[styles.listItem, { alignItems: 'flex-start' }]}
              >
                <View style={styles.dotHard} />
                <Text style={styles.listContent}>{c}</Text>
              </View>
            ))}
          </View>
        )}

      {/* Soft Constraints */}
      {constraints.soft_constraints &&
        constraints.soft_constraints.length > 0 && (
          <View style={styles.card} wrap={false}>
            <MonoLabel>Soft Constraints</MonoLabel>
            {constraints.soft_constraints.map((c, i) => (
              <View
                key={i}
                style={[styles.listItem, { alignItems: 'flex-start' }]}
              >
                <View style={styles.dotSoft} />
                <Text style={styles.listContent}>{c}</Text>
              </View>
            ))}
          </View>
        )}

      {/* Assumptions */}
      {constraints.assumptions && constraints.assumptions.length > 0 && (
        <View style={styles.card} wrap={false}>
          <MonoLabel>Assumptions</MonoLabel>
          {constraints.assumptions.map((a, i) => (
            <View
              key={i}
              style={[styles.listItem, { alignItems: 'flex-start' }]}
            >
              <View style={styles.dotAssumption} />
              <Text style={styles.listContent}>{a}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Success Metrics Table */}
      {constraints.success_metrics &&
        constraints.success_metrics.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <MonoLabel>Success Metrics</MonoLabel>
            <View style={[styles.table, { marginTop: 8 }]}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderCell}>Metric</Text>
                <Text style={styles.tableHeaderCell}>Target</Text>
                <Text style={styles.tableHeaderCell}>Min Viable</Text>
                <Text style={styles.tableHeaderCell}>Stretch</Text>
              </View>
              {constraints.success_metrics.map((m, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={styles.tableCellBold}>{m.metric}</Text>
                  <Text style={styles.tableCellHighlight}>{m.target}</Text>
                  <Text style={styles.tableCell}>{m.minimum_viable}</Text>
                  <Text style={styles.tableCell}>{m.stretch}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
    </View>
  );
}

// ============================================
// 8. Challenge the Frame Section
// ============================================

function ChallengeTheFrameSection({
  challenges,
}: {
  challenges?: ChallengeTheFrame[];
}) {
  if (!challenges || challenges.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Challenge the Frame"
        subtitle="Questioning key assumptions"
      />

      {challenges.map((c, i) => (
        <View key={i} style={styles.card} wrap={false}>
          <View style={{ marginBottom: 8 }}>
            <MonoLabel>Assumption</MonoLabel>
            <Text
              style={[styles.cardContent, { fontFamily: 'Roboto', fontWeight: 700 }]}
            >
              {c.assumption}
            </Text>
          </View>

          <View style={{ marginBottom: 8 }}>
            <MonoLabel>Challenge</MonoLabel>
            <Text style={styles.cardContent}>{c.challenge}</Text>
          </View>

          {c.implication && (
            <View
              style={{
                backgroundColor: colors.zinc100,
                padding: 8,
              }}
            >
              <MonoLabel>Implication</MonoLabel>
              <Text style={[styles.cardContent, { color: colors.zinc600 }]}>
                {c.implication}
              </Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

// ============================================
// 9. Innovation Analysis Section
// ============================================

function InnovationAnalysisSection({
  analysis,
}: {
  analysis?: InnovationAnalysis;
}) {
  if (!analysis) return null;

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Innovation Analysis"
        subtitle="Cross-domain search strategy"
      />

      <View style={styles.card} wrap={false}>
        {analysis.reframe && (
          <View style={{ marginBottom: 8 }}>
            <MonoLabel>Reframe</MonoLabel>
            <Text style={styles.cardContent}>{analysis.reframe}</Text>
          </View>
        )}

        {analysis.domains_searched && analysis.domains_searched.length > 0 && (
          <View>
            <MonoLabel>Domains Searched</MonoLabel>
            <View style={styles.tagRow}>
              {analysis.domains_searched.map((d, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{d}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

// ============================================
// Cross-Domain Search Section
// ============================================

function CrossDomainSearchSection({ search }: { search?: CrossDomainSearch }) {
  if (!search) return null;

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Cross-Domain Search"
        subtitle="Insights from analogous fields"
      />

      {/* Enhanced Challenge Frame */}
      {search.enhanced_challenge_frame && (
        <View style={styles.card} wrap={false}>
          {search.enhanced_challenge_frame.reframing && (
            <View style={{ marginBottom: 8 }}>
              <MonoLabel>Reframing</MonoLabel>
              <Text style={styles.cardContent}>
                {search.enhanced_challenge_frame.reframing}
              </Text>
            </View>
          )}

          {search.enhanced_challenge_frame.search_queries &&
            search.enhanced_challenge_frame.search_queries.length > 0 && (
              <View>
                <MonoLabel>Search Queries</MonoLabel>
                {search.enhanced_challenge_frame.search_queries.map((q, i) => (
                  <View key={i} style={styles.listItem}>
                    <Text style={styles.listBullet}>•</Text>
                    <Text style={styles.listContent}>{q}</Text>
                  </View>
                ))}
              </View>
            )}
        </View>
      )}

      {/* Domains Searched */}
      {search.domains_searched && search.domains_searched.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Text style={styles.subsectionTitle}>Domains Explored</Text>
          {search.domains_searched.map((d, i) => (
            <View key={i} style={styles.card} wrap={false}>
              {d.domain && <Text style={styles.cardTitle}>{d.domain}</Text>}
              {d.mechanism_found && (
                <View style={{ marginTop: 4 }}>
                  <MonoLabel>Mechanism Found</MonoLabel>
                  <Text style={styles.cardContent}>{d.mechanism_found}</Text>
                </View>
              )}
              {d.relevance && (
                <View style={{ marginTop: 4 }}>
                  <MonoLabel>Relevance</MonoLabel>
                  <Text style={styles.cardContent}>{d.relevance}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* From Scratch Revelations */}
      {search.from_scratch_revelations &&
        search.from_scratch_revelations.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.subsectionTitle}>Key Discoveries</Text>
            {search.from_scratch_revelations.map((r, i) => (
              <View key={i} style={styles.insightBox} wrap={false}>
                {r.discovery && (
                  <Text style={styles.insightText}>{r.discovery}</Text>
                )}
                {r.source && (
                  <Text style={[styles.cardContent, { marginTop: 4 }]}>
                    Source: {r.source}
                  </Text>
                )}
                {r.implication && (
                  <Text style={[styles.cardContent, { marginTop: 4 }]}>
                    Implication: {r.implication}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
    </View>
  );
}


// ============================================
// 13. Risks & Watchouts Section
// ============================================

function RisksSection({ risks }: { risks?: RiskAndWatchout[] }) {
  if (!risks || risks.length === 0) return null;

  const getSeverityStyle = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return { badge: styles.tagStrong, text: styles.tagStrongText };
      case 'medium':
        return { badge: styles.tag, text: styles.tagText };
      default:
        return { badge: styles.tagMuted, text: styles.tagMutedText };
    }
  };

  return (
    <View style={styles.section}>
      <SectionHeader title="Risks & Watchouts" subtitle="Potential pitfalls" />

      {risks.map((risk, i) => {
        const severityStyles = getSeverityStyle(risk.severity);

        return (
          <View key={i} style={styles.card} wrap={false}>
            <View style={styles.tagRow}>
              {risk.category && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{risk.category}</Text>
                </View>
              )}
              {risk.severity && (
                <View style={[styles.tag, severityStyles.badge]}>
                  <Text style={[styles.tagText, severityStyles.text]}>
                    {risk.severity.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.cardContent}>{risk.risk}</Text>

            {risk.mitigation && (
              <View style={{ marginTop: 6 }}>
                <MonoLabel>Mitigation</MonoLabel>
                <Text style={styles.cardContent}>{risk.mitigation}</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

// ============================================
// 11. Key Insights Section
// ============================================

function KeyInsightsSection({ insights }: { insights?: string[] }) {
  if (!insights || insights.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Key Insights"
        subtitle="Critical learnings from this analysis"
      />

      {insights.map((insight, i) => (
        <View key={i} style={styles.card} wrap={false}>
          <View style={styles.listItem}>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: colors.zinc100,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: 'Roboto',
                  fontWeight: 700,
                  color: colors.zinc700,
                }}
              >
                {i + 1}
              </Text>
            </View>
            <Text style={[styles.listContent, { flex: 1 }]}>{insight}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ============================================
// 12. Next Steps Section
// ============================================

function NextStepsSection({ steps }: { steps?: string[] }) {
  if (!steps || steps.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Next Steps"
        subtitle="Recommended actions in sequence"
      />

      {steps.map((step, i) => (
        <View key={i} style={[styles.listItem, { marginBottom: 8 }]}>
          <Text style={styles.listNumber}>{i + 1}.</Text>
          <Text style={styles.listContent}>{step}</Text>
        </View>
      ))}
    </View>
  );
}

// ============================================
// 13. What I'd Actually Do Section
// ============================================

function WhatIdActuallyDoSection({ content }: { content?: string }) {
  if (!content) return null;

  return (
    <View style={styles.section}>
      <SectionHeader
        title="What I'd Actually Do"
        subtitle="Personal recommendation"
      />

      <View style={styles.cardHighlight} wrap={false}>
        <Text style={styles.paragraph}>{content}</Text>
      </View>
    </View>
  );
}

// ============================================
// 14. Self-Critique Section
// ============================================

function SelfCritiqueSection({ critique }: { critique?: SelfCritique }) {
  if (!critique) return null;

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Self-Critique"
        subtitle="Honest assessment of this analysis"
      />

      {/* Confidence Level - keep together */}
      {(critique.overall_confidence || critique.confidence_level) && (
        <View style={[styles.warningBox, { marginBottom: 8 }]} wrap={false}>
          <View style={styles.row}>
            <MonoLabel>Overall Confidence</MonoLabel>
            <ConfidenceTag
              level={critique.overall_confidence ?? critique.confidence_level}
            />
          </View>
          {critique.confidence_rationale && (
            <Text style={[styles.cardContent, { marginTop: 8 }]}>
              {critique.confidence_rationale}
            </Text>
          )}
        </View>
      )}

      {/* What We Might Be Wrong About - each item separately */}
      {critique.what_we_might_be_wrong_about &&
        critique.what_we_might_be_wrong_about.length > 0 && (
          <View style={[styles.card, { marginBottom: 12 }]}>
            <MonoLabel>What We Might Be Wrong About</MonoLabel>
            {critique.what_we_might_be_wrong_about.map((item, i) => (
              <View key={i} style={styles.listItem} wrap={false}>
                <Text style={[styles.listBullet, { color: colors.zinc600 }]}>
                  •
                </Text>
                <Text style={styles.listContent}>{item}</Text>
              </View>
            ))}
          </View>
        )}

      {/* Unexplored Directions - each item separately */}
      {critique.unexplored_directions &&
        critique.unexplored_directions.length > 0 && (
          <View style={[styles.card, { marginBottom: 12 }]}>
            <MonoLabel>Unexplored Directions</MonoLabel>
            {critique.unexplored_directions.map((item, i) => (
              <View key={i} style={styles.listItem} wrap={false}>
                <Text style={styles.listBullet}>→</Text>
                <Text style={styles.listContent}>{item}</Text>
              </View>
            ))}
          </View>
        )}

      {/* Validation Gaps - each gap as separate card */}
      {critique.validation_gaps && critique.validation_gaps.length > 0 && (
        <View>
          <MonoLabel>Validation Gaps</MonoLabel>
          {critique.validation_gaps.map((gap: ValidationGap, i: number) => (
            <View key={i} style={[styles.card, { marginTop: 6 }]} wrap={false}>
              <View style={[styles.row, { marginBottom: 4 }]}>
                <Text
                  style={[
                    styles.cardContent,
                    { fontFamily: 'Roboto', fontWeight: 700, flex: 1 },
                  ]}
                >
                  {gap.concern}
                </Text>
                <View
                  style={[
                    styles.tag,
                    gap.status === 'ADDRESSED'
                      ? styles.tagMuted
                      : gap.status === 'EXTENDED_NEEDED'
                        ? styles.tag
                        : styles.tagStrong,
                  ]}
                >
                  <Text
                    style={[
                      styles.tagText,
                      gap.status === 'ADDRESSED'
                        ? styles.tagMutedText
                        : gap.status === 'EXTENDED_NEEDED'
                          ? styles.tagText
                          : styles.tagStrongText,
                    ]}
                  >
                    {gap.status?.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>
              <Text style={styles.cardContent}>{gap.rationale}</Text>
            </View>
          ))}
        </View>
      )}
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

  // Extract all data from report
  let hybridData: HybridReportData | undefined;

  if (isHybridReport(reportData)) {
    hybridData = reportData.report;
  }

  // If not hybrid, we don't render much
  if (!hybridData) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.logo}>SPARLO</Text>
            <Text style={styles.title}>{report.title}</Text>
            {report.headline && (
              <Text style={styles.headline}>{report.headline}</Text>
            )}
          </View>
          <Text style={styles.paragraph}>Report data not available.</Text>
        </Page>
      </Document>
    );
  }

  // Normalize field names: support both old (execution_track/innovation_portfolio)
  // and new (solution_concepts/innovation_concepts) naming conventions
  const rawReport = hybridData as Record<string, unknown>;

  // Map solution_concepts → execution_track with proper field name normalization
  const rawSolutionConcepts = rawReport.solution_concepts as
    | {
        intro?: string;
        primary?: {
          id?: string;
          title?: string;
          confidence_percent?: number;
          source_type?: string;
          what_it_is?: string;
          why_it_works?: string;
          economics?: {
            expected_outcome?: { value?: string };
            investment?: { value?: string };
            timeline?: { value?: string };
          };
          the_insight?: InsightBlock;
          first_validation_step?: {
            test?: string;
            cost?: string;
            go_criteria?: string;
          };
          key_risks?: Array<{ risk?: string; mitigation?: string }>;
        };
        supporting?: Array<{
          id?: string;
          title?: string;
          relationship?: string;
          what_it_is?: string;
          why_it_works?: string;
          when_to_use_instead?: string;
          confidence_percent?: number;
          key_risk?: string;
          the_insight?: InsightBlock;
        }>;
      }
    | undefined;

  const executionTrack: ExecutionTrack | undefined =
    hybridData.execution_track ??
    (rawSolutionConcepts
      ? {
          intro: rawSolutionConcepts.intro,
          primary: rawSolutionConcepts.primary
            ? {
                id: rawSolutionConcepts.primary.id,
                title: rawSolutionConcepts.primary.title,
                confidence: rawSolutionConcepts.primary.confidence_percent,
                source_type: rawSolutionConcepts.primary
                  .source_type as ExecutionTrackPrimary['source_type'],
                what_it_is: rawSolutionConcepts.primary.what_it_is,
                why_it_works: rawSolutionConcepts.primary.why_it_works,
                expected_improvement:
                  rawSolutionConcepts.primary.economics?.expected_outcome
                    ?.value,
                investment:
                  rawSolutionConcepts.primary.economics?.investment?.value,
                timeline:
                  rawSolutionConcepts.primary.economics?.timeline?.value,
                the_insight: rawSolutionConcepts.primary.the_insight,
                validation_gates: rawSolutionConcepts.primary
                  .first_validation_step
                  ? [
                      {
                        test: rawSolutionConcepts.primary.first_validation_step
                          .test,
                        cost: rawSolutionConcepts.primary.first_validation_step
                          .cost,
                        success_criteria:
                          rawSolutionConcepts.primary.first_validation_step
                            .go_criteria,
                      },
                    ]
                  : undefined,
                why_it_might_fail: rawSolutionConcepts.primary.key_risks?.map(
                  (r) => r.risk ?? '',
                ),
              }
            : undefined,
          supporting_concepts: rawSolutionConcepts.supporting?.map((s) => ({
            id: s.id,
            title: s.title,
            relationship: s.relationship as SupportingConcept['relationship'],
            one_liner: s.key_risk,
            what_it_is: s.what_it_is,
            why_it_works: s.why_it_works,
            when_to_use_instead: s.when_to_use_instead,
            confidence: s.confidence_percent,
            the_insight: s.the_insight,
          })),
        }
      : undefined);

  // Map innovation_concepts → innovation_portfolio with field name normalization
  const rawInnovationConcepts = rawReport.innovation_concepts as
    | {
        intro?: string;
        recommended?: RecommendedInnovation & { confidence_percent?: number };
        parallel?: Array<
          ParallelInvestigation & { confidence_percent?: number }
        >;
        frontier_watch?: FrontierWatch[];
      }
    | undefined;

  const innovationPortfolio: InnovationPortfolio | undefined =
    hybridData.innovation_portfolio ??
    (rawInnovationConcepts
      ? {
          intro: rawInnovationConcepts.intro,
          recommended_innovation: rawInnovationConcepts.recommended
            ? {
                ...rawInnovationConcepts.recommended,
                confidence:
                  rawInnovationConcepts.recommended.confidence_percent ??
                  rawInnovationConcepts.recommended.confidence,
              }
            : undefined,
          parallel_investigations: rawInnovationConcepts.parallel?.map((p) => ({
            ...p,
            confidence: p.confidence_percent ?? p.confidence,
          })),
          frontier_watch: rawInnovationConcepts.frontier_watch,
        }
      : undefined);

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

        {/* Section order matches brand-system-report.tsx web display */}

        {/* 1. The Brief */}
        <BriefSection brief={hybridData.brief} />

        {/* 2. Executive Summary */}
        <ExecutiveSummarySection summary={hybridData.executive_summary} />

        {/* 3. Problem Analysis */}
        <ProblemAnalysisSection analysis={hybridData.problem_analysis} />

        {/* 4. Constraints & Metrics */}
        <ConstraintsSection constraints={hybridData.constraints_and_metrics} />

        {/* 5. Challenge the Frame (with reframe from innovation_analysis) */}
        <ChallengeTheFrameSection challenges={hybridData.challenge_the_frame} />
        <InnovationAnalysisSection analysis={hybridData.innovation_analysis} />

        {/* 6. Cross-Domain Search */}
        <CrossDomainSearchSection search={hybridData.cross_domain_search} />

        {/* 8. Solution Concepts (Execution Track) */}
        <SolutionConceptsSection track={executionTrack} />

        {/* 9. Innovation Concepts (Innovation Portfolio) */}
        <InnovationConceptsSection portfolio={innovationPortfolio} />

        {/* 10. Frontier Technologies */}
        <FrontierWatchSection items={innovationPortfolio?.frontier_watch} />

        {/* 11. Risks & Watchouts */}
        <RisksSection risks={hybridData.risks_and_watchouts} />

        {/* 13. Self-Critique */}
        <SelfCritiqueSection critique={hybridData.self_critique} />

        {/* 14. Recommendation */}
        <WhatIdActuallyDoSection content={hybridData.what_id_actually_do} />

        {/* 15. Key Insights (optional) */}
        <KeyInsightsSection insights={hybridData.key_insights} />

        {/* 16. Next Steps (optional) */}
        <NextStepsSection steps={hybridData.next_steps} />

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
