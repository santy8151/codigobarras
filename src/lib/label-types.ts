export type ElementType = "text" | "barcode";

export interface LabelElement {
  id: string;
  type: ElementType;
  x: number; // px on canvas
  y: number;
  width: number;
  height: number;
  // text/template value, may contain {VARIABLE}
  value: string;
  fontSize?: number;
  bold?: boolean;
  align?: "left" | "center" | "right";
  barcodeFormat?: string;
  displayValue?: boolean;
}

export interface LabelDesign {
  id: string;
  name: string;
  widthIn: number;
  heightIn: number;
  elements: LabelElement[];
  updatedAt: number;
}

export const DPI = 96; // screen px per inch for design canvas
export const PRINT_DPI = 96; // print uses CSS inches, so this matches

export function inToPx(n: number) {
  return n * DPI;
}

export function newId() {
  return Math.random().toString(36).slice(2, 10);
}

export function interpolate(template: string, row: Record<string, string>) {
  return template.replace(/\{([^}]+)\}/g, (_, k) => row[k.trim()] ?? "");
}
