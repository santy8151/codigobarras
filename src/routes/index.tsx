import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Alisan Label Print — DigitalPOS 5×3 cm" },
      {
        name: "description",
        content:
          "Imprime etiquetas térmicas adhesivas con código de barras CODE128 para impresora DigitalPOS.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  useEffect(() => {
    window.location.replace("/app/index.html");
  }, []);
  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      Cargando aplicación… Si no carga,{" "}
      <a href="/app/index.html">haz clic aquí</a>.
    </div>
  );
}
