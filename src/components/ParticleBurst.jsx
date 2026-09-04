import { useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';

const COLOR_MAP = {
  emerald: ['#34ffb0', '#5eead4', '#a7f3d0'],
  amber: ['#ffb547', '#fde68a', '#fbbf24'],
  crimson: ['#ff4d6d', '#fca5a5', '#f87171'],
};

function makeParticles(color) {
  const palette = COLOR_MAP[color] || COLOR_MAP.emerald;
  return Array.from({ length: 26 }).map((_, i) => {
    const angle = (Math.PI * 2 * i) / 26 + Math.random() * 0.4;
    const distance = 60 + Math.random() * 90;
    return {
      id: i,
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance,
      size: 4 + Math.random() * 6,
      color: palette[i % palette.length],
      rotate: Math.random() * 360,
    };
  });
}

// Satisfying particle burst fired at a screen point (e.g. the "Confirm
// Payment" button) when a fee payment succeeds.
export default function ParticleBurstLayer() {
  const burst = useAppStore((s) => s.particleBurst);
  const clearParticleBurst = useAppStore((s) => s.clearParticleBurst);
  const particles = useMemo(() => (burst ? makeParticles(burst.color) : []), [burst?.key]);

  useEffect(() => {
    if (!burst) return;
    const t = setTimeout(() => clearParticleBurst(), 900);
    return () => clearTimeout(t);
  }, [burst?.key]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[70]">
      <AnimatePresence>
        {burst && (
          <div key={burst.key} style={{ position: 'absolute', left: burst.x, top: burst.y }}>
            {particles.map((p) => (
              <motion.span
                key={p.id}
                initial={{ opacity: 1, x: 0, y: 0, scale: 0.6, rotate: 0 }}
                animate={{ opacity: 0, x: p.dx, y: p.dy, scale: 1, rotate: p.rotate }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: 'absolute',
                  width: p.size,
                  height: p.size,
                  borderRadius: p.size > 7 ? '3px' : '50%',
                  background: p.color,
                  boxShadow: `0 0 10px ${p.color}`,
                }}
              />
            ))}
            <motion.div
              initial={{ opacity: 0.7, scale: 0.2 }}
              animate={{ opacity: 0, scale: 3.2 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                left: -40,
                top: -40,
                width: 80,
                height: 80,
                borderRadius: '50%',
                border: `2px solid ${COLOR_MAP[burst.color]?.[0] || '#34ffb0'}`,
              }}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
