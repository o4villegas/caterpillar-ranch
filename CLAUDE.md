# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Caterpillar Ranch** is a full-stack e-commerce application for print-on-demand merchandise, built on **Cloudflare Workers** using:
- **Hono** for backend API routes
- **React Router** (v7) for frontend routing with SSR enabled
- **ShadCN UI** + **Tailwind CSS v4** for UI components and styling
- **Vite** for bundling and development
- **Printful API** (v2) for product fulfillment

The architecture combines backend and frontend in a single Cloudflare Worker deployment, where Hono handles API routes and React Router serves the SSR application.

### Business Context
- This is a **print-on-demand** t-shirt/merchandise store powered by the Printful API
- UI design mock is preserved in `DO-NOT-DELETE/ui-mock.tsx` - reference this for design patterns and component structure
- Printful API v2 schema documentation is in `DO-NOT-DELETE/printful-schema.json` (591KB)
- The app features a unique horror-themed "caterpillar ranch" aesthetic with gamified discount mechanics

---

## 🏗️ Current Implementation Status

**Last Updated**: 2025-01-16
**Current Phase**: Phase 2 Complete, Phase 2.9 Complete, Phase 3 In Progress
**Codebase Size**: 39 TypeScript files, 4,500+ lines of application code

### ✅ Completed Phases

**Phase 1.1: Horror Aesthetic Foundation** (Complete)
- ✅ Color palette defined (`app/lib/constants/colors.ts` - 80 lines)
- ✅ Horror-themed UI copy system (`app/lib/constants/horror-copy.ts` - 145 lines)
- ✅ Base styling with Tailwind v4 (`app/app.css` - 403 lines)
- ✅ Custom animations: breathing, heartbeat-pulse, wiggle-wrong, star-blink

**Phase 1.2: Product Catalog** (Complete)
- ✅ 4 product designs with mock data (`app/lib/mocks/products.ts` - 117 lines)
- ✅ Product type system (`app/lib/types/product.ts` - 48 lines)
- ✅ Homepage with product grid (`app/routes/home.tsx` - 174 lines)
- ✅ Product images in `/public/products/` (CR-PUNK, CR-ROCK, CR-WEIRD, CR-ANIME)

**Phase 1.3: Environmental Horror Layer** (Complete)
- ✅ Night sky with blinking stars (`app/lib/components/NightSky.tsx` - 63 lines, 75 stars)
- ✅ Flickering barn light (`app/lib/components/BarnLight.tsx` - 16 lines, CSS-based)
- ✅ Garden shadows vignette (`app/lib/components/GardenShadows.tsx` - 16 lines, CSS-based)
- ✅ Cursor trail effect (`app/lib/hooks/useCursorTrail.ts` - 58 lines, respects prefers-reduced-motion)

**Phase 1.4: Product Detail Modal** (Complete)
- ✅ Responsive modal system (`app/lib/components/ProductModal.tsx` - 321 lines)
  - Desktop: Dialog component (Radix UI)
  - Mobile: Drawer component (Vaul)
- ✅ Size selection with visual states (selected/available/out-of-stock)
- ✅ Quantity controls with validation (1-99 range)
- ✅ Add to Cart with loading states and toast notifications
- ✅ Framer Motion animations (spring physics, breathing effect)
- ✅ Playwright testing suite (`test-modal.mjs` - 153 lines, 8 screenshot tests)

**Phase 1.5: Interactive Polish** (Complete)
- ✅ Rare event system (`app/lib/components/EyeInCorner.tsx`, `app/lib/components/BackgroundBlur.tsx`)
- ✅ Particle burst effects for success animations (Sonner toast with celebration emoji)
- ✅ Game modal selection UI (`app/lib/components/GameModal.tsx` - 87 lines, 6 games)
- ✅ Horror-themed copy integration (ProductModal uses HORROR_COPY throughout)
- ✅ Advanced card hover effects (lime/cyan glow + text color transitions in `home.tsx`)
- ✅ Product image tiny eye pattern overlay (`public/patterns/tiny-eyes.svg`, `.product-image::after` in `app.css`)
- ✅ Playwright tests updated for horror-themed UI text (test-modal.mjs)
- ✅ Production verified: All Phase 1.5 features live and functional

**Phase 2: Cart State Management** (✅ Complete)
- ✅ Cart type definitions and interfaces (`app/lib/types/cart.ts` - 116 lines)
- ✅ CartContext provider with React Context API (`app/lib/contexts/CartContext.tsx` - 383 lines)
  - useReducer for state management
  - localStorage persistence (auto-save on cart changes)
  - 40% max discount cap enforcement in calculateTotals()
- ✅ Cart UI components:
  - CartIcon (`app/lib/components/CartIcon.tsx` - 112 lines)
    - Item count badge with spring animation
    - Wiggle animation on item add
    - Discount percentage indicator
  - CartDrawer (`app/lib/components/CartDrawer.tsx` - 264 lines)
    - Responsive drawer (Vaul library)
    - Item list with thumbnails
    - Quantity controls (+/- buttons)
    - Remove item functionality
    - Totals breakdown with discount display
    - 40% cap warning badge
- ✅ Dedicated product route (`app/routes/product.tsx` - 388 lines)
  - Full-page product view at `/products/:slug`
  - Size and quantity selection
  - Game modal integration
  - Add to cart with discount application
  - Particle burst animation on success
  - SEO meta tags (Open Graph, Twitter Card)
- ✅ ParticleBurst component (`app/lib/components/ParticleBurst.tsx` - 127 lines)
  - Canvas-based particle system
  - Physics simulation (gravity, velocity)
  - Horror color palette (lime, cyan, pink)
- ✅ Integration with homepage (CartIcon + CartDrawer)
- ⏳ Session token management and KV storage (placeholders for Phase 3)
- ⏳ Server sync API routes (placeholders for Phase 3)

**Phase 2.9: Printful API Integration** (✅ Complete)
- ✅ Printful API client library (`workers/lib/printful.ts` - 331 lines)
  - PrintfulClient class with V2 API endpoints
  - Bearer token authentication
  - Error handling and response parsing
  - Support for catalog, orders, variants, estimation
- ✅ PrintfulCache helper for KV storage
  - 1-hour TTL for product catalog
  - 6-hour TTL for product variants
  - Cache invalidation methods
- ✅ Catalog API routes (`workers/routes/catalog.ts` - 146 lines)
  - GET /api/catalog/products - List all products (cached)
  - GET /api/catalog/products/:id - Single product details (cached)
  - POST /api/catalog/invalidate - Cache invalidation (admin only)
- ✅ Integration with Hono app (`workers/app.ts`)
  - Catalog routes mounted at /api/catalog
- ✅ Environment configuration
  - PRINTFUL_API_TOKEN set in wrangler.jsonc (local)
  - Production secret configured via wrangler secret put
  - KV namespace binding (CATALOG_CACHE)
- ✅ API verification
  - Tested against Printful V2 reference documentation
  - Rate limiting confirmed (120 req/min leaky bucket)
  - Response structure validated ({data: [...]} format)
  - Successfully fetching 20+ catalog products
- ✅ Auth scaffolding for Phase 3 (included as infrastructure)
  - Auth routes (`workers/routes/auth.ts` - 143 lines)
  - Auth utilities (`workers/lib/auth.ts` - 297 lines)
  - Database schema (`workers/db/schema.sql` - 232 lines)
  - JWT authentication, bcrypt password hashing
  - Admin login/logout endpoints (mounted at /api/auth)
  - Note: Auth is non-functional until D1 database is initialized in Phase 3

### 🚧 In Progress

**Phase 3: Game Implementation & Backend Integration** (In Progress)
- ✅ Game modal selection UI (`app/lib/components/GameModal.tsx` - 87 lines)
- ✅ Printful API catalog routes (moved to Phase 2.9)
- ⏳ 6 horror-themed discount games (implementation pending)
- ⏳ Score-to-discount conversion system
- ⏳ Printful order creation and confirmation flow
- ⏳ KV storage for cart sessions
- ⏳ Server-side discount validation
- ⏳ Frontend integration with real Printful catalog data

---

## 🎮 Project Vision & Horror Aesthetic (HORROR INTENSITY: 8/10)

### Vision Alignment - How the Documents Work Together

**IMPORTANT**: This project combines two complementary visions:

1. **Business Strategy** (from `DO-NOT-DELETE/app-overview.pdf`):
   - Target: Gen Z shoppers buying novelty t-shirts
   - Philosophy: **Optional games enhance shopping, NEVER block it**
   - Discount mechanics: Product games, rapid-fire timers, daily challenges, last resort game
   - **40% maximum discount cap** (enforced server-side)
   - Success = authentic, fun shopping experience without manipulation

2. **Game Design & Horror Aesthetic** (from `DO-NOT-DELETE/game-details.pdf`):
   - Vibe: **"Tim Burton meets Animal Crossing meets Don't Starve"**
   - Aesthetic: **Cute + Wrong = Unsettling but delightful**
   - 6 horror-themed games with grotesque transformations and uncanny animations
   - Environmental horror UI layer (whispered voice lines, ASMR sounds, "slightly off" movements)
   - Color palette: Lavender (#9B8FB5), Sage green (#A4B494), Dusty rose (#C6A2A2), Deep purple (#4A3258)

**Horror Intensity: 8 out of 10**
- High intensity horror elements (grotesque transformations, unsettling sounds)
- Maintains "cute" baseline (rounded shapes, pastel colors, cartoonish design)
- Intentional uncanny valley (movements slightly too slow/fast, eyes blink wrong)

### Core Philosophy: Games Are OPTIONAL

**CRITICAL RULE**: Never make games feel mandatory or manipulative. "Skip and Buy Now" must always be visible and easy.

**Good UX:**
- ✅ User clicks product → sees clear "Buy Now - $35" button
- ✅ Separate "Play Game - Earn up to 40% Off" button (optional)
- ✅ Game modal has obvious close/skip button
- ✅ Cart shows "Play one last game?" as optional box (not blocking checkout)

**Bad UX:**
- ❌ Game starts automatically
- ❌ "Buy Now" hidden until game completes
- ❌ Modal has no close button
- ❌ Last resort game blocks checkout

---

## 🐛 Game Specifications

Build 6 horror-themed games. All must work on mobile (touch-friendly, 320px-428px width).

### Score-to-Discount Conversion (All Games)

```
45-50 points → 40% off
35-44 points → 30% off
20-34 points → 20% off
10-19 points → 10% off
0-9 points → 0% off (can retry)
```

**Note**: Maximum discount is 40% across all games combined. Server enforces this at checkout.

---

### 1. The Culling (Whack-A-Mole) - 25 seconds

**Concept**: Grotesque "invasive" caterpillars pop up from holes. User must click/tap to cull them before they burrow back.

**Mechanics**:
- 9 holes in 3x3 grid
- Caterpillars appear randomly (1-3 at a time)
- Each stays visible 1.2 seconds before burrowing
- Wrong targets: "Good" caterpillars (different color) - penalty for hitting
- Hit sound: wet squelch + caterpillar squeak
- Miss sound: ominous whisper "they grow..."

**Scoring**:
- Hit invasive caterpillar: +5 points
- Hit good caterpillar: -3 points
- Target for 30% success rate: 25+ points (requires 5+ successful culls)

**Horror Elements**:
- Caterpillars have too many eyes
- Successful cull shows brief "burst" of green ichor
- Background darkens slightly with each miss
- At 10+ points, holes start "breathing" (expanding/contracting)

**Assets Needed**:
- Invasive caterpillar sprite (multiple eye variants)
- Good caterpillar sprite (softer colors)
- Hole sprite (with breathing animation frames)
- Cull burst effect (particle system or spritesheet)

---

### 2. Cursed Harvest (Memory Match) - 30 seconds

**Concept**: Match pairs of mutated crops from The Rancch's cursed garden. Cards flip to reveal grotesque vegetables.

**Mechanics**:
- 12 cards (6 pairs) laid out in 4x3 grid
- Click/tap to flip, find matching pairs
- Matched pairs stay revealed (glow effect)
- Mismatched pairs flip back after 0.8 seconds
- Timer ticks down with heartbeat sound effect

**Scoring**:
- Each matched pair: +8 points
- Bonus for speed: +2 points if matched within 3 seconds of first flip
- Target for 30% success rate: 30+ points (4+ pairs matched)

**Horror Elements**:
- Card backs: pulsing, organic texture (like skin)
- Revealed cards: mutated vegetables with eyes, teeth, or tendrils
- Match success: cards emit faint "scream" (whispered, not loud)
- Mismatch: cards "shudder" before flipping back
- At 20+ points, cards start flipping themselves briefly (1 frame flash)

**Assets Needed**:
- Card back design (animated pulsing texture)
- 6 unique mutated crop illustrations:
  - Eyeball tomato
  - Screaming corn
  - Tendril carrot
  - Tooth potato
  - Crying onion
  - Spine cucumber

---

### 3. Bug Telegram (Speed Typing) - 30 seconds

**Concept**: Intercept coded messages sent by bugs. Type words correctly before timer expires to prevent "infestation spread."

**Mechanics**:
- Words appear at top of screen, scroll down slowly
- User must type each word exactly (case-insensitive)
- Correct word: disappears with "intercepted" effect
- Word reaches bottom: "escaped" (no points, ominous sound)
- 15-20 words total, 4-6 letters each
- Mobile: auto-capitalize keyboard, word validation per character

**Scoring**:
- Correct word: +3 points
- Correct word with no typos: +5 points
- Speed bonus: +2 if typed within 3 seconds
- Target for 30% success rate: 35+ points (7+ words perfectly typed)

**Horror Elements**:
- Words are bug-related: "MOLT", "SWARM", "PUPATE", "HATCH", "INFEST"
- Typed letters appear as dripping green text
- Escaped words leave "trail" down screen (fades after 1 second)
- Background: faint Morse code beeping (adds urgency)
- At 20+ points, words start "vibrating" (harder to read)

**Assets Needed**:
- Word list (20 bug-themed words, 4-6 letters)
- Drip text effect (CSS or canvas animation)
- Trail sprite (fading green line)
- Morse code sound effect (subtle, looping)

---

### 4. Hungry Hungry Caterpillar (Snake Game) - 45 seconds

**Concept**: Control a caterpillar that grows increasingly grotesque as it eats. Grow as large as possible, then "transform" at the end.

**Mechanics**:
- Classic snake: swipe/arrow keys to turn
- Eat food (leaves) to grow longer
- Each food eaten: +1 body segment
- Hit wall or self: game over (score based on length)
- Mobile: swipe controls (up/down/left/right)
- At 45 seconds, caterpillar "transforms" (visual only, doesn't affect score)

**Scoring**:
- Each food eaten: +5 points
- Length bonus: +2 points per body segment at end
- Perfect run (no collisions, 10+ segments): +15 bonus
- Target for 30% success rate: 40+ points (8+ food, 10+ segments)

**Horror Elements**:
- Caterpillar head: too many eyes, mandibles that "chew"
- Body segments: pulsing, veiny texture
- Food: leaves with bite marks, occasionally squirm
- Growth: each segment added plays wet "squelch" sound
- Transformation at end: caterpillar bursts into moth with distorted wings (2-second cutscene)
- Collision: caterpillar "screams" (whispered distortion)

**Assets Needed**:
- Caterpillar head sprite (animated mandibles)
- Body segment sprite (pulsing veins)
- Leaf sprite (animated squirm, 2-3 frames)
- Moth transformation spritesheet (8 frames)
- Squelch sound, transformation sound, collision sound

---

### 5. Midnight Garden (Reflex Clicker) - 25 seconds

**Concept**: Click "good omens" (fireflies, safe plants) but avoid "bad signs" (spiders, withered blooms). Items appear/disappear rapidly.

**Mechanics**:
- Random items appear across screen (anywhere in play area)
- Each visible for 1.5 seconds before fading
- 2-4 items on screen at once (mix of good/bad)
- Click good: +points, click bad: -points
- Mobile: tap friendly (44px minimum touch target)

**Scoring**:
- Good omen clicked: +4 points
- Bad sign clicked: -5 points
- Miss good omen: -1 point (fades away)
- Target for 30% success rate: 25+ points (7+ good clicks, <2 bad clicks)

**Good Omens** (glowing, pulsing):
- Firefly (brightest, easiest to identify)
- Healthy flower (pastel colors, gentle sway)
- Caterpillar with halo (tiny, cute)

**Bad Signs** (darker, twitchy):
- Spider (8 legs, jerky movement)
- Withered flower (brown, drooping)
- Cursed caterpillar (red eyes, fast twitch)

**Horror Elements**:
- Background: night garden scene, faint fog
- Good omens: soft chime when clicked (music box notes)
- Bad signs: discordant screech when clicked
- At 15+ points, bad signs start "disguising" as good (color shifts slightly)
- Missed good omens: whisper "why did you abandon us..."

**Assets Needed**:
- 3 good omen sprites (firefly, flower, caterpillar)
- 3 bad sign sprites (spider, withered flower, cursed caterpillar)
- Fade-in/fade-out animations for each
- Chime sound (3 variations), screech sound (3 variations)

---

### 6. Metamorphosis Queue (Timing Game) - 25 seconds

**Concept**: Caterpillars are transforming in cocoons. Click each at the *exact* moment of emergence to "preserve" them. Too early/late = failed transformation.

**Mechanics**:
- 5 cocoons across screen (horizontal row)
- Each pulses/shakes with increasing intensity
- Visual cue: color shifts from purple → pink → GREEN (click now!) → red (too late)
- GREEN window lasts 0.4 seconds
- Mobile: large touch targets (entire cocoon area)

**Scoring**:
- Perfect timing (clicked during green): +10 points
- Good timing (clicked within 0.2s of green): +5 points
- Early/late click: -3 points
- Missed transformation: -5 points
- Target for 10% success rate: 40+ points (4+ perfect, 5+ good)

**Horror Elements**:
- Cocoons: translucent, see silhouette thrashing inside
- Perfect timing: beautiful moth emerges (brief animation)
- Failed timing: moth emerges deformed (twisted wings, extra legs)
- Missed transformation: cocoon "explodes" into black moths (swarm scatters)
- Background: low-frequency hum (increases tension)
- Sound cues: heartbeat speeds up as green window approaches

**Assets Needed**:
- Cocoon sprite (4 color states: purple, pink, green, red)
- Thrashing silhouette animation (inside cocoon)
- Perfect moth sprite (beautiful, symmetrical)
- Failed moth sprite (grotesque, asymmetrical)
- Explosion effect (particle system or spritesheet)
- Heartbeat sound (variable tempo), explosion sound

---

## 🎨 Horror UI Design Principles

### The Vibe: "That's Messed Up... But I Love It?"

**Core Aesthetic Philosophy**:
- **Tim Burton meets Animal Crossing meets Don't Starve**
- Disturbing concepts, adorable execution
- Things that SHOULD be scary but are charming
- Slightly wrong, completely endearing
- Cozy nightmare energy
- Screenshot-worthy unsettling moments

**Reference Image** (`DO-NOT-DELETE/styling-reference.png`):
The brand mascot perfectly embodies the aesthetic:
- Cute caterpillar with oversized head and big eyes
- **But**: Zig-zag teeth, drool/slime dripping, slightly unsettling smile
- **Color scheme**: Bright cyan/turquoise body, cream/beige face, hot pink accents
- **Typography**: "RANCCH" in drippy, melting pink letters (horror font made cute)
- **Setting**: Served on a plate (implies consumption/culling) but presented adorably
- **Details**: Purple shading, bone decorations, glossy highlights on slime

### Visual Aesthetics

**Color Palette** (refined from styling-reference.png):
- **Primary Greens**: Bright cyan-green (#00CED1), lime green (#32CD32) - caterpillar body colors
- **Accent Pink**: Hot pink/magenta (#FF1493) - drip text, blush, warnings
- **Accent Purple**: Lavender (#9B8FB5), deep purple (#4A3258) - backgrounds, shadows
- **Neutrals**: Cream/beige (#F5F5DC), off-white - text, highlights
- **Dark Base**: Near-black (#1a1a1a) - page backgrounds for contrast

**Typography**:
- **Brand/Headers**: Drippy, melting style (like "RANCCH" in reference image)
  - CSS: Use text-shadow for drip effect or SVG custom font
  - Pink color with subtle glow/shadow
- **Body Text**: Rounded sans-serif (friendly baseline)
  - High contrast on dark backgrounds
  - Slightly increased letter-spacing (0.02em) for "off" feeling
- **Game UI**: Monospace for scores/timers (retro horror vibe)
  - Cyan/green color for active states
  - Pink for warnings/penalties

**Shapes & Forms**:
- **Rounded everything** (16-24px border-radius) - cute baseline
- **Glossy highlights**: Use gradients to simulate slime/organic texture
- **Slight asymmetry**: Elements offset 2-3px, rotated 1-2deg
- **Drip effects**: SVG or CSS for melting edges (like "RANCCH" text)
- **Cards/modals**:
  - Soft shadows with purple tint
  - Subtle "breathing" animation (scale 1.0 → 1.015, 3s ease-in-out)
  - Border glow (cyan/green) on hover

### Animation Principles (Uncanny Effect)

**"Slightly Off" Movements**:
- Buttons: ease-in-out but with 0.05s delay on hover-out (lingers too long)
- Modals: fade in at 0.9x speed (just slow enough to notice)
- Cards: hover lift with slight rotation (2-3deg, feels "alive")
- Mascot eyes: blink at irregular intervals (3s, 7s, 2s, 5s pattern)

**Success Animations**:
- Discount earned: "acceptance" burst (green particles from DO-NOT-DELETE/ui-mock.tsx)
- Item added to cart: brief "absorption" effect (item shrinks into cart icon)

**Loading States**:
- Spinners: pulsing caterpillar icon (too many segments, they wriggle)
- Progress bars: fill with "oozing" motion (not linear)

### Sound Design

**General Principles**:
- Volume: 30-40% by default (user can mute)
- Frequency: Mid-range for whispers, low-range for rumbles
- Reverb: Subtle on all sounds (creates "distance")

**UI Sounds**:
- Button click: soft "squish" (organic, not digital)
- Modal open: slow creak (like door, 0.8s)
- Success: chime with slight dissonance (not pure major chord)
- Error: low rumble + whisper "not yet..."

**Game Sounds** (see individual game specs above)

**Ambient Background** (optional, can disable):
- Faint wind + cricket chirps (pastoral horror)
- Occasional distant "calls" (animal? caterpillar? unclear)

### Environmental Horror Layer - "The Ranch Interface is Alive"

**IMPORTANT**: These effects are subtle background elements. Never block shopping functionality.

#### Homepage Background (Always Active)

**Night Sky with Too Many Stars**:
```css
/* Stars that blink slowly at random intervals */
.star {
  animation: blink-slow var(--random-duration) ease-in-out infinite;
  animation-delay: var(--random-delay);
}

@keyframes blink-slow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
```
- Tech: CSS keyframe animations, generate 50-100 stars with randomized durations (3-8s)
- Some stars blink faster (unsettling rhythm)

**Barn Window Light (Flickers)**:
```javascript
// React state for random triggers
useEffect(() => {
  const flicker = () => {
    setLightOn(false);
    setTimeout(() => setLightOn(true), 100 + Math.random() * 200);
  };

  const interval = setInterval(flicker, 8000 + Math.random() * 12000); // Random 8-20s
  return () => clearInterval(interval);
}, []);
```
- Light flickers at random intervals (never predictable)
- Quick dark period (100-300ms) then back on

**Subtle Movements in Garden Periphery**:
```css
/* Elements at edges of viewport */
.garden-shadow {
  position: fixed;
  bottom: 0;
  animation: creep-up 20s ease-in-out infinite;
}

@keyframes creep-up {
  0%, 100% { transform: translateY(100%); opacity: 0; }
  50% { transform: translateY(0); opacity: 0.3; }
}
```
- Shadows/shapes occasionally move at screen edges
- Very slow (20s+ animations), barely noticeable

**Ambient Sound** (Phase 1 MVP: OMITTED):
- Sound features will be added in a future phase
- MVP focuses on visual environmental horror only

#### Product Pages

**Product Photos with Barely Visible Patterns**:
```css
/* Overlay with tiny eye pattern */
.product-image::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url('/patterns/tiny-eyes.svg');
  background-size: 20px;
  opacity: 0.03; /* Barely visible */
  pointer-events: none;
}
```
- Tiny eyes (3-5px) repeated in fabric texture
- Only noticeable if you stare closely

**Background Occasionally Blurs**:
```javascript
// Random blur effect (1-2% chance per minute)
useEffect(() => {
  const maybeBlur = () => {
    if (Math.random() < 0.015) { // 1.5% chance
      setBlurred(true);

      // Show vague shapes during blur
      setShowShapes(true);

      setTimeout(() => {
        setBlurred(false);
        setShowShapes(false);
      }, 1500); // 1.5s blur
    }
  };

  const interval = setInterval(maybeBlur, 60000); // Check every minute
  return () => clearInterval(interval);
}, []);
```
```css
.page-content.blurred {
  filter: blur(2px);
  transition: filter 0.3s ease-in-out;
}

.vague-shapes {
  position: fixed;
  inset: 0;
  background-image: url('/images/shapes.svg');
  opacity: 0.15;
  pointer-events: none;
  animation: fade-shapes 1.5s ease-in-out;
}
```

**Models Look Slightly "Off"**:
- Use static images with post-processing:
  - Makeup slightly too perfect (increase saturation on face by 5%)
  - Smile held too long (use image where model is mid-blink or awkward expression)
  - Eyes slightly too bright (add subtle glow with CSS filter)
```css
.model-photo {
  filter: saturate(1.05) brightness(1.02);
}

.model-photo .eyes {
  filter: brightness(1.15) contrast(1.1);
}
```

#### Checkout Experience - Horror E-Commerce Copy

**Replace Standard E-Commerce Text**:
```javascript
// Text replacements in React components
const HORROR_COPY = {
  cartTitle: "Your Order is Growing",
  cartEmpty: "The Ranch Awaits Your Selection",
  itemsInCart: (count) => `${count} ${count === 1 ? 'Item' : 'Items'} Growing`,

  shippingTitle: "Where Should the Harvest Arrive?",
  shippingAddress: "Delivery Location",

  loadingOrder: "The Ranch is Preparing Your Items...",
  orderConfirmed: "Your Order Has Been Accepted by The Ranch",
  trackingInfo: "Watch Your Package's Journey",

  checkout: "Complete the Harvest",
  total: "Total Tribute",
  subtotal: "Growth Subtotal",
};
```

**Loading States with Horror Flavor**:
```jsx
// Loading component
<div className="loading-state">
  <div className="pulsing-caterpillar">🐛</div>
  <p className="loading-text">{loadingMessages[messageIndex]}</p>
</div>

// Rotate through messages
const loadingMessages = [
  "The ranch is preparing your items...",
  "Caterpillars are inspecting quality...",
  "Wrapping your harvest...",
  "The colony approves...",
];
```

#### Universal Elements (Site-Wide)

**Cursor Leaves Faint Trail**:
```javascript
// Track cursor position, draw fading trail
useEffect(() => {
  const trails = [];
  const maxTrails = 15;

  const handleMouseMove = (e) => {
    // Create trail element
    const trail = document.createElement('div');
    trail.className = 'cursor-trail';
    trail.style.left = `${e.clientX}px`;
    trail.style.top = `${e.clientY}px`;
    document.body.appendChild(trail);

    trails.push(trail);

    // Remove after animation
    setTimeout(() => {
      trail.remove();
      trails.shift();
    }, 800);

    // Limit trail count
    if (trails.length > maxTrails) {
      trails[0].remove();
      trails.shift();
    }
  };

  document.addEventListener('mousemove', handleMouseMove);
  return () => document.removeEventListener('mousemove', handleMouseMove);
}, []);
```
```css
.cursor-trail {
  position: fixed;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(50, 205, 50, 0.4); /* Lime green */
  pointer-events: none;
  animation: trail-fade 0.8s ease-out forwards;
  z-index: 9999;
}

@keyframes trail-fade {
  0% { opacity: 0.6; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.3); }
}
```

**Page Transitions Feel Slightly Too Smooth**:
```javascript
// React Router with custom transition timing
<AnimatePresence mode="wait">
  <motion.div
    key={location.pathname}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{
      duration: 0.6, // Slightly slower than normal (0.3-0.4s)
      ease: [0.43, 0.13, 0.23, 0.96] // Custom easing (uncanny smooth)
    }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

**Occasional Screen Pulse (Breathing)**:
```css
/* Applied to root element */
html {
  animation: screen-breathe 8s ease-in-out infinite;
}

@keyframes screen-breathe {
  0%, 100% {
    filter: brightness(1.0);
    transform: scale(1.0);
  }
  50% {
    filter: brightness(0.98);
    transform: scale(1.002);
  }
}
```
- Very subtle (most users won't consciously notice)
- Entire viewport pulses like breathing
- 8-second cycle (slow, organic rhythm)

**Random Rare Events** (1% chance on page load):
```javascript
useEffect(() => {
  const triggerRareEvent = () => {
    const rand = Math.random();

    if (rand < 0.01) { // 1% chance
      const events = [
        () => showEyeInCorner(), // Extra eye appears for 0.5s
        () => darkenBackground(), // Background shifts 5% darker for 2s
        () => playWhisper(), // Faint "welcome to the rancch..."
      ];

      const event = events[Math.floor(Math.random() * events.length)];
      event();
    }
  };

  triggerRareEvent();
}, [pathname]); // Trigger on navigation
```

**Interactive Feedback**:
```css
/* Product card breathing */
.product-card:hover .product-image {
  animation: breathe 3s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% { transform: scale(1.0); }
  50% { transform: scale(1.02); }
}

/* Cart icon wiggle (asymmetric) */
.cart-icon.has-items {
  animation: wiggle-wrong 0.6s ease-in-out;
}

@keyframes wiggle-wrong {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-5deg) translateX(-2px); }
  75% { transform: rotate(3deg) translateX(1px); } /* Asymmetric */
}

/* Discount badge pulse (heartbeat) */
.discount-badge {
  animation: heartbeat-pulse 1.2s ease-in-out infinite;
}

@keyframes heartbeat-pulse {
  0%, 100% { transform: scale(1); }
  14% { transform: scale(1.1); }
  28% { transform: scale(1); }
  42% { transform: scale(1.08); }
  56% { transform: scale(1); }
}
```

#### Technical Implementation Checklist

**CSS Animations**:
- [x] Keyframe animations for stars, shadows, breathing
- [x] Custom easing curves for "uncanny" timing
- [ ] GPU-accelerated transforms (use `will-change` sparingly)

**React State Management**:
- [x] Random event triggers (useEffect with intervals) - stars, barn light, shadows
- [ ] Rare event probability checks (Math.random())
- [x] Cleanup intervals on unmount

**Web Audio API** (Future Phase):
- [ ] Ambient sound loops (crickets, wind) - OMITTED IN MVP
- [ ] Random sound effects (whispers, calls) - OMITTED IN MVP
- [ ] User mute controls (localStorage preference) - OMITTED IN MVP
- [ ] Volume controls (start at 15-30%) - OMITTED IN MVP

**Performance Considerations**:
- [x] Limit concurrent animations (max 5-10 at once)
- [x] Use `requestAnimationFrame` for cursor trail (via useCursorTrail hook)
- [x] Respect `prefers-reduced-motion` media query:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## ⚠️ DEPLOYMENT MANDATE - READ FIRST

**Production URL:** `https://caterpillar-ranch.lando555.workers.dev/`

**CRITICAL RULES:**
1. ⛔ **NEVER use `npm run deploy`, `wrangler deploy`, or `wrangler publish`**
2. ✅ **ALL deployments go through GitHub push → Cloudflare auto-build**
3. ⏸️ **ALWAYS wait for user to provide build logs before testing**

**Deployment workflow:**
```bash
git add .
git commit -m "your message"
git push origin main
# ⏸️ STOP - Wait for user's build confirmation before testing!
```

See **"🚨 CRITICAL: Deployment & Testing Protocol"** section below for full details.

---

## Common Commands

### Development (Local Only - No Deploy)
```bash
npm run dev              # Start local development server (uses React Router dev server)
npm run typecheck        # Run TypeScript checks (includes Cloudflare types generation)
npm run cf-typegen       # Generate Cloudflare Workers types from wrangler.jsonc
wrangler dev             # Test with Workers runtime locally (no deploy)
```

### Building (No Deploy)
```bash
npm run build            # Build for production (does NOT deploy)
npm run preview          # Build and preview locally (does NOT deploy)
```

### ❌ Prohibited Commands
```bash
npm run deploy           # ❌ DO NOT USE - Deploy via git push only
wrangler deploy          # ❌ DO NOT USE - Deploy via git push only
wrangler publish         # ❌ DO NOT USE - Deploy via git push only
```

## Architecture

### Entry Points
- **`workers/app.ts`**: Main Worker entry point. Hono app that catches all requests and routes them appropriately
  - API routes should be added here before the catch-all `app.get("*")` handler
  - The catch-all handler delegates to React Router's request handler for SSR

- **`app/root.tsx`**: React app root component
  - Defines the base HTML layout via `Layout` component
  - Includes global error boundary
  - Loads Google Fonts (Inter) via `links` function

- **`app/entry.server.tsx`**: SSR entry point
  - Handles server-side rendering using `renderToReadableStream`
  - Implements bot detection for proper SEO (waits for `allReady` for bots)

### Routing
- **`app/routes.ts`**: Route configuration file using React Router v7's file-based routing
  - Routes are defined using `@react-router/dev/routes` helpers
  - Currently has index route pointing to `routes/home.tsx`
  - Add new routes here using React Router's route config API

### Configuration Files
- **`wrangler.jsonc`**: Cloudflare Workers configuration
  - Defines Worker name, compatibility date, and main entry point
  - Configure bindings (KV, R2, D1, etc.) here
  - Environment variables go in `vars` section (use secrets for sensitive data)

- **`vite.config.ts`**: Vite build configuration with plugins:
  - `cloudflare()`: Enables Cloudflare Workers integration
  - `tailwindcss()`: Tailwind CSS v4 support
  - `reactRouter()`: React Router SSR integration
  - `tsconfigPaths()`: Enables TypeScript path mapping

- **`react-router.config.ts`**: React Router specific config
  - SSR is enabled (`ssr: true`)
  - Uses unstable Vite environment API

### Key Patterns

**Adding API Routes:**
Add Hono routes in `workers/app.ts` BEFORE the catch-all handler:
```typescript
// Example: Add this before app.get("*")
app.get("/api/example", (c) => {
  return c.json({ message: "Hello from API" });
});
```

**Adding Frontend Routes:**
1. Create route file in `app/routes/` directory
2. Register in `app/routes.ts` using React Router config helpers
3. Routes automatically get SSR support

**Accessing Cloudflare Bindings:**
In React Router loaders/actions, bindings are available via `context.cloudflare.env`:
```typescript
export async function loader({ context }) {
  const value = context.cloudflare.env.MY_KV.get("key");
  return { value };
}
```

**Using the Cart System (Phase 2):**
```typescript
// In any component, access cart via context
import { useCart } from '~/lib/contexts/CartContext';

export default function MyComponent() {
  const { cart, totals, addToCart, removeFromCart } = useCart();

  // Add item to cart with optional discount
  await addToCart(product, variantId, quantity, earnedDiscount);

  // Access cart state
  console.log(totals.total); // Final price after discounts
  console.log(totals.effectiveDiscountPercent); // Actual % (capped at 40)
  console.log(cart.items); // All cart items
  console.log(cart.discounts); // All earned discounts

  // Remove item
  await removeFromCart(itemId);

  // Update quantity
  await updateQuantity(itemId, newQuantity);
}
```

**Cart Provider Setup** (already configured in `app/root.tsx`):
```typescript
import { CartProvider } from '~/lib/contexts/CartContext';

export default function App() {
  return (
    <CartProvider>
      {/* Your app components */}
    </CartProvider>
  );
}
```

**TypeScript Types:**
- Run `npm run cf-typegen` after modifying `wrangler.jsonc` to update Cloudflare types
- `worker-configuration.d.ts` is auto-generated and contains Workers type definitions
- Run full typecheck with `npm run typecheck` which generates all types and checks them

**Integrating with Printful API:**
- Printful API v2 base URL: `https://api.printful.com/v2`
- Authentication via private token (Bearer token in Authorization header)
- Complete OpenAPI schema available in `DO-NOT-DELETE/printful-schema.json`
- Key endpoints: catalog products, order creation/estimation, shipping rates, webhooks
- Orders must be created in `draft` state first, then confirmed
- The schema includes detailed examples for order estimation, catalog browsing, and shipment tracking

### Styling
- Uses **Tailwind CSS v4** (configured via `@tailwindcss/vite` plugin)
  - **No separate `tailwind.config.ts` file** - configuration is inline in `app/app.css` using `@theme` directive
  - Custom colors defined directly in CSS using CSS custom properties
  - Utility classes generated automatically from theme
- Global styles in `app/app.css` (403 lines)
- ShadCN UI components manually added (no `components.json` file)
- Utility-first approach with Tailwind classes
- **Reference the UI mock** in `DO-NOT-DELETE/ui-mock.tsx` for:
  - Complete component examples (product cards, navigation, modals)
  - Animation patterns (breathing effect, eye blinks, colony growth)
  - Color schemes (lime-400, pink-500, cyan-400, purple-900)
  - Layout patterns (clipping masks, drip effects, floating mascots)
  - Interactive states (hover effects, acceptance animations)

---

## 📦 Actual Component Structure & File Inventory

**Last Verified**: 2025-01-15
**Total Files**: 37 TypeScript files, 4,049 lines of code

### Application Routes
```
app/routes/
├── home.tsx (184 lines) - Homepage with product grid
│   ├── Integrates CartIcon and CartDrawer
│   ├── Product card grid with hover animations
│   ├── Navigation to product detail pages
│   └── Uses Framer Motion for animations
├── product.tsx (388 lines) - Dedicated product detail page
│   ├── Full-page product view at /products/:slug
│   ├── Size and quantity selection UI
│   ├── Game modal integration (play to earn discount)
│   ├── Add to cart with discount application
│   ├── Particle burst animation on success
│   ├── Auto-navigation back to homepage after add
│   ├── SEO meta tags (Open Graph, Twitter Card)
│   └── Uses CartContext for state management
└── routes.ts (7 lines) - Route configuration
    ├── index("routes/home.tsx")
    └── route("products/:slug", "routes/product.tsx")
```

### Environmental Horror Components (Phase 1.3)
```
app/lib/components/
├── NightSky.tsx (63 lines)
│   └── Generates 75 random stars with blinking animation
│   └── Uses React state for star positions/timings
│   └── Respects prefers-reduced-motion
├── BarnLight.tsx (16 lines)
│   └── CSS-only flickering light effect
│   └── Animation defined in app.css (.barn-light class)
├── GardenShadows.tsx (16 lines)
    └── CSS-only vignette shadows
    └── Animation defined in app.css (.garden-shadows class)
```

### Product Components (Phase 1.4)
```
app/lib/components/
└── ProductModal.tsx (321 lines) - Full-featured responsive modal
    ├── Desktop: Uses Dialog component (Radix UI)
    ├── Mobile: Uses Drawer component (Vaul)
    ├── Size selection with visual states
    ├── Quantity controls (1-99 validation)
    ├── Add to Cart with loading/success states
    ├── Framer Motion animations
    └── Toast notifications via Sonner
```

### Cart System Components (Phase 2)
```
app/lib/components/
├── CartIcon.tsx (112 lines)
│   ├── Fixed position top-right corner
│   ├── Shopping bag SVG icon
│   ├── Item count badge with spring animation
│   ├── Wiggle animation on item add (wiggle-wrong from app.css)
│   ├── Heartbeat pulse on hover
│   ├── Discount percentage indicator
│   └── Framer Motion AnimatePresence for badge
├── CartDrawer.tsx (264 lines)
│   ├── Built with Vaul drawer library
│   ├── Responsive drawer from right/bottom
│   ├── Cart items list with thumbnails
│   ├── Quantity controls (+/- buttons, remove)
│   ├── Empty state with horror messaging
│   ├── Totals breakdown (subtotal, discount, total)
│   ├── 40% discount cap warning badge
│   ├── "Proceed to Harvest" checkout button (placeholder)
│   └── Framer Motion layout animations
└── ParticleBurst.tsx (127 lines)
    ├── Canvas-based particle system
    ├── 40 particles per burst
    ├── Physics simulation (velocity, gravity)
    ├── Color palette: lime, cyan, pink
    ├── Triggered on successful cart add
    └── requestAnimationFrame for 60fps

### UI Primitives (shadcn/ui - manually added)
```
app/lib/components/ui/
├── button.tsx (59 lines)
│   ├── Variants: default, destructive, outline, secondary, ghost, link, horror
│   ├── Sizes: default, sm, lg, icon
│   ├── Uses class-variance-authority for variants
│   └── Custom horror theme colors (ranch-cyan, ranch-lime, ranch-pink)
├── badge.tsx (40 lines)
│   ├── Variants: default, secondary, destructive, outline, success, ghost
│   ├── Includes heartbeat-pulse animation class
│   └── Used for RAPID-FIRE indicators and product tags
├── dialog.tsx (120 lines)
│   ├── Built on @radix-ui/react-dialog
│   ├── Used for desktop modals
│   ├── Includes DialogOverlay, DialogContent, DialogHeader, etc.
│   └── Only lucide-react icon used: X (close button)
└── drawer.tsx (116 lines)
    ├── Built on vaul library
    ├── Used for mobile bottom sheets
    └── Includes DrawerOverlay, DrawerContent, DrawerHeader, etc.
```

**Note**: No `components.json` file exists. ShadCN components were added manually, not via CLI.

### Hooks
```
app/lib/hooks/
├── useCursorTrail.ts (58 lines)
│   ├── Creates lime-green fading cursor trail
│   ├── Max 15 trails at once (memory management)
│   ├── 800ms fade-out animation
│   ├── Respects prefers-reduced-motion
│   └── Used in app/root.tsx
├── useRareEvents.ts (43 lines) - Phase 1.5
│   ├── 1% chance on navigation (location.pathname change)
│   ├── Returns RareEventType: 'eye' | 'darken' | 'whisper' | null
│   ├── Auto-clears event after 1.5-2s duration
│   └── Used in app/root.tsx to trigger EyeInCorner, BackgroundBlur
├── useMediaQuery.ts (34 lines)
│   ├── Generic media query hook
│   ├── Uses window.matchMedia with change listener
│   ├── Returns boolean for query match
│   └── Usage: useMediaQuery('(min-width: 768px)')
└── useReducedMotion.ts (31 lines)
    ├── Detects user's prefers-reduced-motion preference
    ├── Uses window.matchMedia('(prefers-reduced-motion: reduce)')
    ├── Returns boolean for accessibility
    └── Can be used to disable/simplify animations
```

### Constants & Configuration
```
app/lib/constants/
├── colors.ts (80 lines)
│   ├── COLORS object with primary/accent/purple/neutral palettes
│   ├── CSS_VARS for stylesheet integration
│   └── TAILWIND_COLORS for utility class generation
└── horror-copy.ts (145 lines)
    ├── HORROR_COPY object with themed UI text
    ├── Cart, checkout, order, loading, games, errors sections
    ├── Helper functions: getRandomLoadingMessage(), getRandomWhisper()
    └── Used throughout app for consistent horror aesthetic
```

### Types
```
app/lib/types/
├── product.ts (48 lines)
│   ├── ProductSize type ('S' | 'M' | 'L' | 'XL' | 'XXL')
│   ├── ProductVariant interface
│   ├── Product interface
│   └── ProductFilters interface
└── cart.ts (116 lines) - Phase 2
    ├── CartItem interface (with product, variant, quantity, earnedDiscount)
    ├── Discount interface (with gameType, expiry, applied state)
    ├── Cart interface (items + discounts)
    ├── CartSession interface (for KV storage - Phase 3)
    ├── CartTotals interface (with 40% cap calculation)
    ├── CartAction union type (8 action types for reducer)
    ├── CartContextValue interface (provider API)
    └── CartItemWithPrice helper type
```

### Cart Context (Phase 2)
```
app/lib/contexts/
└── CartContext.tsx (383 lines)
    ├── CartProvider component wrapping app
    ├── useReducer for state management (cartReducer)
    ├── 8 action types: ADD_ITEM, REMOVE_ITEM, UPDATE_QUANTITY,
    │   APPLY_DISCOUNT, REMOVE_DISCOUNT, ADD_DISCOUNT,
    │   CLEAR_CART, LOAD_CART, SYNC_FROM_SERVER
    ├── localStorage persistence:
    │   - Auto-save cart on every change
    │   - Auto-load on mount
    │   - Key: 'caterpillar-ranch-cart'
    ├── calculateTotals() function:
    │   - Calculates subtotal, discount, total
    │   - Enforces 40% maximum discount cap
    │   - Returns effectiveDiscountPercent
    ├── Cart actions (async functions):
    │   - addToCart, removeFromCart, updateQuantity
    │   - applyDiscount, removeDiscount, addDiscount
    │   - clearCart, syncToServer, syncFromServer
    ├── Server sync placeholders (Phase 3):
    │   - syncToServer() - TODO
    │   - syncFromServer() - TODO
    └── useCart() hook for consuming components
```

### Mock Data
```
app/lib/mocks/
└── products.ts (117 lines)
    ├── mockProducts array (4 products: CR-PUNK, CR-ROCK, CR-WEIRD, CR-ANIME)
    ├── Helper functions:
    │   ├── getProductById(id: string)
    │   ├── getProductBySlug(slug: string)
    │   ├── getRapidFireProducts()
    │   ├── getProductsByTags(tags: string[])
    │   └── getInStockVariants(productId: string)
    └── Used in app/routes/home.tsx loader
```

### Utilities
```
app/lib/
└── utils.ts (6 lines)
    └── cn() function - Merges Tailwind classes using clsx + tailwind-merge
    └── Used in all shadcn/ui components
```

### Core Application Files
```
app/
├── root.tsx (134 lines)
│   ├── Layout component with HTML shell
│   ├── SVG filter definitions for drip effect
│   ├── Sonner Toaster for toast notifications
│   ├── App component wraps everything in CartProvider
│   ├── Integrates environmental horror components:
│   │   - NightSky, BarnLight, GardenShadows
│   │   - EyeInCorner, BackgroundBlur (rare events)
│   ├── useCursorTrail hook
│   ├── useRareEvents hook (1% navigation trigger)
│   └── Global error boundary with horror messaging
├── entry.server.tsx (43 lines)
│   ├── SSR implementation
│   ├── Bot detection (isbot library)
│   └── Streaming with renderToReadableStream
└── app.css (403 lines)
    ├── Tailwind v4 @theme directive with custom colors
    ├── Custom animations: breathing, heartbeat-pulse, wiggle-wrong, star-blink
    ├── Environmental horror CSS: barn-light, garden-shadows, cursor-trail
    ├── Modal animations: backdrop-fade-in, modal-slide-up
    └── Accessibility: prefers-reduced-motion support
```

### Static Assets
```
public/
├── favicon.ico (15 KB)
└── products/
    ├── CR-ANIME.png (708 KB) - White shirt, kawaii style
    ├── CR-PUNK.png (292 KB) - Dark gray, aggressive style
    ├── CR-ROCK.png (500 KB) - Stone gray, vintage style
    └── CR-WEIRD.png (505 KB) - Lavender, cute+creepy style
```

### Testing
```
/ (root)
└── test-modal.mjs (153 lines)
    ├── Playwright test script
    ├── Tests modal open/close, size selection, quantity controls
    ├── Tests Add to Cart flow, mobile responsive layout
    ├── Generates 8 screenshot files
    └── Run with: node test-modal.mjs
```

---

## 🔌 Dependencies Usage Matrix

**Actually Used** (verified via grep):

| Package | Version | Used In | Import Count | Purpose |
|---------|---------|---------|--------------|---------|
| **framer-motion** | ^12.23.24 | 2 files | 2 imports | ProductModal.tsx, home.tsx animations |
| **@radix-ui/react-dialog** | ^1.1.15 | 1 file | 1 import | ui/dialog.tsx component |
| **@radix-ui/react-slot** | ^1.2.3 | 1 file | 1 import | ui/button.tsx asChild prop |
| **vaul** | ^1.1.2 | 1 file | 1 import | ui/drawer.tsx mobile sheets |
| **sonner** | ^2.0.7 | 2 files | 2 imports | root.tsx (Toaster), ProductModal.tsx (toast) |
| **lucide-react** | ^0.545.0 | 1 file | 1 import | ui/dialog.tsx (X icon ONLY) |
| **clsx** | ^2.1.1 | 1 file | 1 import | utils.ts cn() function |
| **tailwind-merge** | ^3.3.1 | 1 file | 1 import | utils.ts cn() function |
| **class-variance-authority** | ^0.7.1 | 2 files | 2 imports | ui/button.tsx, ui/badge.tsx variants |
| **@playwright/test** | ^1.56.0 | 1 file | 1 import | test-modal.mjs (dev dependency) |

**Installed But NOT Used** (ready for future phases):

| Package | Version | Status |
|---------|---------|--------|
| **@radix-ui/react-select** | ^2.2.6 | ❌ Not imported anywhere - ready for future Select component |

**Framer Motion Usage Details**:
- Only used in 2 files (home.tsx, ProductModal.tsx)
- Animations: spring physics, breathing effect, stagger children
- Features: `motion.div`, `AnimatePresence`, `whileHover`, `whileTap`
- Bundle impact: ~50kb gzipped

**Lucide React Usage**:
- Only ONE icon used: `X` (close button in dialog)
- Could be replaced with custom SVG to reduce bundle size
- Current usage justified for consistency with shadcn/ui

### Static Assets
- Place static files in `public/` directory
- Assets are served automatically by the build system
- Favicon is already configured in `public/favicon.ico`

## Important Files & Directories

### DO-NOT-DELETE/
This directory contains critical reference materials:
- **`ui-mock.tsx`**: Complete React component showcasing the full UI design
  - 1040 lines of production-ready component code
  - Includes all screens: home, cart, checkout, game modal
  - Animation systems: breathing, blinking, colony growth, acceptance
  - All interactive patterns and state management
  - **Use this as the source of truth for UI implementation**
- **`printful-schema.json`**: Full Printful API v2 OpenAPI specification (591KB)
  - Complete endpoint documentation with examples
  - Request/response schemas for all operations
  - Migration guide from v1 to v2
  - Use cases for order management, catalog integration

### Core Application Structure
- `workers/app.ts`: Main entry point - add API routes here before the catch-all
- `app/routes.ts`: Route configuration using React Router v7
- `app/root.tsx`: Layout component with global error boundary
- `app/entry.server.tsx`: SSR configuration with bot detection
- `wrangler.jsonc`: Cloudflare Workers config (bindings, env vars, observability)

## Architecture Decisions & Patterns

### API Integration (Printful)
Add Printful API routes in `workers/app.ts` before the catch-all handler:
```typescript
// Catalog endpoints
app.get("/api/catalog/products", async (c) => { /* fetch from KV cache or Printful */ });
app.get("/api/catalog/products/:id", async (c) => { /* product details */ });

// Order management
app.post("/api/orders/estimate", async (c) => { /* order estimation */ });
app.post("/api/orders", async (c) => { /* create draft order */ });
app.post("/api/orders/:id/confirm", async (c) => { /* confirm order */ });

// Webhooks
app.post("/api/webhooks/printful", async (c) => { /* handle Printful events */ });
```

**Authentication:**
- Store Printful API token in `wrangler.jsonc` vars (dev) or Cloudflare secrets (production)
- Access via `c.env.PRINTFUL_API_TOKEN` in Hono handlers
- Use Bearer token: `Authorization: Bearer ${token}`

### Caching Strategy (KV Storage)
**Add KV namespace to `wrangler.jsonc`:**
```jsonc
{
  "kv_namespaces": [
    { "binding": "CATALOG_CACHE", "id": "your-kv-namespace-id" }
  ]
}
```

**Caching patterns:**
- **Product listings**: Cache for 1 hour (catalog changes infrequently)
- **Product variants**: Cache for 6 hours (rarely change)
- **Shipping rates**: Cache for 4 hours per destination
- **Cache keys**: `catalog:products:list`, `catalog:product:{id}`, `shipping:{hash}`
- **Invalidation**: Webhook handler clears cache on Printful catalog updates

**Why KV?**
- Reduces Printful API calls (120 req/min rate limit)
- Edge caching = 5ms vs 200ms API latency
- Lower costs (KV reads are cheap)

### State Management

**Shopping Cart (Hybrid Approach):**
1. **Client-side (localStorage)**: Guest browsing, instant UX
   - Store: product IDs, quantities, custom designs
   - Limitation: Lost on browser clear, no cross-device sync

2. **Server-side (KV + session tokens)**: When user starts game or earns discount
   - Generate session token (UUID), store in cookie (30-min TTL)
   - KV key: `cart:{sessionToken}` → cart data + earned discounts
   - Enables: abandoned cart recovery, cross-device for logged-in users

**Discount/Game Progress (Server-side):**
- Store per-session: `session:{token}:discounts` → array of earned discounts
- Track: product ID, discount %, earned timestamp, game type
- Apply at checkout, validate server-side (prevent client manipulation)

**User Authentication (Phased Approach):**
- **Phase 1 (MVP)**: Guest checkout only
  - Collect email for order confirmation
  - Session tokens for game discounts (no account needed)
  - Simpler to build, lower friction

- **Phase 2**: Optional accounts
  - Order history, saved discount progress, leaderboard participation
  - Use Cloudflare Access or custom auth with D1 database
  - Printful orders work fine without user accounts

### SSR Strategy
- **Product pages**: Full SSR with meta tags (SEO for Google Shopping, social shares)
- **Home/catalog**: SSR with streaming for fast TTFB
- **Cart/checkout**: Client-side rendering (no SEO value)
- **Bot detection**: Already configured in `app/entry.server.tsx` (waits for `allReady`)

### Webhook Handling
Printful webhooks notify about order status, catalog changes, stock updates:

```typescript
app.post("/api/webhooks/printful", async (c) => {
  // 1. Verify webhook signature (Printful signs requests)
  const signature = c.req.header("X-Printful-Signature");
  const isValid = await verifySignature(signature, await c.req.text());
  if (!isValid) return c.json({ error: "Invalid signature" }, 401);

  // 2. Handle event types
  const event = await c.req.json();
  switch (event.type) {
    case "order_updated":
      // Update order status in DB
      break;
    case "catalog_price_changed":
      // Invalidate KV cache
      await c.env.CATALOG_CACHE.delete(`catalog:product:${event.data.id}`);
      break;
  }

  return c.json({ received: true });
});
```

**Setup in Printful dashboard:**
- URL: `https://your-worker.workers.dev/api/webhooks/printful`
- Events: `order_created`, `order_updated`, `catalog_price_changed`, `stock_updated`
- Store webhook secret in Cloudflare secrets for signature verification

### Mobile-First Design
- Primary viewport: 320px - 428px (iPhone SE to iPhone Pro Max)
- UI mock is designed for mobile (`max-w-md` container)
- Desktop: Center the mobile viewport, don't stretch beyond 448px
- Test on: Chrome DevTools mobile emulation, real devices

### Custom Uploads Flow
In addition to Printful mockups:
1. User uploads image → Store in R2 bucket (Cloudflare Object Storage)
2. Generate preview using Printful's mockup generation API
3. Pass R2 URL to Printful in order `layers[].url` field
4. Validate: file size (<10MB), format (PNG/JPG), dimensions (meet Printful requirements)

**Add R2 bucket to `wrangler.jsonc`:**
```jsonc
{
  "r2_buckets": [
    { "binding": "UPLOADS", "bucket_name": "caterpillar-uploads" }
  ]
}
```

## Feature Implementation Notes

### From UI Mock (DO-NOT-DELETE/ui-mock.tsx)
The mock demonstrates complete implementations - use as reference, not direct copy:

**Keep & Implement:**
- ✅ Gamification mechanics (discount games at product view and checkout)
- ✅ Daily challenges with progress tracking (server-side state)
- ✅ Discount rewards (20-40% range, tracked per-order)
- ✅ Color scheme as inspiration (dark mode is mandatory, accent colors flexible)
- ✅ Mobile-first responsive layout patterns
- ✅ Product card designs, modal patterns, navigation structure

**Remove/Simplify:**
- ❌ Colony growth mechanic (caterpillar count increasing over time)
- ❌ Floating mascot infestation (background animations)
- ❌ Slime intensity system (dynamic background changes)
- ⚠️ Drip effects (nice-to-have, not essential)
- ⚠️ Real-time leaderboard (use static placeholder data for MVP)

**Animation Priorities:**
1. **Essential**: Smooth transitions between screens, loading states
2. **High value**: Game interactions, discount reveal animations
3. **Optional**: Breathing effects, eye blinks, acceptance bursts

### Environment Variables Required

Add to `wrangler.jsonc` vars (dev) or Cloudflare Dashboard secrets (prod):
```jsonc
{
  "vars": {
    "VALUE_FROM_CLOUDFLARE": "Hello from Hono/CF"
  }
  // Add secrets via CLI: wrangler secret put PRINTFUL_API_TOKEN
  // - PRINTFUL_API_TOKEN: Your Printful API private token
  // - PRINTFUL_WEBHOOK_SECRET: For webhook signature verification
  // - SESSION_SECRET: For signing session tokens (generate random 32-byte hex)
}
```

### Database Needs (Phase 2)

**D1 (SQL) for structured data:**
- User accounts (email, created_at, preferences)
- Order history (order_id, user_id, total, status, created_at)
- Game completion tracking (user_id, game_type, discount_earned, product_id, timestamp)

**KV for ephemeral/cache:**
- Product catalog cache
- Session data (cart, discounts)
- Rate limiting counters

**R2 for file storage:**
- User-uploaded designs
- Generated mockup previews (optional cache)

**When to add D1:**
- When you implement user accounts (Phase 2)
- When you need order history/tracking beyond Printful API
- For analytics (game completion rates, popular products)

### Testing Strategy

**Local Development:**
- `npm run dev` starts React Router dev server with HMR
- Mock Printful API responses initially (avoid rate limits)
- Use `wrangler dev --remote` for testing with real Cloudflare bindings (KV, R2)

**Integration Testing:**
- Test webhook handlers with Printful's webhook testing tool
- Verify order flow: catalog → cart → estimate → draft → confirm
- Test file uploads to R2, ensure Printful accepts R2 URLs

**Production Checklist:**
- [ ] KV namespace created and bound
- [ ] R2 bucket created and bound
- [ ] Printful API token stored as secret
- [ ] Webhook secret configured
- [ ] Custom domain configured (for webhook callbacks)
- [ ] Observability enabled (already in wrangler.jsonc)

## Frontend-First Development Strategy

### Why Frontend-First for This Project?
The backend is well-defined by the Printful API schema, but the UX/styling is the differentiator. This approach allows:
- ✅ Design iteration without backend complexity
- ✅ Stakeholder approval on look & feel before integration
- ✅ Parallel work: frontend polish + backend integration
- ✅ Faster feedback loops

### Phase 1: Static Frontend (No Backend) - **START HERE**

**Goal**: Build and approve the entire UI with mock data before touching Printful API.

**Setup:**
1. Create mock data files in `app/lib/mocks/`
```typescript
// app/lib/mocks/products.ts
export const mockProducts = [
  {
    id: "1",
    name: "Crisis Cat",
    price: 35,
    design: "😿",
    modelColor: "pink",
    isRapidFire: true,
    variants: [
      { id: "v1", size: "M", color: "Black", inStock: true },
      { id: "v2", size: "L", color: "White", inStock: true }
    ]
  },
  // ... more products
];

// app/lib/mocks/cart.ts
export const mockCart = { items: [...], total: 58.25 };

// app/lib/mocks/challenges.ts
export const mockDailyChallenge = { progress: 1, goal: 3, reward: 25 };
```

2. Build all routes using mock data:
```typescript
// app/routes/home.tsx
import { mockProducts, mockDailyChallenge } from "~/lib/mocks";

export async function loader() {
  // NO API CALLS - just return mocks
  return { products: mockProducts, challenge: mockDailyChallenge };
}
```

3. Implement all screens:
   - Home (product grid, daily challenge, leaderboard)
   - Product detail modal with game mechanic
   - Cart with discount display
   - Checkout with final game offer
   - Order confirmation (mock success)

4. Add client-side state for interactivity:
```typescript
// Use React state for cart, game completions, discounts
const [cart, setCart] = useState(mockCart);
const [earnedDiscounts, setEarnedDiscounts] = useState([]);
```

**Advantages:**
- `npm run dev` has instant HMR (no API latency)
- Designers/stakeholders can review real UI immediately
- No Printful API rate limits during iteration
- Can deploy to Cloudflare Pages for review (separate from Worker)

**Deliverable**: Fully functional UI that "works" end-to-end with fake data.

---

### Phase 2: API Integration Planning (Before Implementation)

**Goal**: Define the exact API contract before coding.

Create an API spec file:
```typescript
// app/lib/api/types.ts - Define YOUR app's API (not Printful's)
export interface CatalogProduct {
  id: string;
  name: string;
  price: number;
  variants: ProductVariant[];
  mockupUrl: string;
}

export interface CartSession {
  sessionToken: string;
  items: CartItem[];
  earnedDiscounts: Discount[];
  expiresAt: string;
}

// Define all endpoints YOUR frontend will call:
// GET  /api/catalog/products
// GET  /api/catalog/products/:id
// POST /api/cart/add
// POST /api/games/complete
// POST /api/orders/estimate
// POST /api/orders/create
// POST /api/orders/:id/confirm
```

**Mock the API responses:**
```typescript
// app/lib/mocks/api-responses.ts
export const mockApiResponses = {
  "/api/catalog/products": { data: mockProducts, cached: true },
  "/api/cart/session": { sessionToken: "mock-token-123", items: [] },
  // ... all endpoints
};
```

**Create a mock API layer:**
```typescript
// app/lib/api/client.ts
const USE_MOCKS = import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API;

export async function fetchProducts() {
  if (USE_MOCKS) {
    await delay(300); // Simulate network
    return mockApiResponses["/api/catalog/products"];
  }
  const res = await fetch("/api/catalog/products");
  return res.json();
}
```

**Update routes to use the API client:**
```typescript
// app/routes/home.tsx
import { fetchProducts } from "~/lib/api/client";

export async function loader() {
  // Will use mocks in dev, real API when VITE_USE_REAL_API=true
  const products = await fetchProducts();
  return { products };
}
```

**Deliverable**: Frontend code is "backend-ready" but still runs with mocks.

---

### Phase 3: Backend Integration (After Frontend Approval)

**Goal**: Wire up real Printful API without changing frontend code.

1. **Implement API routes** in `workers/app.ts`:
```typescript
app.get("/api/catalog/products", async (c) => {
  // Check KV cache first
  const cached = await c.env.CATALOG_CACHE.get("products:list");
  if (cached) return c.json(JSON.parse(cached));

  // Fetch from Printful
  const res = await fetch("https://api.printful.com/v2/catalog-products", {
    headers: { Authorization: `Bearer ${c.env.PRINTFUL_API_TOKEN}` }
  });
  const data = await res.json();

  // Transform Printful schema to YOUR app's schema
  const products = transformPrintfulProducts(data);

  // Cache and return
  await c.env.CATALOG_CACHE.put("products:list", JSON.stringify(products), {
    expirationTtl: 3600
  });
  return c.json(products);
});
```

2. **Transform Printful data** to match your frontend types:
```typescript
// workers/lib/transformers.ts
function transformPrintfulProducts(printfulData) {
  return printfulData.data.map(p => ({
    id: p.id.toString(),
    name: p.name,
    price: parseFloat(p.price), // Printful returns strings
    mockupUrl: p.image,
    // ... map to YOUR CatalogProduct interface
  }));
}
```

3. **Enable real API** in development:
```bash
# Terminal 1: Start frontend with real API flag
VITE_USE_REAL_API=true npm run dev

# Terminal 2: Start Workers for API endpoints
wrangler dev --port 8788
```

4. **Proxy API requests** in development:
```typescript
// vite.config.ts - Add proxy
export default defineConfig({
  server: {
    proxy: {
      "/api": "http://localhost:8788" // Proxy to wrangler dev
    }
  },
  // ... rest of config
});
```

**Deliverable**: Frontend unchanged, now talking to real Printful via your API.

---

### Phase 4: Testing & Refinement

**Goal**: Validate the full integration.

1. **Test with real Printful sandbox** (if available)
2. **Compare mock vs real data** - ensure transformers work correctly
3. **Test edge cases**: out of stock, API errors, slow responses
4. **Performance**: verify caching works, measure response times

**Deliverable**: Production-ready integration.

---

### Recommended Tooling for Frontend Review

**1. Deploy Frontend-Only Preview (Recommended: Worker with Mocks):**

This keeps your entire stack in Cloudflare Workers - no need to manage separate Pages deployment.

**Setup:**
```jsonc
// wrangler.jsonc
{
  "name": "caterpillar-ranch",
  "compatibility_date": "2025-10-08",
  "main": "./workers/app.ts",
  "vars": {
    "USE_MOCKS": "true",  // Set to "false" or remove for production
    "ENVIRONMENT": "preview"  // Helps frontend show preview banner
  },
  "observability": {
    "enabled": true
  }
}
```

**Implement mock check in Worker:**
```typescript
// workers/app.ts
import { Hono } from "hono";
import { createRequestHandler } from "react-router";

const app = new Hono();

// Helper to check if using mocks
function useMocks(c) {
  return c.env.USE_MOCKS === "true";
}

// Mock data API routes (only active when USE_MOCKS=true)
app.get("/api/catalog/products", async (c) => {
  if (useMocks(c)) {
    return c.json({
      data: [
        {
          id: "1",
          name: "Crisis Cat",
          price: 35,
          design: "😿",
          modelColor: "pink",
          isRapidFire: true,
          mockupUrl: "https://placehold.co/400x500/1a1a1a/32CD32?text=😿",
          variants: [
            { id: "v1", size: "S", color: "Black", inStock: true },
            { id: "v2", size: "M", color: "Black", inStock: true },
            { id: "v3", size: "L", color: "Black", inStock: true }
          ]
        },
        {
          id: "2",
          name: "Pizza Cult",
          price: 32,
          design: "🍕",
          modelColor: "cyan",
          isRapidFire: false,
          mockupUrl: "https://placehold.co/400x500/1a1a1a/00CED1?text=🍕",
          variants: [
            { id: "v4", size: "M", color: "White", inStock: true },
            { id: "v5", size: "L", color: "White", inStock: true }
          ]
        },
        {
          id: "3",
          name: "Overthinking Dino",
          price: 35,
          design: "🦕",
          modelColor: "lime",
          isRapidFire: false,
          mockupUrl: "https://placehold.co/400x500/1a1a1a/32CD32?text=🦕",
          variants: [
            { id: "v6", size: "M", color: "Black", inStock: true }
          ]
        },
        {
          id: "4",
          name: "Caffeine Demon",
          price: 33,
          design: "☕",
          modelColor: "pink",
          isRapidFire: true,
          mockupUrl: "https://placehold.co/400x500/1a1a1a/FF1493?text=☕",
          variants: [
            { id: "v7", size: "L", color: "Black", inStock: true }
          ]
        }
      ],
      meta: { cached: false, source: "mock-data" }
    });
  }

  // Real Printful API (Phase 3)
  // TODO: Implement real API call
  return c.json({ error: "Real API not yet implemented" }, 501);
});

app.get("/api/catalog/products/:id", async (c) => {
  if (useMocks(c)) {
    const id = c.req.param("id");
    // Return single product mock
    return c.json({
      data: {
        id,
        name: "Crisis Cat",
        price: 35,
        description: "For those existential moments. 100% cotton, maximum despair.",
        // ... full product details
      }
    });
  }
  return c.json({ error: "Real API not yet implemented" }, 501);
});

app.post("/api/cart/session", async (c) => {
  if (useMocks(c)) {
    // Generate mock session
    const sessionToken = `mock-session-${Date.now()}`;
    return c.json({
      sessionToken,
      items: [],
      earnedDiscounts: [],
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    });
  }
  return c.json({ error: "Real API not yet implemented" }, 501);
});

app.post("/api/cart/add", async (c) => {
  if (useMocks(c)) {
    const body = await c.req.json();
    return c.json({
      success: true,
      cart: {
        items: [body], // Echo back the added item
        total: body.price * body.quantity
      }
    });
  }
  return c.json({ error: "Real API not yet implemented" }, 501);
});

app.post("/api/games/complete", async (c) => {
  if (useMocks(c)) {
    const body = await c.req.json();
    // Simulate game completion
    const discount = Math.floor(Math.random() * 11) + 20; // 20-30%
    return c.json({
      success: true,
      discount,
      message: "Great job! The RANCCH is pleased! 🐛💚"
    });
  }
  return c.json({ error: "Real API not yet implemented" }, 501);
});

app.post("/api/orders/estimate", async (c) => {
  if (useMocks(c)) {
    return c.json({
      data: {
        subtotal: 67.00,
        discount: -8.75,
        shipping: 0.00,
        tax: 5.85,
        total: 64.10,
        estimatedDelivery: {
          min: "2025-10-20",
          max: "2025-10-25"
        }
      }
    });
  }
  return c.json({ error: "Real API not yet implemented" }, 501);
});

app.post("/api/orders/create", async (c) => {
  if (useMocks(c)) {
    const body = await c.req.json();
    return c.json({
      data: {
        orderId: `mock-order-${Date.now()}`,
        status: "draft",
        total: 64.10,
        createdAt: new Date().toISOString()
      }
    });
  }
  return c.json({ error: "Real API not yet implemented" }, 501);
});

app.post("/api/orders/:id/confirm", async (c) => {
  if (useMocks(c)) {
    const orderId = c.req.param("id");
    return c.json({
      data: {
        orderId,
        status: "confirmed",
        message: "Welcome to the RANCCH! 🐛💚",
        trackingUrl: null,
        estimatedShipDate: "2025-10-18"
      }
    });
  }
  return c.json({ error: "Real API not yet implemented" }, 501);
});

// Catch-all for React Router (SSR)
app.get("*", (c) => {
  const requestHandler = createRequestHandler(
    () => import("virtual:react-router/server-build"),
    import.meta.env.MODE,
  );

  return requestHandler(c.req.raw, {
    cloudflare: { env: c.env, ctx: c.executionCtx },
  });
});

export default app;
```

**Add preview banner to frontend:**
```typescript
// app/root.tsx
import { useLoaderData } from "react-router";

export async function loader({ context }) {
  return {
    environment: context.cloudflare.env.ENVIRONMENT || "production",
    useMocks: context.cloudflare.env.USE_MOCKS === "true"
  };
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useLoaderData<typeof loader>();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {data?.useMocks && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(90deg, #FF1493, #00CED1)',
            color: 'white',
            padding: '8px',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '12px',
            zIndex: 9999,
            borderBottom: '2px solid #32CD32'
          }}>
            🎨 PREVIEW MODE - Using sample data for design review
          </div>
        )}
        <div style={data?.useMocks ? { marginTop: '36px' } : {}}>
          {children}
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
```

**Deployment workflow:**
```bash
# ⚠️ NEVER use `npm run deploy` or `wrangler deploy` directly!
# ALL deployments MUST go through GitHub CI/CD

# For stakeholder review (with mocks):
git add .
git commit -m "feat: add product catalog UI with mock data"
git push origin main
# Cloudflare will auto-deploy to: https://caterpillar-ranch.lando555.workers.dev/

# Share URL with team for approval ✅

# After approval, switch to production mode:
# 1. Edit wrangler.jsonc: set USE_MOCKS to "false" (or remove the var)
# 2. Implement real API routes (Phase 3)
# 3. Commit and push (triggers auto-deploy):
git add .
git commit -m "feat: integrate real Printful API"
git push origin main
```

**Advantages of this approach:**
- ✅ Same deployment target (no Pages vs Workers differences)
- ✅ Tests SSR behavior (same as production)
- ✅ Preview URL has real routing, modals, games
- ✅ Easy toggle: change one var in wrangler.jsonc
- ✅ Clear visual indicator (preview banner)
- ✅ No need to reverse-engineer Pages-specific features
- ✅ When ready for production, just flip USE_MOCKS flag and implement real routes

**2. Visual Regression Testing:**
```bash
# Optional: Add Playwright for screenshot testing
npm install -D @playwright/test

# Test script captures screenshots of all pages
# Compare before/after changes
```

**3. Interactive Prototypes:**
- The static build works without backend at all
- Host on any static hosting for stakeholder review
- Add a banner: "Preview mode - using sample data"

**4. Component Library:**
```bash
# Optional: Add Storybook for isolated component review
npx storybook@latest init

# Build components in isolation:
# - Product card
# - Game modal
# - Cart item
# - Navigation
```

---

### Frontend Development Checklist

**Phase 1 - Static (Approval Target):**
- [ ] Create mock data files (`app/lib/mocks/`)
- [ ] Build all route components with mocks
- [ ] Implement all screens (home, product, cart, checkout)
- [ ] Add game mechanics (client-side state)
- [ ] Implement mobile-responsive design from UI mock
- [ ] Add loading states, transitions, animations
- [ ] Test on multiple devices/browsers
- [ ] **Deploy for stakeholder review** (Cloudflare Pages or Worker with mocks)
- [ ] **GET APPROVAL** ✅

**Phase 2 - API Planning:**
- [ ] Define API contract (`app/lib/api/types.ts`)
- [ ] Create mock API responses
- [ ] Build API client with mock/real toggle
- [ ] Refactor routes to use API client (still runs with mocks)
- [ ] Test that toggle works

**Phase 3 - Backend Integration:**
- [ ] Set up KV namespace
- [ ] Implement API routes in `workers/app.ts`
- [ ] Build Printful data transformers
- [ ] Enable real API in development
- [ ] Test full flow with real data
- [ ] Fix any schema mismatches

**Phase 4 - Production:**
- [ ] Remove mock flags
- [ ] Final testing
- [ ] Deploy to production

---

### Key Principle

> **The frontend should never know or care that Printful exists.**
>
> Your API routes are the abstraction layer. Frontend talks to `/api/catalog/products`, which happens to fetch from Printful behind the scenes. This means:
> - Frontend can be built/tested independently
> - You can swap Printful for another provider without frontend changes
> - Mocking is trivial (just mock your own API)

## 🚨 CRITICAL: Deployment & Testing Protocol

### **STRICT MANDATE - READ FIRST**

**Production URL:** `https://caterpillar-ranch.lando555.workers.dev/`

**Deployment Rules:**
1. ⛔ **NEVER run `npm run deploy` or `wrangler deploy` directly**
2. ✅ **ALL deployments MUST go through GitHub commit/push**
3. ✅ **Cloudflare automatically builds on push to `main` branch**
4. ⏸️ **After pushing, WAIT for user to provide build logs before testing**

### Deployment Workflow (MANDATORY)

**Step 1: Make changes locally**
```bash
# Work on feature
npm run dev  # Local development only
npm run typecheck  # Verify types
```

**Step 2: Commit and push (triggers auto-deploy)**
```bash
git add .
git commit -m "feat: your feature description"
git push origin main

# ⚠️ DO NOT proceed to testing yet!
```

**Step 3: Wait for build confirmation**
```
❌ DO NOT test immediately after push
❌ DO NOT assume build succeeded
✅ WAIT for user to provide Cloudflare build logs
✅ User will confirm: "Build succeeded" or provide error logs
```

**Step 4: Verify build logs (provided by user)**
```
Look for in logs:
✅ "Deployment complete"
✅ "Deployed caterpillar-ranch"
✅ No compilation errors
✅ No missing dependencies
```

**Step 5: Test only after confirmation**
```bash
# Only after user confirms build success:
curl https://caterpillar-ranch.lando555.workers.dev/
# Or visit in browser for manual testing
```

### Testing Protocol

**When to test:**
- ✅ After user provides successful build logs
- ✅ After user explicitly says "ready to test"
- ❌ Never immediately after `git push`
- ❌ Never before build confirmation

**How to test:**
```bash
# API endpoint testing:
curl https://caterpillar-ranch.lando555.workers.dev/api/catalog/products

# Frontend testing:
# Open in browser: https://caterpillar-ranch.lando555.workers.dev/
# Test all screens: home, product modal, cart, checkout
# Verify preview banner shows if USE_MOCKS=true
```

**If build fails:**
1. User will provide error logs
2. Fix issues locally
3. Commit and push again
4. Wait for new build logs
5. Repeat until build succeeds

### Example Session Flow

```
Agent: "I've implemented the product catalog. Committing now..."
Agent: [git add, commit, push]
Agent: "✅ Pushed to GitHub. Awaiting build confirmation."

User: "Build succeeded! Here are the logs: [logs]"

Agent: "Great! Testing now..."
Agent: [curl commands, browser testing]
Agent: "All tests passed! Product catalog is live."
```

### Why This Protocol?

1. **Build verification**: Ensures code compiles before testing
2. **CI/CD best practice**: All deploys traceable via git history
3. **Error detection**: Catches build failures before runtime issues
4. **Team visibility**: All changes visible in GitHub commits

### Local Development (No Deploy)

For rapid iteration without deployment:
```bash
npm run dev              # React Router dev server
wrangler dev            # Local Workers simulation (no deploy)
wrangler dev --remote   # Test with production KV/R2 (no deploy)
```

**Local dev does NOT deploy** - it's safe for experimentation.

---

## Development Workflow

### Initial Setup
```bash
# Install dependencies
npm install

# Generate Cloudflare types
npm run cf-typegen

# Start development server (local only, no deploy)
npm run dev
```

### Creating New Features

**1. Add a new route:**
```bash
# Create route file
touch app/routes/product.tsx

# Register in app/routes.ts
# Add: route("products/:id", "routes/product.tsx")
```

**2. Add an API endpoint:**
Edit `workers/app.ts` and add before the catch-all:
```typescript
app.get("/api/my-endpoint", async (c) => {
  // Access Cloudflare bindings: c.env.MY_KV, c.env.MY_R2
  // Access request: c.req
  return c.json({ success: true });
});
```

**3. Use Cloudflare bindings in routes:**
```typescript
// In app/routes/product.tsx
export async function loader({ context, params }: Route.LoaderArgs) {
  const { env } = context.cloudflare;
  const cached = await env.CATALOG_CACHE.get(`product:${params.id}`);
  // ...
}
```

### Common Gotchas

1. **Types not updating?** Run `npm run typecheck` to regenerate all types
2. **Bindings undefined in dev?**
   - Use `wrangler dev --remote` to test with real Cloudflare resources
   - Or add local test bindings in `wrangler.jsonc` (kv_namespaces with preview_id)
3. **CSS not applying?** Tailwind v4 requires `@import "tailwindcss"` in app.css (already configured)
4. **Worker size limits:**
   - Free tier: 1MB compressed
   - Consider code splitting for large dependencies
   - Use dynamic imports for heavy libraries
5. **Environment variables:**
   - Development: Add to `wrangler.jsonc` vars
   - Production secrets: Use `wrangler secret put SECRET_NAME`
   - Never commit `.env` files (already in .gitignore)

### Debugging

**Local development:**
```bash
npm run dev              # React Router dev server (fast HMR)
wrangler dev            # Full Workers environment (slower, tests bindings)
wrangler dev --remote   # Uses production resources (KV, R2, D1)
```

**View logs:**
```bash
wrangler tail           # Stream production logs
wrangler tail --format pretty
```

**Common console methods work:**
```typescript
console.log("Debug info");    // Shows in wrangler tail
console.error("Error");       // Captured by observability
```

### TypeScript Configuration

The project uses a multi-config setup:
- `tsconfig.json`: Base config, references node and cloudflare configs
- `tsconfig.node.json`: For build tools (Vite config)
- `tsconfig.cloudflare.json`: For Worker code with Cloudflare types
- `worker-configuration.d.ts`: Auto-generated from wrangler.jsonc (run cf-typegen)

Path aliases are supported via `vite-tsconfig-paths` plugin - you can add them in tsconfig.

## Security Considerations

1. **API Token Protection:**
   - NEVER commit Printful tokens to git
   - Use Cloudflare secrets for production
   - Rotate tokens if exposed

2. **Webhook Signature Verification:**
   - Always verify Printful webhook signatures
   - Use constant-time comparison to prevent timing attacks
   - Example: `crypto.subtle.timingSafeEqual()`

3. **User Input Validation:**
   - Validate file uploads (size, type, dimensions)
   - Sanitize custom text for embroidery orders
   - Rate limit game completions to prevent discount abuse

4. **Session Security:**
   - Use httpOnly cookies for session tokens
   - Set secure flag in production (HTTPS)
   - Short TTL (30 minutes) for guest sessions
   - Sign tokens with SESSION_SECRET

5. **CORS Configuration:**
   - Hono CORS middleware for API routes if needed
   - Restrict origins in production (not '*')

## Quick Reference

### Key File Locations
- **Entry point**: `workers/app.ts` (Hono app)
- **Routes config**: `app/routes.ts` (React Router)
- **Route files**: `app/routes/*.tsx`
- **Global styles**: `app/app.css` (Tailwind v4)
- **Layout**: `app/root.tsx` (HTML shell, error boundary)
- **SSR logic**: `app/entry.server.tsx`
- **UI reference**: `DO-NOT-DELETE/ui-mock.tsx`
- **API spec**: `DO-NOT-DELETE/printful-schema.json`
- **Config**: `wrangler.jsonc` (Worker config)
- **Build config**: `vite.config.ts`, `react-router.config.ts`

### Useful Commands Quick List
```bash
npm run dev          # Local development server (no deploy)
npm run build        # Production build (no deploy)
npm run preview      # Local preview of production build (no deploy)
npm run typecheck    # Full TypeScript check + type generation
npm run cf-typegen   # Generate Cloudflare Worker types only
wrangler dev         # Test with Workers runtime locally (no deploy)
wrangler tail        # Stream production logs from live Worker

# ⚠️ DEPLOYMENT COMMANDS - DO NOT USE DIRECTLY
# npm run deploy     # ❌ PROHIBITED - Use git push instead
# wrangler deploy    # ❌ PROHIBITED - Use git push instead
# wrangler publish   # ❌ PROHIBITED - Use git push instead

# ✅ CORRECT DEPLOYMENT METHOD:
git add .
git commit -m "your message"
git push origin main  # Triggers Cloudflare auto-deploy
# Then wait for user to provide build logs before testing
```
