import React from 'react';

export default function HitEffect({ side, amount, theme='player' }) {
  if (!side) return null;
  return (
    <div className={`hit-effect battle-hit-effect hit-${side} hit-theme-${theme}`} aria-hidden="true">
      <div className="hit-core--legacy hit-core" />
      <div className="hit-ring--legacy hit-ring" />
      <div className="hit-ring--legacy secondary hit-ring" />
      <div className="hit-sparks--legacy hit-sparks">✦ ✧ ✦ ✧</div>
      <strong>-{amount}</strong>
    </div>
  );
}
