/**
 * Centralized selectors for Caterpillar Ranch E2E tests
 *
 * All CSS/ARIA/data-testid selectors mapped from actual implementation
 * If a test fails, CHECK THE APPLICATION CODE FIRST to ensure the feature exists
 */

export const selectors = {
  // Homepage
  homepage: {
    logo: 'img[alt="Caterpillar Ranch - Horror Tees"]',
    productGrid: 'main .grid',  // More specific - only grid inside main element
    productCard: 'button.card',  // Simplified - just match button with .card class
    productImage: 'img[alt*="Tee"], img[alt*="CR-"]',  // Match either Tee or CR-
    productName: 'h2.text-xl',
    productPrice: 'div.text-4xl',
    productDescription: 'p.text-ranch-lavender',
  },

  // Product View (modal and dedicated page)
  product: {
    image: 'img.w-full', // Inside product modal/page
    title: 'h3.text-2xl.text-ranch-cream',
    price: 'div.text-4xl.text-ranch-lime',
    description: 'p.text-ranch-lavender.text-lg',
    sizeButton: 'button[aria-pressed]', // Size selection buttons
    quantityInput: 'input[type="number"][aria-label="Quantity"]',
    quantityDecrease: 'button[aria-label="Decrease quantity"]',
    quantityIncrease: 'button[aria-label="Increase quantity"]',
    playGameButton: 'button:has-text("Play Game - Earn a Discount")',
    addToCartButton: 'button:has-text("Claim Your Harvest")',
    discountBadge: 'div:has-text("Ranch Blessing Applied")',
  },

  // Product Page (dedicated route with color selection)
  productPage: {
    backButton: 'button:has-text("Back to Products")',
    colorLabel: 'label:has-text("Choose Your Color")',
    colorSwatchGroup: 'div.flex.flex-wrap.gap-3',
    colorSwatch: 'button.rounded-full.w-10.h-10', // All color swatches
    colorSwatchSelected: 'button.rounded-full:has(.ring-2.ring-ranch-lime)', // Selected swatch
    colorSwatchAvailable: 'button.rounded-full.cursor-pointer', // Available colors
    colorSwatchUnavailable: 'button.rounded-full.cursor-not-allowed', // Out of stock colors
    colorTooltip: '.absolute.-bottom-8', // Tooltip on hover
    sizeLabel: 'label:has-text("Choose Your Offering Size")',
    sizeGrid: 'div.grid.grid-cols-4.gap-2',
    colorText: 'div:has-text("Color:")', // Only in modal (not product page)
  },

  // Cart Icon & Drawer
  cart: {
    icon: 'button[aria-label*="Shopping cart"]',
    badge: '.animate-heartbeat-pulse', // Item count badge
    drawer: '[role="dialog"]', // Vaul drawer
    drawerTitle: 'h2:has-text("Your Order is Growing")',
    drawerEmpty: 'h2:has-text("The Ranch Awaits")',
    item: '.space-y-4 > div', // Cart item containers
    itemImage: 'img[alt*="CR-"]',
    itemName: 'h4',
    itemSize: 'text:has-text("Size:")',
    itemQuantity: 'input[type="number"]',
    itemPrice: 'div:has-text("$")',
    removeButton: 'button[aria-label="Remove item"]',
    subtotal: 'div:has-text("Subtotal")',
    discount: 'div:has-text("Discount")',
    total: 'div:has-text("Total")',
    checkoutButton: 'button:has-text("Complete the Harvest")',
    continueShopping: 'button:has-text("Continue Browsing")',
  },

  // Checkout Flow
  checkout: {
    title: 'h1:has-text("Complete the Harvest")',
    emailInput: 'input[type="email"]',
    nameInput: 'input[type="text"][placeholder*="John Doe"]',
    addressInput: 'input[placeholder*="123 Main St"]',
    address2Input: 'input[placeholder*="Apt"]',
    cityInput: 'input[placeholder*="City"]',
    stateInput: 'input[placeholder*="CA"]',
    zipInput: 'input[placeholder*="12345"]',
    phoneInput: 'input[type="tel"]',
    submitButton: 'button[type="submit"]:has-text("Continue to Review")',
    backButton: 'button:has-text("Back to Shopping")',
    validationError: 'p.text-ranch-pink',
  },

  // Checkout Review
  review: {
    title: 'h1:has-text("Review Your Order")',
    shippingAddress: 'div:has-text("Shipping Address")',
    orderItems: 'div:has-text("Order Items")',
    orderSummary: 'div:has-text("Order Summary")',
    placeOrderButton: 'button:has-text("Place Order")',
    editShippingButton: 'button:has-text("Edit Shipping")',
  },

  // Checkout Confirmation
  confirmation: {
    title: 'h1:has-text("Order Confirmed")',
    orderNumber: 'div:has-text("Order #")',
    thankYouMessage: 'p:has-text("The Ranch Welcomes You")',
    continueShoppingButton: 'button:has-text("Continue Shopping")',
  },

  // Admin Login
  adminLogin: {
    emailInput: 'input#email',
    passwordInput: 'input#password',
    showPasswordButton: 'button:has-text("👁️")',
    submitButton: 'button[type="submit"]:has-text("Enter the Colony")',
    backToStoreButton: 'button:has-text("Back to Store")',
    loadingSpinner: '.animate-spin',
  },

  // Admin Dashboard
  adminDashboard: {
    sidebar: 'nav[aria-label="Admin navigation"]',
    dashboardLink: 'a[href="/admin/dashboard"]',
    ordersLink: 'a[href="/admin/orders"]',
    productsLink: 'a[href="/admin/products"]',
    analyticsLink: 'a[href="/admin/analytics"]',
    logoutButton: 'button:has-text("Logout")',

    // Stats cards
    statCard: '.bg-gray-800',
    ordersToday: 'div:has-text("Orders Today")',
    revenueToday: 'div:has-text("Revenue Today")',
    activeProducts: 'div:has-text("Active Products")',
    gamesToday: 'div:has-text("Games Played Today")',

    // Activity feed
    activityFeed: 'div:has-text("Recent Activity")',
    recentOrder: 'div:has-text("Order")',
    recentGame: 'div:has-text("Game:")',
  },

  // Admin Orders Page
  adminOrders: {
    title: 'h1:has-text("Orders")',
    table: 'table',
    tableRow: 'tbody tr',
    searchInput: 'input[placeholder*="Search"]',
    statusFilter: 'select[aria-label="Filter by status"]',
    orderIdCell: 'td:nth-child(1)',
    customerCell: 'td:nth-child(2)',
    totalCell: 'td:nth-child(3)',
    statusCell: 'td:nth-child(4)',
    dateCell: 'td:nth-child(5)',
    viewButton: 'button:has-text("View")',
  },

  // Admin Analytics Page
  adminAnalytics: {
    title: 'h1:has-text("Analytics")',
    revenueChart: 'div:has-text("Revenue Over Time")',
    ordersChart: 'div:has-text("Orders Over Time")',
    topProducts: 'div:has-text("Top Products")',
    gameStats: 'div:has-text("Game Statistics")',
    dateRangeSelector: 'select[aria-label="Date range"]',
  },

  // Games - The Culling
  gameCulling: {
    title: 'h1:has-text("The Culling")',
    timer: 'div:has-text("Time:")',
    score: 'div:has-text("Score:")',
    grid: '.grid', // 3x3 grid of holes
    hole: 'button[data-hole]',
    caterpillar: 'div[data-caterpillar]',
    invasiveCaterpillar: '[data-type="invasive"]',
    goodCaterpillar: '[data-type="good"]',
    resultsModal: 'div:has-text("Game Over")',
    finalScore: 'div:has-text("Final Score:")',
    discountEarned: 'div:has-text("Discount Earned:")',
    playAgainButton: 'button:has-text("Play Again")',
    backToProductButton: 'button:has-text("Back to Product")',
  },

  // Horror UI Elements
  horror: {
    nightSky: '.night-sky', // Container for stars
    star: '.star', // Individual stars
    barnLight: '.barn-light', // Flickering barn window
    gardenShadows: '.garden-shadows', // Vignette shadows
    cursorTrail: '.cursor-trail', // Fading cursor trail dots
    eyeInCorner: '.eye-in-corner', // Rare event eye
    backgroundBlur: '.page-content.blurred', // Rare event blur
    whisperDisplay: '.whisper-display', // Horror text whispers
  },

  // Environmental Elements
  environmental: {
    logo: 'img[src="/cr-logo.png"]',
    footer: 'footer',
    header: 'header',
  },
};
