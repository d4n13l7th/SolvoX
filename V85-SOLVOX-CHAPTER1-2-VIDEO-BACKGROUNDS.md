# Solvox V85 — Chapter 1 & 2 Video Background Refresh

## Changes
- Chapter 1 now uses the newly supplied `video2_4x1(1).mp4` (first uploaded video), mapped to `level1/chapter1-arena.mp4`.
- Chapter 2 now uses the newly supplied `video_4x1(1).mp4` (second uploaded video), mapped to `level2/chapter2-arena.mp4`.
- Both videos keep the existing 4:1 battle-background renderer and require no layout change.
- Poster fallbacks were regenerated from the first frame of each new video.
- No new background renderer or duplicate stylesheet was introduced.
- The previous Chapter 1/2 video files were replaced in-place, so existing `BACKGROUNDS` wiring remains the single source of truth.

## QA
- Confirmed both videos are H.264 MP4 and 4:1.
- Confirmed `backgrounds.js` still points to the same chapter 1/2 paths.
- Confirmed chapter 1/2 poster files remain referenced and match the new videos.
- ZIP integrity check passed.
