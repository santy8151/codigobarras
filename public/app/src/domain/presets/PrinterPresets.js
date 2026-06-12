(function initPrinterPresets(global) {
  global.Alisan = global.Alisan || {};
  global.Alisan.domain = global.Alisan.domain || {};
  global.Alisan.domain.presets = global.Alisan.domain.presets || {};

  const PRESETS = Object.freeze({
    digitalpos_5x3_2col: Object.freeze({
      id: 'digitalpos_5x3_2col',
      name: 'DigitalPOS borde completo 102 x 30 mm / 2 stickers',
      note: 'Preset principal para imprimir pegado al borde del papel: hoja 102 x 30 mm, 2 stickers de 50 x 30 mm, separación central 2 mm, márgenes en cero y escala 100%.',
      settings: Object.freeze({
        pageWidthMm: 102,
        pageHeightMm: 30,
        labelWidthMm: 50,
        labelHeightMm: 30,
        columns: 2,
        columnGapMm: 2,
        rowGapMm: 0,
        marginLeftMm: 0,
        marginTopMm: 0,
        marginRightMm: 0,
        marginBottomMm: 0,
        labelPaddingMm: 1.65,
        barcodeHeightMm: 8.4,
        productFontMm: 1.95,
        dateFontMm: 1.85,
        codeFontMm: 1.95,
        footerFontMm: 2.05,
        priceFontMm: 2.2,
        dpi: 300,
        scaling: 100,
        rotate: 0,
        debugOutlines: 0,
      }),
    }),
    label_live_visible_5267: Object.freeze({
      id: 'label_live_visible_5267',
      name: 'Copia visual Label LIVE: Avery 5267 / 300 DPI',
      note: 'Traducción de la configuración visible en tus capturas: Page Layout Avery 5267, página 6×1 in, margen izquierdo 0.3 in, separación 0.1 in, escala 100%, 2 etiquetas.',
      settings: Object.freeze({
        pageWidthMm: 152.4,
        pageHeightMm: 25.4,
        labelWidthMm: 50.8,
        labelHeightMm: 25.4,
        columns: 2,
        columnGapMm: 2.54,
        rowGapMm: 2.54,
        marginLeftMm: 7.62,
        marginTopMm: 0,
        marginRightMm: 0,
        marginBottomMm: 0,
        labelPaddingMm: 1.4,
        barcodeHeightMm: 7.1,
        productFontMm: 1.75,
        dateFontMm: 1.7,
        codeFontMm: 1.8,
        footerFontMm: 1.95,
        priceFontMm: 2.1,
        dpi: 300,
        scaling: 100,
        rotate: 0,
        debugOutlines: 0,
      }),
    }),
    digitalpos_5x3_safe_margin: Object.freeze({
      id: 'digitalpos_5x3_safe_margin',
      name: 'DigitalPOS 5×3 cm con margen seguro',
      note: 'Úsalo si la impresión se come el borde izquierdo o superior. Mantiene el rollo 5×3 cm pero entra 1 mm.',
      settings: Object.freeze({
        pageWidthMm: 102,
        pageHeightMm: 30,
        labelWidthMm: 49,
        labelHeightMm: 29.2,
        columns: 2,
        columnGapMm: 3,
        rowGapMm: 0,
        marginLeftMm: 0.7,
        marginTopMm: 0.4,
        marginRightMm: 0,
        marginBottomMm: 0,
        labelPaddingMm: 1.45,
        barcodeHeightMm: 8,
        productFontMm: 1.85,
        dateFontMm: 1.75,
        codeFontMm: 1.85,
        footerFontMm: 1.95,
        priceFontMm: 2.1,
        dpi: 300,
        scaling: 100,
        rotate: 0,
        debugOutlines: 0,
      }),
    }),
  });

  function getPreset(id) {
    return PRESETS[id] || PRESETS.digitalpos_5x3_2col;
  }

  function list() {
    return Object.values(PRESETS);
  }

  function settingsFor(id) {
    return Object.assign({}, getPreset(id).settings, { presetId: getPreset(id).id });
  }

  global.Alisan.domain.presets.PrinterPresets = { PRESETS, getPreset, list, settingsFor };
})(window);
