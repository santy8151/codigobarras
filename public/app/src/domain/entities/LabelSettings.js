(function initLabelSettings(global) {
  global.Alisan = global.Alisan || {};
  global.Alisan.domain = global.Alisan.domain || {};
  global.Alisan.domain.entities = global.Alisan.domain.entities || {};

  const DEFAULT_SETTINGS = Object.freeze({
    presetId: 'digitalpos_5x3_2col',
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
