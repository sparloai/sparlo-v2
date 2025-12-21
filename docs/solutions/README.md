# Sparlo Solution Documentation

This directory contains compounded knowledge from solved problems and implemented features. Each document captures context, decisions, and patterns that would otherwise be lost.

## Why This Matters (Especially Without In-House Developers)

### The Compounding Effect

Without traditional developers, Claude Code becomes your institutional memory. Each documented solution means:

1. **First occurrence**: Research, experimentation, debugging (hours)
2. **Documented solution**: Quick reference (minutes)
3. **Similar future problem**: Near-instant resolution

### What Claude Code Provides

| Traditional Team | Claude Code Solo |
|-----------------|------------------|
| Developers remember past solutions | Documentation IS the memory |
| Code reviews catch issues | Automated review agents catch issues |
| Senior devs mentor juniors | Patterns are documented for future sessions |
| Tribal knowledge in heads | Explicit knowledge in docs |

### Critical Insight

**Claude Code sessions are stateless** - each conversation starts fresh. This documentation bridges that gap:

- New session reads docs → understands patterns → makes better decisions
- Patterns compound across sessions
- No "I already told you this" frustration

## Documentation Categories

### `/features/` - Major Feature Implementations
- Token-based usage tracking
- Discovery Mode
- Structured report rendering

### `/ux/` - User Experience Solutions
- AN0 auto-redirect and error handling
- Processing screen improvements
- Dashboard failed state display

### `/ui/` - Design System & Components
- Aura-inspired redesign
- Light/dark mode theming
- Animation patterns

### `/security/` - Security Hardening
- TOCTOU attack prevention
- Authorization patterns
- Database security

### `/ai/` - Prompt Engineering
- Chain context patterns
- Self-critique sections
- Schema versioning

### `/architecture/` - System Design
- Inngest durable functions
- Supabase Realtime patterns
- API design

## How to Use These Docs

### For Claude Code (in CLAUDE.md or session context)
```markdown
Before implementing [feature type], read:
- docs/solutions/features/token-based-usage-tracking.md
- docs/solutions/security/usage-tracking-security-hardening.md
```

### For Humans
Browse by category when facing similar problems. Each doc includes:
- Problem statement
- Solution approach
- Code examples
- Gotchas and lessons learned

## Recent Changes (Dec 20, 2025)

### Architecture
1. **Unified Hybrid Report Flow** - All reports now use hybrid flow (see `architecture/unified-hybrid-report-flow.md`)
2. **Claude-Generated Headlines** - Report titles from AI instead of truncated challenge text
3. **Reports Dashboard Refactoring** - Type consolidation, shared components (see `architecture/reports-dashboard-refactoring.md`)

### Features Added
1. **Usage-Based Billing with Freemium** - First report free, subscription required after (see `features/usage-based-billing-freemium.md`)
2. **Realtime Polling Fallback** - Guaranteed progress updates when Realtime fails (see `features/realtime-polling-fallback.md`)

### UI Fixes
1. **Structured Executive Summary Rendering** - Fixed React Error #31 for object rendering (see `ui/structured-executive-summary-rendering.md`)

### Security Hardening
1. **Schema Backward Compatibility** - SafeUrlSchema and SeverityLevel case handling (see `security/schema-backward-compatibility.md`)

### Prompt Engineering
1. **Discovery Flow Prior Art Evidence** - Source citation requirements (see `prompt-engineering/discovery-flow-prior-art-evidence.md`)

---

## Previous Changes (Dec 19, 2025)

### Features Added
1. **Token-Based Usage Tracking** - Monthly usage limits with subscription alignment
2. **Discovery Mode** - Novel solution hunting with AN0-D through AN5-D chain
3. **AN0 Auto-Redirect** - Skip waiting screen when no clarification needed
4. **Failed Report Display** - Error handling with user-friendly messages

### UI/UX Improvements
1. **Aura.build Redesign** - Premium aesthetic with glassmorphic navigation
2. **Light/Dark Mode** - Full theming support
3. **Söhne Typography** - Professional font system
4. **Processing Screen** - Brain icon, elapsed time, auto-redirect

### Security Hardening
1. **TOCTOU Protection** - Reserve/finalize/release pattern
2. **Authorization Checks** - In SECURITY DEFINER functions
3. **Data Integrity** - CHECK constraints, proper cascades

### Prompt Engineering
1. **Chain Context** - AN5 sees all prior stage context
2. **Self-Critique** - Honest uncertainties and assumptions
3. **Antifragile Schemas** - .optional(), .catch(), .passthrough()

## The Compound Philosophy

```
Session 1: Solve problem → Document solution
Session 2: Read docs → Build on solution → Document enhancement
Session 3: Read enhanced docs → Implement faster → Document patterns
...
Session N: Rich documentation → Rapid development → Institutional knowledge
```

**Each unit of engineering work makes subsequent work easier—not harder.**

## Maintaining This Documentation

After solving non-trivial problems:
1. Run `/workflows:compound` to create documentation
2. Review and enhance the generated doc
3. Commit with the feature/fix

The investment in documentation pays dividends across every future session.
