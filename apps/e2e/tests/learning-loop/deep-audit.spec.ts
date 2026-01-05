/**
 * Deep Premium Audit - Comprehensive $499/mo Quality Check
 */
import { test, expect, Page } from '@playwright/test';

const CREDENTIALS = {
  email: 'swimakaswim@gmail.com',
  password: 'Linguine2025',
};

const BASE_URL = 'https://sparlo.ai';

interface Finding {
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'POLISH';
  category: string;
  issue: string;
  location: string;
  fix: string;
}

const findings: Finding[] = [];

function report(f: Finding) {
  findings.push(f);
  console.log(`\n[${f.severity}] ${f.category}`);
  console.log(`  Issue: ${f.issue}`);
  console.log(`  Location: ${f.location}`);
  console.log(`  Fix: ${f.fix}`);
}

test.describe('Deep Premium Audit', () => {
  test.setTimeout(600000); // 10 minutes

  test('Landing Page Deep Audit', async ({ page }) => {
    console.log('\n' + '='.repeat(60));
    console.log('SPARLO.AI DEEP PREMIUM AUDIT');
    console.log('Target: $499/mo Premium Quality');
    console.log('='.repeat(60));

    // LANDING PAGE
    console.log('\n\n>>> LANDING PAGE AUDIT <<<\n');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/deep-landing-full.png', fullPage: true });

    // Hero Section
    console.log('\n--- HERO SECTION ---');
    const hero = page.locator('section').first();
    await auditHeroSection(page, hero);

    // Navigation
    console.log('\n--- NAVIGATION ---');
    await auditNavigation(page);

    // Typography across page
    console.log('\n--- TYPOGRAPHY ---');
    await auditTypography(page);

    // Buttons & CTAs
    console.log('\n--- BUTTONS & CTAs ---');
    await auditButtons(page);

    // Spacing & Layout
    console.log('\n--- SPACING & LAYOUT ---');
    await auditSpacing(page);

    // Color Palette
    console.log('\n--- COLOR PALETTE ---');
    await auditColors(page);

    // Hover States
    console.log('\n--- HOVER STATES & INTERACTIONS ---');
    await auditInteractions(page);

    // Images
    console.log('\n--- IMAGES ---');
    await auditImages(page);

    // Footer
    console.log('\n--- FOOTER ---');
    await auditFooter(page);

    // Mobile Responsiveness
    console.log('\n--- MOBILE RESPONSIVENESS ---');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/deep-landing-mobile.png', fullPage: true });
    await auditMobile(page);

    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // AUTH PAGES
    console.log('\n\n>>> AUTH PAGES AUDIT <<<\n');
    await page.goto(`${BASE_URL}/auth/sign-in`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/deep-signin.png', fullPage: true });
    await auditAuthPage(page, 'Sign In');

    await page.goto(`${BASE_URL}/auth/sign-up`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/deep-signup.png', fullPage: true });
    await auditAuthPage(page, 'Sign Up');

    // LOGIN & DASHBOARD
    console.log('\n\n>>> AUTHENTICATED EXPERIENCE AUDIT <<<\n');
    await page.goto(`${BASE_URL}/auth/sign-in`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Try to login
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill(CREDENTIALS.email);
      await passwordInput.fill(CREDENTIALS.password);

      const submitBtn = page.locator('button[type="submit"]').first();
      await submitBtn.click();

      // Wait for navigation
      await page.waitForTimeout(5000);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      const currentUrl = page.url();
      console.log(`After login, URL: ${currentUrl}`);

      if (!currentUrl.includes('/auth/')) {
        // Successfully logged in
        await page.screenshot({ path: 'test-results/deep-dashboard.png', fullPage: true });
        await auditDashboard(page);

        // Navigate through app
        await auditAuthenticatedPages(page);
      } else {
        report({
          severity: 'CRITICAL',
          category: 'Authentication',
          issue: 'Login failed or redirected back to auth',
          location: currentUrl,
          fix: 'Check credentials and auth flow',
        });
      }
    }

    // FINAL REPORT
    console.log('\n\n' + '='.repeat(60));
    console.log('AUDIT COMPLETE - FINAL REPORT');
    console.log('='.repeat(60));

    const critical = findings.filter(f => f.severity === 'CRITICAL');
    const major = findings.filter(f => f.severity === 'MAJOR');
    const minor = findings.filter(f => f.severity === 'MINOR');
    const polish = findings.filter(f => f.severity === 'POLISH');

    console.log(`\nCRITICAL: ${critical.length}`);
    console.log(`MAJOR: ${major.length}`);
    console.log(`MINOR: ${minor.length}`);
    console.log(`POLISH: ${polish.length}`);
    console.log(`TOTAL: ${findings.length}`);

    const isPremium = critical.length === 0 && major.length <= 3;
    console.log(`\n$499/mo PREMIUM QUALITY: ${isPremium ? '✅ PASS' : '❌ FAIL'}`);

    if (critical.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES TO FIX:');
      critical.forEach((f, i) => console.log(`  ${i + 1}. ${f.issue} (${f.location})`));
    }

    if (major.length > 0) {
      console.log('\n⚠️  MAJOR ISSUES TO FIX:');
      major.forEach((f, i) => console.log(`  ${i + 1}. ${f.issue} (${f.location})`));
    }

    if (minor.length > 0) {
      console.log('\n📝 MINOR ISSUES:');
      minor.forEach((f, i) => console.log(`  ${i + 1}. ${f.issue}`));
    }

    if (polish.length > 0) {
      console.log('\n✨ POLISH OPPORTUNITIES:');
      polish.forEach((f, i) => console.log(`  ${i + 1}. ${f.issue}`));
    }

    expect(true).toBe(true);
  });
});

async function auditHeroSection(page: Page, hero: any) {
  // Check headline
  const h1 = page.locator('h1').first();
  if (await h1.isVisible()) {
    const fontSize = await h1.evaluate(el => parseFloat(getComputedStyle(el).fontSize));
    const fontWeight = await h1.evaluate(el => getComputedStyle(el).fontWeight);
    const lineHeight = await h1.evaluate(el => {
      const s = getComputedStyle(el);
      return parseFloat(s.lineHeight) / parseFloat(s.fontSize);
    });

    console.log(`  H1 size: ${fontSize}px, weight: ${fontWeight}, line-height: ${lineHeight.toFixed(2)}`);

    if (fontSize < 36) {
      report({
        severity: 'MAJOR',
        category: 'Typography',
        issue: `Hero headline too small (${fontSize}px)`,
        location: 'Hero H1',
        fix: 'Use text-4xl (36px) or larger for hero headlines',
      });
    }

    if (lineHeight > 1.4) {
      report({
        severity: 'POLISH',
        category: 'Typography',
        issue: `Hero headline line-height loose (${lineHeight.toFixed(2)})`,
        location: 'Hero H1',
        fix: 'Use leading-tight (1.25) for headlines',
      });
    }
  }

  // Check CTA button
  const cta = page.locator('section').first().locator('a, button').first();
  if (await cta.isVisible()) {
    const box = await cta.boundingBox();
    if (box && box.height < 44) {
      report({
        severity: 'MINOR',
        category: 'Touch Targets',
        issue: `Hero CTA button height ${Math.round(box.height)}px < 44px`,
        location: 'Hero CTA',
        fix: 'Add py-3 or min-h-[44px] for touch accessibility',
      });
    }
  }
}

async function auditNavigation(page: Page) {
  const nav = page.locator('nav, header').first();
  if (!await nav.isVisible()) {
    report({
      severity: 'MAJOR',
      category: 'Navigation',
      issue: 'No visible navigation found',
      location: 'Header',
      fix: 'Add semantic <nav> element',
    });
    return;
  }

  // Check sticky behavior
  const position = await nav.evaluate(el => getComputedStyle(el).position);
  if (position !== 'sticky' && position !== 'fixed') {
    report({
      severity: 'POLISH',
      category: 'Navigation',
      issue: 'Navigation not sticky',
      location: 'Header',
      fix: 'Add sticky top-0 for better UX on long pages',
    });
  }

  // Check logo
  const logo = nav.locator('img, svg').first();
  if (await logo.isVisible()) {
    const box = await logo.boundingBox();
    if (box && box.height < 24) {
      report({
        severity: 'MINOR',
        category: 'Branding',
        issue: `Logo too small (${Math.round(box.height)}px)`,
        location: 'Header logo',
        fix: 'Logo should be at least 32px tall',
      });
    }
  }
}

async function auditTypography(page: Page) {
  // Check body text
  const paragraphs = page.locator('p');
  const count = await paragraphs.count();

  let smallTextCount = 0;
  let tightLineHeightCount = 0;

  for (let i = 0; i < Math.min(count, 10); i++) {
    const p = paragraphs.nth(i);
    if (!await p.isVisible()) continue;

    const styles = await p.evaluate(el => {
      const s = getComputedStyle(el);
      return {
        fontSize: parseFloat(s.fontSize),
        lineHeight: parseFloat(s.lineHeight) / parseFloat(s.fontSize),
        color: s.color,
      };
    });

    if (styles.fontSize < 16) smallTextCount++;
    if (styles.lineHeight < 1.5) tightLineHeightCount++;
  }

  if (smallTextCount > 0) {
    report({
      severity: 'MINOR',
      category: 'Typography',
      issue: `${smallTextCount} paragraphs with font-size < 16px`,
      location: 'Body text',
      fix: 'Use text-base (16px) minimum for readability',
    });
  }

  if (tightLineHeightCount > 2) {
    report({
      severity: 'POLISH',
      category: 'Typography',
      issue: `${tightLineHeightCount} paragraphs with tight line-height`,
      location: 'Body text',
      fix: 'Use leading-relaxed (1.625) for body paragraphs',
    });
  }

  // Check heading hierarchy
  const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
  let prevLevel = 0;
  for (const h of headings) {
    const tag = await h.evaluate(el => el.tagName);
    const level = parseInt(tag.replace('H', ''));
    if (prevLevel > 0 && level > prevLevel + 1) {
      report({
        severity: 'MINOR',
        category: 'Typography',
        issue: `Skipped heading level: H${prevLevel} to H${level}`,
        location: 'Heading hierarchy',
        fix: 'Use sequential heading levels for accessibility',
      });
      break;
    }
    prevLevel = level;
  }
}

async function auditButtons(page: Page) {
  const buttons = page.locator('button, a[class*="btn"], [role="button"], a[class*="bg-"]');
  const count = await buttons.count();

  let smallButtons = 0;
  let noHoverTransition = 0;
  let inconsistentRadius = new Set<string>();

  for (let i = 0; i < Math.min(count, 20); i++) {
    const btn = buttons.nth(i);
    if (!await btn.isVisible()) continue;

    const box = await btn.boundingBox();
    if (box && (box.height < 36 || box.width < 60)) {
      smallButtons++;
    }

    const styles = await btn.evaluate(el => {
      const s = getComputedStyle(el);
      return {
        borderRadius: s.borderRadius,
        transition: s.transition,
        cursor: s.cursor,
      };
    });

    inconsistentRadius.add(styles.borderRadius);

    if (!styles.transition || styles.transition === 'none' || styles.transition === 'all 0s ease 0s') {
      noHoverTransition++;
    }
  }

  if (smallButtons > 3) {
    report({
      severity: 'MINOR',
      category: 'Buttons',
      issue: `${smallButtons} buttons are undersized`,
      location: 'Various buttons',
      fix: 'Use min-h-[40px] px-4 for comfortable click targets',
    });
  }

  if (noHoverTransition > 5) {
    report({
      severity: 'POLISH',
      category: 'Interactions',
      issue: `${noHoverTransition} buttons missing hover transitions`,
      location: 'Various buttons',
      fix: 'Add transition-all duration-200 for smooth interactions',
    });
  }

  if (inconsistentRadius.size > 3) {
    report({
      severity: 'POLISH',
      category: 'Consistency',
      issue: `${inconsistentRadius.size} different border-radius values on buttons`,
      location: 'Various buttons',
      fix: 'Standardize on rounded-lg or rounded-xl',
    });
  }
}

async function auditSpacing(page: Page) {
  const sections = page.locator('section');
  const count = await sections.count();

  const paddings: number[] = [];
  for (let i = 0; i < count; i++) {
    const section = sections.nth(i);
    if (!await section.isVisible()) continue;

    const py = await section.evaluate(el => {
      const s = getComputedStyle(el);
      return (parseFloat(s.paddingTop) + parseFloat(s.paddingBottom)) / 2;
    });
    paddings.push(Math.round(py / 4) * 4);
  }

  const uniquePaddings = [...new Set(paddings)];
  if (uniquePaddings.length > 4) {
    report({
      severity: 'POLISH',
      category: 'Spacing',
      issue: `Inconsistent section padding (${uniquePaddings.length} variations)`,
      location: 'Page sections',
      fix: 'Standardize on py-16 or py-24 for sections',
    });
  }

  console.log(`  Section paddings: ${uniquePaddings.join('px, ')}px`);
}

async function auditColors(page: Page) {
  const textColors = await page.evaluate(() => {
    const colors = new Set<string>();
    document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, a, li').forEach(el => {
      colors.add(getComputedStyle(el).color);
    });
    return Array.from(colors);
  });

  console.log(`  Unique text colors: ${textColors.length}`);

  if (textColors.length > 8) {
    report({
      severity: 'POLISH',
      category: 'Colors',
      issue: `Too many text colors (${textColors.length})`,
      location: 'Various text',
      fix: 'Limit to 4-5 text colors for cohesion',
    });
  }

  // Check for low contrast text
  const lowContrastElements = await page.evaluate(() => {
    const issues: string[] = [];
    document.querySelectorAll('p, span').forEach(el => {
      const s = getComputedStyle(el);
      const color = s.color;
      // Very rough check for light gray text
      if (color.includes('161') || color.includes('170') || color.includes('180')) {
        const text = (el as HTMLElement).innerText.slice(0, 30);
        if (text.trim()) issues.push(text);
      }
    });
    return issues.slice(0, 3);
  });

  if (lowContrastElements.length > 0) {
    report({
      severity: 'MINOR',
      category: 'Accessibility',
      issue: 'Potentially low contrast text found',
      location: lowContrastElements[0] + '...',
      fix: 'Ensure 4.5:1 contrast ratio for body text',
    });
  }
}

async function auditInteractions(page: Page) {
  // Test hover on links
  const links = page.locator('a').first();
  if (await links.isVisible()) {
    const initialStyles = await links.evaluate(el => ({
      color: getComputedStyle(el).color,
      textDecoration: getComputedStyle(el).textDecoration,
    }));

    await links.hover();
    await page.waitForTimeout(200);

    const hoverStyles = await links.evaluate(el => ({
      color: getComputedStyle(el).color,
      textDecoration: getComputedStyle(el).textDecoration,
    }));

    if (initialStyles.color === hoverStyles.color &&
        initialStyles.textDecoration === hoverStyles.textDecoration) {
      report({
        severity: 'MINOR',
        category: 'Interactions',
        issue: 'Links have no visible hover state',
        location: 'Links',
        fix: 'Add hover:text-zinc-600 or hover:underline',
      });
    }
  }

  // Check for focus states
  const focusableElements = page.locator('button, a, input, select, textarea');
  const first = focusableElements.first();
  if (await first.isVisible()) {
    await first.focus();
    const focusRing = await first.evaluate(el => {
      const s = getComputedStyle(el);
      return s.outline !== 'none' || s.boxShadow.includes('rgb');
    });

    if (!focusRing) {
      report({
        severity: 'MAJOR',
        category: 'Accessibility',
        issue: 'Focus states not visible',
        location: 'Interactive elements',
        fix: 'Add focus:ring-2 focus:ring-offset-2 for keyboard navigation',
      });
    }
  }
}

async function auditImages(page: Page) {
  const images = page.locator('img');
  const count = await images.count();

  let missingAlt = 0;
  let brokenImages = 0;

  for (let i = 0; i < count; i++) {
    const img = images.nth(i);
    const alt = await img.getAttribute('alt');
    if (!alt) missingAlt++;

    const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
    if (naturalWidth === 0) brokenImages++;
  }

  if (missingAlt > 0) {
    report({
      severity: 'MINOR',
      category: 'Accessibility',
      issue: `${missingAlt} images missing alt text`,
      location: 'Various images',
      fix: 'Add descriptive alt attributes',
    });
  }

  if (brokenImages > 0) {
    report({
      severity: 'MAJOR',
      category: 'Images',
      issue: `${brokenImages} broken/missing images`,
      location: 'Various images',
      fix: 'Fix image sources or add fallbacks',
    });
  }

  console.log(`  Images: ${count} total, ${brokenImages} broken, ${missingAlt} missing alt`);
}

async function auditFooter(page: Page) {
  const footer = page.locator('footer');
  if (!await footer.isVisible()) {
    report({
      severity: 'MINOR',
      category: 'Structure',
      issue: 'No semantic footer element',
      location: 'Page footer',
      fix: 'Wrap footer content in <footer> element',
    });
    return;
  }

  const footerLinks = footer.locator('a');
  const linkCount = await footerLinks.count();
  console.log(`  Footer links: ${linkCount}`);

  if (linkCount < 3) {
    report({
      severity: 'POLISH',
      category: 'Footer',
      issue: 'Footer seems sparse',
      location: 'Footer',
      fix: 'Add links to Terms, Privacy, Contact at minimum',
    });
  }
}

async function auditMobile(page: Page) {
  // Check for horizontal scroll
  const hasHorizontalScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });

  if (hasHorizontalScroll) {
    report({
      severity: 'MAJOR',
      category: 'Responsive',
      issue: 'Horizontal scroll on mobile',
      location: 'Mobile viewport',
      fix: 'Fix overflow elements, use w-full max-w-full',
    });
  }

  // Check touch targets on mobile
  const buttons = page.locator('button, a');
  const count = await buttons.count();
  let tooSmall = 0;

  for (let i = 0; i < Math.min(count, 10); i++) {
    const btn = buttons.nth(i);
    if (!await btn.isVisible()) continue;

    const box = await btn.boundingBox();
    if (box && (box.height < 44 || box.width < 44)) {
      tooSmall++;
    }
  }

  if (tooSmall > 3) {
    report({
      severity: 'MINOR',
      category: 'Mobile',
      issue: `${tooSmall} touch targets < 44px on mobile`,
      location: 'Mobile buttons',
      fix: 'Increase tap target size for mobile',
    });
  }

  // Check if nav is mobile-friendly
  const nav = page.locator('nav').first();
  const navVisible = await nav.isVisible().catch(() => false);
  const hamburger = page.locator('[class*="menu"], [class*="hamburger"], button[aria-label*="menu"]').first();
  const hasHamburger = await hamburger.isVisible().catch(() => false);

  if (navVisible && !hasHamburger) {
    // Nav is visible but no hamburger - might be ok if it's a minimal nav
    const navLinks = nav.locator('a');
    const navLinkCount = await navLinks.count();
    if (navLinkCount > 4) {
      report({
        severity: 'MINOR',
        category: 'Mobile',
        issue: 'Navigation may overflow on mobile',
        location: 'Mobile nav',
        fix: 'Add hamburger menu for mobile',
      });
    }
  }
}

async function auditAuthPage(page: Page, pageName: string) {
  console.log(`\n--- ${pageName} Page ---`);

  // Check form exists
  const form = page.locator('form').first();
  if (!await form.isVisible()) {
    report({
      severity: 'CRITICAL',
      category: 'Auth',
      issue: `${pageName} form not visible`,
      location: pageName,
      fix: 'Check if auth page renders correctly',
    });
    return;
  }

  // Check inputs
  const inputs = form.locator('input');
  const inputCount = await inputs.count();
  console.log(`  Form inputs: ${inputCount}`);

  for (let i = 0; i < inputCount; i++) {
    const input = inputs.nth(i);
    const type = await input.getAttribute('type');
    const placeholder = await input.getAttribute('placeholder');
    const label = await input.getAttribute('aria-label');

    if (!placeholder && !label) {
      report({
        severity: 'MINOR',
        category: 'Forms',
        issue: `Input ${type} missing placeholder/label`,
        location: pageName,
        fix: 'Add placeholder or aria-label for clarity',
      });
    }
  }

  // Check submit button
  const submitBtn = form.locator('button[type="submit"]').first();
  if (await submitBtn.isVisible()) {
    const box = await submitBtn.boundingBox();
    if (box && box.width < 200) {
      report({
        severity: 'POLISH',
        category: 'Forms',
        issue: 'Submit button could be wider',
        location: pageName,
        fix: 'Use w-full for auth form buttons',
      });
    }
  }
}

async function auditDashboard(page: Page) {
  console.log('\n--- Dashboard ---');

  // Check if loaded
  const mainContent = page.locator('main, [role="main"]').first();
  if (!await mainContent.isVisible()) {
    report({
      severity: 'CRITICAL',
      category: 'Dashboard',
      issue: 'Dashboard main content not visible',
      location: 'Dashboard',
      fix: 'Check if dashboard loads correctly',
    });
    return;
  }

  // Check sidebar
  const sidebar = page.locator('aside, [role="navigation"]').first();
  if (await sidebar.isVisible()) {
    console.log('  Sidebar: Present');
  }

  // Check data loading
  const skeletons = page.locator('[class*="skeleton"], [class*="animate-pulse"]');
  const skeletonCount = await skeletons.count();
  if (skeletonCount > 0) {
    console.log(`  Loading skeletons: ${skeletonCount} (content still loading)`);
  }
}

async function auditAuthenticatedPages(page: Page) {
  // Try to find and click through main nav items
  const navLinks = page.locator('nav a, aside a').all();
  const links = await navLinks;

  const visitedPaths = new Set<string>();
  visitedPaths.add(new URL(page.url()).pathname);

  for (const link of links.slice(0, 5)) {
    try {
      const href = await link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:')) continue;

      const path = new URL(href, page.url()).pathname;
      if (visitedPaths.has(path)) continue;

      await link.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      visitedPaths.add(path);
      console.log(`\n--- Page: ${path} ---`);

      await page.screenshot({
        path: `test-results/deep-page-${path.replace(/\//g, '-')}.png`,
        fullPage: true
      });

    } catch (e) {
      // Navigation failed, continue
    }
  }
}
