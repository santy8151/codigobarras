import { Rnd } from "react-rnd";
import { Barcode } from "./Barcode";
import { interpolate, inToPx, type LabelDesign, type LabelElement } from "@/lib/label-types";
import { cn } from "@/lib/utils";

interface Props {
  design: LabelDesign;
  row?: Record<string, string>;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onChange?: (el: LabelElement) => void;
  editable?: boolean;
  scale?: number;
}

export function LabelCanvas({
  design,
  row = {},
  selectedId,
  onSelect,
  onChange,
  editable = false,
  scale = 1,
}: Props) {
  const wPx = inToPx(design.widthIn);
  const hPx = inToPx(design.heightIn);

  return (
    <div
      className={cn(
        "relative bg-white shadow-sm border border-border overflow-hidden",
        editable && "rounded-md"
      )}
      style={{
        width: wPx * scale,
        height: hPx * scale,
      }}
      onMouseDown={(e) => {
        if (editable && e.target === e.currentTarget) onSelect?.(null);
      }}
    >
      <div
        style={{
          width: wPx,
          height: hPx,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "relative",
        }}
      >
        {design.elements.map((el) => {
          const content = renderElement(el, row);
          if (!editable) {
            return (
              <div
                key={el.id}
                style={{
                  position: "absolute",
                  left: el.x,
                  top: el.y,
                  width: el.width,
                  height: el.height,
                }}
              >
                {content}
              </div>
            );
          }
          return (
            <Rnd
              key={el.id}
              size={{ width: el.width, height: el.height }}
              position={{ x: el.x, y: el.y }}
              bounds="parent"
              onDragStop={(_, d) => onChange?.({ ...el, x: d.x, y: d.y })}
              onResizeStop={(_, __, ref, ___, pos) =>
                onChange?.({
                  ...el,
                  width: parseFloat(ref.style.width),
                  height: parseFloat(ref.style.height),
                  x: pos.x,
                  y: pos.y,
                })
              }
              onMouseDown={(e) => {
                e.stopPropagation();
                onSelect?.(el.id);
              }}
              className={cn(
                "group",
                selectedId === el.id
                  ? "outline outline-2 outline-primary"
                  : "hover:outline hover:outline-1 hover:outline-primary/40"
              )}
            >
              <div className="w-full h-full">{content}</div>
            </Rnd>
          );
        })}
      </div>
    </div>
  );
}

function renderElement(el: LabelElement, row: Record<string, string>) {
  const value = interpolate(el.value, row);
  if (el.type === "barcode") {
    return (
      <Barcode
        value={value}
        format={el.barcodeFormat || "CODE128"}
        displayValue={el.displayValue !== false}
        height={el.height - (el.displayValue !== false ? 20 : 0)}
        fontSize={14}
      />
    );
  }
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        fontSize: el.fontSize ?? 14,
        fontWeight: el.bold ? 700 : 400,
        textAlign: el.align ?? "left",
        lineHeight: 1.15,
        whiteSpace: "pre-wrap",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent:
          el.align === "center" ? "center" : el.align === "right" ? "flex-end" : "flex-start",
      }}
    >
      {value}
    </div>
  );
}
