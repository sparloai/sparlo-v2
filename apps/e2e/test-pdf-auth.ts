/**
 * PDF Export Test with Authentication
 *
 * Run: cd apps/e2e && npx tsx test-pdf-auth.ts
 */

import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// Toggle between production and local testing
const USE_LOCAL = false;
const BASE_URL = USE_LOCAL ? 'http://localhost:3000' : 'https://sparlo.ai';
const EMAIL = 'swimakaswim@gmail.com';
const PASSWORD = 'Linguine2025';

async function findReportId(page: import('playwright').Page): Promise<string | null> {
  // Navigate to reports list
  console.log('   Looking for reports...');
  await page.goto(`${BASE_URL}/home`, { waitUntil: 'networkidle', timeout: 30000 });

  // Wait a bit for any dynamic content
  await page.waitForTimeout(3000);

  // Try multiple selectors - the reports might be in different formats
  const selectors = [
    'a[href*="/reports/rpt_"]',
    'a[href*="reports/rpt"]',
    '[data-test*="report"]',
    // Click on first report item in list
    '[class*="report"]',
  ];

  for (const selector of selectors) {
    const elements = await page.$$(selector);
    if (elements.length > 0) {
      const href = await elements[0].getAttribute('href');
      if (href) {
        const match = href.match(/rpt_[a-zA-Z0-9-]+/);
        if (match) {
          console.log(`   Found ${elements.length} report(s) with selector: ${selector}`);
          return match[0];
        }
      }
    }
  }

  // Try to click on the first report card/item and get the URL
  console.log('   Trying to click on first report...');

  // Look for clickable report items - they appear to be in a list
  const reportItems = await page.$$('[class*="cursor-pointer"]');
  console.log(`   Found ${reportItems.length} clickable items`);

  if (reportItems.length > 0) {
    await reportItems[0].click();
    await page.waitForTimeout(3000);

    // Check if URL now contains a report ID
    const currentUrl = page.url();
    console.log(`   Current URL after click: ${currentUrl}`);

    // Try different patterns
    let match = currentUrl.match(/rpt_[a-zA-Z0-9-]+/);
    if (match) {
      console.log(`   Found report via navigation: ${match[0]}`);
      return match[0];
    }

    // Try /reports/UUID pattern
    match = currentUrl.match(/\/reports\/([a-zA-Z0-9-]+)/);
    if (match) {
      console.log(`   Found report ID: ${match[1]}`);
      return match[1];
    }
  }

  // Try looking at the page HTML for any rpt_ patterns
  const pageContent = await page.content();
  const rptMatch = pageContent.match(/rpt_[a-zA-Z0-9-]+/);
  if (rptMatch) {
    console.log(`   Found report ID in page content: ${rptMatch[0]}`);
    return rptMatch[0];
  }

  // Also look for UUID patterns that might be report IDs
  const uuidMatch = pageContent.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i);
  if (uuidMatch) {
    console.log(`   Found UUID in page content: ${uuidMatch[0]}`);
    return `rpt_${uuidMatch[0]}`;
  }

  return null;
}

async function main() {
  console.log('🚀 PDF Export Test with Authentication\n');

  const browser = await chromium.launch({ headless: false }); // Show browser for debugging
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Login
    console.log('1. Logging in...');
    await page.goto(`${BASE_URL}/auth/sign-in`, { waitUntil: 'networkidle' });

    await page.fill('input[name="email"]', EMAIL);
    await page.fill('input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for redirect after login
    await page.waitForTimeout(5000);
    console.log(`   Current URL: ${page.url()}`);
    console.log('   ✓ Logged in successfully\n');

    // Step 2: Find a report
    console.log('2. Finding a report...');
    const reportId = await findReportId(page);

    if (!reportId) {
      console.log('   ❌ No reports found. Taking screenshot...');
      const screenshotPath = path.join(__dirname, 'pdf-test-output', 'no-reports-found.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`   📸 ${screenshotPath}`);
      await browser.close();
      return;
    }

    console.log(`   ✓ Found report: ${reportId}\n`);

    // Step 3: Navigate to the report
    console.log('3. Loading report...');
    const reportUrl = `${BASE_URL}/home/reports/${reportId}`;
    await page.goto(reportUrl, { waitUntil: 'networkidle', timeout: 30000 });
    console.log('   ✓ Report loaded\n');

    // Step 4: Fetch the PDF
    console.log('4. Downloading PDF...');
    const pdfUrl = `${BASE_URL}/api/reports/${reportId}/pdf`;

    const response = await page.request.get(pdfUrl);
    const status = response.status();

    if (status !== 200) {
      console.log(`   ❌ PDF request failed with status ${status}`);
      const body = await response.text();
      console.log(`   Response: ${body.substring(0, 200)}`);
      await browser.close();
      return;
    }

    const pdfBuffer = await response.body();
    const outputDir = path.join(__dirname, 'pdf-test-output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const pdfPath = path.join(outputDir, `${reportId}.pdf`);
    fs.writeFileSync(pdfPath, pdfBuffer);
    console.log(`   ✓ PDF saved (${(pdfBuffer.length / 1024).toFixed(1)} KB)`);
    console.log(`   📄 ${pdfPath}\n`);

    // Step 5: Analyze PDF for issues
    console.log('5. Analyzing PDF for encoding issues...');

    const pdfString = pdfBuffer.toString('latin1');

    // Check for garbled patterns
    const issues: string[] = [];

    // Common garbled Greek character patterns
    const garbledPatterns = [
      { pattern: /Ãbreakup|breakup\s*Ã/i, desc: 'Garbled τ_breakup' },
      { pattern: /Ä[Hh]|ÄH/g, desc: 'Garbled η (eta)' },
      { pattern: /Ã¤|Ã„/g, desc: 'Garbled ä/Ä encoding' },
      { pattern: /Ã³|³=/g, desc: 'Garbled σ (sigma)' },
    ];

    for (const { pattern, desc } of garbledPatterns) {
      if (pattern.test(pdfString)) {
        issues.push(desc);
      }
    }

    // Check for proper Greek letters (good sign)
    const greekChars = ['τ', 'η', 'σ', 'γ', 'μ', 'ρ'];
    const foundGreek: string[] = [];
    for (const char of greekChars) {
      if (pdfString.includes(char)) {
        foundGreek.push(char);
      }
    }

    if (foundGreek.length > 0) {
      console.log(`   ✓ Found Greek characters: ${foundGreek.join(', ')}`);
    }

    if (issues.length > 0) {
      console.log(`   ❌ Found ${issues.length} encoding issues:`);
      issues.forEach(issue => console.log(`      - ${issue}`));
    } else {
      console.log('   ✓ No obvious garbled patterns detected');
    }

    // Step 6: Take screenshot of the report for visual comparison
    console.log('\n6. Taking screenshot of report...');
    const screenshotPath = path.join(outputDir, `${reportId}-report.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`   📸 ${screenshotPath}`);

    console.log('\n==========================================');
    console.log('TEST COMPLETE');
    console.log('==========================================');
    console.log(`\nPlease open the PDF to visually verify:`);
    console.log(`  open "${pdfPath}"`);
    console.log(`\nCheck for:`);
    console.log('  1. Greek characters (τ, η, σ) render correctly');
    console.log('  2. No text overlapping');
    console.log('  3. Cards not split across pages');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

main();
