/**
 * DD Report v2 UI Audit Script
 * Takes screenshots and generates a UI analysis report
 *
 * Run with: npx playwright test dd-report-audit.ts --project=chromium
 */
import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const REPORT_URL = 'http://localhost:3000/share/dd-test';
const OUTPUT_DIR = path.join(__dirname, 'dd-report-audit');

async function auditDDReport() {
  console.log('Starting DD Report v2 UI Audit...\n');

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const findings: string[] = [];

  try {
    console.log(`Navigating to ${REPORT_URL}...`);
    await page.goto(REPORT_URL, { waitUntil: 'networkidle' });

    // Wait for the report to load
    await page.waitForSelector('[data-test="dd-report"]', { timeout: 10000 });

    // Take full page screenshot
    console.log('Taking full page screenshot...');
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '01-full-page.png'),
      fullPage: true,
    });
    findings.push('Full page screenshot captured');

    // Screenshot the header area (first 900px)
    console.log('Taking header section screenshot...');
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '02-header-area.png'),
      clip: { x: 0, y: 0, width: 1440, height: 900 },
    });

    // Get all sections for analysis
    const sections = await page.$$('section[id]');
    console.log(`Found ${sections.length} sections`);
    findings.push(`Report contains ${sections.length} sections`);

    // Screenshot each section
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const sectionId = await section.getAttribute('id');

      if (sectionId) {
        console.log(`Screenshotting section: ${sectionId}`);

        // Scroll section into view
        await section.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300); // Allow for animations

        // Take screenshot of the section
        const box = await section.boundingBox();
        if (box) {
          await page.screenshot({
            path: path.join(OUTPUT_DIR, `section-${String(i + 1).padStart(2, '0')}-${sectionId}.png`),
            clip: {
              x: Math.max(0, box.x - 20),
              y: Math.max(0, box.y - 20),
              width: Math.min(1440, box.width + 40),
              height: Math.min(5000, box.height + 40), // Cap height for very long sections
            },
          });
        }
      }
    }

    // Analyze the page structure
    console.log('\nAnalyzing page structure...');

    // Check for verdict badges
    const verdictBadges = await page.$$('[class*="verdict"], [class*="badge"]');
    findings.push(`Found ${verdictBadges.length} verdict/badge elements`);

    // Check for score cards
    const scoreCards = await page.$$('[class*="score"]');
    findings.push(`Found ${scoreCards.length} score-related elements`);

    // Check for cards/boxes
    const cards = await page.$$('[class*="rounded-lg"][class*="border"]');
    findings.push(`Found ${cards.length} card elements`);

    // Check for accent borders
    const accentBorders = await page.$$('[class*="border-l-2"], [class*="border-l-4"]');
    findings.push(`Found ${accentBorders.length} accent border elements`);

    // Check typography hierarchy
    const h1s = await page.$$('h1');
    const h2s = await page.$$('h2');
    const h3s = await page.$$('h3');
    findings.push(`Typography: ${h1s.length} h1, ${h2s.length} h2, ${h3s.length} h3 elements`);

    // Check for MonoLabel patterns
    const monoLabels = await page.$$('[class*="uppercase"][class*="tracking"]');
    findings.push(`Found ${monoLabels.length} mono-label pattern elements`);

    // Check for highlight boxes
    const highlightBoxes = await page.$$('[class*="bg-zinc-50"], [class*="bg-amber"]');
    findings.push(`Found ${highlightBoxes.length} highlight box elements`);

    // Visual regression checks
    console.log('\nPerforming visual checks...');

    // Check if page has content
    const bodyText = await page.textContent('body');
    if (bodyText && bodyText.length > 1000) {
      findings.push('Page has substantial content (>1000 chars)');
    }

    // Check for company name rendering
    const hasCompanyName = await page.locator('text=PyroHydrogen').count();
    findings.push(`Company name "PyroHydrogen" appears ${hasCompanyName} times`);

    // Check for verdict rendering
    const hasVerdict = await page.locator('text=PROMISING').count();
    findings.push(`Verdict "PROMISING" appears ${hasVerdict} times`);

    // Check for scores rendering
    const hasScores = await page.locator('text=/\\d+\\/10/').count();
    findings.push(`Score patterns (X/10) appear ${hasScores} times`);

    // Take a mobile viewport screenshot
    console.log('\nTaking mobile viewport screenshot...');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(REPORT_URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-test="dd-report"]', { timeout: 10000 });
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '99-mobile-view.png'),
      fullPage: true,
    });
    findings.push('Mobile viewport (375px) screenshot captured');

    // Generate findings report
    console.log('\n=== UI AUDIT FINDINGS ===\n');
    findings.forEach((finding, i) => {
      console.log(`${i + 1}. ${finding}`);
    });

    // Write findings to file
    const reportContent = `# DD Report v2 UI Audit

Generated: ${new Date().toISOString()}

## Screenshots Captured

- 01-full-page.png - Full page render
- 02-header-area.png - Above the fold
- section-XX-*.png - Individual sections
- 99-mobile-view.png - Mobile responsive view

## Findings

${findings.map((f, i) => `${i + 1}. ${f}`).join('\n')}

## Manual Review Checklist

- [ ] Typography hierarchy is clear and consistent
- [ ] Verdict badges are prominent and readable
- [ ] Score cards display correctly with proper contrast
- [ ] Accent borders follow design system (zinc-900 left border)
- [ ] Cards have proper spacing and shadow
- [ ] Highlight boxes stand out appropriately
- [ ] Mobile layout is usable
- [ ] Long text content wraps properly
- [ ] All sections render without errors
- [ ] Color palette is consistent (zinc-based)

## Section Analysis

Check each section screenshot for:
- Proper heading hierarchy
- Consistent spacing
- Readable typography
- Appropriate use of color
- Clear information architecture
`;

    fs.writeFileSync(path.join(OUTPUT_DIR, 'AUDIT-REPORT.md'), reportContent);
    console.log(`\nAudit report written to ${path.join(OUTPUT_DIR, 'AUDIT-REPORT.md')}`);

  } catch (error) {
    console.error('Audit failed:', error);

    // Take error screenshot
    await page.screenshot({
      path: path.join(OUTPUT_DIR, 'ERROR-screenshot.png'),
      fullPage: true,
    });
  } finally {
    await browser.close();
  }

  console.log(`\nScreenshots saved to: ${OUTPUT_DIR}`);
}

// Run the audit
auditDDReport().catch(console.error);
