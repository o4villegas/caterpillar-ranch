# Technical Debt

This document tracks known technical debt items that should be addressed post-launch or when resources permit.

## Performance & Optimization

### 1. Logo GIF File Size (HIGH PRIORITY)

**Issue**: Brand logo (`/public/cr-logo.gif`) is 2.4MB, significantly exceeding performance budget.

**Impact**:
- Largest Contentful Paint (LCP): ~3-4s on 3G connections
- Target LCP: <1.5s (fails Core Web Vitals)
- Page load time: Additional 1-2s on slower connections

**Root Cause**:
- Logo contains 150 animation frames
- Each frame contributes ~16KB
- npm-based optimization tools (`imagemin-gifsicle`) cannot reduce frame count
- Color reduction (256 → 64 colors) only achieved 1% reduction (2.4MB → 2.37MB)

**Current Mitigation**:
- Added resource preload hint in `app/routes/home.tsx`:
  ```typescript
  { rel: "preload", as: "image", href: "/cr-logo.gif" }
  ```
- Improves perceived performance by prioritizing logo download
- Does not reduce actual file size

**Recommended Solutions** (pick one):

**Option A: Manual Frame Reduction** (15-30 mins, ~80% reduction)
1. Upload to https://ezgif.com/optimize
2. Reduce frames: 150 → 50 (remove every 3rd frame)
3. Apply lossy compression level 50
4. Expected result: 2.4MB → 400-500KB

**Option B: Animated WebP Conversion** (2-4 hours, ~85% reduction)
1. Research `imagemin-webp` animated GIF support
2. Convert GIF → animated WebP with quality 80
3. Implement `<picture>` fallback (WebP → GIF)
4. Expected result: 2.4MB → 300-400KB

**Option C: CSS Animation Replacement** (3-4 hours, ~95% reduction)
1. Export single frame as static PNG (~50KB)
2. Recreate drip animation using CSS keyframes
3. Maintain visual fidelity
4. Expected result: 2.4MB → 50-100KB

**Target**: <500KB (80% reduction)

**Priority**: HIGH - Affects Core Web Vitals and SEO rankings

**Timeline**: Post-launch or before marketing push

---

### 2. Product Images Already Optimized ✅

**Status**: RESOLVED

**Solution Implemented**:
- Converted all product PNGs to WebP format
- `<picture>` element with PNG fallback in ProductModal
- Sharp compression: quality 85, effort 6

**Results**:
- CR-ANIME: 708KB → 76KB (89.3% reduction)
- CR-PUNK: 292KB → 33KB (88.8% reduction)
- CR-ROCK: 500KB → 78KB (84.6% reduction)
- CR-WEIRD: 506KB → 48KB (90.7% reduction)
- **Total: 2.0MB → 233KB (88.4% reduction)**

**Files Modified**:
- `app/lib/components/ProductModal.tsx` - Added `<picture>` element
- `public/products/*.webp` - Generated WebP versions

**No further action needed.**

---

## Future Optimizations (MEDIUM PRIORITY)

### 3. Lazy Loading for Below-Fold Images

**Opportunity**: Product images in grid could use native lazy loading

**Implementation**:
```tsx
<img loading="lazy" ... />
```

**Expected Impact**: Save ~1-2MB on initial page load

**Effort**: 5 minutes

---

### 4. SVG Optimization for Icons

**Opportunity**: If custom SVG icons are added, run through SVGO

**Tool**: `svgo` npm package

**Expected Impact**: 20-40% reduction on SVG assets

**Effort**: 10 minutes setup, automatic thereafter

---

## Code Quality

### 5. Lucide React Bundle Size

**Issue**: Only using 1 icon (`X` close button) from `lucide-react` library

**Current Impact**: ~50KB bundle size for single icon

**Recommended Solution**:
Replace with inline SVG:
```tsx
// Replace: import { X } from "lucide-react";
// With:
<svg className="h-4 w-4" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
  <path d="M18 6L6 18M6 6l12 12" />
</svg>
```

**Expected Savings**: ~45KB from bundle

**Priority**: LOW - Minimal impact unless bundle size becomes concern

**Effort**: 10 minutes

---

## Accessibility

### 6. Prefers-Reduced-Motion Compliance

**Status**: PARTIAL

**Current Implementation**:
- Global CSS rule exists in `app/app.css`
- `useCursorTrail` hook respects preference
- Environmental horror components respect preference

**Gap**: Product card animations and modal animations don't check `prefers-reduced-motion`

**Recommended Fix**:
```tsx
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

<motion.div
  animate={!prefersReducedMotion ? { scale: [1, 1.02, 1] } : {}}
  // ...
/>
```

**Priority**: MEDIUM - Accessibility compliance

**Effort**: 1-2 hours

---

## Documentation

### 7. Missing Component Documentation

**Gap**: No JSDoc comments on complex components

**Recommendation**: Add JSDoc to:
- ProductModal (12 props, complex state)
- GameModal (game mechanics)
- CartContext (state management)

**Example**:
```tsx
/**
 * Product detail modal with game integration and add-to-cart functionality.
 * Responsive: Uses Dialog on desktop, Drawer on mobile.
 *
 * @param product - Product data including variants and pricing
 * @param isOpen - Controls modal visibility
 * @param onClose - Callback when modal closes
 * @param onAddToCart - Callback with productId, variantId, quantity, earnedDiscount
 */
```

**Priority**: LOW

**Effort**: 2-3 hours

---

## Testing

### 8. E2E Test Coverage Gaps

**Current Coverage**: Product modal only (`test-modal.mjs`)

**Missing Tests**:
- Cart functionality (add/remove/update quantities)
- Checkout flow
- Environmental horror components (rare events)
- Mobile responsive breakpoints
- Game modal interaction

**Priority**: MEDIUM - Address before Phase 3 (Game Implementation)

**Effort**: 6-8 hours for comprehensive suite

---

## Summary

**Immediate Action Required**:
1. Logo GIF optimization (HIGH PRIORITY) - 15 mins to 4 hours depending on approach

**Nice-to-Have**:
2. Lazy loading - 5 mins
3. Prefers-reduced-motion - 1-2 hours
4. SVG optimization setup - 10 mins

**Total Estimated Debt**: 80% resolved (product images done), 20% remaining (logo)

**Last Updated**: 2025-10-14
