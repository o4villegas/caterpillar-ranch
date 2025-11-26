import { motion } from 'framer-motion';

export function CartEmpty() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      {/* Empty cart icon - caterpillar waiting */}
      <motion.div
        className="text-8xl mb-6"
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        🐛
      </motion.div>

      {/* Horror-themed empty message */}
      <h3 className="text-2xl text-ranch-cream mb-2 font-display-800">
        The Ranch Awaits Your Selection
      </h3>
      <p className="text-ranch-lavender text-center max-w-sm mb-6 font-display-600">
        Your cart is empty. The caterpillars are waiting patiently for their new home...
      </p>

      {/* Visual separator */}
      <div className="w-full max-w-xs h-px bg-gradient-to-r from-transparent via-ranch-purple to-transparent mb-6" />

      {/* Hint text */}
      <p className="text-lg text-ranch-lavender/70 text-center max-w-sm font-display-600">
        Browse the harvest below. Each purchase supports the Ranch's growth. 🦋
      </p>
    </motion.div>
  );
}
