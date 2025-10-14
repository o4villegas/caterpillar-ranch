import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface EyeInCornerProps {
  show: boolean;
}

export function EyeInCorner({ show }: EyeInCornerProps) {
  const shouldReduceMotion = useReducedMotion();

  // Animation variants for container
  const containerVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 0.3,
        ease: [0.22, 1, 0.36, 1] as any, // easeOut cubic bezier
      },
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 0.3,
        ease: [0.22, 1, 0.36, 1] as any, // easeOut cubic bezier
      },
    },
  };

  // Iris tracking animation (subtle movement)
  const irisVariants = {
    animate: shouldReduceMotion
      ? {}
      : {
          cx: [30, 32, 28, 30],
          cy: [20, 18, 22, 20],
          transition: {
            duration: 2,
            repeat: Infinity as any,
            ease: [0.42, 0, 0.58, 1] as any, // easeInOut cubic bezier
          },
        },
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed bottom-8 right-8 pointer-events-none"
          style={{
            zIndex: 9999,
            willChange: "transform, opacity",
          }}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <svg
            width="60"
            height="40"
            viewBox="0 0 60 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))",
            }}
          >
            {/* Outer eye shape (cream) */}
            <ellipse
              cx="30"
              cy="20"
              rx="28"
              ry="18"
              fill="#F5F5DC"
              opacity="0.9"
            />

            {/* Iris (purple) - animated */}
            <motion.circle
              cx="30"
              cy="20"
              r="10"
              fill="#4A3258"
              variants={irisVariants}
              animate="animate"
            />

            {/* Pupil (black) */}
            <motion.circle
              cx="30"
              cy="20"
              r="5"
              fill="#1a1a1a"
              variants={irisVariants}
              animate="animate"
            />

            {/* Highlight (white dot for realism) */}
            <motion.circle
              cx="32"
              cy="18"
              r="2"
              fill="white"
              opacity="0.8"
              variants={irisVariants}
              animate="animate"
            />

            {/* Subtle outer stroke for definition */}
            <ellipse
              cx="30"
              cy="20"
              rx="28"
              ry="18"
              fill="none"
              stroke="#4A3258"
              strokeWidth="0.5"
              opacity="0.3"
            />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
