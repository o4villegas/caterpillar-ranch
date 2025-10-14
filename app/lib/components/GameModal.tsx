import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';

interface GameModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  onGameComplete: (discount: number) => void;
}

// Game list for Phase 3 implementation
const GAMES = [
  { id: 'culling', name: 'The Culling', emoji: '🐛', duration: 25 },
  { id: 'harvest', name: 'Cursed Harvest', emoji: '🌽', duration: 30 },
  { id: 'telegram', name: 'Bug Telegram', emoji: '📟', duration: 30 },
  { id: 'snake', name: 'Hungry Caterpillar', emoji: '🐛', duration: 45 },
  { id: 'garden', name: 'Midnight Garden', emoji: '🌙', duration: 25 },
  { id: 'metamorphosis', name: 'Metamorphosis', emoji: '🦋', duration: 25 },
];

export function GameModal({ isOpen, onClose, productId, onGameComplete }: GameModalProps) {
  const handleSkip = () => {
    onClose();
  };

  const handleGameSelect = (gameId: string) => {
    // TODO: Phase 3 - Launch actual game
    // For now, simulate game completion with random discount
    const discount = Math.floor(Math.random() * 21) + 20; // 20-40%
    onGameComplete(discount);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-ranch-dark border-4 border-ranch-purple">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-ranch-pink text-center">
            Choose Your Challenge
          </DialogTitle>
          <DialogDescription className="text-ranch-lavender text-center">
            Complete a game to earn discounts up to 40% off
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {GAMES.map((game, index) => (
              <motion.button
                key={game.id}
                onClick={() => handleGameSelect(game.id)}
                whileHover={{ scale: 1.05, rotate: index % 2 === 0 ? -2 : 2 }}
                whileTap={{ scale: 0.95 }}
                className="p-6 bg-ranch-purple/30 rounded-lg border-2 border-ranch-purple hover:border-ranch-cyan transition-all"
              >
                <div className="text-5xl mb-3">{game.emoji}</div>
                <div className="font-bold text-ranch-cream mb-1">{game.name}</div>
                <div className="text-xs text-ranch-lavender">{game.duration}s</div>
              </motion.button>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <p className="text-sm text-ranch-lavender">
              Or skip and proceed at full price
            </p>
            <Button onClick={handleSkip} variant="ghost" size="sm">
              Skip Games - Buy Now
            </Button>
          </div>

          <motion.div
            className="mt-6 p-4 bg-ranch-purple/20 rounded-lg text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-xs text-ranch-lavender">
              🐛 Games are optional - The Ranch offers discounts, never demands them
            </p>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
