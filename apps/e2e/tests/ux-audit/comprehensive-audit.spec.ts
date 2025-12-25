import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Comprehensive UX/UI Audit for Sparlo
 * Evaluates landing page and pricing/billing page against
 * the 8 dimensions for senior UI/UX design review.
 *
 * Target User: Climate tech CTO / Deep tech VC
 * Design Target: Palantir seriousness + Linear craft + Stripe confidence
 */

const AUDIT_REPORT_DIR = 'tests/ux-audit/screenshots/comprehensive-audit';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

interface AuditFinding {
  dimension: string;
  observation: string;
  evokes: string;
  gap: string;
  severity: 'high' | 'medium' | 'low' | 'none';
}

interface PageAudit {
  page: string;
  url: string;
  screenshots: string[];
  findings: AuditFinding[];
  metrics: Record<string, unknown>;
}

const auditResults: PageAudit[] = [];

// Ensure screenshot directory exists
test.beforeAll(async () => {
  const dir = path.join(process.cwd(), AUDIT_REPORT_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Write final report after all tests
test.afterAll(async () => {
  const reportPath = path.join(process.cwd(), AUDIT_REPORT_DIR, `audit-report-${TIMESTAMP}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2));

  // Generate markdown summary
  const mdReport = generateMarkdownReport(auditResults);
  const mdPath = path.join(process.cwd(), AUDIT_REPORT_DIR, `audit-report-${TIMESTAMP}.md`);
  fs.writeFileSync(mdPath, mdReport);

  console.log(`\n📊 Audit Report saved to: ${mdPath}`);
});

function generateMarkdownReport(results: PageAudit[]): string {
  let md = `# Sparlo UX/UI Audit Report\n\n`;
  md += `**Generated:** ${new Date().toISOString()}\n\n`;
  md += `**Audit Scope:** Landing Page, Pricing Page\n\n`;
  md += `---\n\n`;

  for (const pageAudit of results) {
    md += `## ${pageAudit.page}\n\n`;
    md += `**URL:** ${pageAudit.url}\n\n`;

    if (pageAudit.screenshots.length > 0) {
      md += `### Screenshots\n\n`;
      for (const screenshot of pageAudit.screenshots) {
        md += `- ${screenshot}\n`;
      }
      md += `\n`;
    }

    if (pageAudit.findings.length > 0) {
      md += `### Findings\n\n`;
      for (const finding of pageAudit.findings) {
        const severityEmoji = {
          high: '🔴',
          medium: '🟠',
          low: '🟡',
          none: '🟢',
        }[finding.severity];

        md += `#### ${severityEmoji} ${finding.dimension}\n\n`;
        md += `**Observation:** ${finding.observation}\n\n`;
        md += `**Evokes:** ${finding.evokes}\n\n`;
        md += `**Gap:** ${finding.gap}\n\n`;
        md += `---\n\n`;
      }
    }

    if (Object.keys(pageAudit.metrics).length > 0) {
      md += `### Metrics\n\n`;
      md += `\`\`\`json\n${JSON.stringify(pageAudit.metrics, null, 2)}\n\`\`\`\n\n`;
    }
  }

  return md;
}

async function captureScreenshot(page: Page, name: string): Promise<string> {
  const filename = `${name}-${TIMESTAMP}.png`;
  const filepath = path.join(AUDIT_REPORT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  return filename;
}

async function captureViewportScreenshot(page: Page, name: string): Promise<string> {
  const filename = `${name}-viewport-${TIMESTAMP}.png`;
  const filepath = path.join(AUDIT_REPORT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: false });
  return filename;
}

async function getTypographyMetrics(page: Page) {
  return page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const h2 = document.querySelector('h2');
    const body = document.body;

    const getStyles = (el: Element | null) => {
      if (!el) return null;
      const styles = window.getComputedStyle(el);
      return {
        fontFamily: styles.fontFamily,
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        lineHeight: styles.lineHeight,
        letterSpacing: styles.letterSpacing,
        color: styles.color,
      };
    };

    return {
      h1: getStyles(h1),
      h2: getStyles(h2),
      body: getStyles(body),
    };
  });
}

async function getColorPalette(page: Page) {
  return page.evaluate(() => {
    const colors = new Set<string>();
    const elements = document.querySelectorAll('*');

    elements.forEach((el) => {
      const styles = window.getComputedStyle(el);
      colors.add(styles.backgroundColor);
      colors.add(styles.color);
      colors.add(styles.borderColor);
    });

    return Array.from(colors).filter(
      (c) => c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent'
    ).slice(0, 20);
  });
}

async function getInteractiveElements(page: Page) {
  return page.evaluate(() => {
    const buttons = document.querySelectorAll('button, [role="button"]');
    const links = document.querySelectorAll('a');
    const inputs = document.querySelectorAll('input, textarea, select');

    return {
      buttonCount: buttons.length,
      linkCount: links.length,
      inputCount: inputs.length,
      buttonsWithHover: Array.from(buttons).filter((btn) => {
        const styles = window.getComputedStyle(btn);
        return styles.transition !== 'all 0s ease 0s';
      }).length,
    };
  });
}

async function getLayoutMetrics(page: Page) {
  return page.evaluate(() => {
    const main = document.querySelector('main') || document.body;
    const styles = window.getComputedStyle(main);

    return {
      maxWidth: styles.maxWidth,
      padding: styles.padding,
      margin: styles.margin,
      display: styles.display,
    };
  });
}

async function checkDesignSystemConsistency(page: Page) {
  return page.evaluate(() => {
    const allElements = document.querySelectorAll('*');
    const fontFamilies = new Set<string>();
    const borderRadii = new Set<string>();

    allElements.forEach((el) => {
      const styles = window.getComputedStyle(el);
      fontFamilies.add(styles.fontFamily.split(',')[0].trim());
      if (styles.borderRadius !== '0px') {
        borderRadii.add(styles.borderRadius);
      }
    });

    return {
      uniqueFontFamilies: Array.from(fontFamilies),
      uniqueBorderRadii: Array.from(borderRadii),
      consistencyScore: fontFamilies.size <= 3 && borderRadii.size <= 5 ? 'high' : 'low',
    };
  });
}

// =============================================================================
// LANDING PAGE AUDIT
// =============================================================================

test.describe('Landing Page Comprehensive Audit', () => {
  const pageAudit: PageAudit = {
    page: 'Landing Page',
    url: 'https://sparlo.ai/',
    screenshots: [],
    findings: [],
    metrics: {},
  };

  test.beforeAll(() => {
    auditResults.push(pageAudit);
  });

  test('1. First Impression & Positioning', async ({ page }) => {
    await page.goto('https://sparlo.ai/');
    await page.waitForLoadState('networkidle');

    // Capture above-the-fold
    const screenshot = await captureViewportScreenshot(page, 'landing-first-impression');
    pageAudit.screenshots.push(screenshot);

    // Analyze hero section
    const heroHeadline = await page.locator('h1').first().textContent();
    const heroCTA = await page.locator('a[href*="sign-up"]').first().textContent();
    const hasValueProp = await page.locator('text=/8 hours|10 minutes|research/i').count() > 0;

    // Check for AI-wrapper signals (gradients, "magic" language)
    const hasGradientBg = await page.evaluate(() => {
      const body = document.body;
      const styles = window.getComputedStyle(body);
      return styles.background.includes('gradient') || styles.backgroundImage.includes('gradient');
    });

    pageAudit.metrics['firstImpression'] = {
      heroHeadline,
      heroCTA,
      hasValueProp,
      hasGradientBackground: hasGradientBg,
    };

    pageAudit.findings.push({
      dimension: '1. First Impression & Positioning',
      observation: `Hero headline: "${heroHeadline}". CTA: "${heroCTA}". Value prop visible: ${hasValueProp}. Gradient background: ${hasGradientBg}.`,
      evokes: hasGradientBg ? 'May evoke typical AI tool aesthetics' : 'Clean, professional first impression',
      gap: hasValueProp ? 'Value proposition is present' : 'Value proposition may not be immediately clear',
      severity: hasValueProp ? 'none' : 'medium',
    });

    expect(heroHeadline).toBeTruthy();
  });

  test('2. Visual Authority', async ({ page }) => {
    await page.goto('https://sparlo.ai/');
    await page.waitForLoadState('networkidle');

    const designConsistency = await checkDesignSystemConsistency(page);
    const typography = await getTypographyMetrics(page);
    const colors = await getColorPalette(page);

    pageAudit.metrics['visualAuthority'] = {
      designConsistency,
      typography,
      colorPaletteSize: colors.length,
    };

    // Check for distinctive design choices
    const hasCustomFont = typography.body?.fontFamily?.toLowerCase().includes('soehne') ||
      !typography.body?.fontFamily?.toLowerCase().includes('system-ui');

    pageAudit.findings.push({
      dimension: '2. Visual Authority',
      observation: `Font families: ${designConsistency.uniqueFontFamilies.join(', ')}. Border radius variants: ${designConsistency.uniqueBorderRadii.length}. Primary font: ${typography.body?.fontFamily?.slice(0, 50)}...`,
      evokes: hasCustomFont ? 'Custom typography suggests intentional design choices (Linear/Stripe territory)' : 'System fonts may feel less distinctive',
      gap: designConsistency.consistencyScore === 'high' ? 'Strong design system consistency' : 'Design system could be more cohesive',
      severity: designConsistency.consistencyScore === 'high' ? 'none' : 'medium',
    });
  });

  test('3. Craft Parity', async ({ page }) => {
    await page.goto('https://sparlo.ai/');
    await page.waitForLoadState('networkidle');

    // Full page screenshot for craft review
    const screenshot = await captureScreenshot(page, 'landing-full-craft');
    pageAudit.screenshots.push(screenshot);

    const interactiveElements = await getInteractiveElements(page);

    // Check micro-interactions
    const ctaButton = page.locator('a[href*="sign-up"]').first();
    const hasHoverTransition = await ctaButton.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.transition !== 'all 0s ease 0s' && styles.transition !== 'none';
    });

    // Check spacing consistency
    const layoutMetrics = await getLayoutMetrics(page);

    pageAudit.metrics['craftParity'] = {
      interactiveElements,
      hasHoverTransition,
      layoutMetrics,
    };

    pageAudit.findings.push({
      dimension: '3. Craft Parity',
      observation: `${interactiveElements.buttonCount} buttons, ${interactiveElements.buttonsWithHover} with transitions. CTA hover animation: ${hasHoverTransition}.`,
      evokes: hasHoverTransition ? 'Polished interactions suggest attention to detail' : 'Missing micro-interactions may feel unfinished',
      gap: interactiveElements.buttonsWithHover === interactiveElements.buttonCount ? 'All interactive elements have proper states' : `${interactiveElements.buttonCount - interactiveElements.buttonsWithHover} buttons may lack hover states`,
      severity: hasHoverTransition ? 'none' : 'medium',
    });
  });

  test('4. Density Through Craft', async ({ page }) => {
    await page.goto('https://sparlo.ai/');
    await page.waitForLoadState('networkidle');

    // Scroll to content sections
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(500);

    const contentScreenshot = await captureScreenshot(page, 'landing-density');
    pageAudit.screenshots.push(contentScreenshot);

    // Analyze information density
    const contentMetrics = await page.evaluate(() => {
      const textNodes = document.body.innerText.length;
      const viewportHeight = window.innerHeight;
      const pageHeight = document.body.scrollHeight;
      const whitespaceRatio = (pageHeight - viewportHeight) / pageHeight;

      return {
        totalTextLength: textNodes,
        pageHeight,
        viewportHeight,
        whitespaceRatio,
        scrollDepth: pageHeight / viewportHeight,
      };
    });

    pageAudit.metrics['density'] = contentMetrics;

    pageAudit.findings.push({
      dimension: '4. Density Through Craft',
      observation: `Page scroll depth: ${contentMetrics.scrollDepth.toFixed(1)}x viewport. Total content: ${contentMetrics.totalTextLength} characters.`,
      evokes: contentMetrics.scrollDepth > 3 ? 'Rich content depth suggests substance' : 'May feel light on content',
      gap: 'Evaluate whether information density respects PhD-level audience expectations',
      severity: 'low',
    });
  });

  test('5. Trust Architecture', async ({ page }) => {
    await page.goto('https://sparlo.ai/');
    await page.waitForLoadState('networkidle');

    // Look for trust signals
    const trustSignals = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      return {
        hasMethodology: text.includes('methodology') || text.includes('first-principles') || text.includes('research'),
        hasExamples: text.includes('example') || text.includes('report') || text.includes('analysis'),
        hasTechStack: text.includes('llm') || text.includes('ai') || text.includes('model'),
        hasCredentials: text.includes('phd') || text.includes('engineer') || text.includes('researcher'),
        hasMetrics: /\d+\s*(hours?|minutes?|%|reports?)/.test(text),
      };
    });

    pageAudit.metrics['trustArchitecture'] = trustSignals;

    const trustScore = Object.values(trustSignals).filter(Boolean).length;

    pageAudit.findings.push({
      dimension: '5. Trust Architecture',
      observation: `Trust signals found: Methodology: ${trustSignals.hasMethodology}, Examples: ${trustSignals.hasExamples}, Tech stack: ${trustSignals.hasTechStack}, Metrics: ${trustSignals.hasMetrics}. Score: ${trustScore}/5.`,
      evokes: trustScore >= 3 ? 'Shows rather than tells - evidence of rigor' : 'May rely too heavily on claims without demonstration',
      gap: trustSignals.hasExamples ? 'Example reports help demonstrate value' : 'Could benefit from more visible proof of quality',
      severity: trustScore >= 3 ? 'none' : 'high',
    });
  });

  test('6. Domain Authenticity', async ({ page }) => {
    await page.goto('https://sparlo.ai/');
    await page.waitForLoadState('networkidle');

    // Check for domain-specific language
    const domainSignals = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      return {
        hasTechnicalTerms: text.includes('engineering') || text.includes('technical') || text.includes('analysis'),
        hasDeepTechSectors: text.includes('climate') || text.includes('energy') || text.includes('biotech') || text.includes('materials'),
        avoidsConsumerLanguage: !text.includes('easy') && !text.includes('simple') && !text.includes('fun'),
        hasRDLanguage: text.includes('research') || text.includes('development') || text.includes('innovation'),
      };
    });

    pageAudit.metrics['domainAuthenticity'] = domainSignals;

    pageAudit.findings.push({
      dimension: '6. Domain Authenticity',
      observation: `Technical terms: ${domainSignals.hasTechnicalTerms}, Deep tech sectors: ${domainSignals.hasDeepTechSectors}, R&D language: ${domainSignals.hasRDLanguage}, Avoids consumer language: ${domainSignals.avoidsConsumerLanguage}.`,
      evokes: domainSignals.hasDeepTechSectors ? 'Speaks the language of deep tech - feels authentic' : 'May feel generic',
      gap: domainSignals.avoidsConsumerLanguage ? 'Tone is appropriately serious' : 'Some language may feel too consumer-friendly for target audience',
      severity: 'low',
    });
  });

  test('7. Singular Identity', async ({ page }) => {
    await page.goto('https://sparlo.ai/');
    await page.waitForLoadState('networkidle');

    // Check for unique design elements
    const identitySignals = await page.evaluate(() => {
      const hasCustomAnimations = document.querySelectorAll('[class*="animate"]').length > 0;
      const hasUniqueComponents = document.querySelectorAll('[class*="sparlo"]').length > 0;

      // Check for distinctive visual elements
      const allClasses = Array.from(document.querySelectorAll('*'))
        .flatMap((el) => Array.from(el.classList))
        .filter((c) => c.length > 3);

      return {
        hasCustomAnimations,
        hasUniqueComponents,
        totalUniqueClasses: new Set(allClasses).size,
      };
    });

    pageAudit.metrics['singularIdentity'] = identitySignals;

    pageAudit.findings.push({
      dimension: '7. Singular Identity',
      observation: `Custom animations: ${identitySignals.hasCustomAnimations}, Branded components: ${identitySignals.hasUniqueComponents}, Design system complexity: ${identitySignals.totalUniqueClasses} unique classes.`,
      evokes: identitySignals.hasCustomAnimations ? 'Has distinctive motion design' : 'May feel template-derived',
      gap: 'Evaluate whether the design language could only belong to Sparlo',
      severity: 'medium',
    });
  });

  test('8. Responsive Design Check', async ({ page }) => {
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('https://sparlo.ai/');
    await page.waitForLoadState('networkidle');
    const desktopScreenshot = await captureViewportScreenshot(page, 'landing-desktop-1920');
    pageAudit.screenshots.push(desktopScreenshot);

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);
    const tabletScreenshot = await captureViewportScreenshot(page, 'landing-tablet-768');
    pageAudit.screenshots.push(tabletScreenshot);

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    const mobileScreenshot = await captureViewportScreenshot(page, 'landing-mobile-375');
    pageAudit.screenshots.push(mobileScreenshot);

    pageAudit.findings.push({
      dimension: '8. Responsive Design',
      observation: 'Captured screenshots at 1920px (desktop), 768px (tablet), 375px (mobile).',
      evokes: 'Review screenshots for layout adaptation quality',
      gap: 'Manually inspect for layout issues across breakpoints',
      severity: 'low',
    });
  });
});

// =============================================================================
// PRICING PAGE AUDIT
// =============================================================================

test.describe('Pricing Page Comprehensive Audit', () => {
  const pageAudit: PageAudit = {
    page: 'Pricing Page',
    url: 'https://sparlo.ai/pricing',
    screenshots: [],
    findings: [],
    metrics: {},
  };

  test.beforeAll(() => {
    auditResults.push(pageAudit);
  });

  test('1. First Impression & Value Communication', async ({ page }) => {
    await page.goto('https://sparlo.ai/pricing');
    await page.waitForLoadState('networkidle');

    const screenshot = await captureViewportScreenshot(page, 'pricing-first-impression');
    pageAudit.screenshots.push(screenshot);

    // Analyze pricing presentation
    const pricingMetrics = await page.evaluate(() => {
      const priceElements = Array.from(document.querySelectorAll('*')).filter((el) =>
        el.textContent?.match(/\$\d+/)
      );

      const planNames = Array.from(document.querySelectorAll('h2, h3, [class*="plan"], [class*="tier"]'))
        .map((el) => el.textContent?.trim())
        .filter(Boolean);

      return {
        priceCount: priceElements.length,
        planNames: planNames.slice(0, 5),
        hasMonthlyAnnualToggle: document.body.innerText.toLowerCase().includes('monthly') ||
          document.body.innerText.toLowerCase().includes('annual'),
      };
    });

    pageAudit.metrics['pricingPresentation'] = pricingMetrics;

    pageAudit.findings.push({
      dimension: '1. First Impression - Pricing',
      observation: `Found ${pricingMetrics.priceCount} price elements. Plans: ${pricingMetrics.planNames.join(', ')}. Monthly/Annual toggle: ${pricingMetrics.hasMonthlyAnnualToggle}.`,
      evokes: pricingMetrics.priceCount > 0 ? 'Clear pricing visibility' : 'Pricing may not be immediately visible',
      gap: 'Evaluate whether $199/month value is clearly communicated',
      severity: pricingMetrics.priceCount > 0 ? 'none' : 'high',
    });
  });

  test('2. Visual Authority & Premium Feel', async ({ page }) => {
    await page.goto('https://sparlo.ai/pricing');
    await page.waitForLoadState('networkidle');

    const fullScreenshot = await captureScreenshot(page, 'pricing-full');
    pageAudit.screenshots.push(fullScreenshot);

    const designConsistency = await checkDesignSystemConsistency(page);
    const typography = await getTypographyMetrics(page);

    pageAudit.metrics['pricingDesign'] = {
      designConsistency,
      typography,
    };

    pageAudit.findings.push({
      dimension: '2. Visual Authority - Pricing',
      observation: `Font: ${typography.body?.fontFamily?.slice(0, 40)}... Border radius variants: ${designConsistency.uniqueBorderRadii.length}.`,
      evokes: designConsistency.consistencyScore === 'high' ? 'Cohesive design supports premium positioning' : 'Design inconsistency may undermine premium pricing',
      gap: 'Premium pricing requires premium presentation',
      severity: designConsistency.consistencyScore === 'high' ? 'none' : 'high',
    });
  });

  test('3. Trust & Value Justification', async ({ page }) => {
    await page.goto('https://sparlo.ai/pricing');
    await page.waitForLoadState('networkidle');

    const trustSignals = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      return {
        hasFeatureList: document.querySelectorAll('li, [class*="feature"]').length > 5,
        hasValueComparison: text.includes('vs') || text.includes('compare') || text.includes('save'),
        hasGuarantee: text.includes('guarantee') || text.includes('refund') || text.includes('trial'),
        hasSocialProof: text.includes('trusted') || text.includes('companies') || text.includes('teams'),
        hasROIMetrics: text.includes('hour') || text.includes('time') || text.includes('cost'),
      };
    });

    pageAudit.metrics['pricingTrust'] = trustSignals;

    const trustScore = Object.values(trustSignals).filter(Boolean).length;

    pageAudit.findings.push({
      dimension: '3. Trust & Value Justification',
      observation: `Feature list: ${trustSignals.hasFeatureList}, Value comparison: ${trustSignals.hasValueComparison}, ROI metrics: ${trustSignals.hasROIMetrics}, Social proof: ${trustSignals.hasSocialProof}. Score: ${trustScore}/5.`,
      evokes: trustScore >= 3 ? 'Value proposition is well-supported' : 'May need stronger justification for premium pricing',
      gap: trustSignals.hasROIMetrics ? 'ROI is communicated' : 'Could better communicate time/cost savings',
      severity: trustScore >= 3 ? 'low' : 'high',
    });
  });

  test('4. Interactive Elements & CTAs', async ({ page }) => {
    await page.goto('https://sparlo.ai/pricing');
    await page.waitForLoadState('networkidle');

    const ctaAnalysis = await page.evaluate(() => {
      const ctas = Array.from(document.querySelectorAll('a, button')).filter((el) =>
        el.textContent?.toLowerCase().match(/start|try|get|subscribe|sign/i)
      );

      return {
        ctaCount: ctas.length,
        ctaTexts: ctas.map((el) => el.textContent?.trim()).slice(0, 5),
        hasVisibleCTA: ctas.some((el) => {
          const rect = el.getBoundingClientRect();
          return rect.top < window.innerHeight && rect.bottom > 0;
        }),
      };
    });

    pageAudit.metrics['pricingCTAs'] = ctaAnalysis;

    pageAudit.findings.push({
      dimension: '4. Interactive Elements - Pricing',
      observation: `Found ${ctaAnalysis.ctaCount} CTAs: ${ctaAnalysis.ctaTexts.join(', ')}. Visible above fold: ${ctaAnalysis.hasVisibleCTA}.`,
      evokes: ctaAnalysis.hasVisibleCTA ? 'Clear path to conversion' : 'CTA may not be prominent enough',
      gap: ctaAnalysis.ctaCount > 0 ? 'Conversion path exists' : 'Need clearer call to action',
      severity: ctaAnalysis.hasVisibleCTA ? 'none' : 'high',
    });
  });

  test('5. Responsive Pricing Layout', async ({ page }) => {
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('https://sparlo.ai/pricing');
    await page.waitForLoadState('networkidle');
    const desktopScreenshot = await captureViewportScreenshot(page, 'pricing-desktop-1920');
    pageAudit.screenshots.push(desktopScreenshot);

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);
    const tabletScreenshot = await captureViewportScreenshot(page, 'pricing-tablet-768');
    pageAudit.screenshots.push(tabletScreenshot);

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    const mobileScreenshot = await captureViewportScreenshot(page, 'pricing-mobile-375');
    pageAudit.screenshots.push(mobileScreenshot);

    // Check mobile layout
    const mobilePricingVisible = await page.evaluate(() => {
      const priceElements = Array.from(document.querySelectorAll('*')).filter((el) =>
        el.textContent?.match(/\$\d+/)
      );
      return priceElements.some((el) => {
        const rect = el.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.width > 0;
      });
    });

    pageAudit.findings.push({
      dimension: '5. Responsive Pricing Layout',
      observation: `Captured at 1920px, 768px, 375px. Mobile pricing visible: ${mobilePricingVisible}.`,
      evokes: mobilePricingVisible ? 'Pricing adapts well to mobile' : 'Mobile experience may hide critical information',
      gap: 'Review screenshots for pricing card layout on smaller screens',
      severity: mobilePricingVisible ? 'low' : 'medium',
    });
  });

  test('6. Comparison to Alternatives', async ({ page }) => {
    await page.goto('https://sparlo.ai/pricing');
    await page.waitForLoadState('networkidle');

    const comparisonSignals = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      return {
        mentionsFreeAI: text.includes('chatgpt') || text.includes('claude') || text.includes('free ai'),
        mentionsConsultants: text.includes('consultant') || text.includes('agency') || text.includes('contractor'),
        hasPositioning: text.includes('unlike') || text.includes('instead of') || text.includes('compared to'),
        hasUniqueDifferentiator: text.includes('only') || text.includes('exclusive') || text.includes('unique'),
      };
    });

    pageAudit.metrics['competitivePositioning'] = comparisonSignals;

    pageAudit.findings.push({
      dimension: '6. Competitive Positioning',
      observation: `Mentions free AI: ${comparisonSignals.mentionsFreeAI}, Mentions consultants: ${comparisonSignals.mentionsConsultants}, Has positioning language: ${comparisonSignals.hasPositioning}.`,
      evokes: comparisonSignals.hasPositioning ? 'Clear differentiation from alternatives' : 'May not clearly explain why this vs. free AI or consultants',
      gap: 'Product sits between free AI and consultants - positioning should address this explicitly',
      severity: comparisonSignals.hasPositioning ? 'low' : 'high',
    });
  });
});

// =============================================================================
// CROSS-PAGE CONSISTENCY
// =============================================================================

test.describe('Journey Coherence Check', () => {
  test('Landing to Pricing visual consistency', async ({ page }) => {
    // Capture landing page design tokens
    await page.goto('https://sparlo.ai/');
    await page.waitForLoadState('networkidle');

    const landingTokens = await page.evaluate(() => {
      const body = document.body;
      const styles = window.getComputedStyle(body);
      return {
        fontFamily: styles.fontFamily,
        backgroundColor: styles.backgroundColor,
      };
    });

    // Capture pricing page design tokens
    await page.goto('https://sparlo.ai/pricing');
    await page.waitForLoadState('networkidle');

    const pricingTokens = await page.evaluate(() => {
      const body = document.body;
      const styles = window.getComputedStyle(body);
      return {
        fontFamily: styles.fontFamily,
        backgroundColor: styles.backgroundColor,
      };
    });

    // Compare
    const isConsistent = landingTokens.fontFamily === pricingTokens.fontFamily;

    console.log('\n📊 Journey Coherence:');
    console.log(`  Landing font: ${landingTokens.fontFamily.slice(0, 50)}...`);
    console.log(`  Pricing font: ${pricingTokens.fontFamily.slice(0, 50)}...`);
    console.log(`  Consistent: ${isConsistent}`);

    expect(isConsistent).toBeTruthy();
  });
});
