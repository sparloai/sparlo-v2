# docs: Complete Sparlo User Documentation

## Overview

Create comprehensive end-user documentation for Sparlo, an AI-powered engineering research platform. The documentation will be simple, accessible, and focused on helping users (engineers, product managers, founders) successfully generate and use research reports.

**Key Context:**
- Report modes consolidating to single "Analysis" experience (Hybrid becoming default)
- ~25 minute generation time positioned as premium thoroughness feature
- End-user focused, non-technical language
- User will provide example problem statements

## Problem Statement

Sparlo currently has generic MakerKit boilerplate documentation that doesn't reflect the actual product. Users need clear guidance on:
- How to write effective problem statements
- What to expect during report generation
- How to interpret and use report results
- Team collaboration and billing

## Proposed Solution

Replace boilerplate documentation with Sparlo-specific content using the existing Keystatic CMS + Markdoc system at `/apps/web/content/documentation/`.

## Technical Approach

### Content System
- **Format**: Markdoc (`.mdoc` files) with YAML frontmatter
- **Location**: `apps/web/content/documentation/`
- **CMS**: Keystatic (already configured)
- **Route**: `/docs/[...slug]`

### Documentation Structure

```
apps/web/content/documentation/
├── getting-started/
│   ├── getting-started.mdoc          # Section index
│   ├── quick-start.mdoc              # 5-minute first report guide
│   ├── create-account.mdoc           # Sign up flow
│   └── your-first-report.mdoc        # Detailed first report walkthrough
├── creating-reports/
│   ├── creating-reports.mdoc         # Section index
│   ├── writing-problems.mdoc         # How to write effective problems
│   ├── file-attachments.mdoc         # Attachment specs and tips
│   ├── generation-process.mdoc       # What happens during generation
│   └── troubleshooting-generation.mdoc
├── understanding-reports/
│   ├── understanding-reports.mdoc    # Section index
│   ├── report-sections.mdoc          # What each section contains
│   ├── using-chat.mdoc               # Post-report chat guide
│   ├── sharing-reports.mdoc          # Public share links
│   └── exporting-pdf.mdoc            # PDF export guide
├── team-collaboration/
│   ├── team-collaboration.mdoc       # Section index
│   ├── creating-team.mdoc            # Set up team account
│   ├── inviting-members.mdoc         # Invite flow
│   └── roles-permissions.mdoc        # What each role can do
├── billing/
│   ├── billing.mdoc                  # Section index
│   ├── pricing-plans.mdoc            # Core vs Pro vs Max comparison
│   ├── usage-limits.mdoc             # Report limits, what counts
│   └── managing-subscription.mdoc    # Upgrade, downgrade, cancel
├── troubleshooting/
│   ├── troubleshooting.mdoc          # Section index
│   ├── common-issues.mdoc            # Quick fixes
│   ├── error-messages.mdoc           # Error code reference
│   └── browser-requirements.mdoc     # Supported browsers
└── faq/
    └── faq.mdoc                      # Comprehensive FAQ
```

## Acceptance Criteria

### Functional Requirements
- [ ] All documentation accessible at `/docs/*` routes
- [ ] Sidebar navigation reflects new structure
- [ ] Search functionality works across all docs
- [ ] Mobile-responsive documentation pages
- [ ] "Was this helpful?" feedback on each page

### Content Requirements
- [ ] Getting Started section complete with screenshots
- [ ] Creating Reports guide with example problem statements
- [ ] Report sections explained with visual examples
- [ ] Chat feature documented with rate limits (30/hr, 150/day)
- [ ] Pricing comparison table with accurate limits
- [ ] FAQ covers top 20 user questions
- [ ] Troubleshooting covers common errors

### Quality Gates
- [ ] All placeholder content from MakerKit replaced
- [ ] Terminology consistent ("Analysis" not "Hybrid Mode")
- [ ] Screenshots current with latest UI
- [ ] Internal links working
- [ ] No technical jargon without explanation

## Implementation Phases

### Phase 1: Foundation
Remove boilerplate, create structure, write core docs

**Files to create/modify:**

#### 1.1 Getting Started Section

**getting-started/getting-started.mdoc**
```yaml
---
title: "Getting Started"
description: "Learn how to create your first engineering research report with Sparlo"
order: 0
status: "published"
---
```
Content: Welcome message, what Sparlo does, quick links to key docs

**getting-started/quick-start.mdoc**
```yaml
---
title: "Quick Start"
description: "Create your first research report in 5 minutes"
order: 1
status: "published"
---
```
Content:
- Sign up (30 seconds)
- Enter your engineering problem
- Click "Run Analysis"
- Wait ~25 minutes (explain why it's thorough)
- Explore your report

**getting-started/create-account.mdoc**
```yaml
---
title: "Create Your Account"
description: "Sign up for Sparlo and verify your email"
order: 2
status: "published"
---
```
Content:
- Email/password signup flow
- Email verification process
- OAuth options (if enabled)
- First login experience

**getting-started/your-first-report.mdoc**
```yaml
---
title: "Your First Report"
description: "A detailed walkthrough of creating your first engineering research report"
order: 3
status: "published"
---
```
Content:
- Detailed step-by-step with screenshots
- What makes a good problem statement
- Understanding the progress indicators
- What to do while waiting
- Exploring your completed report

#### 1.2 Creating Reports Section

**creating-reports/creating-reports.mdoc**
```yaml
---
title: "Creating Reports"
description: "Everything you need to know about generating engineering research reports"
order: 1
status: "published"
---
```

**creating-reports/writing-problems.mdoc**
```yaml
---
title: "Writing Effective Problem Statements"
description: "How to describe your engineering challenge for the best results"
order: 1
status: "published"
---
```
Content:
- What makes a good problem statement
- The three detection indicators (Problem, Constraints, Success Criteria)
- Example problem statements (user to provide)
- Common mistakes to avoid
- Tips for different industries

**creating-reports/file-attachments.mdoc**
```yaml
---
title: "File Attachments"
description: "Add supporting documents and images to your research request"
order: 2
status: "published"
---
```
Content:
- Supported file types: PDF, DOCX, images (PNG, JPG)
- Maximum 5 files per report
- Maximum 10MB per file
- How attachments are used in analysis
- Tips for useful attachments

**creating-reports/generation-process.mdoc**
```yaml
---
title: "The Generation Process"
description: "What happens during the ~25 minutes while your report is being created"
order: 3
status: "published"
---
```
Content:
- Why thorough research takes time (position as premium)
- The analysis steps (simplified AN0-AN5 explanation)
- Progress tracking in real-time
- Can I close my browser? (Yes, generation continues)
- Email notification when complete
- What affects generation time

**creating-reports/troubleshooting-generation.mdoc**
```yaml
---
title: "Troubleshooting Report Generation"
description: "Solutions for common issues during report creation"
order: 4
status: "published"
---
```
Content:
- Report stuck at a step
- Generation failed error
- File upload issues
- Network interruptions
- Usage limit reached

### Phase 2: Report Understanding & Interaction

#### 2.1 Understanding Reports Section

**understanding-reports/understanding-reports.mdoc**
```yaml
---
title: "Understanding Your Report"
description: "Learn how to read and use your engineering research report"
order: 2
status: "published"
---
```

**understanding-reports/report-sections.mdoc**
```yaml
---
title: "Report Sections Explained"
description: "What each section of your report contains and how to use it"
order: 1
status: "published"
---
```
Content:
- Executive Summary
- Problem Analysis
- Innovation Concepts
- Technical Validation
- IP Landscape
- Risk Assessment
- Strategic Recommendations
- Next Steps

**understanding-reports/using-chat.mdoc**
```yaml
---
title: "Chat With Your Report"
description: "Ask follow-up questions and dig deeper into your research"
order: 2
status: "published"
---
```
Content:
- How to access report chat
- What kinds of questions work best
- Example questions to ask
- Rate limits: 30 messages/hour, 150/day
- Streaming responses (can cancel mid-stream)
- Chat history persistence

**understanding-reports/sharing-reports.mdoc**
```yaml
---
title: "Sharing Reports"
description: "Share your research with colleagues and stakeholders"
order: 3
status: "published"
---
```
Content:
- Generate public share link
- What shared viewers can see
- Revoking share links
- Team sharing (automatic for team members)
- Security considerations

**understanding-reports/exporting-pdf.mdoc**
```yaml
---
title: "Export to PDF"
description: "Download your report as a formatted PDF document"
order: 4
status: "published"
---
```
Content:
- How to export
- What's included in PDF
- PDF formatting and layout
- Use cases (presentations, stakeholders)

### Phase 3: Team & Billing

#### 3.1 Team Collaboration Section

**team-collaboration/team-collaboration.mdoc**
```yaml
---
title: "Team Collaboration"
description: "Work together with your team on engineering research"
order: 3
status: "published"
---
```

**team-collaboration/creating-team.mdoc**
Content: How to create team account, naming, settings

**team-collaboration/inviting-members.mdoc**
Content: Invite flow, email invitations, accepting invites

**team-collaboration/roles-permissions.mdoc**
Content:
- Team Owner: full control, billing, delete
- Team Member: create reports, view team reports, chat
- What members cannot do (billing, delete team, remove others)

#### 3.2 Billing Section

**billing/billing.mdoc**
```yaml
---
title: "Billing & Plans"
description: "Understand Sparlo pricing and manage your subscription"
order: 4
status: "published"
---
```

**billing/pricing-plans.mdoc**
Content:
- Pricing comparison table:

| Feature | Core ($199/mo) | Pro ($499/mo) | Max ($999/mo) |
|---------|----------------|---------------|---------------|
| Reports/month | ~10 | ~30 | ~70 |
| Post-report chat | Yes | Yes | Yes |
| Team seats | 1 | 5 | 10 |
| File attachments | 5 per report | 5 per report | 5 per report |
| Support | Email | Priority | Dedicated |

- Which plan is right for you
- Annual discount (if applicable)

**billing/usage-limits.mdoc**
Content:
- What counts as a report
- Monthly reset date
- Warning before limit
- What happens when limit reached
- Upgrading for more reports

**billing/managing-subscription.mdoc**
Content:
- Upgrading your plan
- Downgrading your plan
- Cancellation process
- What happens to reports after cancellation
- Payment methods (credit cards via Stripe)
- Accessing invoices

### Phase 4: Troubleshooting & FAQ

#### 4.1 Troubleshooting Section

**troubleshooting/troubleshooting.mdoc**
```yaml
---
title: "Troubleshooting"
description: "Quick solutions to common issues"
order: 5
status: "published"
---
```

**troubleshooting/common-issues.mdoc**
Content:
- Can't log in
- Report generation stuck
- Chat not responding
- PDF export failed
- Share link not working
- Payment declined

**troubleshooting/error-messages.mdoc**
Content:
- Error code reference table
- "Rate limit exceeded" - wait X minutes
- "Usage limit reached" - upgrade or wait for reset
- "Generation failed" - retry or contact support
- "Invalid file type" - supported types list

**troubleshooting/browser-requirements.mdoc**
Content:
- Supported: Chrome, Firefox, Safari, Edge (latest 2 versions)
- JavaScript required
- Cookies required
- Mobile browsers supported
- Recommended: Desktop for best experience

#### 4.2 FAQ Section

**faq/faq.mdoc**
```yaml
---
title: "Frequently Asked Questions"
description: "Quick answers to common questions about Sparlo"
order: 6
status: "published"
---
```

Content (20 essential questions):

**Getting Started**
1. What is Sparlo?
2. Do I need an engineering background to use Sparlo?
3. Is there a free trial?

**Reports**
4. How long does report generation take?
5. Why does it take ~25 minutes?
6. Can I cancel a report mid-generation?
7. What file types can I attach?
8. What makes a good problem statement?

**Using Reports**
9. Can I ask questions about my report?
10. Are there limits on chat messages?
11. Can I share my report publicly?
12. Can I download my report as PDF?
13. How long are my reports stored?

**Billing**
14. What's included in each pricing tier?
15. Can I upgrade or downgrade anytime?
16. What happens when I reach my monthly limit?
17. What payment methods do you accept?
18. What's your refund policy?

**Security & Privacy**
19. Is my engineering data secure?
20. Do you use my data to train AI models?

## Also Update: Marketing FAQ Page

**File**: `apps/web/app/(marketing)/faq/page.tsx`

Replace generic MakerKit FAQ with Sparlo-specific content matching the documentation FAQ.

## Dependencies & Prerequisites

- [x] User provides 3-5 example problem statements for docs (PROVIDED - see Appendix A)
- [ ] Screenshots of current UI (will capture during implementation)
- [x] Confirmation on share link behavior: **No expiration** for share links
- [x] Confirmation on data retention policy: **Middleware encryption via Inngest** (see Appendix B)
- [x] Confirmation on refund policy: **Email help@sparlo.ai**

---

## Appendix A: Example Problem Statements

Use these real-world examples in the "Writing Effective Problem Statements" documentation:

### Example 1: Thermal Management
> "I need to dissipate 50W of heat from a sealed electronics enclosure in an outdoor environment. Can't use fans (dust/reliability), can't add significant mass (drone application), ambient temps up to 45°C. Current passive heatsink isn't cutting it."

**Why it works**: Clear power requirement, explicit constraints (no fans, weight-sensitive, sealed), environmental context, current solution baseline.

### Example 2: Desalination Energy
> "Reverse osmosis desalination is stuck at ~3-4 kWh per cubic meter — we're approaching thermodynamic limits with membrane tech. What mechanical or thermal approaches from other industries could step-change this? Looking for concepts that could work at municipal scale (100,000+ m³/day)."

**Why it works**: Quantified current state, identifies the limitation (thermodynamic limits), explicit request for cross-industry approaches, scale requirements defined.

### Example 3: Offshore Wind Access
> "Offshore wind turbines need maintenance but we can only access them ~60% of days due to wave height limits on crew transfer vessels. This drives up O&M costs and reduces availability. The industry is stuck between expensive solutions (helicopters, walk-to-work vessels) and accepting weather downtime. What motion compensation or access system approaches from other marine industries could expand our weather window cost-effectively?"

**Why it works**: Clear problem quantification (60% access), economic impact explained, existing solutions acknowledged with limitations, specific technical direction (motion compensation).

### Example 4: Fatigue in Prosthetics
> "We have a linkage mechanism in a prosthetic knee joint that sees ~2 million cycles per year with highly variable loading (walking, stairs, sitting). Current steel design is failing at 18 months. Titanium is too expensive. How do other industries handle high-cycle fatigue in compact, weight-sensitive applications?"

**Why it works**: Specific cycle count, failure timeline, material constraints (cost), asks for cross-industry solutions, clear design constraints (compact, weight-sensitive).

### Example 5: Vibration Isolation
> "Mounting a sensitive optical sensor on an agricultural robot. Need to isolate it from chassis vibration (5-50 Hz) but it also needs to stay precisely positioned (±0.5mm) relative to the camera boom. Passive isolators I've tried either don't isolate enough or are too soft for the positioning requirement."

**Why it works**: Specific frequency range, precision requirement quantified, describes the tradeoff problem, mentions what's been tried.

---

## Appendix B: Security & Data Retention Documentation

### Security Infrastructure

Document the following security characteristics:

**Data Encryption**
- **Middleware encryption via Inngest**: Report data is encrypted in the processing pipeline
- **In-transit encryption**: All data transmitted over HTTPS/TLS
- **At-rest encryption**: Data encrypted in Supabase (PostgreSQL) storage

**Infrastructure Security**

| Provider | Security Features |
|----------|-------------------|
| **Claude (Anthropic)** | SOC 2 Type II, data not used for training, enterprise-grade API security |
| **Inngest** | SOC 2 compliant, encrypted job queues, no persistent storage of report content |
| **Supabase** | SOC 2 Type II, PostgreSQL RLS enforcement, encrypted backups |
| **Railway** | SOC 2 compliant, isolated containers, encrypted networking |

**Access Controls**
- We cannot casually browse user data or view reports
- Row-Level Security (RLS) enforces account-level isolation
- Admin access requires explicit authorization and is logged

**Data Retention**
- Reports retained while subscription is active
- Archived reports retained indefinitely
- Data export available upon request
- Account deletion removes all associated data

### FAQ Security Answers

**"Is my engineering data secure?"**
> Yes. Your reports are encrypted in transit and at rest. We use middleware encryption in our processing pipeline, meaning we cannot casually browse or view your reports. Our infrastructure partners (Anthropic, Supabase, Railway, Inngest) are all SOC 2 compliant with enterprise-grade security.

**"Do you use my data to train AI models?"**
> No. Your engineering problems and reports are never used to train AI models. Anthropic (Claude) explicitly does not use API data for training. Your research remains your intellectual property.

### Refund Policy

**To request a refund, email us at help@sparlo.ai.**

Document in billing section:
- Refunds handled on case-by-case basis
- Contact help@sparlo.ai with your account email
- Include reason for refund request
- Typical response within 2 business days

## Success Metrics

- Documentation covers 100% of user-facing features
- Zero "mock/placeholder content" warnings remain
- Support ticket reduction for documented issues
- User feedback rating on documentation pages

## Future Considerations

- Video tutorials for complex flows
- Interactive problem statement builder
- In-app contextual help tooltips
- API documentation (if API access added)
- Internationalization (if expanding beyond English)

## References

### Internal References
- Existing docs structure: `apps/web/content/documentation/`
- Keystatic config: `packages/cms/keystatic/src/keystatic.config.ts`
- FAQ page: `apps/web/app/(marketing)/faq/page.tsx`
- Billing config: `apps/web/config/billing.config.ts`
- Feature flags: `apps/web/config/feature-flags.config.ts`

### External References
- MakerKit Keystatic docs: https://makerkit.dev/docs/next-supabase-turbo/cms/keystatic
- Markdoc syntax: https://markdoc.dev/docs/syntax

### Research Conducted
- Repository structure analysis (agent: ad82010)
- SaaS documentation best practices (agent: a70ae6f)
- MakerKit documentation system (agent: ac93c5e)
- User flow analysis (agent: a0e29f8)
