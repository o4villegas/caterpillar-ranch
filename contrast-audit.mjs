import { chromium } from '@playwright/test';

const url = 'https://caterpillar-ranch.lando555.workers.dev';

/**
 * Calculate relative luminance for WCAG contrast ratio
 * https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate WCAG contrast ratio
 * https://www.w3.org/TR/WCAG20/#contrast-ratiodef
 */
function getContrastRatio(rgb1, rgb2) {
  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Parse RGB string to object
 */
function parseRGB(rgbString) {
  const match = rgbString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return null;
  return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
}

(async () => {
  console.log('🎨 Starting WCAG Contrast Audit...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Analyze all text elements for contrast
  const results = await page.evaluate(() => {
    const textElements = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip empty/whitespace nodes
          if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
          // Skip script/style nodes
          if (node.parentElement.tagName === 'SCRIPT' ||
              node.parentElement.tagName === 'STYLE') return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let node;
    while (node = walker.nextNode()) {
      const element = node.parentElement;
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();

      // Skip invisible elements
      if (rect.width === 0 || rect.height === 0) continue;
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      if (style.opacity === '0') continue;

      const text = node.textContent.trim();
      if (text.length === 0) continue;

      textElements.push({
        text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        color: style.color,
        backgroundColor: style.backgroundColor,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        selector: element.tagName.toLowerCase() +
                  (element.className ? '.' + element.className.split(' ')[0] : '') +
                  (element.id ? '#' + element.id : ''),
        position: {
          top: Math.round(rect.top),
          left: Math.round(rect.left)
        }
      });
    }

    return textElements;
  });

  console.log(`Found ${results.length} text elements to analyze\n`);

  // Calculate contrast ratios
  const contrastIssues = [];

  for (const element of results) {
    const textColor = parseRGB(element.color);
    let bgColor = parseRGB(element.backgroundColor);

    // If background is transparent, use page background
    if (!bgColor || element.backgroundColor === 'rgba(0, 0, 0, 0)') {
      bgColor = { r: 26, g: 26, b: 26 }; // --color-ranch-dark
    }

    if (!textColor || !bgColor) continue;

    const ratio = getContrastRatio(textColor, bgColor);
    const fontSize = parseFloat(element.fontSize);
    const fontWeight = parseInt(element.fontWeight);

    // Determine if text is "large" (18pt+ or 14pt+ bold)
    const isLargeText = fontSize >= 24 || (fontSize >= 18 && fontWeight >= 700);

    // WCAG AA requirements
    const requiredRatio = isLargeText ? 3.0 : 4.5;
    const passes = ratio >= requiredRatio;

    if (!passes) {
      contrastIssues.push({
        ...element,
        ratio: ratio.toFixed(2),
        required: requiredRatio.toFixed(1),
        isLargeText,
        severity: ratio < 3.0 ? 'CRITICAL' : 'WARNING'
      });
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 CONTRAST AUDIT RESULTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (contrastIssues.length === 0) {
    console.log('✅ All text elements pass WCAG AA contrast requirements!\n');
  } else {
    console.log(`❌ Found ${contrastIssues.length} contrast issues:\n`);

    contrastIssues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.severity} - ${issue.selector}`);
      console.log(`   Text: "${issue.text}"`);
      console.log(`   Color: ${issue.color}`);
      console.log(`   Background: ${issue.backgroundColor}`);
      console.log(`   Ratio: ${issue.ratio}:1 (required: ${issue.required}:1)`);
      console.log(`   Font: ${issue.fontSize} / ${issue.fontWeight} ${issue.isLargeText ? '(large text)' : '(normal text)'}`);
      console.log(`   Position: top ${issue.position.top}px, left ${issue.position.left}px`);
      console.log('');
    });
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await browser.close();

  // Exit with error code if critical issues found
  const criticalIssues = contrastIssues.filter(i => i.severity === 'CRITICAL');
  if (criticalIssues.length > 0) {
    console.log(`🔴 ${criticalIssues.length} CRITICAL contrast issues must be fixed`);
    process.exit(1);
  } else if (contrastIssues.length > 0) {
    console.log(`⚠️  ${contrastIssues.length} contrast warnings should be reviewed`);
    process.exit(0);
  } else {
    console.log('✅ Contrast audit passed!');
    process.exit(0);
  }
})();
