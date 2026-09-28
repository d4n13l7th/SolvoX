import React from 'react';

const SHAPES = {
  home: <><path d="M7 13 16 5l9 8v8h-6v-6h-6v6H7z"/><path d="M5 13h3M24 13h-3M10 10 16 5l6 5"/></>,
  sword: <><path d="m7 5 14 14"/><path d="M18 5h3v3M7 18v3h3"/><path d="M12 16 8 20"/><path d="M11 15 15 11"/></>,
  party: <><circle cx="9" cy="9" r="3"/><circle cx="19" cy="9" r="3"/><path d="M3 21c1-4 3-6 6-6s5 2 6 6M13 21c1-3 3-5 6-5 2 0 4 2 5 5"/></>,
  dashboard: <><path d="M5 5h8v8H5zM15 5h6v4h-6zM15 11h6v10h-6zM5 15h8v6H5z"/></>,
  profile: <><circle cx="16" cy="11" r="4"/><path d="M7 25c1-5 4-8 9-8s8 3 9 8z"/></>,
  gear: <><path d="M14 4h4v3l2 1 3-1 2 4-2 2v3l2 2-2 4-3-1-2 1v3h-4v-3l-2-1-3 1-2-4 2-2v-3L5 11l2-4 3 1 2-1z"/><circle cx="16" cy="14" r="3"/></>,
  feedback: <><path d="M5 5h18v12H10l-5 4z"/><path d="M9 9h10M9 13h7"/></>,
  language: <><circle cx="16" cy="14" r="8"/><path d="M8 14h16M16 6c3 3 3 13 0 16M16 6c-3 3-3 13 0 16M4 7h5M6 5v4"/></>,
  play: <path d="M9 6v16l12-8z"/>,
  map: <><path d="M4 6 10 3l6 3 4-2 4 2v14l-4 2-4-2-6 3-6-3z"/><path d="M10 3v16M16 6v14M20 4v15"/></>,
  quest: <><circle cx="16" cy="14" r="8"/><path d="M13 13c0-2 2-3 3-3 2 0 3 1 3 3 0 2-3 2-3 4M16 21h.01"/></>,
  lock: <><rect x="8" y="11" width="16" height="12" rx="1"/><path d="M11 11V8a5 5 0 0 1 10 0v3"/><path d="M16 16v3"/></>,
  check: <path d="m7 15 5 5 11-12"/>,
  reset: <><path d="M7 10a9 9 0 1 1 1 10"/><path d="M7 10V5M7 10h5"/></>,
  trophy: <><path d="M10 5h12v4c0 5-3 8-6 8s-6-3-6-8z"/><path d="M10 7H6v3c0 3 2 5 5 5M22 7h4v3c0 3-2 5-5 5M16 17v4M11 23h10"/></>,
  skull: <><path d="M8 13V9a8 8 0 0 1 16 0v4c0 4-2 6-5 7v3H13v-3c-3-1-5-3-5-7z"/><path d="M11 12h.01M21 12h.01M13 17h6"/></>,
  retry: <><path d="M7 9a9 9 0 1 1 2 10"/><path d="M7 9V4M7 9h5"/><path d="M19 19v-5h-5"/></>,
  warning: <><path d="M16 4 27 23H5z"/><path d="M16 10v7M16 20h.01"/></>,
  keyboard: <><rect x="4" y="7" width="24" height="14" rx="2"/><path d="M7 11h2M11 11h2M15 11h2M19 11h2M23 11h2M7 15h2M11 15h2M15 15h2M19 15h2M23 15h2M8 18h15"/></>,
  hint: <><path d="M10 14a7 7 0 1 1 12 0c-1 1-2 2-2 4h-8c0-2-1-3-2-4z"/><path d="M13 21h6M14 24h4"/><path d="M16 3v2"/></>,
  back: <><path d="M20 16H6"/><path d="m12 8-8 8 8 8"/></>,
  attack: <><path d="m7 21 14-14"/><path d="M9 7h6v6"/><path d="M18 18h5v5"/></>,
  heart: <path d="M16 24S5 18 5 11a6 6 0 0 1 11-3 6 6 0 0 1 11 3c0 7-11 13-11 13z"/>,
  energy: <path d="m18 3-9 12h6l-2 9 9-13h-6z"/>,
  shield: <><path d="M16 4 25 8v7c0 5-4 9-9 13-5-4-9-8-9-13V8z"/><path d="m11 16 3 3 7-8"/></>,
  crown: <path d="m5 8 5 4 6-7 6 7 5-4-2 13H7z"/>,
  star: <path d="m16 4 3.7 7.5 8.3 1.2-6 5.8 1.4 8.2-7.4-3.9-7.4 3.9L10 18.5l-6-5.8 8.3-1.2z"/>,
  chart: <><path d="M5 24V6M5 24h22"/><path d="m8 19 5-6 4 3 7-9"/></>,
  book: <><path d="M6 5h8c2 0 4 2 4 4v14c-2-2-4-3-7-3H6z"/><path d="M26 5h-8c-2 0-4 2-4 4v14c2-2 4-3 7-3h5z"/></>,
  close: <><path d="m8 8 16 16M24 8 8 24"/></>,
  power: <><path d="M16 4v11M10 7a9 9 0 1 0 12 0"/></>,
  backspace: <path d="M6 9h16l5 5-5 5H6l-4-5zM11 12l6 4M17 12l-6 4"/>,
  clear: <><path d="M7 7h18v18H7z"/><path d="m10 10 12 12M22 10 10 22"/></>,
  enter: <><path d="M6 8v5h15"/><path d="m17 9 5 4-5 4"/><path d="M6 20h12"/></>,
  save: <><path d="M6 5h18l3 3v19H5V6z"/><path d="M10 5v7h10V5M10 20h12v7H10z"/></>,
  history: <><path d="M7 10a9 9 0 1 1 2 10"/><path d="M7 10V5M7 10h5"/><path d="M16 10v5l3 2"/></>,
  spark: <><path d="M16 3l2.2 8.8L27 14l-8.8 2.2L16 25l-2.2-8.8L5 14l8.8-2.2z"/></>,
  right: <><path d="M6 16h15"/><path d="m17 9 7 7-7 7"/></>,
  pixelMage: <><path d="M10 5h12v4h3v7h-3v4H10l-4-4V9h4z"/><path d="M13 10h2v2h-2zM19 10h2v2h-2zM14 16h6"/><path d="M8 20v5M14 20v5M21 20v5"/></>,
  pixelNinja: <><path d="M9 7h14v10H9L5 13z"/><path d="M12 11h8"/><path d="M8 17h16v5H8z"/><path d="M11 22v3M20 22v3"/></>,
  pixelRobot: <><rect x="7" y="7" width="18" height="15"/><path d="M16 4v3M11 11h3M18 11h3M12 17h8M10 22v3M22 22v3"/></>,
  pixelElf: <><path d="M12 8h8l5 4-5 6h-8l-5-6z"/><path d="M10 8 4 4l3 9M22 8l6-4-3 9"/><path d="M12 18v6M20 18v6"/></>,
  pixelHero: <><path d="M9 6h14v6l4 4-5 7H9l-5-7 5-4z"/><path d="M13 12h6M11 23v3M21 23v3"/></>,
  pixelDragon: <><path d="m8 10 3-5 5 3 5-3 3 5-3 9H11z"/><path d="M11 14h3M18 14h3M13 19h6M9 18l-4 4M23 18l4 4"/></>,
};

const RASTER = {
  party:'/assets/ui/reference/nav-multiplayer-icon.png',
  attack:'/assets/ui/reference/attack-skill-icon.png',
  heart:'/assets/ui/reference/heart-icon.png',
  shield:'/assets/ui/reference/shield-icon.png',
  energy:'/assets/ui/reference/energy-icon.png',
  lock:'/assets/ui/reference/lock-icon.png',
  pixelNinja:'/assets/characters/traveler/idle/01.png',
};

export default function PixelIcon({name,size=18,title,className=''}){
  const raster = RASTER[name];
  if(raster){
    return <img className={`pixel-icon pixel-icon-raster ${className}`} src={raster} width={size} height={size} alt={title||''} aria-hidden={title?undefined:'true'} draggable="false" />;
  }
  return <svg className={`pixel-icon ${className}`} width={size} height={size} viewBox="0 0 32 32" aria-hidden={title?undefined:'true'} role={title?'img':undefined} focusable="false">
    {title && <title>{title}</title>}
    <g fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="square" strokeLinejoin="miter" shapeRendering="crispEdges">{SHAPES[name]||SHAPES.star}</g>
  </svg>;
}
