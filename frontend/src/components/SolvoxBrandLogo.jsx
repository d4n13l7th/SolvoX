import React from 'react';

/** V89 — single-source Solvox image logo. */
export default function SolvoxBrandLogo({ compact = false, className = '' }) {
  return (
    <div
      className={`solvox-brand-v89${compact ? ' is-compact' : ''}${className ? ` ${className}` : ''}`}
      role="img"
      aria-label="Solvox"
    >
      <img
        src="/assets/ui/brand/solvox-logo-v89.png"
        alt="Solvox"
        draggable="false"
      />
    </div>
  );
}
