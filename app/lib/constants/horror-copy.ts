/**
 * Horror-Themed E-Commerce Copy
 *
 * "That's messed up... but I love it?"
 *
 * Replaces standard e-commerce language with horror-themed alternatives
 * while maintaining clarity and usability.
 */

export const HORROR_COPY = {
  // Cart & Shopping
  cart: {
    title: 'Your Order is Growing',
    empty: 'The Ranch Awaits Your Selection',
    itemCount: (count: number) => `${count} ${count === 1 ? 'Item' : 'Items'} Growing`,
    addToCart: 'Add to Your Collection',
    removeFromCart: 'Release from Collection',
    viewCart: 'View Your Growing Order',
  },

  // Checkout Process
  checkout: {
    title: 'Complete the Harvest',
    shippingTitle: 'Where Should the Harvest Arrive?',
    shippingAddress: 'Delivery Location',
    billingTitle: 'Payment Details',
    total: 'Total Tribute',
    subtotal: 'Growth Subtotal',
    discount: 'Ranch Blessing',
    shipping: 'Journey Cost',
    tax: 'Colony Contribution',
    placeOrder: 'Complete the Harvest',
    processing: 'The Ranch is Processing Your Order...',
  },

  // Order Status
  order: {
    confirmed: 'Your Order Has Been Accepted by The Ranch',
    preparing: 'The Ranch is Preparing Your Items...',
    shipped: 'Your Package Has Left the Ranch',
    delivered: 'The Harvest Has Arrived',
    tracking: 'Watch Your Package\'s Journey',
    orderNumber: 'Ranch Order',
  },

  // Loading States
  loading: {
    default: 'The Ranch is Preparing...',
    products: 'Caterpillars are Selecting Items...',
    order: 'The Colony is Processing...',
    payment: 'Counting Your Tribute...',
    messages: [
      'The ranch is preparing your items...',
      'Caterpillars are inspecting quality...',
      'Wrapping your harvest...',
      'The colony approves...',
    ],
  },

  // Products
  products: {
    outOfStock: 'Temporarily Out of the Colony',
    lowStock: 'Few Remaining in the Ranch',
    newArrival: 'Fresh from the Ranch',
    addedToCart: 'Added to Your Growing Collection',
  },

  // Games & Discounts
  games: {
    playToEarn: 'Play Game - Earn up to 40% Off',
    skipGame: 'Skip and Buy at Full Price',
    gameInProgress: 'Game in Progress...',
    discountEarned: 'The Ranch is Pleased!',
    tryAgain: 'Try Another Game',
    giveUp: 'Give Up',
    lastResort: 'Wait! Play one last game for up to 10% more off',
    lastResortNote: '(The ranch offers one final challenge)',
    maxDiscount: 'Maximum Blessing Reached (40%)',
  },

  // Leaderboard
  leaderboard: {
    title: 'The Ranch Leaderboard',
    topPoints: 'Top Point Earners',
    topDiscounts: 'Biggest Discount Winners',
    mostActive: 'Most Active Players',
    yourRank: 'Your Standing',
    anonymous: 'Anonymous Caterpillar',
  },

  // Errors & Warnings
  errors: {
    generic: 'The Ranch Encountered an Issue...',
    network: 'Lost Connection to the Ranch',
    outOfStock: 'This Item Has Left the Colony',
    paymentFailed: 'The Tribute Could Not Be Processed',
    tryAgain: 'Try Again',
    contactSupport: 'Contact the Ranch',
  },

  // Success Messages
  success: {
    added: 'Added to your growing collection!',
    removed: 'Released from your collection',
    ordered: 'Your order has been accepted by the ranch!',
    discountApplied: 'Ranch blessing applied!',
  },

  // Ambient Whispers (rare events, barely audible)
  whispers: [
    'welcome to the rancch...',
    'they grow...',
    'the colony watches...',
    'molt with us...',
    'why did you abandon us...',
    'not yet...',
  ],
} as const;

/**
 * Helper function to get a random loading message
 */
export function getRandomLoadingMessage(): string {
  const messages = HORROR_COPY.loading.messages;
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Helper function to get a random whisper
 */
export function getRandomWhisper(): string {
  const whispers = HORROR_COPY.whispers;
  return whispers[Math.floor(Math.random() * whispers.length)];
}
