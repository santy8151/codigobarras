(function initLabelRenderer(global) {
  global.Alisan = global.Alisan || {};
  global.Alisan.presentation = global.Alisan.presentation || {};
  global.Alisan.presentation.components = global.Alisan.presentation.components || {};

  // Global stores for drag positions + hidden objects (mm units, label-local coords)
  global.AlisanPositions = global.AlisanPositions || (function(){
    try { return JSON.parse(localStorage.getItem('alisan_positions_v1') || '{}'); }
    catch(e){ return {}; }
  })();
  global.AlisanHidden = global.AlisanHidden || (function(){
    try { return JSON.parse(localStorage.getItem('alisan_hidden_v1') || '{}'); }
    catch(e){ return {}; }
  })();

  global.AlisanSavePositions = function(){
    try { localStorage.setItem('alisan_positions_v1', JSON.stringify(global.AlisanPositions)); } catch(e){}
  };
  global.AlisanSaveHidden = function(){
    try { localStorage.setItem('alisan_hidden_v1', JSON.stringify(global.AlisanHidden)); } catch(e){}
  };

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  function defaultPositions(s) {
    const p = s.labelPaddingMm;
    const w = s.labelWidthMm;
    const h = s.labelHeightMm;
    const topH = Math.max(s.productFontMm, s.dateFontMm) * 1.15;
    const barcodeY = p + topH + 0.6;
    const codeY = barcodeY + s.barcodeHeightMm + 0.5;
    return {
      product: { x: p, y: p, w: w * 0.62, h: topH, align: 'left' },
      date:    { x: p + w * 0.62, y: p, w: w - p*2 - w*0.62, h: topH, align: 'right' },
      barcode: { x: p, y: barcodeY, w: w - p*2, h: s.barcodeHeightMm, align: 'center' },
      code:    { x: p, y: codeY, w: w - p*2, h: s.codeFontMm * 1.2, align: 'center' },
      company: { x: p, y: h - p - s.footerFontMm * 1.15, w: w * 0.55, h: s.footerFontMm * 1.15, align: 'left' },
      price:   { x: p + w * 0.55, y: h - p - s.priceFontMm * 1.15, w: w - p*2 - w*0.55, h: s.priceFontMm * 1.15, align: 'right' },
    };
  }

  function getPos(s, key) {
    const defs = defaultPositions(s);
    const def = defs[key];
    const ov = (global.AlisanPositions || {})[key] || {};
    return {
      x: ov.x != null ? ov.x : def.x,
      y: ov.y != null ? ov.y : def.y,
      w: ov.w != null ? ov.w : def.w,
      h: ov.h != null ? ov.h : def.h,
      align: def.align,
    };
  }

  function fieldStyle(pos) {
    return `position:absolute;left:${pos.x}mm;top:${pos.y}mm;width:${pos.w}mm;`;
  }

  function fieldEl(key, inner, pos, extraStyle) {
    return `<div class="lbl-field" data-field="${key}" style="${fieldStyle(pos)}${extraStyle || ''}">${inner}</div>`;
  }

  function isHidden(key) {
    return !!(global.AlisanHidden || {})[key];
  }

  function renderLabel(label, settings) {
    const s = global.Alisan.domain.entities.LabelSettings.sanitizeSettings(settings);
    const debugClass = s.debugOutlines ? ' debug-outline' : '';
    if (!label || label.blank) {
      return `<article class="label blank-label${debugClass}" style="position:relative;width:${s.labelWidthMm}mm;height:${s.labelHeightMm}mm"></article>`;
    }

    const barcodeSvg = global.Alisan.domain.services.Code128Barcode.toSvg(label.code, { className: 'barcode-svg' });

    const parts = [];
    if (!isHidden('producto')) {
      const p = getPos(s, 'product');
      parts.push(fieldEl('producto',
        `<span class="product" style="font-size:${s.productFontMm}mm;line-height:1.05;font-weight:700;display:block;overflow:hidden;">${escapeHtml(label.product)}</span>`,
        p));
    }
    if (!isHidden('fecha')) {
      const p = getPos(s, 'date');
      parts.push(fieldEl('fecha',
        `<span class="date" style="font-size:${s.dateFontMm}mm;line-height:1.05;font-weight:700;display:block;text-align:right;white-space:nowrap;">${escapeHtml(label.date)}</span>`,
        p));
    }
    if (!isHidden('barcode')) {
      const p = getPos(s, 'barcode');
      parts.push(fieldEl('barcode',
        `<div class="barcode-box" style="width:100%;height:${p.h}mm;">${barcodeSvg}</div>`,
        p, `height:${p.h}mm;`));
    }
    if (!isHidden('barcode')) {
      const p = getPos(s, 'code');
      parts.push(fieldEl('code',
        `<div class="code-text" style="font-size:${s.codeFontMm}mm;text-align:center;letter-spacing:.09mm;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(label.code)}</div>`,
        p));
    }
    if (!isHidden('empresa')) {
      const p = getPos(s, 'company');
      parts.push(fieldEl('empresa',
        `<span class="company" style="font-size:${s.footerFontMm}mm;font-weight:500;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(label.company)}</span>`,
        p));
    }
    if (!isHidden('precio')) {
      const p = getPos(s, 'price');
      parts.push(fieldEl('precio',
        `<span class="price" style="font-size:${s.priceFontMm}mm;font-weight:700;display:block;text-align:right;white-space:nowrap;">${escapeHtml(label.price)}</span>`,
        p));
    }

    return `<article class="label${debugClass}" style="position:relative;width:${s.labelWidthMm}mm;height:${s.labelHeightMm}mm;padding:0;overflow:hidden;background:white;color:#000;font-family:Arial,Helvetica,sans-serif;">${parts.join('')}</article>`;
  }

  function renderRow(page, settings) {
    const s = global.Alisan.domain.entities.LabelSettings.sanitizeSettings(settings);
    const labelsHtml = page.map((label) => renderLabel(label, s)).join('');
    return `<div class="print-row" style="height:${s.labelHeightMm}mm;gap:${s.columnGapMm}mm;">${labelsHtml}</div>`;
  }

  function renderPage(page, settings) {
    const s = global.Alisan.domain.entities.LabelSettings.sanitizeSettings(settings);
    const pageWidth = global.Alisan.domain.entities.LabelSettings.getPageWidthMm(s);
    const pageHeight = global.Alisan.domain.entities.LabelSettings.getPageHeightMm(s);
    const rotateClass = s.rotate === 90 ? ' rotate-90' : '';
    return `<section class="print-row-page${rotateClass}" style="width:${pageWidth}mm;height:${pageHeight}mm;padding-left:${s.marginLeftMm}mm;padding-top:${s.marginTopMm}mm;padding-right:${s.marginRightMm}mm;padding-bottom:${s.marginBottomMm}mm;">${renderRow(page, s)}</section>`;
  }

  function renderPages(pages, settings) {
    return pages.map((page) => renderPage(page, settings)).join('');
  }

  global.Alisan.presentation.components.LabelRenderer = {
    renderLabel, renderRow, renderPage, renderPages, defaultPositions,
  };
})(window);
