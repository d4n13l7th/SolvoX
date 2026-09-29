// Each chapter owns one background source. Replacing a chapter only changes its media asset.
export const BACKGROUNDS = {
  1: { type:'video', src:'/assets/backgrounds/level1/chapter1-arena.mp4', poster:'/assets/backgrounds/chapter1-video-poster.jpg', objectPosition:'center center', mobileObjectPosition:'center bottom', brightness:.88, saturation:.98, scale:1.0 },
  2: { type:'video', src:'/assets/backgrounds/level2/chapter2-arena.mp4', poster:'/assets/backgrounds/chapter2-video-poster.jpg', objectPosition:'center center', mobileObjectPosition:'center bottom', brightness:.86, saturation:.96, scale:1.0 },
  3: { type:'video', src:'/assets/backgrounds/level3/chapter3-arena-4x1.mp4', poster:'/assets/backgrounds/level3/chapter3-video-poster-4x1.jpg', objectPosition:'center center', mobileObjectPosition:'center center', brightness:.92, saturation:.98, scale:1.0, fit:'cover', width:'100%', height:'100%', inset:'0' },
  4: { type:'video', src:'/assets/backgrounds/level4/chapter4-arena.mp4', poster:'/assets/backgrounds/level4/chapter4-video-poster.jpg', objectPosition:'center center', mobileObjectPosition:'center bottom', brightness:.94, saturation:1.02, scale:1.0 },
  5: { type:'video', src:'/assets/backgrounds/level5/chapter5-arena.mp4', poster:'/assets/backgrounds/level5/chapter5-video-poster.jpg', objectPosition:'center center', mobileObjectPosition:'center bottom', brightness:.84, saturation:.96, scale:1.0 },
};
