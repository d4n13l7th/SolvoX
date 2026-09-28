import React, { useEffect, useMemo, useRef } from 'react';
import { BACKGROUNDS } from '../config/backgrounds';

export default function ArenaBackground({ levelId = 1 }) {
  const ref = useRef(null);
  const bg = useMemo(() => BACKGROUNDS[levelId] || BACKGROUNDS[1], [levelId]);

  useEffect(() => {
    const media = ref.current;
    if (media?.tagName === 'VIDEO') media.play().catch(() => {});
  }, [bg.src]);

  const style = {
    '--bg-object-position': bg.objectPosition || 'center center',
    '--bg-brightness': bg.brightness ?? 1,
    '--bg-saturation': bg.saturation ?? 1,
    '--bg-scale': bg.scale ?? 1.02,
    '--bg-fit': bg.fit || 'cover',
    '--bg-inset': bg.inset || '-1.5%',
    '--bg-width': bg.width || '103%',
    '--bg-height': bg.height || '103%',
  };

  return (
    <div className="arena-background" aria-hidden="true">
      {bg.type === 'video' ? (
        <video
          ref={ref}
          className="arena-background-media"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster={bg.poster}
          style={style}
        >
          <source src={bg.src} type="video/mp4" />
        </video>
      ) : (
        <img ref={ref} className="arena-background-media" src={bg.src} alt="" style={style} />
      )}
      <div className="arena-vignette" />
      <div className="arena-atmosphere arena-atmosphere-a" />
      <div className="arena-atmosphere arena-atmosphere-b" />
      <div className="arena-mist arena-mist-a" />
      <div className="arena-mist arena-mist-b" />
    </div>
  );
}
