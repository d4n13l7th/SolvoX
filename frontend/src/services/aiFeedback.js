import { apiUrl } from '../config';

// Optional AI feedback adapter (V108).
//
// This is a progressive enhancement only, and it is OFF by default. The Worker
// has no /api/ai-feedback route, so there is nothing to call until a backend
// route is deployed. Point the endpoint at one with either:
//
//   globalThis.__SOLVOX_AI_FEEDBACK_ENDPOINT__ = 'https://...'
//   VITE_SOLVOX_AI_FEEDBACK_ENDPOINT=... at build time
//
// With no endpoint configured we return `fallback` synchronously: no fetch, no
// wasted round trip, no console noise on every wrong answer. `apiUrl()` is
// still used for the real call so it reaches the backend host instead of 404ing
// against the Vercel origin.
//
// Every failure path -- non-2xx, timeout, malformed body, throw -- also
// resolves to `fallback`, so the battle always keeps the local,
// question-authored feedback.
const getEndpoint = () =>
  globalThis.__SOLVOX_AI_FEEDBACK_ENDPOINT__ ||
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SOLVOX_AI_FEEDBACK_ENDPOINT) ||
  '';

export async function enhanceFeedback(payload, fallback) {
  const endpoint = getEndpoint();
  if (!endpoint) return fallback;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);

  try {
    const response = await fetch(apiUrl(endpoint), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!response.ok) return fallback;

    const data = await response.json();
    if (!data?.message) return fallback;

    return {
      ...fallback,
      message: String(data.message),
      nextStep: data.nextStep ? String(data.nextStep) : fallback.nextStep,
      source: 'ai',
    };
  } catch {
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}
