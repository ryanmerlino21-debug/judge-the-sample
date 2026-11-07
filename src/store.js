import { useEffect, useReducer } from "react";
// In-memory store for the current result of each experiment, so results survive switching tabs.
// Re-running an experiment replaces its entry; nothing is saved to disk or pooled.
const data = { methods: null, size: null, challenge: null };
const listeners = new Set();
export const getResult = (key) => data[key];
export function setResult(key, value) { data[key] = value; listeners.forEach((f) => f()); }
export function useResults() {
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => { listeners.add(force); return () => { listeners.delete(force); }; }, []);
  return data;
}
// Seed-check and sample-size-curve results use a plain cache.
export const cache = {};
