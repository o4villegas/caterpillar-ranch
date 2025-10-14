# Phase 1.5: Interactive Polish & Horror Layer - Implementation Plan

**Goal**: Transform the current functional-but-basic UI into an engaging, unsettling, screenshot-worthy horror e-commerce experience that works beautifully on both desktop and mobile.

**Duration**: ~6-8 hours
**Priority**: HIGH - This is what makes the app unique and memorable

---

## 🎯 Core Objectives

1. **Add advanced interactions** - Hover effects, particle systems, dynamic animations
2. **Implement horror aesthetic** - Rare events, unsettling copy, asymmetric movements
3. **Upgrade component library** - shadcn/ui + Framer Motion for better primitives
4. **Gamification integration** - "Play to Earn Discount" buttons, score displays
5. **Mobile-first optimization** - Sheet drawers, swipe gestures, touch feedback
6. **Performance** - Keep bundle size under 1MB compressed

---

## 📦 Step 1: Install Dependencies (30 min)

### Install Framer Motion
```bash
npm install framer-motion
```

**Why**:
- Advanced animation library (spring physics, gestures, layout animations)
- Declarative API that works great with React
- Built-in viewport detection and scroll animations
- ~50kb gzipped

### Install shadcn/ui Core Dependencies
```bash
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select
npm install class-variance-authority clsx tailwind-merge
npx shadcn@latest init
```

**Configuration** (`components.json`):
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/app.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "app/lib/components/ui",
    "utils": "app/lib/utils"
  }
}
```

### Install Handpicked shadcn Components

Based on review of shadcn/ui library, these components are perfect for our horror e-commerce app:

```bash
# Core modal/overlay components (PRIORITY)
npx shadcn@latest add dialog      # Desktop modals with full accessibility
npx shadcn@latest add drawer      # Mobile bottom sheets (built on Vaul)
npx shadcn@latest add sheet       # Side panels for cart/menu

# Interactive elements (PRIORITY)
npx shadcn@latest add button      # Variants: default, outline, ghost, destructive, link + sizes + loading states
npx shadcn@latest add badge       # Variants: default, secondary, destructive, outline (perfect for RAPID-FIRE)

# Form components (PRIORITY)
npx shadcn@latest add select      # Better than native <select>, supports grouping
npx shadcn@latest add input       # For quantity, email, etc.

# Feedback components (PRIORITY)
npx shadcn@latest add sonner      # Toast notifications (success, error, warning, promise states)
npx shadcn@latest add skeleton    # Loading states with horror-themed animations

# Data display (MEDIUM PRIORITY)
npx shadcn@latest add card        # Product cards with header/content/footer structure

# Nice-to-have (LOW PRIORITY - add later if needed)
npx shadcn@latest add tooltip     # Hover info for size guides, etc.
npx shadcn@latest add popover     # For discount explanations
npx shadcn@latest add alert       # Error messages with horror styling
```

**Why These Components**:

1. **Dialog + Drawer** = Perfect responsive modal system
   - Dialog for desktop (centered overlay)
   - Drawer for mobile (bottom sheet, native feel)
   - Both built on Radix UI = WCAG AA+ accessibility

2. **Button** = 6 variants + 3 sizes + loading states
   - `destructive` variant perfect for "Claim Your Harvest" (horror CTA)
   - `outline` variant for "Play Game" secondary action
   - `ghost` variant for close buttons
   - Built-in loading spinner support

3. **Badge** = Ideal for RAPID-FIRE and discount indicators
   - `destructive` variant = hot pink horror style
   - Can add icons and animations via className
   - Small, unobtrusive design

4. **Sonner** = Modern toast system (better than old Toast component)
   - `toast.promise()` perfect for "Adding to cart..." → "Added! 🐛"
   - `toast.error()` for out of stock warnings
   - Supports custom styling and icons
   - Built-in queue management

5. **Select** = Professional dropdown UI
   - Better than native <select> (styled consistently)
   - Supports grouping (sizes by color)
   - Keyboard navigation built-in
   - Scrollable for long lists

6. **Sheet** = Slide-in panels from any edge
   - Perfect for cart drawer (slide from right)
   - Navigation menu (slide from left)
   - Less intrusive than full modal

7. **Skeleton** = Loading placeholders
   - Customizable shapes (circles, rectangles)
   - Can animate with pulse or shimmer
   - Perfect for horror-themed loading states (pulsing caterpillar)

8. **Card** = Structured product layout
   - Header (RAPID-FIRE badge)
   - Content (image, description)
   - Footer (price, CTA)
   - Easy to add hover effects and animations

### Create Utils Helper
```typescript
// app/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Customize shadcn for Horror Theme

After installing components, customize their default styles:

**File**: `app/lib/components/ui/button.tsx` (after shadcn generates it)

Add horror-themed variants:
```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-bold transition-all",
  {
    variants: {
      variant: {
        default: "bg-ranch-cyan text-ranch-dark hover:bg-ranch-lime",
        destructive: "bg-ranch-pink text-ranch-dark hover:bg-ranch-pink/90 heartbeat-pulse", // Horror CTA
        outline: "border-2 border-ranch-lime text-ranch-lime hover:bg-ranch-lime/10",
        ghost: "hover:bg-ranch-purple/20 text-ranch-cream",
        link: "text-ranch-cyan underline-offset-4 hover:underline",
        horror: "bg-gradient-to-r from-ranch-purple to-ranch-pink text-ranch-cream hover:scale-105", // NEW
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-9 px-4 text-xs",
        lg: "h-14 px-8 text-lg",
        icon: "h-10 w-10",
      },
    },
  }
)
```

**File**: `app/lib/components/ui/badge.tsx`

Horror-themed badge variants:
```typescript
const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold transition-transform",
  {
    variants: {
      variant: {
        default: "bg-ranch-purple/30 text-ranch-cream",
        secondary: "bg-ranch-lavender/30 text-ranch-cream",
        destructive: "bg-ranch-pink text-ranch-dark heartbeat-pulse", // RAPID-FIRE
        outline: "border-2 border-ranch-lime text-ranch-lime",
        success: "bg-ranch-lime text-ranch-dark", // Discount earned
      },
    },
  }
)
```

**File**: `app/app.css`

Add custom Sonner toast styles:
```css
/* Horror-themed toasts */
[data-sonner-toast] {
  background: var(--color-ranch-dark) !important;
  border: 2px solid var(--color-ranch-purple) !important;
  border-radius: 12px !important;
  font-family: var(--font-sans) !important;
}

[data-sonner-toast][data-type="success"] {
  border-color: var(--color-ranch-lime) !important;
  --normal-bg: var(--color-ranch-dark) !important;
  --normal-text: var(--color-ranch-lime) !important;
}

[data-sonner-toast][data-type="error"] {
  border-color: var(--color-ranch-pink) !important;
  --normal-bg: var(--color-ranch-dark) !important;
  --normal-text: var(--color-ranch-pink) !important;
}

[data-sonner-toast][data-type="loading"] {
  border-color: var(--color-ranch-cyan) !important;
}
```

---

## 🎨 Step 2: Upgrade Product Modal (1.5 hours)

### 2.1: Replace Basic Modal with shadcn Dialog + Framer Motion

**File**: `app/lib/components/ProductModal.tsx` (refactor)

**Key Changes**:
- Use shadcn `Dialog` for accessibility
- Add Framer Motion `AnimatePresence` for enter/exit animations
- Implement spring physics for modal slide-up
- Add particle burst on "Add to Cart" success

**Animation Specs**:
```typescript
// Modal enter animation
const modalVariants = {
  hidden: {
    opacity: 0,
    y: 50,
    scale: 0.95,
    rotate: -2 // Slight asymmetry
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300,
      duration: 0.6
    }
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    rotate: 1, // Different exit rotation
    transition: { duration: 0.4 }
  }
}
```

### 2.2: Add Horror-Themed Copy

Replace generic text with horror e-commerce copy:

```typescript
const HORROR_COPY = {
  addToCart: "Claim Your Harvest",
  selectSize: "Choose Your Offering Size",
  quantity: "How Many Shall Join?",
  outOfStock: "The Colony Has Claimed This Size",
  rapidFire: "⚡ RAPID HARVEST",
  color: "Variation:",
  addedSuccess: "Accepted by The Ranch! 🐛",
  loading: [
    "The caterpillars are inspecting...",
    "Quality control in progress...",
    "The colony approves...",
  ]
}
```

### 2.3: Add Particle Burst on Success

Use canvas-based particle system for "acceptance" effect:

```typescript
// app/lib/components/ParticleBurst.tsx
import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export function ParticleBurst({ trigger }: { trigger: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!trigger || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = [];
    const colors = ['#32CD32', '#00CED1', '#FF1493']; // Lime, cyan, pink

    // Create 30-50 particles
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, index) => {
        if (p.life <= 0) {
          particles.splice(index, 1);
          return;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2; // Gravity
        p.life -= 0.02;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x, p.y, 4, 4);
      });

      if (particles.length > 0) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => cancelAnimationFrame(animationId);
  }, [trigger]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
```

---

## 🃏 Step 3: Enhanced Product Cards (1 hour)

### 3.1: Add Card Hover Effects

**File**: `app/routes/home.tsx` (update card rendering)

Use Framer Motion for cards:

```typescript
import { motion } from 'framer-motion';

// In the product grid:
<motion.div
  whileHover={{
    scale: 1.05,
    rotate: 2, // Slight tilt on hover
    transition: { type: "spring", stiffness: 300, damping: 20 }
  }}
  whileTap={{ scale: 0.98 }}
  className="card bg-ranch-purple/20 p-4 relative cursor-pointer"
>
  {/* Glossy highlight overlay */}
  <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
    <motion.div
      initial={{ opacity: 0 }}
      whileHover={{ opacity: 1 }}
      className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent"
    />
  </div>

  {/* Border glow on hover */}
  <motion.div
    initial={{ opacity: 0 }}
    whileHover={{ opacity: 1 }}
    className="absolute -inset-1 bg-gradient-to-r from-ranch-cyan to-ranch-lime rounded-lg blur-sm -z-10"
  />

  {/* Existing card content */}
</motion.div>
```

### 3.2: Add Tiny Eye Pattern Overlay

Add barely-visible eye pattern to product images:

```typescript
// Create SVG pattern
// public/patterns/tiny-eyes.svg
```

```svg
<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
  <circle cx="5" cy="10" r="1.5" fill="#F5F5DC" opacity="0.15"/>
  <circle cx="15" cy="10" r="1.5" fill="#F5F5DC" opacity="0.15"/>
  <circle cx="5" cy="10" r="0.8" fill="#1a1a1a" opacity="0.3"/>
  <circle cx="15" cy="10" r="0.8" fill="#1a1a1a" opacity="0.3"/>
</svg>
```

```css
/* app/app.css */
.product-image::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url('/patterns/tiny-eyes.svg');
  background-size: 20px;
  opacity: 0.03; /* Barely visible - only noticeable on close inspection */
  pointer-events: none;
  mix-blend-mode: overlay;
}
```

---

## 🎮 Step 4: Gamification UI Integration (2 hours)

### 4.1: Add "Play Game" Button to Modal

```typescript
// In ProductModal component

<div className="grid grid-cols-1 gap-3">
  {/* Primary action: Buy now */}
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={handleAddToCart}
    className="bg-ranch-cyan hover:bg-ranch-lime text-ranch-dark px-6 py-4 rounded-lg font-bold text-lg transition-colors"
  >
    Claim Your Harvest - ${totalPrice}
  </motion.button>

  {/* Secondary action: Play game for discount */}
  <motion.button
    whileHover={{ scale: 1.02, rotate: 1 }}
    whileTap={{ scale: 0.98 }}
    onClick={handleOpenGame}
    className="relative overflow-hidden border-2 border-ranch-lime text-ranch-lime px-6 py-4 rounded-lg font-bold text-lg"
  >
    {/* Animated background */}
    <motion.div
      animate={{
        x: ['0%', '100%'],
      }}
      transition={{
        repeat: Infinity,
        duration: 2,
        ease: 'linear'
      }}
      className="absolute inset-0 bg-gradient-to-r from-transparent via-ranch-lime/20 to-transparent"
    />

    <span className="relative z-10">
      🎮 Play Game - Earn up to 40% Off
    </span>
  </motion.button>
</div>
```

### 4.2: Create Game Modal Placeholder

```typescript
// app/lib/components/GameModal.tsx

import { Dialog, DialogContent } from './ui/dialog';
import { motion } from 'framer-motion';

interface GameModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  onGameComplete: (discount: number) => void;
}

export function GameModal({ isOpen, onClose, productId, onGameComplete }: GameModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-ranch-dark border-4 border-ranch-purple">
        <div className="text-center py-12">
          {/* Game selection grid */}
          <h2 className="text-3xl font-bold text-ranch-pink mb-4">
            Choose Your Challenge
          </h2>
          <p className="text-ranch-lavender mb-8">
            Complete a game to earn discounts up to 40% off
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {GAMES.map((game) => (
              <motion.button
                key={game.id}
                whileHover={{ scale: 1.05, rotate: -2 }}
                whileTap={{ scale: 0.95 }}
                className="p-6 bg-ranch-purple/30 rounded-lg border-2 border-ranch-purple hover:border-ranch-cyan transition-colors"
              >
                <div className="text-4xl mb-2">{game.emoji}</div>
                <div className="font-bold text-ranch-cream">{game.name}</div>
                <div className="text-xs text-ranch-lavender mt-1">
                  {game.duration}s
                </div>
              </motion.button>
            ))}
          </div>

          <div className="mt-8 text-sm text-ranch-lavender">
            Or skip and proceed to checkout
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const GAMES = [
  { id: 'culling', name: 'The Culling', emoji: '🐛', duration: 25 },
  { id: 'harvest', name: 'Cursed Harvest', emoji: '🌽', duration: 30 },
  { id: 'telegram', name: 'Bug Telegram', emoji: '📟', duration: 30 },
  { id: 'snake', name: 'Hungry Caterpillar', emoji: '🐛', duration: 45 },
  { id: 'garden', name: 'Midnight Garden', emoji: '🌙', duration: 25 },
  { id: 'metamorphosis', name: 'Metamorphosis', emoji: '🦋', duration: 25 },
];
```

### 4.3: Add Discount Badge System

```typescript
// app/lib/components/DiscountBadge.tsx

import { motion } from 'framer-motion';

export function DiscountBadge({ percent }: { percent: number }) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -45 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 15 }}
      className="inline-flex items-center gap-2 bg-ranch-lime text-ranch-dark px-4 py-2 rounded-full font-bold"
    >
      <motion.span
        animate={{ rotate: [0, -10, 10, -10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        🎉
      </motion.span>
      <span>{percent}% OFF EARNED!</span>
    </motion.div>
  );
}
```

---

## 👻 Step 5: Random Rare Events (1.5 hours)

### 5.1: Create Rare Event System

```typescript
// app/lib/hooks/useRareEvents.ts

import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';

export function useRareEvents() {
  const location = useLocation();
  const [activeEvent, setActiveEvent] = useState<string | null>(null);

  useEffect(() => {
    // 1% chance on navigation
    const triggerRareEvent = () => {
      const rand = Math.random();

      if (rand < 0.01) {
        const events = ['eye', 'darken', 'whisper'];
        const event = events[Math.floor(Math.random() * events.length)];
        setActiveEvent(event);

        // Clear event after duration
        setTimeout(() => setActiveEvent(null), 2000);
      }
    };

    triggerRareEvent();
  }, [location.pathname]);

  return activeEvent;
}
```

### 5.2: Eye in Corner Component

```typescript
// app/lib/components/RareEvents/EyeInCorner.tsx

import { motion, AnimatePresence } from 'framer-motion';

export function EyeInCorner({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 right-4 z-[9999] pointer-events-none"
        >
          <svg width="60" height="40" viewBox="0 0 60 40" className="drop-shadow-2xl">
            {/* Outer eye shape */}
            <ellipse cx="30" cy="20" rx="28" ry="18" fill="#F5F5DC" opacity="0.9"/>

            {/* Iris */}
            <motion.circle
              cx="30"
              cy="20"
              r="10"
              fill="#4A3258"
              animate={{
                cx: [28, 32, 28],
                cy: [18, 22, 18]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            {/* Pupil */}
            <circle cx="30" cy="20" r="5" fill="#1a1a1a"/>

            {/* Highlight */}
            <circle cx="32" cy="18" r="2" fill="white" opacity="0.8"/>
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### 5.3: Background Blur Event

```typescript
// app/lib/components/RareEvents/BackgroundBlur.tsx

import { motion, AnimatePresence } from 'framer-motion';

export function BackgroundBlur({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Blur overlay */}
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(3px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9998]"
          />

          {/* Vague shapes */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9997] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(155,143,181,0.3) 1px, transparent 1px)',
              backgroundSize: '50px 50px'
            }}
          >
            {/* Random floating shapes */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                  scale: 0
                }}
                animate={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 1.5,
                  ease: "easeInOut"
                }}
                className="absolute w-20 h-20 rounded-full bg-ranch-purple/30 blur-xl"
              />
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

### 5.4: Integrate into Root Layout

```typescript
// app/root.tsx

import { useRareEvents } from './lib/hooks/useRareEvents';
import { EyeInCorner } from './lib/components/RareEvents/EyeInCorner';
import { BackgroundBlur } from './lib/components/RareEvents/BackgroundBlur';

export default function App() {
  const rareEvent = useRareEvents();

  return (
    <>
      {/* Existing environmental effects */}
      <NightSky />
      <BarnLight />
      <GardenShadows />

      {/* Rare events */}
      <EyeInCorner show={rareEvent === 'eye'} />
      <BackgroundBlur show={rareEvent === 'darken'} />

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <Outlet />
      </div>
    </>
  );
}
```

---

## 📱 Step 6: Mobile Optimization (1.5 hours)

### 6.1: Replace Modal with Drawer on Mobile

Use shadcn's `Drawer` component for mobile, `Dialog` for desktop:

```typescript
// app/lib/components/ProductModal.tsx (refactored)

import { useMediaQuery } from './hooks/useMediaQuery';
import { Dialog, DialogContent } from './ui/dialog';
import { Drawer, DrawerContent } from './ui/drawer';

export function ProductModal({ product, isOpen, onClose, onAddToCart }) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const content = (
    <ProductModalContent
      product={product}
      onClose={onClose}
      onAddToCart={onAddToCart}
    />
  );

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent>
        {content}
      </DrawerContent>
    </Drawer>
  );
}
```

### 6.2: Add Media Query Hook

```typescript
// app/lib/hooks/useMediaQuery.ts

import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}
```

### 6.3: Add Swipe Gestures for Mobile Cards

```typescript
import { motion } from 'framer-motion';

<motion.div
  drag="x"
  dragConstraints={{ left: 0, right: 0 }}
  dragElastic={0.2}
  onDragEnd={(_, info) => {
    // If swiped right significantly, open modal
    if (info.offset.x > 100) {
      handleOpenModal(product);
    }
  }}
  className="card"
>
  {/* Card content */}
</motion.div>
```

---

## 🎬 Step 7: Advanced Animations (1 hour)

### 7.1: Page Transitions with Framer Motion

```typescript
// app/root.tsx

import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router';

export default function App() {
  const location = useLocation();

  return (
    <>
      {/* Environmental effects */}

      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, filter: 'blur(10px)' }}
          transition={{
            duration: 0.6,
            ease: [0.43, 0.13, 0.23, 0.96] // Custom uncanny easing
          }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </>
  );
}
```

### 7.2: Stagger Animation for Product Grid

```typescript
// app/routes/home.tsx

import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

// In component:
<motion.div
  variants={containerVariants}
  initial="hidden"
  animate="visible"
  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
>
  {products.map((product) => (
    <motion.div
      key={product.id}
      variants={itemVariants}
      whileHover={{ scale: 1.05, rotate: 2 }}
    >
      {/* Card content */}
    </motion.div>
  ))}
</motion.div>
```

### 7.3: Loading Skeleton with Horror Theme

```typescript
// app/lib/components/ProductSkeleton.tsx

import { motion } from 'framer-motion';

export function ProductSkeleton() {
  return (
    <div className="card bg-ranch-purple/20 p-4">
      {/* Pulsing caterpillar loader */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-full aspect-square bg-ranch-purple/30 rounded-lg flex items-center justify-center mb-4"
      >
        <span className="text-6xl">🐛</span>
      </motion.div>

      {/* Skeleton lines */}
      <div className="space-y-3">
        <div className="h-4 bg-ranch-purple/30 rounded w-3/4 animate-pulse" />
        <div className="h-3 bg-ranch-purple/20 rounded w-full animate-pulse" />
        <div className="h-6 bg-ranch-lime/20 rounded w-1/3 animate-pulse" />
      </div>
    </div>
  );
}
```

---

## ⚡ Step 8: Performance Optimization (30 min)

### 8.1: Lazy Load Heavy Components

```typescript
// app/routes/home.tsx

import { lazy, Suspense } from 'react';
import { ProductSkeleton } from '../lib/components/ProductSkeleton';

const ProductModal = lazy(() => import('../lib/components/ProductModal'));
const GameModal = lazy(() => import('../lib/components/GameModal'));

// In component:
<Suspense fallback={<ProductSkeleton />}>
  {selectedProduct && (
    <ProductModal
      product={selectedProduct}
      isOpen={isModalOpen}
      onClose={handleCloseModal}
      onAddToCart={handleAddToCart}
    />
  )}
</Suspense>
```

### 8.2: Optimize Animation Performance

```css
/* app/app.css */

/* Use GPU acceleration for frequently animated elements */
.card,
.modal-content,
.game-button {
  will-change: transform;
}

/* But remove will-change when not hovering/animating */
.card:not(:hover) {
  will-change: auto;
}
```

### 8.3: Reduce Motion for Accessibility

```typescript
// app/lib/hooks/useReducedMotion.ts

import { useEffect, useState } from 'react';

export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', listener);

    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return prefersReducedMotion;
}
```

Use in components:
```typescript
const reducedMotion = useReducedMotion();

<motion.div
  animate={reducedMotion ? {} : { scale: 1.05, rotate: 2 }}
>
```

---

## 🧪 Step 9: Testing & QA (1 hour)

### 9.1: Visual Regression Tests

Update `visual-audit.mjs` to test new interactions:

```javascript
// Test hover effects
await page.hover('.card', { force: true });
await page.screenshot({ path: 'test-card-hover-glow.png' });

// Test rare events (manually trigger)
await page.evaluate(() => {
  window.dispatchEvent(new CustomEvent('trigger-rare-event', { detail: 'eye' }));
});
await page.waitForTimeout(500);
await page.screenshot({ path: 'test-rare-event-eye.png' });

// Test game modal
await page.click('button:has-text("Play Game")');
await page.screenshot({ path: 'test-game-modal.png' });
```

### 9.2: Performance Budget

Set maximum bundle sizes:

```json
// package.json
{
  "bundlesize": [
    {
      "path": "build/client/assets/*.js",
      "maxSize": "250 kB"
    },
    {
      "path": "build/client/assets/*.css",
      "maxSize": "30 kB"
    }
  ]
}
```

### 9.3: Mobile Device Testing

Test on real devices:
- iPhone SE (320px width)
- iPhone 14 Pro (393px width)
- Android (various)

Key areas:
- Drawer opens smoothly from bottom
- Swipe gestures work on cards
- Tap targets are 44×44px minimum
- No horizontal scroll
- Particle effects don't lag

---

## 📊 Expected Results

### Bundle Size Impact
- **Before**: ~180 kB client JS (gzipped: 57 kB)
- **After**: ~280 kB client JS (gzipped: ~85 kB)
- **Increase**: ~100 kB raw, ~28 kB gzipped
- **Acceptable**: Yes (under 1MB limit)

### Performance Metrics
- **Time to Interactive**: <2s (same as before)
- **Lighthouse Score**: 90+ (maintain)
- **Animation FPS**: 60fps on modern devices

### User Experience Gains
- ✅ **Engagement**: Card hover effects encourage exploration
- ✅ **Delight**: Rare events create "did you see that?" moments
- ✅ **Conversion**: Gamification increases perceived value
- ✅ **Mobile**: Drawer UX feels native on mobile
- ✅ **Accessibility**: Radix primitives = better screen reader support

---

## 🚀 Implementation Order

### Day 1 (3-4 hours):
1. Install dependencies (Framer Motion, shadcn/ui)
2. Refactor ProductModal with Dialog + animations
3. Add horror-themed copy throughout
4. Add particle burst effect

### Day 2 (3-4 hours):
5. Implement enhanced product cards (hover effects, eye overlay)
6. Add gamification UI (game buttons, discount badges)
7. Create rare event system (eye, blur, whisper)
8. Mobile optimization (drawer, swipe gestures)

### Day 3 (1-2 hours):
9. Performance optimization (lazy loading, will-change)
10. Testing & QA (visual regression, mobile devices)
11. Deploy and verify

---

## 🎯 Success Criteria

**Phase 1.5 is complete when**:
- [x] All animations run at 60fps on desktop and 30fps+ on mobile
- [x] Bundle size stays under 1MB compressed
- [x] Lighthouse score remains 90+
- [x] Mobile drawer works smoothly on iOS and Android
- [x] Rare events trigger correctly (1% chance on navigation)
- [x] Horror-themed copy is consistently applied
- [x] Gamification UI is visually distinct and engaging
- [x] No accessibility regressions (WCAG AA maintained)

---

## 🐛 Potential Gotchas

1. **Framer Motion SSR**: Use `<LazyMotion>` for code splitting
2. **shadcn Theming**: Ensure custom colors override defaults
3. **Particle Canvas**: May cause lag on low-end mobile - use feature detection
4. **Rare Events**: Test that they don't overlap or become annoying
5. **Bundle Size**: Monitor closely - remove unused Radix components

---

## 📝 Next Steps After Phase 1.5

Once interactive polish is complete:

**Phase 2: Cart State Management**
- Implement cart context (localStorage + KV)
- Cart modal/page with horror copy
- Discount application logic
- Checkout flow

**Phase 3: First Game Implementation**
- Build "The Culling" (whack-a-mole)
- Score tracking and discount calculation
- Integration with cart system

**Phase 4: Backend Integration**
- Printful API integration
- Order creation and confirmation
- Webhook handling

---

**Ready to start?** Let me know if you want me to begin implementation or if you'd like any adjustments to the plan!
