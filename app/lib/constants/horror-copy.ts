/**
 * Horror-Themed E-Commerce Copy — "The Chrysalis"
 *
 * Theme: Painful Beauty / Transformation
 *
 * Core philosophy: Transformation is not gentle. The caterpillar must be
 * unmade entirely — dissolved into primordial soup within the chrysalis —
 * before it can become. You are the midwife of this violent becoming.
 * Guide them through the dark. What emerges depends on your care.
 *
 * Horror intensity: 8/10 (disturbing/unsettling, not gratuitous)
 * Tone: Reverent, bittersweet, earned transcendence
 * Player role: Caretaker/Midwife guiding transformation
 */

export const HORROR_COPY = {
  // Brand Identity
  brand: {
    name: 'Caterpillar Ranch',
    tagline: 'Guide them through the dark',
    welcome: 'Welcome to the Chrysalis',
    mission: 'Every caterpillar dreams of wings. Not all of them make it.',
    footer: 'Where transformation happens',
  },

  // Cart & Shopping
  cart: {
    title: 'Your Chrysalis Forms',
    empty: 'Nothing yet prepares to transform',
    itemCount: (count: number) =>
      `${count} ${count === 1 ? 'transformation' : 'transformations'} pending`,
    addToCart: 'Begin This Transformation',
    removeFromCart: 'Abandon This Chrysalis',
    viewCart: 'View Pending Transformations',
    continueShopping: 'Find more to transform',
  },

  // Checkout Process
  checkout: {
    title: 'The Transformation Completes',
    shippingTitle: 'Where will they emerge?',
    shippingAddress: 'Emergence Location',
    billingTitle: 'Cost of Becoming',
    total: 'Total Transformation',
    subtotal: 'Chrysalis Forming',
    discount: 'Earned Trust',
    shipping: 'Journey to You',
    tax: 'Transformation Tax',
    placeOrder: 'Seal the Chrysalis',
    processing: 'The transformation is happening...',
  },

  // Order Status
  order: {
    confirmed: 'The chrysalis is sealed. Transformation begins.',
    preparing: 'They are changing within the dark...',
    shipped: 'The chrysalis travels to you now',
    delivered: 'They have emerged. Open carefully.',
    tracking: 'Follow the chrysalis',
    orderNumber: 'Chrysalis',
  },

  // Loading States
  loading: {
    default: 'The chrysalis stirs...',
    products: 'Gathering what they need to transform...',
    order: 'Sealing the chrysalis...',
    payment: 'The cost of becoming is calculated...',
    messages: [
      'The chrysalis stirs...',
      'Something moves in the dark...',
      'The transformation requires patience...',
      'Wings are forming...',
      'They are almost ready...',
    ],
  },

  // Products
  products: {
    outOfStock: 'This transformation has ended',
    lowStock: 'Few chrysalises remain',
    newArrival: 'Fresh from the cocoon',
    addedToCart: 'Another transformation begins',
  },

  // Games & Discounts — Core Framing
  games: {
    // Main CTAs
    playToEarn: 'Prove Your Care',
    skipGame: 'Skip — Pay Full Price',
    gameInProgress: 'The trial continues...',
    discountEarned: 'They trust you now',
    tryAgain: 'Try again. They deserve better.',
    giveUp: 'Abandon them',
    lastResort: 'One more chance to prove your care',
    lastResortNote: '(They are watching. They want to trust you.)',
    maxDiscount: 'Maximum trust earned',

    // Game Selection Modal
    modal: {
      title: 'Prove Your Care',
      subtitle: 'Guide them through a trial. Earn their trust.',
      skipPrompt: 'Or abandon them to transform alone',
      skipButton: 'Skip — They Transform Alone',
      optionalNote: 'Transformation happens either way. Your care determines what emerges.',
    },

    // Individual Game Data — Reframed as Stages of Care
    theCulling: {
      title: 'The Culling',
      emoji: '🛡️',
      duration: 20,
      careStage: 'Protection',
      description: 'Defend the vulnerable from parasites',
      instructions: [
        'Protect the vulnerable caterpillars from parasites',
        'Red eyes = threat. Remove them before they corrupt the chrysalis.',
      ],
      startButton: 'Begin Protection',
      failureMessage: 'The parasites got through. The chrysalis is corrupted.',
    },

    cursedHarvest: {
      title: 'Cursed Harvest',
      emoji: '🌿',
      duration: 20,
      careStage: 'Nourishment',
      description: 'Gather the nutrients they need',
      instructions: [
        'Match the nutrients they need to fuel transformation',
        'Wrong combinations poison the chrysalis.',
      ],
      startButton: 'Begin Gathering',
      failureMessage: 'Wrong nutrients. The transformation will be agonizing.',
    },

    chrysalisPulse: {
      title: 'Chrysalis Pulse',
      emoji: '💓',
      duration: 25,
      careStage: 'Synchronization',
      description: 'Sync with their heartbeat',
      instructions: [
        'The chrysalis pulses with life. Feel the rhythm.',
        'Tap when the pulse aligns with the ring.',
      ],
      startButton: 'Feel the Pulse',
      failureMessage: 'Out of sync. The rhythm was lost.',
    },

    organHarvest: {
      title: 'Organ Harvest',
      emoji: '🫀',
      duration: 45,
      careStage: 'The Offering',
      description: 'Stack the offerings. Survive the harvest.',
      instructions: [
        'The ritual demands an offering',
        'Stack the organs before time runs out',
      ],
      startButton: 'Begin the Harvest',
      failureMessage: 'The offering was rejected. The ritual is incomplete.',
    },

    midnightGarden: {
      title: 'Midnight Garden',
      emoji: '🌙',
      duration: 25,
      careStage: 'Divination',
      description: 'Read the signs of what they will become',
      instructions: [
        'The garden reveals omens of transformation',
        'Good signs guide them. Bad signs corrupt them.',
      ],
      startButton: 'Enter the Garden',
      failureMessage: 'The omens were misread. They enter the chrysalis blind.',
    },

    metamorphosisQueue: {
      title: 'The Emergence',
      emoji: '🦋',
      duration: 25,
      careStage: 'Birth',
      description: 'Help them break free at the right moment',
      instructions: [
        'They struggle to emerge. Help at the GREEN moment.',
        'Too early, they dissolve. Too late, they suffocate.',
      ],
      startButton: 'Begin the Watch',
      failureMessage: 'Wrong timing. They emerged still dissolving, not yet formed.',
    },

    larvaLaunch: {
      title: 'Larva Launch',
      emoji: '🎯',
      duration: 20,
      careStage: 'Defense',
      description: 'Launch defenders to protect the leaves',
      instructions: [
        'Parasites infest the sacred leaves. Launch caterpillars to stop them.',
        'Drag back to aim, release to launch. Protect what feeds the chrysalis.',
      ],
      startButton: 'Begin Defense',
      failureMessage: 'The parasites consumed everything. Nothing left to nourish the transformation.',
    },

    pathOfThePupa: {
      title: 'Path of the Pupa',
      emoji: '🌿',
      duration: 25,
      careStage: 'Guidance',
      survivalStage: 'Survival',
      description: 'Draw paths to guide them to nourishment',
      survivalDescription: 'Flee. Survive. Grow at your own risk.',
      instructions: [
        'Move your finger or mouse to flee from the pursuers.',
        'Collect gems for bonus points... but each one makes you bigger.',
      ],
      startButton: 'Begin the Chase',
      failureMessage: 'The predators caught you. The chrysalis remains empty.',
    },

    // Tier-Specific Celebration Messages — Earned Transcendence
    celebrations: {
      tier15: {
        message: 'Perfect care. They emerged exactly as they dreamed.',
        subtext: 'You guided them through dissolution, terror, and remaking. They fly now. Because of you.',
        emoji: '🦋',
      },
      tier12: {
        message: 'Strong guidance. They will fly.',
        subtext: 'The transformation was nearly perfect. Their wings catch the light.',
        emoji: '✨',
      },
      tier9: {
        message: 'They emerged. Some scars, but whole.',
        subtext: 'The chrysalis was dark, but they made it through.',
        emoji: '🌙',
      },
      tier6: {
        message: 'The transformation was incomplete.',
        subtext: 'They fly, but they remember the pain more than the beauty.',
        emoji: '🕯️',
      },
      tier3: {
        message: 'They emerged. Something is wrong with their wings.',
        subtext: 'They try to fly. They cannot. But they are alive.',
        emoji: '👁️',
      },
    },

    // Failure Messages (0% discount) — Horror of Failed Transformation
    failures: {
      generic: 'The chrysalis failed. What emerged... it is better not to describe.',
      detailed: 'They trusted you to guide them through the dark. You were not ready.',
      tryAgain: 'Try again. They deserve better care.',
    },
  },

  // Errors & Warnings
  errors: {
    generic: 'Something went wrong in the chrysalis...',
    network: 'Connection to the chrysalis lost',
    outOfStock: 'This transformation has already completed',
    paymentFailed: 'The cost of becoming could not be paid',
    tryAgain: 'Try Again',
    contactSupport: 'Seek help',
  },

  // Success Messages
  success: {
    added: 'Another transformation begins',
    removed: 'The chrysalis dissolves, unused',
    ordered: 'The transformation is sealed',
    discountApplied: 'Their trust is applied',
  },

  // Ambient Whispers — Unsettling but Thematic
  whispers: [
    'it hurts to become...',
    'the dark is where we change...',
    'do you remember being small?',
    'wings are earned, not given...',
    'the chrysalis knows your name...',
    'they trusted you...',
    'something stirs within...',
    'not all of them make it...',
    'the struggle is the point...',
    'what will you become?',
  ],

  // Progressive Dread Messages (shown as mistakes accumulate)
  dread: {
    level1: 'The chrysalis trembles.',
    level2: 'Something is going wrong inside.',
    level3: 'They are struggling. Your care falters.',
    level4: 'The transformation corrupts. What will emerge?',
    level5: 'It is too late to save this one. But you can try again.',
  },

  // Homepage / Site Copy
  site: {
    heroTitle: 'Caterpillar Ranch',
    heroSubtitle: 'Where transformation happens',
    heroTagline: 'Every caterpillar dreams of wings. Guide them through the dark.',
    productsTitle: 'Begin a Transformation',
    productsSubtitle: 'Each piece carries the weight of becoming',
    aboutTitle: 'About the Chrysalis',
    aboutText: 'Transformation is not gentle. The caterpillar dissolves entirely within the chrysalis before it can become. We honor that struggle. We wear the reminder that beauty requires sacrifice, that becoming requires unmaking.',
  },
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

/**
 * Get dread message based on mistake count
 */
export function getDreadMessage(mistakeCount: number): string | null {
  if (mistakeCount >= 5) return HORROR_COPY.dread.level5;
  if (mistakeCount >= 4) return HORROR_COPY.dread.level4;
  if (mistakeCount >= 3) return HORROR_COPY.dread.level3;
  if (mistakeCount >= 2) return HORROR_COPY.dread.level2;
  if (mistakeCount >= 1) return HORROR_COPY.dread.level1;
  return null;
}

/**
 * Get failure message for specific game
 */
export function getGameFailureMessage(gameType: string): string {
  const gameKey = gameType as keyof typeof HORROR_COPY.games;
  const game = HORROR_COPY.games[gameKey];

  if (game && typeof game === 'object' && 'failureMessage' in game) {
    return game.failureMessage;
  }

  return HORROR_COPY.games.failures.generic;
}
