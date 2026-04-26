import DEFAULT_STATE from '../config.json';

export function loadState() {
  try {
    const raw = localStorage.getItem('retirementCalc');
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATE,
      ...parsed,
      settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) },
    };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

export function saveState(s) {
  localStorage.setItem('retirementCalc', JSON.stringify(s));
}

export const state = loadState();
