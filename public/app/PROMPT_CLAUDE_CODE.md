Necesito mejorar una aplicación web local en HTML, CSS y JavaScript puro para imprimir etiquetas térmicas adhesivas con código de barras, reemplazando una herramienta paga llamada Label LIVE.

Contexto real:
- Empresa: ALISAN PG S.A.S.
- Impresora: DigitalPOS térmica.
- Rollo: etiquetas térmicas adhesivas de 5 × 3 cm.
- Formato físico: 2 columnas por fila.
- Cada sticker debe mostrar:
  1. Nombre del producto arriba a la izquierda.
  2. Fecha arriba a la derecha.
  3. Código de barras centrado.
  4. Número del código debajo del barcode.
  5. Empresa abajo a la izquierda.
  6. Precio abajo a la derecha.

Configuración principal que debe quedar lista:
- Papel/fila: 102 mm × 30 mm.
- Etiqueta: 50 mm × 30 mm.
- Columnas: 2.
- Separación central: 2 mm.
- Márgenes: 0 mm.
- DPI de referencia: 300.
- Escala: 100%.
- @page en CSS debe usar size: 102mm 30mm; margin: 0;

También quiero un preset alternativo basado en la configuración visible de Label LIVE:
- Page Layout: Avery 5267.
- Page Size: 6 × 1 pulgadas.
- Edge Margin Left: 0.3 pulgadas.
- Label Spacing: 0.1 pulgadas.
- Scaling: 100%.
- Configuration: 300 DPI.
- 2 etiquetas por fila.

Requisitos técnicos:
- No usar librerías externas.
- No usar backend.
- Que funcione abriendo index.html en Chrome o Edge.
- Mantener arquitectura Onion:
  - domain/entities
  - domain/presets
  - domain/services
  - application/use-cases
  - infrastructure/csv
  - infrastructure/printing
  - infrastructure/storage
  - presentation/components
- Generar barcode CODE128 en SVG.
- Permitir cargar CSV.
- Detectar encabezados con alias: PRODUCTO, NOMBRE, DESCRIPCION, CODIGO, SKU, BARCODE, FECHA, EMPRESA, PRECIO.
- Permitir seleccionar qué filas imprimir.
- Botón para imprimir solo una prueba de 1 sticker para no gastar el rollo.
- Control para saltar 0 o 1 sticker inicial si ya se usó la primera columna.
- Pantalla de configuración con preset DigitalPOS 5×3 cm y preset Label LIVE Avery 5267.
- Controles para margen izquierdo, margen superior, separación central, padding interno, alto de barras y tamaños de texto.
- Incluir guía en pantalla: escala 100%, márgenes ninguno, encabezados/pies desactivados, papel personalizado 102 mm × 30 mm.

Resultado esperado:
- El sticker debe quedar como el ejemplo bueno: todo dentro de una sola etiqueta, sin partirse entre varios stickers.
- No debe salir como el ejemplo malo donde el contenido se atraviesa y se lleva varias etiquetas.
