# Alisan Label Print - DigitalPOS 5×3 cm / 2 columnas

Aplicación gratis en HTML + JavaScript para imprimir etiquetas térmicas adhesivas con código de barras tipo Label LIVE, sin licencia paga.

## Configuración principal incluida

Preset recomendado para el rollo de las fotos:

- Impresora: DigitalPOS térmica
- Papel/fila: 102 mm × 30 mm
- Etiquetas: 2 columnas
- Medida de cada sticker: 50 mm × 30 mm
- Separación central: 2 mm
- Márgenes: 0 mm
- Resolución guía: 300 DPI
- Escala: 100%

También se agregó un preset llamado **Copia visual Label LIVE: Avery 5267 / 300 DPI**, basado en la configuración visible en las capturas:

- Page Layout: Avery 5267
- Page Size: 6 × 1 pulgadas
- Edge Margin Left: 0.3 pulgadas
- Label Spacing: 0.1 pulgadas
- Scaling: 100%
- Configuration: 300 DPI
- 2 etiquetas por fila

> Nota: no se copió código propietario de Label LIVE. Se tradujeron las medidas visibles a una configuración propia en CSS/JS.

## Cómo usar

1. Abre `index.html` en Chrome o Edge.
2. Carga tu CSV o pega los datos.
3. Revisa que el CSV tenga campos como:
   - `PRODUCTO`
   - `CODIGO`
   - `FECHA`
   - `EMPRESA`
   - `PRECIO`
4. Presiona **Prueba 1 sticker** antes de imprimir todo.
5. En la ventana de impresión:
   - Escala: 100%
   - Márgenes: ninguno
   - Encabezados y pies: desactivados
   - Papel personalizado: 102 mm × 30 mm

## Si la impresión sale mal

- Sale corrida hacia la derecha: baja el margen izquierdo.
- Sale corrida hacia la izquierda: sube el margen izquierdo.
- Sale muy arriba: sube el margen superior.
- Sale muy abajo: baja el margen superior.
- Sale atravesada: usa Rotación 90° en la pestaña Impresora.
- Se está gastando muchas etiquetas: el driver está imprimiendo en A4/Carta. Cambia el tamaño de papel a 102 mm × 30 mm.

## Arquitectura Onion

```text
src/
  domain/
    entities/
    presets/
    services/
  application/
    use-cases/
  infrastructure/
    csv/
    printing/
    storage/
  presentation/
    components/
```

## Código de barras

La app genera CODE128 directamente en SVG. No necesita internet ni librerías externas.
