import { createFileRoute } from "@tanstack/react-router";
import { LabelEditor } from "@/components/LabelEditor";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Editor de Etiquetas — Diseña e imprime códigos de barras" },
      {
        name: "description",
        content:
          "Diseña etiquetas con códigos de barras, importa datos desde CSV e imprime múltiples etiquetas en lote.",
      },
      { property: "og:title", content: "Editor de Etiquetas" },
      {
        property: "og:description",
        content: "Diseña, edita e imprime etiquetas con códigos de barras.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <LabelEditor />;
}
