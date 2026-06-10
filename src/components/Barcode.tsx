import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

type Props = {
  value: string;
  format?: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
};

export function Barcode({
  value,
  format = "CODE128",
  width = 2,
  height = 60,
  displayValue = true,
  fontSize = 16,
}: Props) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    try {
      JsBarcode(ref.current, value || " ", {
        format,
        width,
        height,
        displayValue,
        fontSize,
        margin: 0,
      });
    } catch (e) {
      // ignore invalid value
    }
  }, [value, format, width, height, displayValue, fontSize]);

  return <svg ref={ref} style={{ width: "100%", height: "100%" }} />;
}
