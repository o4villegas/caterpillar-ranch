/**
 * Mock Leaderboard Data
 *
 * Static leaderboard data for Phase 1 (frontend-first development)
 * Will be replaced with real database data in Phase 4
 */

export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  gameType: 'the-culling' | 'cursed-harvest' | 'bug-telegram' | 'hungry-caterpillar' | 'midnight-garden' | 'metamorphosis-queue';
  timestamp: string; // ISO 8601 date string
  discountEarned: number; // percentage (0-40)
}

export interface GameLeaderboard {
  gameType: string;
  gameName: string;
  entries: LeaderboardEntry[];
}

// Mock usernames with horror-themed names
const mockUsernames = [
  'CaterpillarKing',
  'RanchReaper',
  'MotherMoth',
  'PupaQueen',
  'SilkSlayer',
  'CocoonCrusher',
  'MetamorphMaster',
  'WrigglyWarrior',
  'ChitinChampion',
  'MandibleMage',
  'LarvaLord',
  'SegmentSage',
  'MoltMaster',
  'SpinneretStar',
  'InstarInsider',
];

/**
 * Generate mock leaderboard entries for a specific game
 */
function generateMockEntries(
  gameType: LeaderboardEntry['gameType'],
  count: number = 10
): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = [];

  // Score ranges per game (based on difficulty)
  const scoreRanges: Record<LeaderboardEntry['gameType'], { min: number; max: number }> = {
    'the-culling': { min: 15, max: 50 },
    'cursed-harvest': { min: 20, max: 48 },
    'bug-telegram': { min: 25, max: 50 },
    'hungry-caterpillar': { min: 30, max: 75 },
    'midnight-garden': { min: 18, max: 45 },
    'metamorphosis-queue': { min: 25, max: 50 },
  };

  const range = scoreRanges[gameType];

  // Generate top scores (descending order)
  const baseScores = Array.from({ length: count }, (_, i) => {
    const maxScore = range.max - i * 2; // Scores decrease gradually
    const minScore = Math.max(range.min, maxScore - 8);
    return Math.floor(Math.random() * (maxScore - minScore + 1)) + minScore;
  }).sort((a, b) => b - a);

  for (let i = 0; i < count; i++) {
    const score = baseScores[i];
    const discountEarned =
      score >= 45 ? 40 :
      score >= 35 ? 30 :
      score >= 20 ? 20 :
      score >= 10 ? 10 : 0;

    entries.push({
      rank: i + 1,
      username: mockUsernames[i % mockUsernames.length],
      score,
      gameType,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // Random timestamp within last week
      discountEarned,
    });
  }

  return entries;
}

// Generate leaderboards for all games
export const mockLeaderboards: GameLeaderboard[] = [
  {
    gameType: 'the-culling',
    gameName: 'The Culling',
    entries: generateMockEntries('the-culling'),
  },
  {
    gameType: 'cursed-harvest',
    gameName: 'Cursed Harvest',
    entries: generateMockEntries('cursed-harvest'),
  },
  {
    gameType: 'bug-telegram',
    gameName: 'Bug Telegram',
    entries: generateMockEntries('bug-telegram'),
  },
  {
    gameType: 'hungry-caterpillar',
    gameName: 'Hungry Hungry Caterpillar',
    entries: generateMockEntries('hungry-caterpillar'),
  },
  {
    gameType: 'midnight-garden',
    gameName: 'Midnight Garden',
    entries: generateMockEntries('midnight-garden'),
  },
  {
    gameType: 'metamorphosis-queue',
    gameName: 'Metamorphosis Queue',
    entries: generateMockEntries('metamorphosis-queue'),
  },
];

/**
 * Get leaderboard for a specific game
 */
export function getLeaderboardByGame(gameType: LeaderboardEntry['gameType']): GameLeaderboard | undefined {
  return mockLeaderboards.find(lb => lb.gameType === gameType);
}

/**
 * Get all leaderboards (for overview page)
 */
export function getAllLeaderboards(): GameLeaderboard[] {
  return mockLeaderboards;
}

/**
 * Get user's rank in a specific game (simulated)
 * Returns null if user hasn't played
 */
export function getUserRank(gameType: LeaderboardEntry['gameType'], userScore: number): number | null {
  const leaderboard = getLeaderboardByGame(gameType);
  if (!leaderboard) return null;

  // Find where user's score would rank
  const higherScores = leaderboard.entries.filter(entry => entry.score > userScore);
  return higherScores.length + 1;
}
