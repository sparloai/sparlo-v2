import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

// Wait for animation to initialize
await page.waitForTimeout(2000);

// Screenshot hero area
await page.screenshot({ path: '/tmp/debug-1-hero.png' });

// Scroll to animation section
await page.evaluate(() => window.scrollTo(0, window.innerHeight));
await page.waitForTimeout(1000);
await page.screenshot({ path: '/tmp/debug-2-animation-start.png' });

// Scroll more into animation
await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5));
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/debug-3-animation-mid.png' });

// Scroll to end of animation
await page.evaluate(() => window.scrollTo(0, window.innerHeight * 2.2));
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/debug-4-animation-end.png' });

// Check console errors
const logs = [];
page.on('console', msg => logs.push(msg.text()));
page.on('pageerror', err => logs.push('ERROR: ' + err.message));

// Get computed styles of animation section
const styles = await page.evaluate(() => {
  const section = document.querySelector('.analysis-animation');
  const content = section?.querySelector('[style*="opacity"]');
  return {
    sectionExists: !!section,
    sectionBg: section ? getComputedStyle(section).backgroundColor : null,
    contentStyle: content?.getAttribute('style'),
    cssVars: {
      bgVoid: getComputedStyle(document.documentElement).getPropertyValue('--bg-void'),
      textPrimary: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
    }
  };
});

console.log('Styles:', JSON.stringify(styles, null, 2));
console.log('Console logs:', logs);

await browser.close();
