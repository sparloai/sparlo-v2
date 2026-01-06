/**
 * Brand System Components
 *
 * Air Company Aesthetic - Technical Monograph
 *
 * A complete component library for rendering hybrid reports
 * with premium typography-driven styling.
 */

// Main report component
export { BrandSystemReport } from './brand-system-report';

// DD Mode report component
export { DDReportDisplay } from './dd-report-display';

// Table of Contents
export {
  TableOfContents,
  generateTocSections,
  type TocSection,
} from './table-of-contents';

// Primitives
export {
  Section,
  SectionTitle,
  SectionSubtitle,
  MonoLabel,
  BodyText,
  ArticleBlock,
  ContentBlock,
  AccentBorder,
  HighlightBox,
  SeverityIndicator,
  ConstraintList,
  NumberedItem,
  MetadataGrid,
  UnknownFieldRenderer,
} from './primitives';

// Section Components
export {
  ChallengeFrameSection,
  ConstraintsSection,
  ExecutiveSummarySection,
  FrontierTechnologiesSection,
  InnovationAnalysisSection,
  InnovationConceptsSection,
  ProblemAnalysisSection,
  RecommendationSection,
  RisksWatchoutsSection,
  SelfCritiqueSection,
  SolutionConceptsSection,
} from './sections';
