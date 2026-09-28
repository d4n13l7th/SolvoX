// Each chapter owns one background source. Replacing a chapter only changes its media asset.
export const BACKGROUNDS = {
  1: { type:'video', src:'/assets/backgrounds/level1/chapter1-arena.mp4', poster:'/assets/backgrounds/chapter1-video-poster.jpg', objectPosition:'center center', brightness:.88, saturation:.98, scale:1.0 },
  2: { type:'video', src:'/assets/backgrounds/level2/chapter2-arena.mp4', poster:'/assets/backgrounds/chapter2-video-poster.jpg', objectPosition:'center center', brightness:.86, saturation:.96, scale:1.0 },
  3: { type:'image', src:'/assets/backgrounds/level3/chapter3-battle-4x1.png', objectPosition:'center center', brightness:.92, saturation:1.0, scale:1.0, fit:'fill', inset:'0', width:'100%', height:'100%' },
  4: { type:'video', src:'/assets/backgrounds/level4/chapter4-arena.mp4', poster:'/assets/backgrounds/level4/chapter4-video-poster.jpg', objectPosition:'center center', brightness:.94, saturation:1.02, scale:1.0 },
  5: { type:'video', src:'/assets/backgrounds/level5/chapter5-arena.mp4', poster:'/assets/backgrounds/level5/chapter5-video-poster.jpg', objectPosition:'center center', brightness:.84, saturation:.96, scale:1.0 },
};
