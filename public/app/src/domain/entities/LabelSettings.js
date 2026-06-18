(function initLabelSettings(global) {
  global.Alisan = global.Alisan || {};
  global.Alisan.domain = global.Alisan.domain || {};
  global.Alisan.domain.entities = global.Alisan.domain.entities || {};

  const DEFAULT_SETTINGS = Object.freeze({
    presetId: 'rollo_105x25_2col',
    pageWidthMm: 105,
    pageHeightMm: 25,
    labelWidthMm: 47,
    labelHeightMm: 25,
    columns: 2,
    columnGapMm: 3,
    rowGapMm: 0,
    marginLeftMm: 4,
    marginTopMm: 0,
    marginRightMm: 4,
    marginBottomMm: 0,
    labelPaddingMm: 2.5,
    barcodeHeightMm: 7,
    productFontMm: 1.65,
    dateFontMm: 1.55,
    codeFontMm: 1.6,
    footerFontMm: 1.75,
    priceFontMm: 1.85,
    dpi: 300,
    scaling: 100,
    rotate: 0,
    debugOutlines: 0,
    blankColumn: 'none',
  });

  function toNumber(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function sanitizeSettings(input) {
    const raw = Object.assign({}, DEFAULT_SETTINGS, input || {});
    const settings = {
      presetId: raw.presetId || DEFAULT_SETTINGS.presetId,
      blankColumn: ['none', 'left', 'right'].includes(raw.blankColumn) ? raw.blankColumn : 'none',
    };
    Object.keys(DEFAULT_SETTINGS).forEach((key) => {
      if (key === 'presetId' || key === 'blankColumn') return;
      settings[key] = toNumber(raw[key], DEFAULT_SETTINGS[key]);
    });

    settings.columns = Math.max(1, Math.min(2, Math.round(settings.columns)));
    settings.pageWidthMm = Math.max(20, settings.pageWidthMm);
    settings.pageHeightMm = Math.max(10, settings.pageHeightMm);
    settings.labelWidthMm = Math.max(20, settings.labelWidthMm);
    settings.labelHeightMm = Math.max(10, settings.labelHeightMm);
    settings.columnGapMm = Math.max(0, settings.columnGapMm);
    settings.rowGapMm = Math.max(0, settings.rowGapMm);
    settings.marginLeftMm = Math.max(0, settings.marginLeftMm);
    settings.marginTopMm = Math.max(0, settings.marginTopMm);
    settings.marginRightMm = Math.max(0, settings.marginRightMm);
    settings.marginBottomMm = Math.max(0, settings.marginBottomMm);
    settings.labelPaddingMm = Math.max(0, settings.labelPaddingMm);
    settings.barcodeHeightMm = Math.max(4, settings.barcodeHeightMm);
    settings.dpi = Math.max(203, Math.round(settings.dpi));
    settings.scaling = Math.max(10, Math.min(200, settings.scaling));
    settings.rotate = Number(settings.rotate) === 90 ? 90 : 0;
    settings.debugOutlines = Number(settings.debugOutlines) ? 1 : 0;
    return settings;
  }

  function getContentWidthMm(settings) {
    const s = sanitizeSettings(settings);
    return s.marginLeftMm + s.marginRightMm + (s.labelWidthMm * s.columns) + (s.columnGapMm * (s.columns - 1));
  }

  function getContentHeightMm(settings) {
    const s = sanitizeSettings(settings);
    return s.marginTopMm + s.marginBottomMm + s.labelHeightMm;
  }

  function getPageWidthMm(settings) {
    const s = sanitizeSettings(settings);
    return Math.max(s.pageWidthMm, getContentWidthMm(s));
  }

  function getPageHeightMm(settings) {
    const s = sanitizeSettings(settings);
    return Math.max(s.pageHeightMm, getContentHeightMm(s));
  }

  function getDriverSummary(settings) {
    const s = sanitizeSettings(settings);
    return {
      widthMm: getPageWidthMm(s),
      heightMm: getPageHeightMm(s),
      widthIn: getPageWidthMm(s) / 25.4,
      heightIn: getPageHeightMm(s) / 25.4,
      dpi: s.dpi,
      scaling: s.scaling,
    };
  }

  global.Alisan.domain.entities.LabelSettings = {
    DEFAULT_SETTINGS,
    sanitizeSettings,
    getContentWidthMm,
    getContentHeightMm,
    getPageWidthMm,
    getPageHeightMm,
    getDriverSummary,
  };
})(window);
