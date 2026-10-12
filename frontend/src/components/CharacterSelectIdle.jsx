import React, { useEffect, useState } from 'react';

const IDLE_FRAMES = Object.freeze({
  traveler: Object.freeze(Array.from(
    { length: 42 },
    (_, index) => `/assets/characters/idle-knight-front/idle-knight-front_${String(index + 1).padStart(2, '0')}.webp`,
  )),
  asuka: Object.freeze(Array.from(
    { length: 40 },
    (_, index) => `/assets/characters/idle-asuka-knight/idle-asuka-front_${String(index + 1).padStart(2, '0')}.webp`,
  )),
});

export default function CharacterSelectIdle({
  playerId,
  className = '',
}) {
  const [frameIndex, setFrameIndex] = useState(0);
  const frames = IDLE_FRAMES[playerId] || IDLE_FRAMES.traveler;

  useEffect(() => {
    setFrameIndex(0);

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % frames.length);
    }, 83);

    return () => window.clearInterval(timer);
  }, [frames]);

  return (
    <img
      className={className}
      src={frames[frameIndex]}
      alt=""
      draggable="false"
      decoding="async"
    />
  );
}
