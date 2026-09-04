import { useEffect, useRef } from 'react';
import VanillaTilt from 'vanilla-tilt';

// Wraps any card content with a mouse-tracking 3D tilt + glare effect.
// Pass `intensity` to dial the max tilt angle down for dense layouts (tables)
// and up for hero-style stat cards.
export default function TiltCard({
  children,
  className = '',
  intensity = 8,
  glare = true,
  scale = 1.02,
  as: Tag = 'div',
  ...rest
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    VanillaTilt.init(el, {
      max: intensity,
      speed: 400,
      glare,
      'max-glare': 0.18,
      scale,
      gyroscope: false,
      perspective: 900,
      easing: 'cubic-bezier(.03,.98,.52,.99)',
    });
    return () => {
      if (el.vanillaTilt) el.vanillaTilt.destroy();
    };
  }, [intensity, glare, scale]);

  return (
    <Tag ref={ref} className={`glass-card ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
