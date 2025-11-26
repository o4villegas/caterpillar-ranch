import { motion } from 'framer-motion';
import { useNavigate } from 'react-router';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { HORROR_COPY } from '../constants/horror-copy';

interface GameModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productSlug: string;
  onGameComplete: (discount: number) => void;
}

// Game list with route mappings (using HORROR_COPY for display data)
const GAMES = [
  { id: 'culling', ...HORROR_COPY.games.theCulling, route: 'the-culling' },
  { id: 'harvest', ...HORROR_COPY.games.cursedHarvest, route: 'cursed-harvest' },
  { id: 'telegram', ...HORROR_COPY.games.bugTelegram, route: 'bug-telegram' },
  { id: 'snake', ...HORROR_COPY.games.hungryCaterpillar, route: 'hungry-caterpillar' },
  { id: 'garden', ...HORROR_COPY.games.midnightGarden, route: 'midnight-garden' },
  { id: 'metamorphosis', ...HORROR_COPY.games.metamorphosisQueue, route: 'metamorphosis-queue' },
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
          <DialogTitle className="text-3xl text-ranch-pink text-center font-display-800">
            {HORROR_COPY.games.modal.title}
          </DialogTitle>
          <DialogDescription className="text-ranch-lavender text-center font-display-600">
            {HORROR_COPY.games.modal.subtitle}
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
                <div className="text-ranch-cream mb-1 font-display-700">{game.title}</div>
                <div className="text-lg text-ranch-lavender font-display-600">{game.duration}s</div>
              </motion.button>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <p className="text-lg text-ranch-lavender font-display-600">
              {HORROR_COPY.games.modal.skipPrompt}
            </p>
            <Button onClick={handleSkip} variant="ghost" size="sm" className="font-display-600">
              {HORROR_COPY.games.modal.skipButton}
            </Button>
          </div>

          <motion.div
            className="mt-6 p-4 bg-ranch-purple/20 rounded-lg text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-lg text-ranch-lavender font-display-600">
              {HORROR_COPY.games.modal.optionalNote}
            </p>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
