# Caterpillar Ranch: Quick Reference for Developers

## Project Structure

```
/home/lando555/caterpillar-ranch/
├── workers/
│   └── app.ts (20 lines) - Hono entry point [API ROUTES GO HERE]
├── app/
│   ├── routes.ts - React Router config
│   ├── root.tsx - App layout
│   ├── entry.server.tsx - SSR logic
│   ├── app.css - Global styles (Tailwind v4)
│   ├── routes/
│   │   ├── home.tsx - Product grid
│   │   ├── product.tsx - Product detail
│   │   ├── checkout.tsx - Shipping form
│   │   ├── checkout.review.tsx - Order review
│   │   ├── checkout.confirmation.tsx - Order confirmation
│   │   └── games/
│   │       └── games.*.tsx - 6 game implementations
│   └── lib/
│       ├── types/ - TypeScript interfaces
│       │   ├── product.ts - Product, ProductVariant, ProductSize
│       │   └── cart.ts - CartItem, Discount, Cart, CartTotals
│       ├── contexts/
│       │   └── CartContext.tsx - State management (useCart hook)
│       ├── components/
│       │   ├── Cart/ - CartIcon, CartDrawer, CartItem, CartSummary
│       │   ├── Games/ - GameModal, GameTimer, GameScore, GameResults
│       │   ├── ui/ - Button, Badge, Dialog, Drawer, Input, Select, etc.
│       │   └── RareEvents/ - EyeInCorner, BackgroundBlur, WhisperDisplay
│       ├── mocks/
│       │   └── products.ts - Mock product data (4 products)
│       ├── constants/
│       │   ├── colors.ts - Color palette
│       │   └── horror-copy.ts - UI text strings
│       ├── hooks/
│       │   ├── useCursorTrail.ts - Cursor trail effect
│       │   ├── useGamePlaySession.ts - Game session tracking
│       │   ├── useMediaQuery.ts - Responsive queries
│       │   ├── useRareEvents.ts - Rare event system
│       │   └── useReducedMotion.ts - Accessibility
│       └── utils.ts - cn() utility
├── public/
│   ├── cr-logo.png - Brand logo
│   ├── cr-favicon.svg - Favicon
│   ├── products/ - Product images
│   └── patterns/ - Pattern overlays
├── wrangler.jsonc - Worker config [NO KV/D1 CONFIGURED YET]
├── vite.config.ts - Build config
├── package.json - Dependencies
└── tsconfig.json - TypeScript config
```

## Key Data Structures

### Product
```typescript
interface Product {
  id: string; // e.g., "cr-punk"
  name: string;
  slug: string; // e.g., "punk-edition"
  description: string;
  price: number; // $30
  imageUrl: string; // "/products/CR-PUNK.png"
  variants: ProductVariant[];
  tags: string[]; // ["horror", "punk"]
  createdAt?: string; // ISO date
}

interface ProductVariant {
  id: string;
  size: 'S' | 'M' | 'L' | 'XL' | 'XXL';
  color: string; // "Dark Gray"
  inStock: boolean;
}
```

### Cart Item
```typescript
interface CartItem {
  id: string; // ${product.id}-${variantId}-${Date.now()}
  product: Product;
  variantId: string;
  variant: ProductVariant;
  quantity: number; // 1-99
  earnedDiscount: number; // 0-40% from games
  addedAt: string; // ISO timestamp
}
```

### Discount
```typescript
interface Discount {
  id: string;
  productId: string;
  gameType: 'culling' | 'harvest' | 'telegram' | 'snake' | 'garden' | 'metamorphosis' | 'last-resort';
  discountPercent: number; // 10, 20, 30, or 40
  earnedAt: string; // ISO timestamp
  expiresAt: string; // 30 minutes from earn
  applied: boolean;
}
```

## Current Data Flow

### Getting Products
```
home.tsx loader
  → returns: mockProducts (static array from app/lib/mocks/products.ts)
  → Home component
  → map through products
  → render ProductCard grid
```

### Adding to Cart
```
User clicks "Add to Cart" on ProductView
  → CartContext.addToCart(product, variantId, quantity, earnedDiscount)
  → cartReducer dispatches ADD_ITEM action
  → cart state updated
  → useEffect saves to localStorage: 'caterpillar-ranch-cart'
  → CartIcon badge updates (spring animation)
```

### Checkout Flow
```
/checkout (shipping form) → sessionStorage.setItem('checkout_shipping')
  ↓
/checkout/review (display summary)
  ↓
Click "Place Order" → Mock order created → localStorage.setItem('caterpillar-ranch-orders')
  ↓
/checkout/confirmation?order={id}
  ↓
DEAD END (orders not sent to Printful)
```

### Game → Discount Flow
```
/products/:slug (opens GameModal)
  → User selects game
  → navigate("/games/{type}?product={slug}")
  → Game component calculates score (client-side)
  → getDiscountResult(score) determines tier
  → CartContext.addDiscount(newDiscount)
  → navigate back to /products/:slug
  → ProductView detects discount in CartContext
  → Discount applied automatically to product
```

## Storage Keys

### localStorage
- `'caterpillar-ranch-cart'` - Cart state (CartItem[], Discount[])
- `'caterpillar-ranch-session'` - Session token (string, UUID)
- `'game:the-culling:best-score'` - Best game score (number)
- `'caterpillar-ranch-orders'` - Order history (Order[])

### sessionStorage
- `'checkout_shipping'` - Shipping info during checkout (ShippingInfo)

**Note:** All storage is client-side only. No server-side persistence.

## Environment Variables

### Currently Used (in wrangler.jsonc)
```
VALUE_FROM_CLOUDFLARE = "Hello from Hono/CF"
```

### To Be Added
```
PRINTFUL_API_TOKEN (secret) - Printful API key
JWT_SECRET (secret) - For signing JWT tokens
ENVIRONMENT (var) - "development" or "production"
```

## API Routes (Current Status)

**Currently Implemented:** NONE

**All routes currently:**
- `/` → React Router SSR
- `/products/:slug` → React Router SSR
- `/checkout` → React Router SSR
- `/games/*` → React Router SSR

**To Be Implemented (Before Admin Portal):**
```
GET  /api/catalog/products
POST /api/auth/login
GET  /api/orders/:id
POST /api/orders
POST /api/admin/products
etc.
```

## Component Dependencies

### CartContext (Provider)
- Wraps entire app in `app/root.tsx`
- Provides `useCart()` hook
- Methods: addToCart, removeFromCart, updateQuantity, applyDiscount, addDiscount, clearCart

### GameModal
- Used in ProductView
- Routes to `/games/{type}?product={slug}`
- 6 games available (all implemented)

### ProductView
- Used in product.tsx route
- Shows product image, variants, price
- Integrates GameModal for discount earning

### CartIcon + CartDrawer
- Fixed position top-right
- Shows item count badge
- Drawer opens from right side (Vaul library)
- Uses Framer Motion for animations

## Adding New Features

### New Route
1. Create file in `app/routes/`
2. Export default component
3. Add to `app/routes.ts` using `route()` helper
4. Component receives `useLoaderData<typeof loader>()`

### New Product
1. Edit `app/lib/mocks/products.ts`
2. Add to `mockProducts` array
3. Product appears on home page automatically

### New Game
1. Create `app/routes/games.{name}.tsx`
2. Implement game logic with score calculation
3. Use `useGameState()` hook from `app/lib/components/Games/hooks/useGameState.ts`
4. Call `CartContext.addDiscount()` when game completes
5. Add game to GAMES array in `GameModal.tsx`

### New API Endpoint
1. Add before catch-all in `workers/app.ts` (line 8)
2. Use Hono syntax: `app.get("/api/...", (c) => { ... })`
3. Access env via `c.env.MY_VAR`
4. Return JSON via `c.json({ ... })`

## Important Numbers

### Cart & Discounts
- Max quantity per item: 99
- Min quantity per item: 1
- Max discount cap: 40% of subtotal
- Discount expiry: 30 minutes after earning
- Game types: 7 total

### Games
```
The Culling: 25 seconds
Cursed Harvest: 30 seconds
Bug Telegram: 30 seconds
Hungry Caterpillar: 45 seconds
Midnight Garden: 25 seconds
Metamorphosis Queue: 25 seconds
```

### Score-to-Discount Tiers
```
45-50 points → 40% off
35-44 points → 30% off
20-34 points → 20% off
10-19 points → 10% off
0-9 points → 0% off (can retry)
```

### Current Products
- cr-punk (Dark Gray) - $30
- cr-rock (Stone Gray) - $30
- cr-weird (Lavender) - $30
- cr-anime (White) - $30

## Common Tasks

### Debug Cart State
```typescript
import { useCart } from '~/lib/contexts/CartContext';

export default function DebugComponent() {
  const { cart, totals } = useCart();
  console.log('Cart items:', cart.items);
  console.log('Discounts:', cart.discounts);
  console.log('Totals:', totals);
  return null;
}
```

### Get Product Details
```typescript
import { getProductBySlug } from '~/lib/mocks/products';

const product = getProductBySlug('punk-edition');
console.log(product.name, product.price);
```

### Calculate Discount
```typescript
import { calculateDiscount } from '~/lib/components/Games/utils/scoreConversion';

const discount = calculateDiscount(score); // Returns: 0, 10, 20, 30, or 40
```

### Access Cloudflare Env
```typescript
// In Hono routes (workers/app.ts)
app.get("/api/example", (c) => {
  const token = c.env.PRINTFUL_API_TOKEN; // From secret
  const message = c.env.VALUE_FROM_CLOUDFLARE; // From var
  return c.json({ message, token });
});

// In React Router loaders
export function loader({ context }: Route.LoaderArgs) {
  const cloudflare = context.cloudflare as { env: Env };
  const message = cloudflare.env.VALUE_FROM_CLOUDFLARE;
  return { message };
}
```

## Performance Notes

- All products load synchronously (no async)
- Cart auto-saves to localStorage on every change (100% coverage but no batching)
- Game scores calculated 100% client-side (no server validation)
- No caching for product catalog
- No database queries (all mock data)

## Known Limitations

1. **Orders not persisted** - Created in checkout but stored only in localStorage
2. **Game scores unvalidated** - Client-side calculation, no server verification
3. **No user authentication** - All users are guests
4. **No Printful integration** - 4 static products only
5. **No inventory sync** - Stock status hardcoded
6. **No real payments** - Checkout is mock flow

## Next Steps (Before Admin Portal)

1. ✅ Understand current architecture (you are here)
2. ⏳ Set up D1 database (PRIORITY 1)
3. ⏳ Implement authentication (PRIORITY 1)
4. ⏳ Add Printful API integration (PRIORITY 2)
5. ⏳ Build admin portal (PRIORITY 3)

