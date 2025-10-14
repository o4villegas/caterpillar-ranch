import { useEffect, useRef } from "react";

interface ParticleBurstProps {
  trigger: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

const COLORS = ["#32CD32", "#00CED1", "#FF1493"]; // lime, cyan, pink
const PARTICLE_SIZE = 4;
const PARTICLE_COUNT = 40;
const GRAVITY = 0.2;
const LIFE_DECAY = 0.02;

export function ParticleBurst({ trigger }: ParticleBurstProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const previousTriggerRef = useRef(trigger);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to full viewport
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Spawn particles when trigger changes from false to true
    if (trigger && !previousTriggerRef.current) {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      const newParticles: Particle[] = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        newParticles.push({
          x: centerX,
          y: centerY,
          vx: (Math.random() - 0.5) * 20, // -10 to +10
          vy: (Math.random() - 0.5) * 20, // -10 to +10
          life: 1.0,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        });
      }

      // Add to existing particles (support multiple bursts)
      particlesRef.current = [...particlesRef.current, ...newParticles];
    }

    previousTriggerRef.current = trigger;

    // Animation loop
    const animate = () => {
      if (!ctx || !canvas) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter((particle) => {
        // Apply physics
        particle.vy += GRAVITY; // Gravity pulls down
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= LIFE_DECAY;

        // Remove dead particles
        if (particle.life <= 0) {
          return false;
        }

        // Draw particle
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.life; // Fade out as life decreases
        ctx.fillRect(particle.x, particle.y, PARTICLE_SIZE, PARTICLE_SIZE);

        return true;
      });

      // Reset global alpha
      ctx.globalAlpha = 1.0;

      // Continue animation if particles exist
      if (particlesRef.current.length > 0) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        animationFrameRef.current = null;
      }
    };

    // Start animation if not already running
    if (particlesRef.current.length > 0 && animationFrameRef.current === null) {
      animate();
    }

    // Cleanup
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [trigger]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[9999]"
      aria-hidden="true"
    />
  );
}
