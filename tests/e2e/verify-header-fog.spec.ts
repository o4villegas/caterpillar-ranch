import { test, expect } from '@playwright/test';

test.describe('Header Fog Overlay Verification', () => {
  test('should have fog overlay with correct styling', async ({ page }) => {
    // Use port 5175 to avoid conflict with other projects
    await page.goto('http://localhost:5175/');
    await page.waitForLoadState('networkidle');

    // Verify header has fog class
    const header = page.locator('header.header-fog');
    await expect(header).toBeVisible();
    console.log('✅ Header with .header-fog class: FOUND');

    // Check computed styles for header
    const headerStyles = await page.evaluate(() => {
      const header = document.querySelector('header.header-fog');
      if (!header) return null;
      const computedStyle = window.getComputedStyle(header);
      const beforeStyle = window.getComputedStyle(header, '::before');
      const afterStyle = window.getComputedStyle(header, '::after');
      return {
        position: computedStyle.position,
        overflow: computedStyle.overflow,
        beforeContent: beforeStyle.content,
        afterContent: afterStyle.content,
      };
    });

    expect(headerStyles).not.toBeNull();
    console.log('✅ Header position:', headerStyles!.position);
    console.log('✅ Header overflow:', headerStyles!.overflow);
    console.log('✅ ::before pseudo-element:', headerStyles!.beforeContent !== 'none' ? 'ACTIVE' : 'INACTIVE');
    console.log('✅ ::after pseudo-element:', headerStyles!.afterContent !== 'none' ? 'ACTIVE' : 'INACTIVE');

    // Verify fog pseudo-elements are active
    expect(headerStyles!.beforeContent).not.toBe('none');
    expect(headerStyles!.afterContent).not.toBe('none');

    // Check logo text shadow (reduced glow with rgba)
    const logoStyles = await page.evaluate(() => {
      const logo = document.querySelector('header span[style*="Creepster"]');
      if (!logo) return { found: false, style: '' };
      const style = logo.getAttribute('style') || '';
      return {
        found: true,
        hasReducedGlow: style.includes('rgba(50, 205, 50'),
        textShadow: style,
      };
    });

    console.log('✅ Logo text found:', logoStyles.found);
    console.log('✅ Uses rgba (reduced glow):', logoStyles.hasReducedGlow);
    expect(logoStyles.found).toBe(true);
    expect(logoStyles.hasReducedGlow).toBe(true);

    // Take screenshots for visual verification
    await header.screenshot({ path: 'test-results/header-fog-screenshot.png' });
    console.log('📸 Header screenshot saved: test-results/header-fog-screenshot.png');

    await page.screenshot({ path: 'test-results/homepage-with-fog.png' });
    console.log('📸 Full page screenshot saved: test-results/homepage-with-fog.png');
  });
});
