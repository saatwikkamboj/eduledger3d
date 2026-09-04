import { useEffect, useRef } from 'react';

// Multi-layered parallax backdrop: a reactive mesh-gradient wash, a faint
// perspective grid, and a handful of floating 3D-ish geometric tokens.
// Layers move at different speeds relative to the mouse to sell depth.
const TOKENS = [
  { shape: 'square', size: 64, top: '12%', left: '8%', depth: 18, hue: 'emerald', rotate: 12 },
  { shape: 'circle', size: 40, top: '68%', left: '14%', depth: 30, hue: 'cyan', rotate: 0 },
  { shape: 'triangle', size: 54, top: '22%', left: '82%', depth: 22, hue: 'amber', rotate: -8 },
  { shape: 'square', size: 34, top: '78%', left: '78%', depth: 40, hue: 'violet', rotate: 20 },
  { shape: 'circle', size: 26, top: '45%', left: '48%', depth: 50, hue: 'emerald', rotate: 0 },
  { shape: 'triangle', size: 38, top: '8%', left: '55%', depth: 26, hue: 'crimson', rotate: 6 },
];

const HUE_MAP = {
  emerald: 'rgba(52,255,176,0.35)',
  cyan: 'rgba(94,234,212,0.3)',
  amber: 'rgba(255,181,71,0.3)',
  violet: 'rgba(167,139,250,0.3)',
  crimson: 'rgba(255,77,109,0.28)',
};

function TokenShape({ token, style }) {
  const color = HUE_MAP[token.hue];
  const commonStyle = { ...style, width: token.size, height: token.size };

  if (token.shape === 'circle') {
    return <div className="absolute rounded-full animate-floaty" style={{ ...commonStyle, background: `radial-gradient(circle at 35% 30%, ${color}, transparent 70%)`, border: `1px solid ${color}`, backdropFilter: 'blur(2px)' }} />;
  }
  if (token.shape === 'triangle') {
    return (
      <div className="absolute animate-floaty" style={{ ...style, width: 0, height: 0, borderLeft: `${token.size / 2}px solid transparent`, borderRight: `${token.size / 2}px solid transparent`, borderBottom: `${token.size}px solid ${color}`, filter: 'drop-shadow(0 0 12px rgba(0,0,0,0.3))' }} />
    );
  }
  return <div className="absolute rounded-xl animate-floaty" style={{ ...commonStyle, background: `linear-gradient(135deg, ${color}, transparent)`, border: `1px solid ${color}` }} />;
}

export default function ParallaxBackground() {
  const rootRef = useRef(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const rafId = useRef(null);

  useEffect(() => {
    function onMove(e) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      target.current = { x: (e.clientX / w) * 2 - 1, y: (e.clientY / h) * 2 - 1 };
    }
    window.addEventListener('mousemove', onMove);

    function tick() {
      current.current.x += (target.current.x - current.current.x) * 0.06;
      current.current.y += (target.current.y - current.current.y) * 0.06;
      const root = rootRef.current;
      if (root) {
        root.style.setProperty('--px', current.current.x.toFixed(4));
        root.style.setProperty('--py', current.current.y.toFixed(4));
      }
      rafId.current = requestAnimationFrame(tick);
    }
    rafId.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <div ref={rootRef} className="fixed inset-0 -z-10 overflow-hidden bg-ink-950" style={{ '--px': 0, '--py': 0 }}>
      {/* Mesh gradient wash — slow layer */}
      <div
        className="absolute inset-0 transition-transform duration-300 ease-out"
        style={{
          transform: 'translate3d(calc(var(--px) * 14px), calc(var(--py) * 14px), 0)',
          background:
            'radial-gradient(45% 45% at 20% 25%, rgba(52,255,176,0.12), transparent 60%), radial-gradient(40% 40% at 80% 15%, rgba(167,139,250,0.10), transparent 60%), radial-gradient(50% 50% at 65% 85%, rgba(255,181,71,0.08), transparent 60%)',
        }}
      />

      {/* Perspective grid — mid layer */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          transform: 'translate3d(calc(var(--px) * 26px), calc(var(--py) * 26px), 0)',
          backgroundImage:
            'linear-gradient(rgba(148,163,184,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.5) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 75%)',
        }}
      />

      {/* Floating geometric tokens — fast layer, varying depth per token */}
      {TOKENS.map((t, i) => (
        <div
          key={i}
          className="absolute transition-transform duration-300 ease-out"
          style={{
            top: t.top,
            left: t.left,
            transform: `translate3d(calc(var(--px) * ${t.depth}px), calc(var(--py) * ${t.depth}px), 0) rotate(${t.rotate}deg)`,
            animationDelay: `${i * 0.6}s`,
          }}
        >
          <TokenShape token={t} style={{ transform: `rotate(${t.rotate}deg)` }} />
        </div>
      ))}

      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink-950/80" />
      <div className="absolute inset-0 shadow-[inset_0_0_180px_60px_rgba(5,6,10,0.9)]" />
    </div>
  );
}
