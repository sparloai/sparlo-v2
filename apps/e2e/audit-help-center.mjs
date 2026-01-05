#!/usr/bin/env node
/**
 * Help Center UX/UI Audit Script
 * Run with: node audit-help-center.mjs
 */
import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots', 'help-center-audit');
const BASE_URL = 'https://sparlo.ai';

// Get credentials from environment
const EMAIL = process.env.TEST_EMAIL;
const PASSWORD = process.env.TEST_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error('❌ Missing credentials. Usage:');
  console.error('   TEST_EMAIL=your@email.com TEST_PASSWORD=yourpass node audit-help-center.mjs');
  process.exit(1);
}

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function runAudit() {
  console.log('🚀 Starting Help Center UI Audit...\n');
  console.log(`📍 Target: ${BASE_URL}`);
  console.log(`📧 User: ${EMAIL}\n`);

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  try {
    // 1. Go to sign in page
    console.log('1️⃣  Navigating to login page...');
    await page.goto(`${BASE_URL}/auth/sign-in`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '01-login-page.png'),
      fullPage: true,
    });
    console.log('   ✅ Screenshot: 01-login-page.png');

    // 2. Login
    console.log('2️⃣  Logging in...');
    await page.fill('input[name="email"]', EMAIL);
    await page.fill('input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for redirect after login - wait for URL to contain /home/
    console.log('   Waiting for redirect...');
    try {
      await page.waitForURL('**/home/**', { timeout: 15000 });
    } catch {
      // If not redirected to /home/, navigate there manually
      console.log('   Not redirected to /home/, navigating manually...');
      await page.goto(`${BASE_URL}/home`);
      await page.waitForURL('**/home/**', { timeout: 10000 }).catch(() => {});
    }
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Dismiss cookie consent banner if present
    const acceptButton = page.locator('button:has-text("Accept"), button:has-text("Got it"), button:has-text("Allow")').first();
    if (await acceptButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('   📍 Dismissing cookie consent banner...');
      await acceptButton.click();
      await page.waitForTimeout(500);
    }

    console.log(`   📍 Current URL after login: ${page.url()}`);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '02-home-after-login.png'),
      fullPage: true,
    });
    console.log('   ✅ Screenshot: 02-home-after-login.png');

    // 3. Navigate to Help Center directly
    console.log('3️⃣  Navigating to Help Center...');
    console.log('   📍 Current session cookies:');
    const cookies = await page.context().cookies();
    console.log(`   📍 Found ${cookies.length} cookies`);

    // Navigate directly using page.evaluate to preserve session
    console.log('   📍 Navigating to /home/help...');
    const response = await page.goto(`${BASE_URL}/home/help`, { waitUntil: 'networkidle' });
    console.log(`   📍 Response status: ${response?.status()}`);
    console.log(`   📍 Response URL: ${response?.url()}`);

    await page.waitForTimeout(2000);
    console.log(`   📍 Final URL after navigation: ${page.url()}`);

    // Check page content
    const pageTitle = await page.title();
    console.log(`   📍 Page title: ${pageTitle}`);

    const h1Text = await page.locator('h1').first().textContent().catch(() => 'No h1 found');
    console.log(`   📍 H1 text: ${h1Text}`);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '03-help-chat-tab.png'),
      fullPage: true,
    });
    console.log('   ✅ Screenshot: 03-help-chat-tab.png');

    // 4. Type in chat input
    console.log('4️⃣  Testing chat input...');
    const chatInput = page.locator('input[placeholder*="question"], input[placeholder*="message"], input[placeholder*="Type"]').first();
    if (await chatInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await chatInput.fill('How do I create a new analysis?');
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '04-help-chat-with-input.png'),
        fullPage: true,
      });
      console.log('   ✅ Screenshot: 04-help-chat-with-input.png');
    }

    // 5. Click Submit Request tab
    console.log('5️⃣  Testing Submit Request tab...');
    const ticketTab = page.locator('button:has-text("Submit"), [role="tab"]:has-text("Submit"), button:has-text("Request")').first();
    if (await ticketTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await ticketTab.click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '05-help-ticket-tab.png'),
        fullPage: true,
      });
      console.log('   ✅ Screenshot: 05-help-ticket-tab.png');
    }

    // 6. Click Documentation tab
    console.log('6️⃣  Testing Documentation tab...');
    const docsTab = page.locator('button:has-text("Documentation"), [role="tab"]:has-text("Documentation"), button:has-text("Docs")').first();
    if (await docsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await docsTab.click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '06-help-docs-tab.png'),
        fullPage: true,
      });
      console.log('   ✅ Screenshot: 06-help-docs-tab.png');
    }

    // 7. Mobile viewport
    console.log('7️⃣  Testing mobile viewport...');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);

    // Go back to chat tab for mobile view
    const chatTab = page.locator('button:has-text("Chat"), button:has-text("Support"), [role="tab"]:has-text("Chat")').first();
    if (await chatTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await chatTab.click();
      await page.waitForTimeout(500);
    }

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '07-help-mobile-chat.png'),
      fullPage: true,
    });
    console.log('   ✅ Screenshot: 07-help-mobile-chat.png');

    // Mobile - ticket tab
    if (await ticketTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await ticketTab.click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '08-help-mobile-ticket.png'),
        fullPage: true,
      });
      console.log('   ✅ Screenshot: 08-help-mobile-ticket.png');
    }

    console.log('\n✅ Audit complete!');
    console.log(`📁 Screenshots saved to: ${SCREENSHOTS_DIR}`);

    const files = fs.readdirSync(SCREENSHOTS_DIR);
    console.log('\nFiles created:');
    files.forEach((file) => console.log(`   - ${file}`));

  } catch (error) {
    console.error('\n❌ Error during audit:', error.message);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'error-state.png'),
      fullPage: true,
    });
    console.log('   📸 Error screenshot saved');
  } finally {
    await browser.close();
  }
}

runAudit();
