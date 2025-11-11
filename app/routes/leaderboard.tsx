import { useState } from 'react';
import { Link, useLoaderData } from 'react-router';
import { motion } from 'framer-motion';
import type { Route } from './+types/leaderboard';
import { getAllLeaderboards, type GameLeaderboard, type LeaderboardEntry } from '~/lib/mocks/leaderboard';
import { Badge } from '~/lib/components/ui/badge';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Leaderboards | Caterpillar Ranch' },
    { name: 'description', content: 'Top scores across all horror games. Can you claim the throne?' },
  ];
}

export async function loader() {
  const leaderboards = getAllLeaderboards();
  return { leaderboards };
}

export default function LeaderboardPage() {
  const { leaderboards } = useLoaderData<typeof loader>();
  const [selectedGame, setSelectedGame] = useState<string>(leaderboards[0].gameType);

  const currentLeaderboard = leaderboards.find(
    (lb: GameLeaderboard) => lb.gameType === selectedGame
  );

  if (!currentLeaderboard) {
    return <div>Leaderboard not found</div>;
  }

  return (
    <div className="min-h-screen bg-ranch-dark py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-ranch-lavender hover:text-ranch-lime transition-colors"
            style={{ fontFamily: 'Handjet, monospace', fontWeight: 500 }}
          >
            <span className="text-xl">←</span>
            <span>Back to Ranch</span>
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl text-ranch-cream mb-2" style={{ fontFamily: 'Handjet, monospace', fontWeight: 800 }}>
            🏆 Leaderboards
          </h1>
          <p className="text-ranch-lavender" style={{ fontFamily: 'Handjet, monospace', fontWeight: 500 }}>
            The Ranch's Most Skilled Survivors
          </p>
        </motion.div>

        {/* Game selector tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 flex flex-wrap gap-2 justify-center"
        >
          {leaderboards.map((lb: GameLeaderboard) => (
            <button
              key={lb.gameType}
              onClick={() => setSelectedGame(lb.gameType)}
              className={`px-4 py-2 rounded-lg text-lg transition-all ${
                selectedGame === lb.gameType
                  ? 'bg-ranch-lime text-ranch-dark shadow-lg scale-105'
                  : 'bg-ranch-purple/30 text-ranch-cream hover:bg-ranch-purple/50 border-2 border-ranch-purple'
              }`}
              style={{ fontFamily: 'Handjet, monospace', fontWeight: 700 }}
            >
              {lb.gameName}
            </button>
          ))}
        </motion.div>

        {/* Leaderboard table */}
        <motion.div
          key={selectedGame}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-ranch-purple/20 rounded-xl p-6 border-2 border-ranch-purple"
        >
          <h2 className="text-2xl text-ranch-cream mb-4 text-center" style={{ fontFamily: 'Handjet, monospace', fontWeight: 700 }}>
            {currentLeaderboard.gameName}
          </h2>

          {/* Table */}
          <div className="space-y-2">
            {currentLeaderboard.entries.map((entry: LeaderboardEntry, index: number) => {
              const isTopThree = entry.rank <= 3;
              const medalEmoji = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : '';

              return (
                <motion.div
                  key={`${entry.username}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                    isTopThree
                      ? 'bg-gradient-to-r from-ranch-lime/20 to-ranch-cyan/20 border-2 border-ranch-lime'
                      : 'bg-ranch-dark/40 border border-ranch-purple/30 hover:bg-ranch-dark/60'
                  }`}
                >
                  {/* Rank */}
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg ${
                        isTopThree
                          ? 'bg-ranch-lime text-ranch-dark'
                          : 'bg-ranch-purple/50 text-ranch-cream'
                      }`}
                    >
                      {medalEmoji || entry.rank}
                    </div>

                    {/* Username */}
                    <div className="flex-1">
                      <div className="text-ranch-cream" style={{ fontFamily: 'Handjet, monospace', fontWeight: 700 }}>
                        {entry.username}
                      </div>
                      <div className="text-lg text-ranch-lavender" style={{ fontFamily: 'Handjet, monospace', fontWeight: 500 }}>
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Score and discount */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl text-ranch-lime" style={{ fontFamily: 'Handjet, monospace', fontWeight: 700 }}>
                        {entry.score} pts
                      </div>
                      {entry.discountEarned > 0 && (
                        <Badge variant="success" className="text-xs">
                          {entry.discountEarned}% OFF
                        </Badge>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Footer message */}
          <div className="mt-6 text-center text-lg text-ranch-lavender" style={{ fontFamily: 'Handjet, monospace', fontWeight: 500 }}>
            Play games on product pages to earn your spot on the leaderboard
          </div>
        </motion.div>
      </div>
    </div>
  );
}
