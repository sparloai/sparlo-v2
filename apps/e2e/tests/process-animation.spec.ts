import { expect, test } from '@playwright/test';

test('process animation phases work correctly', async ({ page }) => {
  await page.goto('http://localhost:3000/testlp', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Get section info
  const sectionInfo = await page.evaluate(() => {
    const section = document.querySelector('section[aria-label="Analysis Process"]');
    if (!section) return null;

    const rect = section.getBoundingClientRect();
    return {
      top: window.scrollY + rect.top,
      height: rect.height,
      viewportHeight: window.innerHeight,
    };
  });

  if (!sectionInfo) {
    throw new Error('Process Animation section not found');
  }

  console.log('Section info:', sectionInfo);
  const scrollRange = sectionInfo.height - sectionInfo.viewportHeight;

  // Helper to scroll to a specific progress point and check visibility
  async function checkAtProgress(progress: number, expectedState: {
    problemVisible?: boolean;
    reframeVisible?: boolean;
    analyzingVisible?: boolean;
    statsVisible?: boolean;
    outputVisible?: boolean;
    reportVisible?: boolean;
  }) {
    const targetScroll = sectionInfo!.top + (scrollRange * progress);
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), targetScroll);
    await page.waitForTimeout(400); // Wait for animation

    const state = await page.evaluate(() => {
      const section = document.querySelector('section[aria-label="Analysis Process"]');
      if (!section) return null;

      const sticky = section.querySelector('.sticky');
      const content = sticky?.querySelector('[class*="max-w"]');

      // Check each element's opacity
      const getOpacity = (selector: string): number => {
        const el = content?.querySelector(selector) as HTMLElement;
        if (!el) return 0;
        const style = getComputedStyle(el);
        return parseFloat(style.opacity) || 0;
      };

      // Problem text is always visible (opacity 1)
      const problemText = content?.textContent?.includes('Electrochemical ocean alkalinity');

      // Get reframe text by looking for the arrow prefix
      const reframe = Array.from(content?.querySelectorAll('p') || [])
        .find((p) => p.textContent?.includes('Reframed:'));
      const reframeOpacity = reframe ? parseFloat(getComputedStyle(reframe).opacity) : 0;

      // Analyzing label
      const analyzing = Array.from(content?.querySelectorAll('p') || [])
        .find((p) => p.textContent?.trim() === 'Analyzing');
      const analyzingOpacity = analyzing ? parseFloat(getComputedStyle(analyzing).opacity) : 0;

      // Stats (3,310 patents)
      const stats = Array.from(content?.querySelectorAll('p') || [])
        .find((p) => p.textContent?.includes('3,310 patents'));
      const statsOpacity = stats ? parseFloat(getComputedStyle(stats).opacity) : 0;

      // Output (12 concepts → 6 solutions)
      const output = Array.from(content?.querySelectorAll('p') || [])
        .find((p) => p.textContent?.includes('12 concepts'));
      const outputOpacity = output ? parseFloat(getComputedStyle(output).opacity) : 0;

      // Report (20-page report)
      const report = Array.from(content?.querySelectorAll('p') || [])
        .find((p) => p.textContent?.includes('20-page report'));
      const reportOpacity = report ? parseFloat(getComputedStyle(report).opacity) : 0;

      // Check sticky is at top
      const stickyTop = sticky?.getBoundingClientRect().top || 0;

      return {
        stickyAtTop: Math.abs(stickyTop) < 5, // within 5px of top
        problemVisible: !!problemText,
        reframeOpacity,
        analyzingOpacity,
        statsOpacity,
        outputOpacity,
        reportOpacity,
      };
    });

    console.log(`Progress ${(progress * 100).toFixed(0)}%:`, state);

    // Verify sticky is at top
    expect(state?.stickyAtTop).toBe(true);

    // Check expected visibility (opacity > 0.5 = visible)
    if (expectedState.problemVisible !== undefined) {
      expect(state?.problemVisible).toBe(expectedState.problemVisible);
    }
    if (expectedState.reframeVisible !== undefined) {
      const visible = (state?.reframeOpacity ?? 0) > 0.5;
      expect(visible).toBe(expectedState.reframeVisible);
    }
    if (expectedState.analyzingVisible !== undefined) {
      const visible = (state?.analyzingOpacity ?? 0) > 0.5;
      expect(visible).toBe(expectedState.analyzingVisible);
    }
    if (expectedState.statsVisible !== undefined) {
      const visible = (state?.statsOpacity ?? 0) > 0.5;
      expect(visible).toBe(expectedState.statsVisible);
    }
    if (expectedState.outputVisible !== undefined) {
      const visible = (state?.outputOpacity ?? 0) > 0.5;
      expect(visible).toBe(expectedState.outputVisible);
    }
    if (expectedState.reportVisible !== undefined) {
      const visible = (state?.reportOpacity ?? 0) > 0.5;
      expect(visible).toBe(expectedState.reportVisible);
    }

    return state;
  }

  // Test animation phases according to the component's scroll timeline:
  // 0-20%: Problem visible, Reframe fading in at 20%
  // 20-46%: Reframe visible, Analyzing label at 46%
  // 46-65%: Analyzing phase with fragments
  // 65-76%: Stats and domains appearing
  // 76-84%: Output appearing
  // 84-100%: Report appearing

  // Phase 1: Start - only problem visible
  await checkAtProgress(0.05, {
    problemVisible: true,
    reframeVisible: false,
    analyzingVisible: false,
  });

  // Phase 2: After reframe appears
  await checkAtProgress(0.35, {
    problemVisible: true,
    reframeVisible: true,
    analyzingVisible: false,
  });

  // Phase 3: Analyzing phase
  await checkAtProgress(0.55, {
    problemVisible: true,
    reframeVisible: true,
    analyzingVisible: true,
    statsVisible: false,
  });

  // Phase 4: Stats visible
  await checkAtProgress(0.72, {
    problemVisible: true,
    statsVisible: true,
    outputVisible: false,
  });

  // Phase 5: Output visible
  await checkAtProgress(0.82, {
    problemVisible: true,
    statsVisible: true,
    outputVisible: true,
    reportVisible: false,
  });

  // Phase 6: Report visible
  await checkAtProgress(0.95, {
    problemVisible: true,
    statsVisible: true,
    outputVisible: true,
    reportVisible: true,
  });

  // Take final screenshot
  await page.screenshot({ path: '/tmp/process-animation-final.png' });
  console.log('Animation test completed successfully');
});
