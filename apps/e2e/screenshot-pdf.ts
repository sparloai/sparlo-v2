/**
 * Screenshot PDF to verify Greek characters
 * Run: cd apps/e2e && npx tsx screenshot-pdf.ts
 */

import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

async function main() {
  const pdfPath = path.join(__dirname, 'pdf-test-output', 'greek-font-test.pdf');

  if (!fs.existsSync(pdfPath)) {
    console.log('PDF not found. Run test-font-greek.ts first.');
    process.exit(1);
  }

  console.log('Taking screenshot of PDF...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to the PDF file
  await page.goto(`file://${pdfPath}`);
  await page.waitForTimeout(3000); // Wait for PDF to render

  // Take screenshot
  const screenshotPath = path.join(__dirname, 'pdf-test-output', 'greek-font-test-screenshot.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });

  console.log(`Screenshot saved to: ${screenshotPath}`);

  await browser.close();
}

main();
