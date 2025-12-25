import { test } from '@playwright/test';

const SITE_URL = 'https://sparlo.ai';
const SCREENSHOT_DIR = 'tests/ux-audit/screenshots/new-analysis';
const TEST_EMAIL = 'swimakaswim@gmail.com';
const TEST_PASSWORD = 'Linguine2025';

test.describe('New Analysis Page - Premium UX Audit', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto(`${SITE_URL}/auth/sign-in`);
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/home**', { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('1. Desktop Full Page Capture', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${SITE_URL}/home/reports/new`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Full page screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-desktop-full-page.png`,
      fullPage: true,
    });

    // Above the fold only
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-desktop-above-fold.png`,
    });

    // Capture page metrics
    const metrics = await page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;
      return {
        pageHeight: Math.max(body.scrollHeight, html.scrollHeight),
        viewportHeight: window.innerHeight,
        scrollY: window.scrollY,
      };
    });
    console.log('Page Metrics:', JSON.stringify(metrics, null, 2));
  });

  test('2. Typography Analysis', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${SITE_URL}/home/reports/new`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Analyze all text elements
    const typography = await page.evaluate(() => {
      const elements: Array<{
        tag: string;
        text: string;
        fontFamily: string;
        fontSize: string;
        fontWeight: string;
        lineHeight: string;
        letterSpacing: string;
        color: string;
      }> = [];

      // Get headings
      document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((el) => {
        const style = getComputedStyle(el);
        elements.push({
          tag: el.tagName,
          text: el.textContent?.trim().slice(0, 50) || '',
          fontFamily: style.fontFamily.split(',')[0]?.trim() || '',
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          lineHeight: style.lineHeight,
          letterSpacing: style.letterSpacing,
          color: style.color,
        });
      });

      // Get paragraphs and labels
      document.querySelectorAll('p, label, span').forEach((el) => {
        if (el.textContent && el.textContent.trim().length > 2) {
          const style = getComputedStyle(el);
          if (!elements.find((e) => e.text === el.textContent?.trim().slice(0, 50))) {
            elements.push({
              tag: el.tagName,
              text: el.textContent?.trim().slice(0, 50) || '',
              fontFamily: style.fontFamily.split(',')[0]?.trim() || '',
              fontSize: style.fontSize,
              fontWeight: style.fontWeight,
              lineHeight: style.lineHeight,
              letterSpacing: style.letterSpacing,
              color: style.color,
            });
          }
        }
      });

      return elements.slice(0, 20); // Limit to first 20
    });

    console.log('\n=== TYPOGRAPHY ANALYSIS ===');
    typography.forEach((t) => {
      console.log(`[${t.tag}] "${t.text}"`);
      console.log(`  Font: ${t.fontFamily}, ${t.fontSize}, ${t.fontWeight}`);
      console.log(`  Line-height: ${t.lineHeight}, Letter-spacing: ${t.letterSpacing}`);
      console.log(`  Color: ${t.color}`);
    });

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-typography-context.png`,
    });
  });

  test('3. Spacing & Layout Grid', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${SITE_URL}/home/reports/new`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Analyze layout structure
    const layout = await page.evaluate(() => {
      const main = document.querySelector('main') || document.body;
      const mainStyle = getComputedStyle(main);

      // Find form container
      const form = document.querySelector('form') || document.querySelector('[class*="form"]');
      const formStyle = form ? getComputedStyle(form) : null;

      // Find all major containers
      const containers: Array<{
        selector: string;
        width: string;
        maxWidth: string;
        padding: string;
        margin: string;
        gap: string;
      }> = [];

      document.querySelectorAll('main, section, form, [class*="container"], [class*="wrapper"]').forEach((el) => {
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        if (rect.width > 100) {
          containers.push({
            selector: el.tagName + (el.className ? `.${el.className.split(' ')[0]}` : ''),
            width: `${Math.round(rect.width)}px`,
            maxWidth: style.maxWidth,
            padding: style.padding,
            margin: style.margin,
            gap: style.gap,
          });
        }
      });

      return {
        mainPadding: mainStyle.padding,
        mainMaxWidth: mainStyle.maxWidth,
        containers: containers.slice(0, 10),
      };
    });

    console.log('\n=== LAYOUT ANALYSIS ===');
    console.log('Main Padding:', layout.mainPadding);
    console.log('Main Max-Width:', layout.mainMaxWidth);
    console.log('\nContainers:');
    layout.containers.forEach((c) => {
      console.log(`  ${c.selector}: ${c.width} (max: ${c.maxWidth})`);
      console.log(`    Padding: ${c.padding}, Gap: ${c.gap}`);
    });

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/04-layout-analysis.png`,
    });
  });

  test('4. Form Elements & Input Design', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${SITE_URL}/home/reports/new`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Screenshot of form in default state
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/05-form-default-state.png`,
    });

    // Analyze form inputs
    const formElements = await page.evaluate(() => {
      const inputs: Array<{
        type: string;
        placeholder: string;
        height: string;
        borderRadius: string;
        border: string;
        background: string;
        fontSize: string;
        padding: string;
      }> = [];

      document.querySelectorAll('input, textarea, select').forEach((el) => {
        const input = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        inputs.push({
          type: input.tagName + (input.type ? `[${input.type}]` : ''),
          placeholder: input.placeholder?.slice(0, 30) || '',
          height: `${Math.round(rect.height)}px`,
          borderRadius: style.borderRadius,
          border: style.border,
          background: style.backgroundColor,
          fontSize: style.fontSize,
          padding: style.padding,
        });
      });

      return inputs;
    });

    console.log('\n=== FORM ELEMENTS ===');
    formElements.forEach((f) => {
      console.log(`${f.type}: ${f.placeholder}`);
      console.log(`  Height: ${f.height}, Border-radius: ${f.borderRadius}`);
      console.log(`  Border: ${f.border}`);
      console.log(`  Background: ${f.background}`);
      console.log(`  Font-size: ${f.fontSize}, Padding: ${f.padding}`);
    });

    // Focus on textarea
    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible().catch(() => false)) {
      await textarea.focus();
      await page.waitForTimeout(200);

      const focusStyle = await textarea.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          outline: style.outline,
          boxShadow: style.boxShadow,
          borderColor: style.borderColor,
        };
      });
      console.log('\nTextarea Focus State:', JSON.stringify(focusStyle, null, 2));

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/06-textarea-focused.png`,
      });

      // Type some text
      await textarea.fill('Developing a novel approach to direct air capture of CO2 using electrochemical methods. Current systems require 250+ kWh per ton captured. Need to achieve <150 kWh/ton while maintaining >90% purity.');
      await page.waitForTimeout(500);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/07-textarea-with-content.png`,
      });
    }
  });

  test('5. Button States & CTAs', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${SITE_URL}/home/reports/new`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Find all buttons
    const buttons = await page.evaluate(() => {
      const btns: Array<{
        text: string;
        type: string;
        disabled: boolean;
        backgroundColor: string;
        color: string;
        borderRadius: string;
        padding: string;
        fontSize: string;
        fontWeight: string;
        boxShadow: string;
        height: string;
        width: string;
      }> = [];

      document.querySelectorAll('button, [role="button"], a[class*="btn"]').forEach((el) => {
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const btn = el as HTMLButtonElement;
        btns.push({
          text: el.textContent?.trim().slice(0, 30) || '',
          type: btn.type || 'button',
          disabled: btn.disabled || false,
          backgroundColor: style.backgroundColor,
          color: style.color,
          borderRadius: style.borderRadius,
          padding: style.padding,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          boxShadow: style.boxShadow,
          height: `${Math.round(rect.height)}px`,
          width: `${Math.round(rect.width)}px`,
        });
      });

      return btns;
    });

    console.log('\n=== BUTTON ANALYSIS ===');
    buttons.forEach((b) => {
      console.log(`"${b.text}" (${b.type}, disabled: ${b.disabled})`);
      console.log(`  Size: ${b.width} x ${b.height}`);
      console.log(`  Background: ${b.backgroundColor}`);
      console.log(`  Color: ${b.color}`);
      console.log(`  Border-radius: ${b.borderRadius}`);
      console.log(`  Shadow: ${b.boxShadow}`);
    });

    // Screenshot submit button area
    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.isVisible().catch(() => false)) {
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/08-submit-button-disabled.png`,
      });

      // Hover over submit button
      await submitBtn.hover();
      await page.waitForTimeout(200);

      const hoverStyle = await submitBtn.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          backgroundColor: style.backgroundColor,
          boxShadow: style.boxShadow,
          transform: style.transform,
          cursor: style.cursor,
        };
      });
      console.log('\nSubmit Button Hover:', JSON.stringify(hoverStyle, null, 2));

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/09-submit-button-hover.png`,
      });
    }

    // Fill form to enable submit
    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible().catch(() => false)) {
      await textarea.fill('Test problem description for enabling submit button.');
      await page.waitForTimeout(500);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/10-submit-button-enabled.png`,
      });

      // Hover enabled state
      await submitBtn.hover();
      await page.waitForTimeout(200);

      const enabledHoverStyle = await submitBtn.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          backgroundColor: style.backgroundColor,
          boxShadow: style.boxShadow,
          transform: style.transform,
        };
      });
      console.log('\nEnabled Submit Hover:', JSON.stringify(enabledHoverStyle, null, 2));

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/11-submit-enabled-hover.png`,
      });
    }
  });

  test('6. Visual Hierarchy & Information Architecture', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${SITE_URL}/home/reports/new`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Analyze visual hierarchy
    const hierarchy = await page.evaluate(() => {
      const elements: Array<{
        text: string;
        fontSize: number;
        fontWeight: number;
        y: number;
        importance: string;
      }> = [];

      // Get all text-containing elements
      document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, label, span, button').forEach((el) => {
        const text = el.textContent?.trim();
        if (text && text.length > 2 && text.length < 100) {
          const style = getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          const fontSize = parseFloat(style.fontSize);
          const fontWeight = parseInt(style.fontWeight);

          // Determine importance level
          let importance = 'low';
          if (fontSize >= 24) importance = 'high';
          else if (fontSize >= 16 || fontWeight >= 600) importance = 'medium';

          elements.push({
            text: text.slice(0, 40),
            fontSize,
            fontWeight,
            y: Math.round(rect.top),
            importance,
          });
        }
      });

      // Sort by Y position
      return elements.sort((a, b) => a.y - b.y).slice(0, 15);
    });

    console.log('\n=== VISUAL HIERARCHY (top to bottom) ===');
    hierarchy.forEach((h) => {
      console.log(`[${h.importance.toUpperCase()}] "${h.text}"`);
      console.log(`  Y: ${h.y}px, Font: ${h.fontSize}px, Weight: ${h.fontWeight}`);
    });

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/12-visual-hierarchy.png`,
    });
  });

  test('7. Color Palette & Contrast', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${SITE_URL}/home/reports/new`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Extract color palette
    const colors = await page.evaluate(() => {
      const colorMap = new Map<string, number>();

      // Sample colors from various elements
      document.querySelectorAll('*').forEach((el) => {
        const style = getComputedStyle(el);
        [style.color, style.backgroundColor, style.borderColor].forEach((c) => {
          if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') {
            colorMap.set(c, (colorMap.get(c) || 0) + 1);
          }
        });
      });

      // Sort by frequency
      return Array.from(colorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([color, count]) => ({ color, count }));
    });

    console.log('\n=== COLOR PALETTE (by frequency) ===');
    colors.forEach((c) => {
      console.log(`${c.color} (used ${c.count}x)`);
    });

    // Check background/foreground contrast
    const contrastInfo = await page.evaluate(() => {
      const body = document.body;
      const bodyStyle = getComputedStyle(body);

      const main = document.querySelector('main');
      const mainStyle = main ? getComputedStyle(main) : null;

      return {
        bodyBackground: bodyStyle.backgroundColor,
        bodyColor: bodyStyle.color,
        mainBackground: mainStyle?.backgroundColor || 'N/A',
      };
    });

    console.log('\nContrast Info:', JSON.stringify(contrastInfo, null, 2));

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/13-color-context.png`,
    });
  });

  test('8. Micro-interactions & Transitions', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${SITE_URL}/home/reports/new`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Check transition properties on interactive elements
    const transitions = await page.evaluate(() => {
      const results: Array<{
        element: string;
        transition: string;
        cursor: string;
      }> = [];

      document.querySelectorAll('button, a, input, textarea, [role="button"]').forEach((el) => {
        const style = getComputedStyle(el);
        if (style.transition && style.transition !== 'none' && style.transition !== 'all 0s ease 0s') {
          results.push({
            element: el.tagName + (el.textContent?.trim().slice(0, 20) || ''),
            transition: style.transition,
            cursor: style.cursor,
          });
        }
      });

      return results.slice(0, 10);
    });

    console.log('\n=== TRANSITIONS ===');
    transitions.forEach((t) => {
      console.log(`${t.element}:`);
      console.log(`  Transition: ${t.transition}`);
      console.log(`  Cursor: ${t.cursor}`);
    });

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/14-transitions-context.png`,
    });
  });

  test('9. Mobile Responsive View', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${SITE_URL}/home/reports/new`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Full mobile view
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/15-mobile-full.png`,
      fullPage: true,
    });

    // Above the fold mobile
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/16-mobile-above-fold.png`,
    });

    // Check touch targets
    const touchTargets = await page.evaluate(() => {
      const smallTargets: Array<{
        element: string;
        width: number;
        height: number;
      }> = [];

      document.querySelectorAll('button, a, input, textarea, [role="button"]').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          if (rect.width < 44 || rect.height < 44) {
            smallTargets.push({
              element: el.tagName + ': ' + (el.textContent?.trim().slice(0, 20) || ''),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            });
          }
        }
      });

      return smallTargets;
    });

    console.log('\n=== TOUCH TARGETS UNDER 44px ===');
    touchTargets.forEach((t) => {
      console.log(`${t.element}: ${t.width}x${t.height}px`);
    });
  });

  test('10. Empty State & Guidance', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${SITE_URL}/home/reports/new`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Look for guidance elements, hints, examples
    const guidance = await page.evaluate(() => {
      const elements: Array<{
        type: string;
        text: string;
        visible: boolean;
      }> = [];

      // Find placeholders
      document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach((el) => {
        const input = el as HTMLInputElement | HTMLTextAreaElement;
        elements.push({
          type: 'placeholder',
          text: input.placeholder.slice(0, 100),
          visible: true,
        });
      });

      // Find helper text, hints
      document.querySelectorAll('[class*="hint"], [class*="help"], [class*="description"], small, .text-muted').forEach((el) => {
        if (el.textContent?.trim()) {
          elements.push({
            type: 'helper',
            text: el.textContent.trim().slice(0, 100),
            visible: el.getBoundingClientRect().height > 0,
          });
        }
      });

      // Find examples or templates
      document.querySelectorAll('[class*="example"], [class*="template"]').forEach((el) => {
        if (el.textContent?.trim()) {
          elements.push({
            type: 'example',
            text: el.textContent.trim().slice(0, 100),
            visible: el.getBoundingClientRect().height > 0,
          });
        }
      });

      return elements;
    });

    console.log('\n=== GUIDANCE ELEMENTS ===');
    guidance.forEach((g) => {
      console.log(`[${g.type}] "${g.text}" (visible: ${g.visible})`);
    });

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/17-guidance-elements.png`,
    });
  });

  test('11. Dark Mode Consistency', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${SITE_URL}/home/reports/new`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Check current theme
    const isDark = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ||
             document.body.classList.contains('dark');
    });

    console.log(`\nCurrent theme: ${isDark ? 'DARK' : 'LIGHT'}`);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/18-current-theme.png`,
    });

    // If there's a theme toggle, try switching
    const themeToggle = page.locator('button[aria-label*="theme"], button[aria-label*="Theme"], [class*="theme-toggle"]').first();
    if (await themeToggle.isVisible().catch(() => false)) {
      await themeToggle.click();
      await page.waitForTimeout(500);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/19-alternate-theme.png`,
      });

      const newTheme = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ||
               document.body.classList.contains('dark');
      });
      console.log(`After toggle: ${newTheme ? 'DARK' : 'LIGHT'}`);
    }
  });

  test('12. Page Load Performance', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    const startTime = Date.now();
    await page.goto(`${SITE_URL}/home/reports/new`);
    const navigationTime = Date.now() - startTime;

    await page.waitForLoadState('domcontentloaded');
    const domContentLoaded = Date.now() - startTime;

    await page.waitForLoadState('networkidle');
    const networkIdle = Date.now() - startTime;

    console.log('\n=== PAGE LOAD PERFORMANCE ===');
    console.log(`Navigation: ${navigationTime}ms`);
    console.log(`DOM Content Loaded: ${domContentLoaded}ms`);
    console.log(`Network Idle: ${networkIdle}ms`);

    // Check for loading states, skeleton loaders
    const loadingElements = await page.evaluate(() => {
      const found: string[] = [];
      document.querySelectorAll('[class*="loading"], [class*="skeleton"], [class*="spinner"]').forEach((el) => {
        found.push(el.className);
      });
      return found;
    });

    console.log('Loading elements found:', loadingElements.length > 0 ? loadingElements : 'None');

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/20-loaded-state.png`,
    });
  });

  test('13. Overall Craft Assessment', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${SITE_URL}/home/reports/new`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Final comprehensive analysis
    const craftAssessment = await page.evaluate(() => {
      // Check for design system consistency
      const fontFamilies = new Set<string>();
      const borderRadii = new Set<string>();
      const shadows = new Set<string>();

      document.querySelectorAll('*').forEach((el) => {
        const style = getComputedStyle(el);
        if (style.fontFamily) fontFamilies.add(style.fontFamily.split(',')[0]?.trim() || '');
        if (style.borderRadius && style.borderRadius !== '0px') borderRadii.add(style.borderRadius);
        if (style.boxShadow && style.boxShadow !== 'none') shadows.add(style.boxShadow);
      });

      return {
        fontFamilyCount: fontFamilies.size,
        fontFamilies: Array.from(fontFamilies).slice(0, 5),
        borderRadiiCount: borderRadii.size,
        borderRadii: Array.from(borderRadii).slice(0, 8),
        shadowCount: shadows.size,
        shadows: Array.from(shadows).slice(0, 5),
      };
    });

    console.log('\n=== DESIGN SYSTEM CONSISTENCY ===');
    console.log(`Font families used: ${craftAssessment.fontFamilyCount}`);
    craftAssessment.fontFamilies.forEach((f) => console.log(`  - ${f}`));
    console.log(`\nBorder radii used: ${craftAssessment.borderRadiiCount}`);
    craftAssessment.borderRadii.forEach((r) => console.log(`  - ${r}`));
    console.log(`\nShadows used: ${craftAssessment.shadowCount}`);
    craftAssessment.shadows.forEach((s) => console.log(`  - ${s.slice(0, 60)}...`));

    // Final screenshots
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/21-final-desktop.png`,
    });

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/22-final-bottom.png`,
    });
  });
});
