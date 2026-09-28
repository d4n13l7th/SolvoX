import React from 'react';

export default function HitEffect({ side, amount, theme='player' }) {
  if (!side) return null;
  return (
    <div className={`hit-effect-v20 battle-hit-effect-v21 hit-${side} hit-theme-${theme}`} aria-hidden="true">
      <div className="hit-core-v20 hit-core-v21" />
      <div className="hit-ring-v20 hit-ring-v21" />
      <div className="hit-ring-v20 secondary hit-ring-v21" />
      <div className="hit-sparks-v20 hit-sparks-v21">✦ ✧ ✦ ✧</div>
      <strong>-{amount}</strong>
    </div>
  );
}
