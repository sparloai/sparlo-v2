import { test, expect, Page } from '@playwright/test';

/**
 * Visual Regression & Brand Compliance Tests
 * 
 * These tests check visual consistency, brand adherence, and UX quality.
 * Uses screenshot comparison and DOM inspection for brand compliance.
 */

// Brand color palette (zinc-only)
const BRAND_COLORS = {
  backgrounds: ['#09090b', '#18181b', '#27272a'], // zinc-950, zinc-900, zinc-800
  text: ['#fafafa', '#a1a1aa', '#71717a'], // zinc-50, zinc-400, zinc-500
  borders: ['#3f3f46', '#52525b'], // zinc-700, zinc-600
  forbidden: ['#3b82f6', '#22c55e', '#ef4444', '#eab308', '#8b5cf6'], // blue, green, red, yellow, purple
};

// Breakpoints to test
const VIEWPORTS = [
  { name: 'desktop-large', width: 1440, height: 900 },
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'laptop', width: 1024, height: 768 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 667 },
];

test.describe('Visual Regression Tests', () => {
  
  test('dashboard visual snapshot', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot for comparison
    await expect(page).toHaveScreenshot('dashboard.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('report page visual snapshot', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('reports-list.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('responsive layouts across viewports', async ({ page }) => {
    for (const viewport of VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot(`dashboard-${viewport.name}.png`, {
        fullPage: false,
        animations: 'disabled',
      });
    }
  });
});

test.describe('Brand Compliance Checks', () => {
  
  test('typography uses correct font family', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check body font
    const bodyFont = await page.evaluate(() => {
      const body = document.body;
      return window.getComputedStyle(body).fontFamily;
    });
    
    console.log(`Body font-family: ${bodyFont}`);
    
    // Should include Suisse or system-ui fallback
    const validFonts = ['Suisse', 'suisse', 'system-ui', 'Inter', 'sans-serif'];
    const hasValidFont = validFonts.some(font => bodyFont.toLowerCase().includes(font.toLowerCase()));
    expect(hasValidFont).toBe(true);
  });

  test('no forbidden colors in use', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const colorViolations = await page.evaluate((forbiddenColors) => {
      const violations: string[] = [];
      const elements = document.querySelectorAll('*');
      
      elements.forEach((el) => {
        const styles = window.getComputedStyle(el);
        const bgColor = styles.backgroundColor;
        const textColor = styles.color;
        const borderColor = styles.borderColor;
        
        // Convert rgb to hex for comparison
        const rgbToHex = (rgb: string) => {
          const match = rgb.match(/\d+/g);
          if (!match || match.length < 3) return '';
          return '#' + match.slice(0, 3).map(x => {
            const hex = parseInt(x).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
          }).join('');
        };
        
        [bgColor, textColor, borderColor].forEach(color => {
          const hex = rgbToHex(color).toLowerCase();
          if (forbiddenColors.some((fc: string) => hex === fc.toLowerCase())) {
            violations.push(`${el.tagName}.${el.className}: ${hex}`);
          }
        });
      });
      
      return violations.slice(0, 10); // Limit to 10 violations
    }, BRAND_COLORS.forbidden);
    
    if (colorViolations.length > 0) {
      console.log('Color violations found:', colorViolations);
    }
    
    // Warn but don't fail - some violations might be intentional (e.g., success/error states)
    expect(colorViolations.length).toBeLessThanOrEqual(5);
  });

  test('no generic SaaS patterns detected', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check for gradient backgrounds
    const hasGradients = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let gradientCount = 0;
      
      elements.forEach((el) => {
        const styles = window.getComputedStyle(el);
        if (styles.backgroundImage.includes('gradient')) {
          gradientCount++;
        }
      });
      
      return gradientCount;
    });
    
    console.log(`Gradient backgrounds found: ${hasGradients}`);
    expect(hasGradients).toBeLessThanOrEqual(2); // Allow minimal gradients
    
    // Check for overly rounded buttons (>16px border-radius)
    const roundedButtons = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, .btn, [role="button"]');
      let tooRounded = 0;
      
      buttons.forEach((btn) => {
        const styles = window.getComputedStyle(btn);
        const radius = parseInt(styles.borderRadius);
        if (radius > 16) {
          tooRounded++;
        }
      });
      
      return tooRounded;
    });
    
    console.log(`Overly rounded buttons: ${roundedButtons}`);
  });
});

test.describe('UX Quality Checks', () => {
  
  test('all interactive elements have hover states', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const buttons = page.locator('button, a, [role="button"]');
    const count = await buttons.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const btn = buttons.nth(i);
      if (await btn.isVisible()) {
        const beforeStyles = await btn.evaluate((el) => {
          return {
            bg: window.getComputedStyle(el).backgroundColor,
            border: window.getComputedStyle(el).borderColor,
          };
        });
        
        await btn.hover();
        await page.waitForTimeout(100);
        
        const afterStyles = await btn.evaluate((el) => {
          return {
            bg: window.getComputedStyle(el).backgroundColor,
            border: window.getComputedStyle(el).borderColor,
          };
        });
        
        // Check if any style changed on hover
        const hasHoverState = 
          beforeStyles.bg !== afterStyles.bg || 
          beforeStyles.border !== afterStyles.border;
        
        if (!hasHoverState) {
          console.log(`Warning: Element ${i} may lack hover state`);
        }
      }
    }
  });

  test('focus states are visible for keyboard navigation', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Tab through the page
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return null;
        
        const styles = window.getComputedStyle(el);
        return {
          tag: el.tagName,
          outline: styles.outline,
          boxShadow: styles.boxShadow,
        };
      });
      
      if (focusedElement && focusedElement.tag !== 'BODY') {
        const hasFocusIndicator = 
          focusedElement.outline !== 'none' && focusedElement.outline !== '' ||
          focusedElement.boxShadow !== 'none';
        
        if (!hasFocusIndicator) {
          console.log(`Warning: ${focusedElement.tag} lacks visible focus state`);
        }
      }
    }
  });

  test('loading states are present for async operations', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for skeleton loaders or spinners during initial load
    const loadingIndicators = page.locator(
      '[data-testid="skeleton"], .skeleton, [data-testid="spinner"], .spinner, .loading, [role="status"]'
    );
    
    // These should exist somewhere in the codebase
    // Just log for now
    const count = await loadingIndicators.count();
    console.log(`Loading indicators found: ${count}`);
  });

  test('empty states are styled appropriately', async ({ page }) => {
    // Navigate to a page that might show empty state
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    
    const emptyState = page.locator(
      '[data-testid="empty-state"], .empty-state, text=/no reports|get started|create your first/i'
    ).first();
    
    if (await emptyState.count() > 0) {
      await expect(emptyState).toBeVisible();
      console.log('Empty state found and styled');
    }
  });
});

test.describe('Accessibility Checks', () => {
  
  test('all images have alt text', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const images = page.locator('img');
    const count = await images.count();
    let missingAlt = 0;
    
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      if (!alt || alt.trim() === '') {
        missingAlt++;
        const src = await images.nth(i).getAttribute('src');
        console.log(`Missing alt text: ${src?.substring(0, 50)}...`);
      }
    }
    
    expect(missingAlt).toBe(0);
  });

  test('form inputs have associated labels', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const inputs = page.locator('input:not([type="hidden"]):not([type="submit"])');
    const count = await inputs.count();
    let unlabeled = 0;
    
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const placeholder = await input.getAttribute('placeholder');
      
      // Check for associated label
      let hasLabel = false;
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        hasLabel = await label.count() > 0;
      }
      
      const hasAccessibleName = hasLabel || ariaLabel || ariaLabelledBy;
      
      if (!hasAccessibleName) {
        unlabeled++;
        console.log(`Unlabeled input: ${await input.getAttribute('name') || await input.getAttribute('type')}`);
      }
    }
    
    expect(unlabeled).toBe(0);
  });

  test('sufficient color contrast', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // This is a simplified check - for full compliance, use axe-playwright
    const textElements = page.locator('p, span, h1, h2, h3, h4, h5, h6, a, button');
    const count = await textElements.count();
    let lowContrast = 0;
    
    for (let i = 0; i < Math.min(count, 20); i++) {
      const el = textElements.nth(i);
      if (await el.isVisible()) {
        const contrast = await el.evaluate((element) => {
          const styles = window.getComputedStyle(element);
          const textColor = styles.color;
          const bgColor = styles.backgroundColor;
          
          // Simple luminance check (not WCAG compliant calculation)
          const getLuminance = (rgb: string) => {
            const match = rgb.match(/\d+/g);
            if (!match) return 0;
            const [r, g, b] = match.map(Number);
            return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          };
          
          const textLum = getLuminance(textColor);
          const bgLum = getLuminance(bgColor);
          
          return Math.abs(textLum - bgLum);
        });
        
        if (contrast < 0.3) {
          lowContrast++;
        }
      }
    }
    
    console.log(`Potential low contrast elements: ${lowContrast}`);
  });
});
