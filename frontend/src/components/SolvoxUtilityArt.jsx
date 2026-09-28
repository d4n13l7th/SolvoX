import React from 'react';

const UTILITY_ART = {
  back: '/assets/ui/utility/icons/back.webp',
  feedback: '/assets/ui/utility/icons/feedback.png',
  settings: '/assets/ui/utility/icons/settings.png',
};

export function SolvoxUtilityArt({ name, className = '', alt = '', size = 26, variant = 'icon' }) {
  const src = variant === 'full'
    ? `/assets/ui/utility/art/${name}.png`
    : UTILITY_ART[name];
  if (!src) return null;
  return (
    <img
      className={`solvox-utility-art ${className}`}
      src={src}
      width={size}
      height={size}
      alt={alt}
      aria-hidden={alt ? undefined : 'true'}
      draggable="false"
    />
  );
}

export default SolvoxUtilityArt;
