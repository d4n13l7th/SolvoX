import React, { useEffect, useState } from 'react';
import SpriteCharacter from './SpriteCharacter';

const ASUKA_IDLE_FRAMES = Object.freeze(
  Array.from(
    { length: 42 },
    (_, index) =>
      `/assets/characters/idle-knight-front/idle-knight-front_${String(index + 1).padStart(2, '0')}.webp`,
  ),
);

export default function CharacterSelectIdle({
  playerId,
  size = 280,
  className = '',
}) {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    if (playerId !== 'asuka') {
      setFrameIndex(0);
      return undefined;
    }

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % ASUKA_IDLE_FRAMES.length);
    }, 83);

    return () => window.clearInterval(timer);
  }, [playerId]);

  if (playerId !== 'asuka') {
    return (
      <SpriteCharacter
        playerId={playerId}
        size={size}
        className={className}
      />
    );
  }

  return (
    <img
      className={className}
      src={ASUKA_IDLE_FRAMES[frameIndex]}
      alt=""
      draggable="false"
      decoding="async"
    />
  );
}
