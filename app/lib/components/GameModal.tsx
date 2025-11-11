import { motion } from 'framer-motion';
import { useNavigate } from 'react-router';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';

interface GameModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productSlug: string;
  onGameComplete: (discount: number) => void;
}

// Game list with route mappings
const GAMES = [
  { id: 'culling', name: 'The Culling', emoji: '🐛', duration: 25, route: 'the-culling' },
  { id: 'harvest', name: 'Cursed Harvest', emoji: '🌽', duration: 30, route: 'cursed-harvest' },
  { id: 'telegram', name: 'Bug Telegram', emoji: '📟', duration: 30, route: 'bug-telegram' },
  { id: 'snake', name: 'Hungry Caterpillar', emoji: '🐛', duration: 45, route: 'hungry-caterpillar' },
  { id: 'garden', name: 'Midnight Garden', emoji: '🌙', duration: 25, route: 'midnight-garden' },
  { id: 'metamorphosis', name: 'Metamorphosis Queue', emoji: '🦋', duration: 25, route: 'metamorphosis-queue' },
];

export function GameModal({ isOpen, onClose, productId, productSlug, onGameComplete }: GameModalProps) {
  const navigate = useNavigate();

  const handleSkip = () => {
    onClose();
  };

  const handleGameSelect = (gameRoute: string) => {
    // Navigate to game route with product slug as query parameter
    // Game will handle discount earning and return navigation to /products/{slug}
    navigate(`/games/${gameRoute}?product=${productSlug}`);
    onClose(); // Close modal immediately as we're navigating away
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-ranch-dark border-4 border-ranch-purple">
        <DialogHeader>
          <DialogTitle className="text-3xl text-ranch-pink text-center" style={{ fontFamily: 'Handjet, monospace', fontWeight: 800 }}>
            Choose Your Challenge
          </DialogTitle>
          <DialogDescription className="text-ranch-lavender text-center" style={{ fontFamily: 'Handjet, monospace', fontWeight: 500 }}>
            Complete a game to earn discounts up to 40% off
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {GAMES.map((game, index) => (
              <motion.button
                key={game.id}
                onClick={() => handleGameSelect(game.route)}
                whileHover={{ scale: 1.05, rotate: index % 2 === 0 ? -2 : 2 }}
                whileTap={{ scale: 0.95 }}
                className="p-6 bg-ranch-purple/30 rounded-lg border-2 border-ranch-purple hover:border-ranch-cyan transition-all"
              >
                <div className="text-5xl mb-3">{game.emoji}</div>
                <div className="text-ranch-cream mb-1" style={{ fontFamily: 'Handjet, monospace', fontWeight: 700 }}>{game.name}</div>
                <div className="text-sm text-ranch-lavender" style={{ fontFamily: 'Handjet, monospace', fontWeight: 500 }}>{game.duration}s</div>
              </motion.button>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <p className="text-base text-ranch-lavender" style={{ fontFamily: 'Handjet, monospace', fontWeight: 500 }}>
              Or skip and proceed at full price
            </p>
            <Button onClick={handleSkip} variant="ghost" size="sm" style={{ fontFamily: 'Handjet, monospace', fontWeight: 500 }}>
              Skip Games - Buy Now
            </Button>
          </div>

          <motion.div
            className="mt-6 p-4 bg-ranch-purple/20 rounded-lg text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-sm text-ranch-lavender" style={{ fontFamily: 'Handjet, monospace', fontWeight: 500 }}>
              🐛 Games are optional - The Ranch offers discounts, never demands them
            </p>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
