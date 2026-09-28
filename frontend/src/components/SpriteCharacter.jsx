import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { getPlayerAsset, resolvePlayerSequence } from '../data/playerAssets';

const ONE_SHOT_MODES = new Set(['attack', 'hurt', 'die']);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
const easeInOutSine = (x) => -(Math.cos(Math.PI * x) - 1) / 2;

function load(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(src));
    image.src = src;
  });
}

const SpriteCharacter = forwardRef(function SpriteCharacter(
  { size = 280, className = '', onImpact },
  ref,
) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const impactRef = useRef(onImpact);

  useEffect(() => {
    impactRef.current = onImpact;
  }, [onImpact]);

  const asset = getPlayerAsset();
  const durationFor = (mode) => asset.sequences[mode]?.step || 120;
  const stateRef = useRef({
    mode: 'idle',
    startedAt: 0,
    images: {},
    ready: false,
    impactFired: false,
    distance: 180,
  });

  useEffect(() => {
    let alive = true;
    const state = stateRef.current;

    (async () => {
      const entries = await Promise.all(
        Object.entries(asset.sequences).map(async ([mode, sequence]) => {
          const loaded = await Promise.all(
            sequence.frames.map(async (name) => {
              try {
                return await load(`${asset.base}/${mode}/${name}`);
              } catch (error) {
                console.warn('[Player] missing sprite', `${mode}/${name}`);
                return null;
              }
            }),
          );
          return [mode, loaded.filter(Boolean)];
        }),
      );

      if (!alive) return;
      state.images = Object.fromEntries(entries);
      state.ready = true;
      state.mode = 'idle';
      state.startedAt = performance.now();
    })();

    const tick = (now) => {
      const canvas = canvasRef.current;
      const state = stateRef.current;
      if (!canvas) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const dpr = Math.min(window.devicePixelRatio || 1.5, 2);
      const logicalW = size;
      const logicalH = Math.round(size * 1.14);
      const pixelW = Math.round(logicalW * dpr);
      const pixelH = Math.round(logicalH * dpr);

      if (canvas.width !== pixelW || canvas.height !== pixelH) {
        canvas.width = pixelW;
        canvas.height = pixelH;
      }

      // The bitmap keeps its logical resolution while the visual canvas follows
      // the responsive fighter wrapper. Motion uses the same scale factor so
      // attack/hurt animations remain proportional on phones.
      const parentWidth = canvas.parentElement?.getBoundingClientRect().width || logicalW;
      const visualScale = clamp(parentWidth / logicalW, 0.2, 1);
      canvas.style.width = `${logicalW * visualScale}px`;
      canvas.style.height = `${logicalH * visualScale}px`;

      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, logicalW, logicalH);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      let mode = state.mode;
      let frames = state.images[mode] || [];
      let elapsed = Math.max(0, now - state.startedAt);
      const step = durationFor(mode);
      const total = frames.length * step;

      // One-shot states return to idle in the same render tick. There is no
      // cleared frame between the attack/hurt animation and idle.
      if (ONE_SHOT_MODES.has(mode) && mode !== 'die' && elapsed >= total) {
        state.mode = 'idle';
        state.startedAt = now;
        state.impactFired = false;
        mode = 'idle';
        frames = state.images.idle || [];
        elapsed = 0;
      }

      if (frames.length) {
        const activeStep = durationFor(mode);
        const activeTotal = frames.length * activeStep;
        const rawFrame = Math.floor(elapsed / activeStep);
        const frameIndex = mode === 'die'
          ? Math.min(frames.length - 1, rawFrame)
          : rawFrame % frames.length;

        // Trigger gameplay impact from the same discrete frame timeline used
        // to render the sprite. This prevents timing drift between art and hit.
        if (mode === 'attack' && !state.impactFired) {
          const impactFrame = asset.sequences.attack?.impactFrame ?? Math.max(0, frames.length - 2);
          if (frameIndex >= impactFrame) {
            state.impactFired = true;
            impactRef.current?.();
          }
        }


        const image = frames[frameIndex];
        const fit = Math.min(logicalW / image.width, logicalH / image.height) * 0.985;
        const w = image.width * fit;
        const h = image.height * fit;
        const baseX = (logicalW - w) / 2;
        const baseY = logicalH - h;

        let motionX = 0;
        let motionY = 0;
        let rotation = 0;
        let scaleMul = 1;
        let alpha = 1;

        if (mode === 'idle') {
          const breath = Math.sin(elapsed / 1420);
          const weight = Math.sin(elapsed / 2760 + 0.35);
          motionY = breath * 0.75;
          motionX = weight * 0.28;
          rotation = weight * 0.0015;
          scaleMul = 1 + breath * 0.0025;
        } else if (mode === 'attack') {
          const attackTotal = Math.max(activeTotal - activeStep, activeStep);
          const p = clamp(elapsed / attackTotal, 0, 1);
          const travelCss = Math.max(48, Number.isFinite(state.distance) ? state.distance : 180);
          const travel = clamp(travelCss / Math.max(visualScale, 0.2), 120, 1200);
          const f = p < 0.16
            ? 0.06 * (p / 0.16)
            : p < 0.66
              ? 0.06 + 0.94 * easeOutCubic((p - 0.16) / 0.50)
              : 1 - (p - 0.66) / 0.34;
          motionX = Math.max(0, f) * travel;
          motionY = -easeInOutSine(p) * 4.5;
          rotation = -easeInOutSine(p) * 0.03;
          scaleMul = 1 + easeInOutSine(p) * 0.024;
        } else if (mode === 'hurt') {
          const p = clamp(elapsed / Math.max(activeTotal, 1), 0, 1);
          const decay = 1 - p;
          motionX = Math.sin(elapsed / 24) * 6.2 * decay;
          motionY = Math.abs(Math.sin(elapsed / 38)) * 1.2 * decay;
          rotation = Math.sin(elapsed / 22) * 0.014 * decay;
          scaleMul = 1 - 0.012 * Math.sin(Math.PI * p);
        } else if (mode === 'die') {
          const p = clamp(elapsed / Math.max(activeTotal, 1), 0, 1);
          motionY = 10 * easeOutCubic(p);
          rotation = -0.10 * p;
          scaleMul = 1 - 0.08 * p;
          alpha = 1 - 0.18 * p;
        }

        ctx.save();
        ctx.globalAlpha = 0.24 * alpha;
        ctx.filter = 'none';
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(logicalW / 2, logicalH - 6, Math.max(32, w * 0.22), 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.translate(logicalW / 2, logicalH / 2);
        ctx.rotate(rotation);
        ctx.scale(scaleMul, scaleMul);
        ctx.translate(-logicalW / 2, -logicalH / 2);

        // Motion is applied to the canvas element itself. Drawing beyond the
        // canvas bitmap clips the attack pose, so never place the sprite body
        // outside the bitmap when performing a lunge. This mirrors the stable
        // transform pipeline used by the V57 reference implementation.
        canvas.style.transform = `translate3d(${(motionX * visualScale).toFixed(2)}px, ${(motionY * visualScale).toFixed(2)}px, 0)`;
        canvas.style.transformOrigin = '50% 100%';
        const x = baseX;
        const y = baseY;

        if (mode === 'attack') {
          const p = clamp(elapsed / Math.max(activeTotal, 1), 0, 1);
          const intensity = Math.sin(Math.PI * p);
          const ring = Math.min(w, h) * (0.18 + 0.09 * intensity);
          ctx.save();
          ctx.globalAlpha = 0.07 + intensity * 0.15;
          ctx.strokeStyle = '#8beaff';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(logicalW / 2, logicalH * 0.57, ring, 0, Math.PI * 2);
          ctx.stroke();
          // Keep the attack readable even when a frame is visually sparse.
          const slash = Math.min(logicalW * 0.44, 118) * intensity;
          ctx.globalAlpha = 0.10 + intensity * 0.22;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(logicalW * 0.50, logicalH * 0.48);
          ctx.lineTo(logicalW * 0.50 + slash, logicalH * 0.39);
          ctx.stroke();
          ctx.restore();
        }

        ctx.save();
        // Keep the sprite crisp: sprite-frame animation itself is discrete;
        // motion is smoothed by the time-based lunge rather than blur.
        ctx.globalAlpha = alpha;
        ctx.filter = 'none';
        ctx.drawImage(image, 0, 0, image.width, image.height, x, y, w, h);
        ctx.restore();
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [asset, size]);

  useImperativeHandle(ref, () => ({
    play(mode = 'attack', options = {}) {
      const state = stateRef.current;
      const safeMode = resolvePlayerSequence(mode);
      if (!state.images[safeMode]?.length) return false;
      state.mode = safeMode;
      state.startedAt = performance.now();
      state.impactFired = false;
      if (Number.isFinite(options.distance)) state.distance = options.distance;
      return true;
    },
    idle() {
      const state = stateRef.current;
      state.mode = 'idle';
      state.startedAt = performance.now();
      state.impactFired = false;
    },
    ready: () => stateRef.current.ready,
    modes: () => Object.keys(asset.sequences),
  }), [asset]);

  return (
    <div className={`sprite-wrap ${className}`}>
      <canvas ref={canvasRef} aria-label="The Traveler" />
    </div>
  );
});

export default SpriteCharacter;
