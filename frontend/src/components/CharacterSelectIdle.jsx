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
  const [animationReady, setAnimationReady] = useState(false);
  const frames = IDLE_FRAMES[playerId] || IDLE_FRAMES.traveler;

  useEffect(() => {
    setFrameIndex(0);
    setAnimationReady(false);

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    let cancelled = false;
    let loaded = 0;
    const readyFrameCount = Math.min(6, frames.length);
    const markFrameReady = () => {
      loaded += 1;
      if (!cancelled && loaded >= readyFrameCount) setAnimationReady(true);
    };

    const preloadedFrames = frames.map((src) => {
      const image = new Image();
      image.addEventListener('load', markFrameReady, { once: true });
      image.addEventListener('error', markFrameReady, { once: true });
      image.src = src;
      return image;
    });

    return () => {
      cancelled = true;
      preloadedFrames.forEach((image) => {
        image.removeEventListener('load', markFrameReady);
        image.removeEventListener('error', markFrameReady);
      });
    };
  }, [frames]);

  useEffect(() => {
    if (!animationReady) return undefined;

    const timer = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % frames.length);
    }, 83);

    return () => window.clearInterval(timer);
  }, [animationReady, frames]);

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
