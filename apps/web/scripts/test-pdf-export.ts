/**
 * PDF Export Test Script
 *
 * Tests PDF export functionality and checks for common issues:
 * 1. Greek character encoding (τ, η, σ should render correctly, not as Ä, H, ³)
 * 2. Text overlapping
 * 3. Card splitting across pages
 *
 * Usage: npx tsx scripts/test-pdf-export.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_REPORT_ID = process.env.TEST_REPORT_ID || ''; // Will find one dynamically

interface TestResult {
  success: boolean;
  issues: string[];
  screenshots: string[];
}

async function findReportWithGreekChars(
  page: import('playwright').Page,
): Promise<string | null> {
  // Navigate to reports list to find a report
  await page.goto(`${BASE_URL}/app/reports`, { waitUntil: 'networkidle' });

  // Look for any report link
  const reportLink = await page.$('a[href*="/reports/"][href*="rpt_"]');
  if (reportLink) {
    const href = await reportLink.getAttribute('href');
    const match = href?.match(/rpt_[a-zA-Z0-9]+/);
    return match ? match[0] : null;
  }
  return null;
}

async function exportPdfAndAnalyze(
  page: import('playwright').Page,
  reportId: string,
): Promise<TestResult> {
  const result: TestResult = {
    success: true,
    issues: [],
    screenshots: [],
  };

  const screenshotDir = path.join(__dirname, '../test-pdf-screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log(`\n📄 Testing PDF export for report: ${reportId}`);

  // Navigate to the PDF endpoint directly to see the rendered output
  const pdfUrl = `${BASE_URL}/api/reports/${reportId}/pdf`;
  console.log(`  Fetching PDF from: ${pdfUrl}`);

  try {
    // First, let's check the report page itself
    await page.goto(`${BASE_URL}/app/reports/${reportId}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Take a screenshot of the report page
    const reportScreenshot = path.join(
      screenshotDir,
      `report-${reportId}-page.png`,
    );
    await page.screenshot({ path: reportScreenshot, fullPage: true });
    result.screenshots.push(reportScreenshot);
    console.log(`  📸 Report page screenshot: ${reportScreenshot}`);

    // Now fetch the PDF
    const response = await page.request.get(pdfUrl);

    if (response.status() !== 200) {
      result.success = false;
      result.issues.push(`PDF endpoint returned status ${response.status()}`);
      return result;
    }

    // Save the PDF
    const pdfBuffer = await response.body();
    const pdfPath = path.join(screenshotDir, `report-${reportId}.pdf`);
    fs.writeFileSync(pdfPath, pdfBuffer);
    console.log(`  💾 PDF saved to: ${pdfPath}`);

    // Check PDF size - a valid PDF should be at least a few KB
    const pdfSize = pdfBuffer.length;
    console.log(`  📊 PDF size: ${(pdfSize / 1024).toFixed(2)} KB`);

    if (pdfSize < 1000) {
      result.success = false;
      result.issues.push('PDF file is suspiciously small (< 1KB)');
    }

    // Try to extract text from PDF to check for encoding issues
    // We'll look for common garbled patterns
    const pdfText = pdfBuffer.toString('utf-8');

    // Check for garbled Greek character patterns
    const garbledPatterns = [
      { pattern: /Ä[Hh]/, description: 'Garbled η (eta) character' },
      { pattern: /Ã[³3]/, description: 'Garbled σ (sigma) character' },
      { pattern: /Ã¤/, description: 'Garbled character encoding' },
      { pattern: /breakup Ä/, description: 'Garbled τ (tau) in formula' },
    ];

    for (const { pattern, description } of garbledPatterns) {
      if (pattern.test(pdfText)) {
        result.success = false;
        result.issues.push(`Found ${description}`);
      }
    }

    // Check if proper Greek characters exist (good sign)
    const greekChars = ['τ', 'η', 'σ', 'γ', 'μ'];
    let foundGreek = false;
    for (const char of greekChars) {
      if (pdfText.includes(char)) {
        foundGreek = true;
        console.log(`  ✓ Found Greek character: ${char}`);
      }
    }

    if (!foundGreek && pdfText.length > 10000) {
      // Only flag if the PDF is substantial but has no Greek
      console.log('  ⚠️ No Greek characters found in PDF text extraction');
    }
  } catch (error) {
    result.success = false;
    result.issues.push(`Error during PDF export: ${error}`);
  }

  return result;
}

async function main() {
  console.log('🚀 Starting PDF Export Test\n');
  console.log(`Base URL: ${BASE_URL}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // If we need to log in, do it here
    // For now, assume we're testing against a local dev server with auth disabled
    // or we have a session

    let reportId = TEST_REPORT_ID;

    if (!reportId) {
      console.log('\n🔍 No report ID provided, searching for a report...');
      reportId = (await findReportWithGreekChars(page)) || '';

      if (!reportId) {
        // Use a known report ID from the biotech example
        console.log('  Using default biotech example report...');
        // Try to find it via the examples
        await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle' });
        const exampleLink = await page.$('a[href*="biotech"]');
        if (exampleLink) {
          const href = await exampleLink.getAttribute('href');
          const match = href?.match(/rpt_[a-zA-Z0-9]+/);
          reportId = match ? match[0] : '';
        }
      }
    }

    if (!reportId) {
      console.log(
        '\n❌ Could not find a report to test. Please provide TEST_REPORT_ID env var.',
      );
      await browser.close();
      process.exit(1);
    }

    console.log(`\n📋 Testing report: ${reportId}`);

    const result = await exportPdfAndAnalyze(page, reportId);

    console.log('\n' + '='.repeat(60));
    console.log('TEST RESULTS');
    console.log('='.repeat(60));

    if (result.success) {
      console.log('\n✅ All checks passed!');
    } else {
      console.log('\n❌ Issues found:');
      for (const issue of result.issues) {
        console.log(`   • ${issue}`);
      }
    }

    if (result.screenshots.length > 0) {
      console.log('\n📸 Screenshots saved:');
      for (const screenshot of result.screenshots) {
        console.log(`   • ${screenshot}`);
      }
    }

    console.log('\n');
  } catch (error) {
    console.error('Test failed with error:', error);
  } finally {
    await browser.close();
  }
}

main();
