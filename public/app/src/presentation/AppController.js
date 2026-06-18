(function initAppController(global) {
  const A = global.Alisan;
  const settingsEntity = A.domain.entities.LabelSettings;
  const presets = A.domain.presets.PrinterPresets;
  const storage = A.infrastructure.storage.LocalStorageRepository;
  const printService = A.infrastructure.printing.PrintService;
  const labelRenderer = A.presentation.components.LabelRenderer;
  const dataTable = A.presentation.components.DataTable;

  const sampleCsv = `PRODUCTO,CODIGO,FECHA,EMPRESA,PRECIO
BLOWER RENAULT TWINGO 96-16,001003100024B05188,30/05/2026,ALISAN PG S.A.S,$320.000
RESISTENCIA VELOCIDADES CHEVROLET DMAX,RE6257480301,04/06/2026,ALISAN PG S.A.S,$160.000`;

  function initialSettings() {
    const saved = storage.loadSettings();
    if (saved && saved.pageWidthMm) return settingsEntity.sanitizeSettings(saved);
    return settingsEntity.sanitizeSettings(presets.settingsFor('rollo_105x25_2col'));
  }

  const state = {
    settings: initialSettings(),
    headers: [],
    rows: [],
    selectedIndexes: new Set(),
    previewIndex: 0,
    copies: 1,
    skipLabels: 0,
    defaultCompany: 'ALISAN PG S.A.S',
    editableColumns: new Set(),
    searchQuery: '',
    visibleIndexes: [],
  };

  const els = {};

  function $(id) { return document.getElementById(id); }

  function bindElements() {
    [
      'previewPage', 'printRoot', 'printStyle', 'csvFile', 'csvText', 'btnParseText', 'defaultCompany',
      'copies', 'skipLabels', 'dataTable', 'btnSelectAll', 'btnSelectNone', 'btnLoadExample',
      'btnPrintTop', 'btnPrintOneTest', 'btnResetSettings', 'btnSaveSettings', 'totalToPrint', 'printSizeBox',
      'presetId', 'presetNote', 'pageWidthMm', 'pageHeightMm', 'labelWidthMm', 'labelHeightMm', 'columns',
      'columnGapMm', 'marginLeftMm', 'marginTopMm', 'marginRightMm', 'marginBottomMm', 'labelPaddingMm',
      'barcodeHeightMm', 'productFontMm', 'dateFontMm', 'codeFontMm', 'footerFontMm', 'priceFontMm',
      'rotate', 'debugOutlines', 'blankColumn', 'editableCols'
    ].forEach((id) => { els[id] = $(id); });
  }

  function hydrateFromStorage() {
    const ui = storage.loadUi();
    if (!ui) return;
    state.copies = Number(ui.copies || 1);
    state.skipLabels = Number(ui.skipLabels || 0);
    state.defaultCompany = ui.defaultCompany || state.defaultCompany;
    if (Array.isArray(ui.editableColumns)) state.editableColumns = new Set(ui.editableColumns);
  }

  function wireEvents() {
    document.querySelectorAll('.tab').forEach((tab) => {
      tab.addEventListener('click', () => activateTab(tab.dataset.tab));
    });

    els.csvFile.addEventListener('change', async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const text = await file.text();
      loadCsv(text);
      event.target.value = '';
    });

    els.btnParseText.addEventListener('click', () => loadCsv(els.csvText.value));
    els.btnLoadExample.addEventListener('click', () => {
      els.csvText.value = sampleCsv;
      loadCsv(sampleCsv);
      toast('Ejemplo cargado. Imprime una prueba antes de tirar todo el rollo.');
    });

    els.btnSelectAll.addEventListener('click', () => {
      state.selectedIndexes = new Set(state.rows.map((_, index) => index));
      render();
    });

    els.btnSelectNone.addEventListener('click', () => {
      state.selectedIndexes = new Set();
      render();
    });

    els.btnPrintTop.addEventListener('click', () => printCurrent(false));
    els.btnPrintOneTest.addEventListener('click', () => printCurrent(true));

    els.copies.addEventListener('input', () => {
      state.copies = Math.max(1, Number(els.copies.value || 1));
      saveUi();
      render();
    });

    els.skipLabels.addEventListener('change', () => {
      state.skipLabels = Number(els.skipLabels.value || 0);
      saveUi();
      render();
    });

    els.defaultCompany.addEventListener('input', () => {
      state.defaultCompany = els.defaultCompany.value || 'ALISAN PG S.A.S';
      saveUi();
      render();
    });

    els.presetId.addEventListener('change', () => {
      state.settings = settingsEntity.sanitizeSettings(
        Object.assign({}, presets.settingsFor(els.presetId.value), { blankColumn: state.settings.blankColumn })
      );
      render();
      toast('Preset aplicado. Revisa tamaño de papel antes de imprimir.');
    });

    els.blankColumn.addEventListener('change', () => {
      state.settings.blankColumn = els.blankColumn.value;
      state.settings = settingsEntity.sanitizeSettings(state.settings);
      render();
    });

    const settingsInputs = [
      'pageWidthMm', 'pageHeightMm', 'labelWidthMm', 'labelHeightMm', 'columns', 'columnGapMm',
      'marginLeftMm', 'marginTopMm', 'marginRightMm', 'marginBottomMm', 'labelPaddingMm', 'barcodeHeightMm',
      'productFontMm', 'dateFontMm', 'codeFontMm', 'footerFontMm', 'priceFontMm', 'rotate', 'debugOutlines'
    ];

    settingsInputs.forEach((id) => {
      els[id].addEventListener('input', () => updateSettingFromForm(id));
      els[id].addEventListener('change', () => updateSettingFromForm(id));
    });

    els.btnResetSettings.addEventListener('click', () => {
      state.settings = settingsEntity.sanitizeSettings(presets.settingsFor('digitalpos_5x3_2col'));
      render();
      toast('Restaurado al preset DigitalPOS 5×3 cm / 2 columnas.');
    });

    els.btnSaveSettings.addEventListener('click', () => {
      storage.saveSettings(state.settings);
      toast('Configuración guardada en este navegador.');
    });
  }

  function updateSettingFromForm(id) {
    if (id === 'debugOutlines') state.settings[id] = els[id].checked ? 1 : 0;
    else state.settings[id] = Number(els[id].value);
    state.settings.presetId = 'custom';
    state.settings = settingsEntity.sanitizeSettings(state.settings);
    render();
  }

  function activateTab(name) {
    document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.tab === name));
    document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.remove('active'));
    $(`tab-${name}`).classList.add('active');
  }

  function loadCsv(text) {
    const result = A.application.useCases.ParseCsvUseCase.execute(text);
    state.headers = result.headers;
    state.rows = result.rows;
    state.selectedIndexes = new Set(state.rows.map((_, index) => index));
    state.previewIndex = 0;
    // prune editable columns that no longer exist
    state.editableColumns = new Set(Array.from(state.editableColumns).filter((c) => state.headers.includes(c)));
    if (!state.rows.length) toast('No se encontraron filas en el CSV. Revisa encabezados y separador.');
    render();
  }

  function saveUi() {
    storage.saveUi({
      copies: state.copies,
      skipLabels: state.skipLabels,
      defaultCompany: state.defaultCompany,
      editableColumns: Array.from(state.editableColumns),
    });
  }

  function getSelectedLabels(onlyOneTest) {
    if (onlyOneTest) {
      const mapper = A.domain.entities.LabelData.mapRowToLabel;
      const row = state.rows[state.previewIndex] || A.application.useCases.ParseCsvUseCase.execute(sampleCsv).rows[0];
      return [mapper(row, state.defaultCompany)];
    }
    return A.application.useCases.BuildPrintRowsUseCase.execute(
      state.rows,
      state.selectedIndexes,
      state.copies,
      state.defaultCompany,
      state.skipLabels
    );
  }

  function getPages(onlyOneTest) {
    return A.application.useCases.BuildPrintPagesUseCase.execute(getSelectedLabels(onlyOneTest), state.settings);
  }

  function renderPresetOptions() {
    const ids = presets.list().map((preset) => preset.id);
    if (!els.presetId.dataset.loaded) {
      els.presetId.innerHTML = presets.list().map((preset) => `<option value="${preset.id}">${preset.name}</option>`).join('') + '<option value="custom">Personalizado</option>';
      els.presetId.dataset.loaded = '1';
    }
    els.presetId.value = ids.includes(state.settings.presetId) ? state.settings.presetId : 'custom';
    const preset = presets.getPreset(els.presetId.value);
    els.presetNote.textContent = els.presetId.value === 'custom' ? 'Configuración personalizada. Guarda cuando ya te quede calibrada.' : preset.note;
  }

  function renderSettingsForm() {
    renderPresetOptions();
    Object.keys(state.settings).forEach((key) => {
      if (!els[key]) return;
      if (key === 'debugOutlines') els[key].checked = Boolean(state.settings[key]);
      else els[key].value = state.settings[key];
    });
    els.blankColumn.value = state.settings.blankColumn || 'none';
    els.copies.value = state.copies;
    els.skipLabels.value = String(state.skipLabels);
    els.defaultCompany.value = state.defaultCompany;
  }

  function renderEditableCols() {
    if (!state.headers.length) {
      els.editableCols.innerHTML = '<small>Carga datos para elegir columnas.</small>';
      return;
    }
    els.editableCols.innerHTML = state.headers.map((h) => {
      const active = state.editableColumns.has(h) ? 'active' : '';
      return `<button type="button" class="chip ${active}" data-col="${h.replace(/"/g, '&quot;')}">${h}</button>`;
    }).join('');
    els.editableCols.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const col = chip.dataset.col;
        if (state.editableColumns.has(col)) state.editableColumns.delete(col);
        else state.editableColumns.add(col);
        saveUi();
        render();
      });
    });
  }

  function renderDataTable() {
    dataTable.render(
      els.dataTable,
      state.headers,
      state.rows,
      state.selectedIndexes,
      (index) => {
        if (state.selectedIndexes.has(index)) state.selectedIndexes.delete(index);
        else state.selectedIndexes.add(index);
        render();
      },
      (index) => {
        state.previewIndex = index;
        renderPreview();
        highlightPreviewRow();
      },
      {
        editableColumns: state.editableColumns,
        onEdit: (index, col, value) => {
          if (!state.rows[index]) return;
          state.rows[index] = Object.assign({}, state.rows[index], { [col]: value });
          renderPreview();
          renderPrintArea(false);
        },
      }
    );
    highlightPreviewRow();
  }

  function highlightPreviewRow() {
    els.dataTable.querySelectorAll('tbody tr').forEach((tr) => {
      tr.classList.toggle('previewing', Number(tr.dataset.index) === state.previewIndex);
    });
  }

  function computePreviewScale() {
    const wrap = els.previewPage.parentElement; // .preview-wrap
    const availWidth = wrap ? (wrap.clientWidth - 24) : 600;
    const pageWidthMm = settingsEntity.getPageWidthMm(state.settings);
    // 1 mm = 3.7795275591 px at 96dpi
    const pageWidthPx = pageWidthMm * 3.7795275591;
    return Math.max(0.5, Math.min(5, availWidth / pageWidthPx));
  }

  function renderPreview() {
    const mapper = A.domain.entities.LabelData.mapRowToLabel;

    // Build the full list of labels to preview
    let labels = [];
    const hasSelection = state.selectedIndexes && state.selectedIndexes.size > 0;
    if (hasSelection) {
      // All selected rows × copies, including skips
      labels = getSelectedLabels(false);
    } else {
      // Only the currently highlighted row (1 copy)
      const row = state.rows[state.previewIndex] || A.application.useCases.ParseCsvUseCase.execute(sampleCsv).rows[0];
      const lbl = mapper(row, state.defaultCompany);
      labels = [lbl];
    }

    const pages = A.application.useCases.BuildPrintPagesUseCase.execute(labels, state.settings);
    const scale = computePreviewScale();
    const pageWidthMm = settingsEntity.getPageWidthMm(state.settings);
    const pageHeightMm = settingsEntity.getPageHeightMm(state.settings);
    // Raw pixel dimensions at 96dpi
    const rawW = pageWidthMm * 3.7795275591;
    const rawH = pageHeightMm * 3.7795275591;
    // Scaled dimensions = what the browser actually renders visually
    const scaledW = Math.round(rawW * scale);
    const scaledH = Math.round(rawH * scale);

    const html = pages.map((page, idx) => {
      const pageHtml = labelRenderer.renderPage(page, state.settings);
      const labelText = `Fila ${idx + 1} de ${pages.length}`;
      return `
        <div class="preview-page-container" style="width:${scaledW}px;">
          <span class="preview-page-label">${labelText}</span>
          <div style="width:${scaledW}px;height:${scaledH}px;overflow:hidden;position:relative;">
            <div class="preview-page" style="transform:scale(${scale});transform-origin:top left;width:${Math.round(rawW)}px;height:${Math.round(rawH)}px;position:absolute;top:0;left:0;">${pageHtml}</div>
          </div>
        </div>`;
    }).join('');

    els.previewPage.innerHTML = html;
  }


  function renderPrintArea(onlyOneTest) {
    const pages = getPages(Boolean(onlyOneTest));
    els.printRoot.innerHTML = labelRenderer.renderPages(pages, state.settings);
    const pageWidth = settingsEntity.getPageWidthMm(state.settings);
    const pageHeight = settingsEntity.getPageHeightMm(state.settings);
    // Detect if label row is wider than tall → landscape
    const isLandscape = pageWidth > pageHeight;
    const sizeDecl = isLandscape
      ? `${pageWidth}mm ${pageHeight}mm landscape`
      : `${pageWidth}mm ${pageHeight}mm portrait`;
    els.printStyle.textContent = `
      @media print {
        @page { size: ${sizeDecl}; margin: 0; }
        html, body, #printRoot { width: ${pageWidth}mm !important; height: ${pageHeight}mm !important; }
        .print-row-page { width: ${pageWidth}mm !important; height: ${pageHeight}mm !important; }
      }
    `;
    const driver = settingsEntity.getDriverSummary(state.settings);
    const blankNote = state.settings.blankColumn === 'left'
      ? 'Solo se imprime la columna derecha.'
      : state.settings.blankColumn === 'right'
        ? 'Solo se imprime la columna izquierda.'
        : 'Se imprimen las 2 columnas.';
    els.printSizeBox.innerHTML = `
      <strong>Config de impresora copiada/preparada:</strong><br>
      Papel personalizado: <strong>${driver.widthMm.toFixed(1)} × ${driver.heightMm.toFixed(1)} mm</strong><br>
      En pulgadas: ${driver.widthIn.toFixed(2)} × ${driver.heightIn.toFixed(2)} in · DPI: ${driver.dpi} · Escala: ${driver.scaling}%<br>
      Etiqueta: ${state.settings.labelWidthMm} × ${state.settings.labelHeightMm} mm · Columnas: ${state.settings.columns} · Separación central: ${state.settings.columnGapMm} mm<br>
      Márgenes: izq ${state.settings.marginLeftMm} mm · sup ${state.settings.marginTopMm} mm · der ${state.settings.marginRightMm} mm · inf ${state.settings.marginBottomMm} mm<br>
      <em>${blankNote}</em>
    `;
  }

  function renderTotal() {
    const realLabels = getSelectedLabels(false).filter((label) => !label.blank).length;
    const skipped = Number(state.skipLabels || 0);
    els.totalToPrint.textContent = `${realLabels} etiqueta${realLabels === 1 ? '' : 's'}${skipped ? ` · ${skipped} salto` : ''}`;
  }

  function render() {
    renderSettingsForm();
    renderEditableCols();
    renderPreview();
    renderPrintArea(false);
    renderTotal();
    renderDataTable();
  }

  function printCurrent(onlyOneTest) {
    if (!state.rows.length) {
      loadCsv(sampleCsv);
      state.selectedIndexes = new Set([0]);
    }
    renderPrintArea(Boolean(onlyOneTest));
    printService.print();
  }

  function toast(message) {
    const node = document.createElement('div');
    node.className = 'toast';
    node.textContent = message;
    document.body.appendChild(node);
    setTimeout(() => node.classList.add('show'), 10);
    setTimeout(() => {
      node.classList.remove('show');
      setTimeout(() => node.remove(), 200);
    }, 2600);
  }

  function init() {
    bindElements();
    hydrateFromStorage();
    wireEvents();
    els.csvText.value = sampleCsv;
    loadCsv(sampleCsv);
  }

  document.addEventListener('DOMContentLoaded', init);
})(window);
