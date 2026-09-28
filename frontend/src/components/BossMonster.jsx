import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { getBoss } from '../data/bosses';
import {
  getBossAsset,
  getBossImpactMs,
  resolveBossSequence,
} from '../data/bossAssets';

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

const WebPBossSprite = forwardRef(function WebPBossSprite({ size, boss, onImpact }, ref) {
  const asset = getBossAsset(boss.spriteId);
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const impactRef = useRef(onImpact);
  const stateRef = useRef({
    mode: 'idle',
    startedAt: 0,
    images: {},
    effects: {},
    ready: false,
    impactFired: false,
    distance: 180,
    pending: null,
  });

  useEffect(() => {
    impactRef.current = onImpact;
  }, [onImpact]);

  const durationFor = (mode) => asset?.sequences?.[mode]?.step || 160;

  const startAction = (action = 'idle', options = {}) => {
    const state = stateRef.current;
    const next = resolveBossSequence(boss.spriteId, action) || 'idle';
    if (!state.images[next]?.length) return false;

    state.mode = next;
    state.startedAt = performance.now();
    state.impactFired = false;
    if (Number.isFinite(options.distance)) state.distance = Math.max(110, options.distance);
    return true;
  };

  useEffect(() => {
    let alive = true;
    const state = stateRef.current;

    const sequenceEntries = Object.entries(asset?.sequences || {});
    const effectEntries = Object.entries(asset?.effects || {});

    (async () => {
      const sequences = await Promise.all(
        sequenceEntries.map(async ([mode, sequence]) => {
          const loaded = await Promise.all(
            sequence.frames.map(async (name) => {
              try {
                return await load(`${asset.base}/${mode}/${name}`);
              } catch (error) {
                console.warn('[Boss] missing sprite', `${mode}/${name}`);
                return null;
              }
            }),
          );
          return [mode, loaded.filter(Boolean)];
        }),
      );

      const effects = await Promise.all(
        effectEntries.map(async ([effectName, sequence]) => {
          const loaded = await Promise.all(
            sequence.frames.map(async (name) => {
              try {
                return await load(`${asset.base}/effects/${effectName}/${name}`);
              } catch (error) {
                console.warn('[Boss] missing effect frame', `${effectName}/${name}`);
                return null;
              }
            }),
          );
          return [effectName, loaded.filter(Boolean)];
        }),
      );

      if (!alive) return;
      state.images = Object.fromEntries(sequences);
      state.effects = Object.fromEntries(effects);
      state.ready = true;
      state.mode = 'idle';
      state.startedAt = performance.now();

      if (state.pending) {
        const pending = state.pending;
        state.pending = null;
        startAction(pending.action, pending.options);
      }
    })();

    const tick = (now) => {
      const canvas = canvasRef.current;
      const state = stateRef.current;
      if (!canvas) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const dpr = Math.min(window.devicePixelRatio || 1.5, 2);
      const logicalW = Math.round(size * 1.42);
      const logicalH = Math.round(size * 1.20);
      const pixelW = Math.round(logicalW * dpr);
      const pixelH = Math.round(logicalH * dpr);

      if (canvas.width !== pixelW || canvas.height !== pixelH) {
        canvas.width = pixelW;
        canvas.height = pixelH;
      }

      // The boss frame shrinks on mobile. Scale both the canvas and lunge motion
      // from the actual responsive frame width so the renderer stays in-bounds.
      const frameWidth = canvas.parentElement?.getBoundingClientRect().width || size;
      const visualScale = clamp(frameWidth / size, 0.2, 1);
      canvas.style.width = `${logicalW * visualScale}px`;
      canvas.style.height = `${logicalH * visualScale}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, logicalW, logicalH);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      canvas.style.transformOrigin = '100% 100%';
      canvas.style.willChange = 'transform';
      canvas.style.transform = 'translate3d(0,0,0)';

      let mode = state.mode;
      let frames = state.images[mode] || [];
      let elapsed = Math.max(0, now - state.startedAt);
      const step = durationFor(mode);
      const total = frames.length * step;

      if ((mode === 'attack' || mode === 'hurt') && elapsed >= total) {
        state.mode = 'idle';
        state.startedAt = now;
        state.impactFired = false;
        mode = 'idle';
        frames = state.images.idle || [];
        elapsed = 0;
      }

      if (!frames.length) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const activeStep = durationFor(mode);
      const activeTotal = frames.length * activeStep;
      const rawFrame = Math.floor(elapsed / activeStep);
      const frame = mode === 'die'
        ? Math.min(frames.length - 1, rawFrame)
        : rawFrame % frames.length;
      const image = frames[frame];

      if (mode === 'attack' && !state.impactFired) {
        const impactMs = getBossImpactMs(boss.spriteId, 'attack', 320);
        if (elapsed >= impactMs) {
          state.impactFired = true;
          impactRef.current?.();
        }
      }

      const fit = Math.min(size / image.width, (size * 1.20) / image.height) * 0.985;
      const w = image.width * fit;
      const h = image.height * fit;
      const baseX = logicalW - w - Math.max(0, size * 0.012);
      const baseY = logicalH - h;

      const attackTotal = Math.max(activeTotal - activeStep, activeStep);
      const p = mode === 'attack'
        ? clamp(elapsed / attackTotal, 0, 1)
        : clamp(elapsed / Math.max(activeTotal, 1), 0, 1);
      const travelCss = Math.max(48, Number.isFinite(state.distance) ? state.distance : 180);
      const travel = clamp(travelCss / Math.max(visualScale, 0.2), 110, 1200);

      let motionX = 0;
      let motionY = 0;
      let rotation = 0;
      let scale = 1;
      let alpha = 1;

      if (mode === 'idle') {
        motionY = Math.sin(elapsed / 1350) * 2;
        scale = 1 + Math.sin(elapsed / 1800) * 0.004;
      } else if (mode === 'attack') {
        const f = p < 0.18
          ? 0.04 * (p / 0.18)
          : p < 0.68
            ? 0.04 + 0.96 * easeOutCubic((p - 0.18) / 0.50)
            : Math.max(0, 1 - ((p - 0.68) / 0.32));
        motionX = -Math.max(0, f) * travel;
        motionY = -easeInOutSine(p) * 3.5;
        rotation = -easeInOutSine(p) * 0.024;
        scale = 1 + easeInOutSine(p) * 0.022;
      } else if (mode === 'hurt') {
        const decay = 1 - p;
        motionX = Math.sin(elapsed / 22) * 7 * decay;
        rotation = Math.sin(elapsed / 20) * 0.014 * decay;
      } else if (mode === 'die') {
        motionY = 14 * p;
        rotation = -0.09 * p;
        scale = 1 - 0.08 * p;
        alpha = 1 - 0.20 * p;
      }

      const drawShadow = () => {
        ctx.save();
        ctx.globalAlpha = 0.22 * alpha;
        ctx.filter = 'none';
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(baseX + w / 2, logicalH - 5, Math.max(36, w * 0.23), 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      const drawElementAttack = () => {
        if (mode !== 'attack') return;
        const effectFrames = state.effects.attackElement || [];
        const effectConfig = asset?.effects?.attackElement;
        if (!effectFrames.length || !effectConfig) return;

        const effectElapsed = Math.min(
          elapsed,
          effectFrames.length * effectConfig.step - 1,
        );
        const effectFrameIndex = Math.min(
          effectFrames.length - 1,
          Math.floor(Math.max(0, effectElapsed) / effectConfig.step),
        );
        const effectImage = effectFrames[effectFrameIndex];
        const effectW = Math.min(size * 0.86, effectImage.width * 0.92);
        const effectH = effectImage.height * (effectW / effectImage.width);
        const beamRight = baseX + w * 0.26;
        const beamY = baseY + h * 0.28;
        const fadeIn = clamp(p / 0.12, 0, 1);
        const fadeOut = clamp((1 - p) / 0.18, 0, 1);
        const beamAlpha = 0.18 + 0.82 * Math.min(fadeIn, fadeOut);

        ctx.save();
        ctx.globalAlpha = beamAlpha;
        ctx.globalCompositeOperation = 'screen';
        ctx.translate(beamRight, beamY);
        ctx.scale(-1, 1);
        ctx.drawImage(effectImage, 0, 0, effectImage.width, effectImage.height, 0, 0, effectW, effectH);
        ctx.restore();
      };

      drawShadow();

      ctx.save();
      ctx.translate(logicalW / 2, logicalH / 2);
      ctx.rotate(rotation);
      ctx.scale(scale, scale);
      ctx.translate(-logicalW / 2, -logicalH / 2);

      canvas.style.transform = `translate3d(${(motionX * visualScale).toFixed(2)}px, ${(motionY * visualScale).toFixed(2)}px, 0)`;

      drawElementAttack();

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.filter = 'none';
      ctx.drawImage(image, 0, 0, image.width, image.height, baseX, baseY, w, h);
      ctx.restore();

      if (mode === 'attack') {
        const intensity = Math.sin(Math.PI * p);
        ctx.save();
        ctx.globalAlpha = 0.04 + intensity * 0.10;
        ctx.strokeStyle = boss.accent;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(baseX + w * 0.30, baseY + h * 0.58, Math.min(w, h) * (0.18 + 0.08 * intensity), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [asset, boss, size]);

  useImperativeHandle(ref, () => ({
    play(action = 'attack', options = {}) {
      const state = stateRef.current;
      if (!state.ready || !state.images[resolveBossSequence(boss.spriteId, action)]) {
        state.pending = { action, options };
        return true;
      }
      return startAction(action, options);
    },
    idle() {
      const state = stateRef.current;
      state.pending = null;
      if (!state.ready) return;
      startAction('idle');
    },
  }), [boss]);

  return (
    <div
      className={`asset-boss-sprite-v40 asset-boss-${boss.spriteId}-v40 asset-boss-canvas-v62`}
      style={{ width: size, height: Math.round(size * 1.20), '--boss-accent': boss.accent }}
      aria-label={`${boss.nameEn} boss`}
    >
      <div className="asset-boss-aura-v40" aria-hidden="true" />
      <canvas ref={canvasRef} aria-hidden="true" />
      <div className="asset-boss-ground-v40" aria-hidden="true" />
    </div>
  );
});

const BossMonster = forwardRef(function BossMonster({ levelId, size = 310, onImpact }, ref) {
  const boss = getBoss(levelId);
  const spriteRef = useRef(null);

  useImperativeHandle(ref, () => ({
    play(action = 'attack', options = {}) {
      return spriteRef.current?.play(action, options);
    },
    idle() {
      spriteRef.current?.idle();
    },
  }), []);

  return (
    <WebPBossSprite
      ref={spriteRef}
      size={size}
      boss={boss}
      onImpact={onImpact}
    />
  );
});

export default BossMonster;
