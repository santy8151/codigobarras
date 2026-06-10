import type { LabelDesign } from "./label-types";

const KEY = "label_designs_v1";

export function loadDesigns(): LabelDesign[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveDesigns(designs: LabelDesign[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(designs));
}
