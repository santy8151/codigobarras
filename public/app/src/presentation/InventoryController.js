/* Inventory Controller - camera barcode scanning, count tracking, export */
(function initInventoryController(global) {
  const STORAGE_KEY = 'alisan_inventory_v1';
  const OFFICE_EMAIL_KEY = 'alisan_office_email_v1';

  // inventory: { [code]: { code, product, empresa, precio, expected, counted, lastScan } }
  let inventory = loadInventory();
  let videoStream = null;
  let detector = null;
  let scanRAF = null;
  let lastScannedCode = null;
  let lastScanAt = 0;

  function loadInventory() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch (e) { return {}; }
  }
  function saveInventory() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory)); } catch (e) {}
  }

  function syncFromRows(rows) {
    // Add/refresh expected counts from current label list
    const seen = {};
    (rows || []).forEach((r) => {
      const code = String(r.CODIGO || r.codigo || r.code || '').trim();
      if (!code) return;
      seen[code] = (seen[code] || 0) + 1;
      if (!inventory[code]) {
        inventory[code] = {
          code,
          product: r.PRODUCTO || r.producto || '',
          empresa: r.EMPRESA || r.empresa || '',
          precio: r.PRECIO || r.precio || '',
          expected: 0,
          counted: 0,
          lastScan: null,
        };
      } else {
        inventory[code].product = r.PRODUCTO || inventory[code].product;
        inventory[code].empresa = r.EMPRESA || inventory[code].empresa;
        inventory[code].precio = r.PRECIO || inventory[code].precio;
      }
    });
    Object.keys(seen).forEach((code) => { inventory[code].expected = seen[code]; });
    saveInventory();
    renderInventoryTable();
  }

  function adjust(code, delta) {
    if (!inventory[code]) {
      inventory[code] = { code, product: '(no en lista)', empresa: '', precio: '', expected: 0, counted: 0, lastScan: null };
    }
    inventory[code].counted = Math.max(0, (inventory[code].counted || 0) + delta);
    inventory[code].lastScan = Date.now();
    saveInventory();
    renderScanFeedback(code);
    renderInventoryTable();
  }

  function resetCounts() {
    if (!confirm('¿Reiniciar todas las cuentas confirmadas a 0?')) return;
    Object.keys(inventory).forEach((c) => { inventory[c].counted = 0; inventory[c].lastScan = null; });
    saveInventory();
    renderInventoryTable();
  }

  // ── Camera scanning ──
  async function startCamera() {
    const video = document.getElementById('invVideo');
    const status = document.getElementById('invScanStatus');
    if (!video) return;
    try {
      if (!('BarcodeDetector' in window)) {
        status.textContent = 'Tu navegador no soporta lector de cámara. Usa Chrome en Android, o escribe el código a mano abajo.';
        document.getElementById('invManualBox').style.display = 'block';
        return;
      }
      detector = new window.BarcodeDetector({
        formats: ['code_128', 'ean_13', 'ean_8', 'code_39', 'upc_a', 'upc_e', 'qr_code']
      });
      videoStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }, audio: false
      });
      video.srcObject = videoStream;
      await video.play();
      status.textContent = 'Apunta la cámara al código de barras.';
      scanLoop(video);
    } catch (err) {
      status.textContent = 'No se pudo abrir la cámara: ' + (err && err.message ? err.message : err);
      document.getElementById('invManualBox').style.display = 'block';
    }
  }

  function stopCamera() {
    if (scanRAF) { cancelAnimationFrame(scanRAF); scanRAF = null; }
    if (videoStream) { videoStream.getTracks().forEach((t) => t.stop()); videoStream = null; }
    const video = document.getElementById('invVideo');
    if (video) { try { video.pause(); video.srcObject = null; } catch (e) {} }
  }

  async function scanLoop(video) {
    if (!detector || !videoStream) return;
    try {
      const codes = await detector.detect(video);
      if (codes && codes.length) {
        const code = String(codes[0].rawValue || '').trim();
        const now = Date.now();
        if (code && (code !== lastScannedCode || now - lastScanAt > 1500)) {
          lastScannedCode = code; lastScanAt = now;
          handleScannedCode(code);
        }
      }
    } catch (e) {}
    scanRAF = requestAnimationFrame(() => scanLoop(video));
  }

  function handleScannedCode(code) {
    adjust(code, 1);
    try { if (navigator.vibrate) navigator.vibrate(80); } catch (e) {}
  }

  function renderScanFeedback(code) {
    const box = document.getElementById('invScanFeedback');
    if (!box) return;
    const it = inventory[code];
    if (!it) { box.innerHTML = ''; return; }
    const expected = Number(it.expected || 0);
    const counted = Number(it.counted || 0);
    const status = expected === 0
      ? { cls: 'inv-status-warn', text: 'No estaba en la lista (extra)' }
      : counted === expected
        ? { cls: 'inv-status-ok', text: '✓ Confirmado: ' + counted + '/' + expected }
        : counted < expected
          ? { cls: 'inv-status-warn', text: 'Faltan: ' + counted + '/' + expected }
          : { cls: 'inv-status-bad', text: 'Sobran: ' + counted + '/' + expected };
    box.innerHTML = `
      <div class="inv-card ${status.cls}">
        <div class="inv-card-title">${escapeHtml(it.product || '(sin nombre)')}</div>
        <div class="inv-card-code">${escapeHtml(code)}</div>
        <div class="inv-card-status">${status.text}</div>
        <div class="inv-card-actions">
          <button type="button" class="inv-btn-minus" onclick="AlisanInventory.adjust('${jsEsc(code)}', -1)">−1</button>
          <span class="inv-card-counted">${counted}</span>
          <button type="button" class="inv-btn-plus" onclick="AlisanInventory.adjust('${jsEsc(code)}', 1)">+1</button>
        </div>
      </div>
    `;
  }

  function renderInventoryTable() {
    const tbody = document.getElementById('invTableBody');
    if (!tbody) return;
    const items = Object.values(inventory).sort((a, b) => String(a.product).localeCompare(String(b.product)));
    if (!items.length) { tbody.innerHTML = '<tr><td colspan="6" class="empty">Sin productos en inventario.</td></tr>'; return; }
    tbody.innerHTML = items.map((it) => {
      const exp = Number(it.expected || 0), cnt = Number(it.counted || 0);
      const diff = cnt - exp;
      const cls = exp === 0 && cnt > 0 ? 'inv-row-warn' : cnt === exp ? 'inv-row-ok' : cnt < exp ? 'inv-row-warn' : 'inv-row-bad';
      return `<tr class="${cls}">
        <td>${escapeHtml(it.product || '')}</td>
        <td><code>${escapeHtml(it.code)}</code></td>
        <td>${exp}</td>
        <td>${cnt}</td>
        <td>${diff > 0 ? '+' : ''}${diff}</td>
        <td>
          <button type="button" onclick="AlisanInventory.adjust('${jsEsc(it.code)}',-1)">−</button>
          <button type="button" onclick="AlisanInventory.adjust('${jsEsc(it.code)}',1)">+</button>
        </td>
      </tr>`;
    }).join('');
  }

  function buildCsv() {
    const headers = ['PRODUCTO','CODIGO','EMPRESA','PRECIO','ESPERADO','CONFIRMADO','DIFERENCIA','ULTIMA_LECTURA'];
    const rows = Object.values(inventory).map((it) => {
      const exp = Number(it.expected || 0), cnt = Number(it.counted || 0);
      const dt = it.lastScan ? new Date(it.lastScan).toLocaleString() : '';
      return [it.product || '', it.code, it.empresa || '', it.precio || '', exp, cnt, cnt - exp, dt];
    });
    const esc = (v) => { const s = String(v ?? ''); return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    return [headers.join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n');
  }

  function downloadExcel() {
    const csv = buildCsv();
    // BOM so Excel detects UTF-8
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventario-alisan-' + new Date().toISOString().slice(0,10) + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  function sendToOffice() {
    let email = localStorage.getItem(OFFICE_EMAIL_KEY) || '';
    email = prompt('Correo de la oficina para enviar el inventario:', email || 'oficina@alisan.com') || '';
    if (!email) return;
    localStorage.setItem(OFFICE_EMAIL_KEY, email);
    const csv = buildCsv();
    const subject = encodeURIComponent('Inventario Alisan - ' + new Date().toLocaleDateString());
    const body = encodeURIComponent('Inventario confirmado:\n\n' + csv);
    window.location.href = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
  }

  function openScanModal() {
    const modal = document.getElementById('invScanModal');
    if (!modal) return;
    modal.classList.add('open');
    document.getElementById('invScanFeedback').innerHTML = '';
    document.getElementById('invManualBox').style.display = 'none';
    startCamera();
  }
  function closeScanModal() {
    const modal = document.getElementById('invScanModal');
    if (modal) modal.classList.remove('open');
    stopCamera();
  }
  function openListModal() {
    const modal = document.getElementById('invListModal');
    if (modal) modal.classList.add('open');
    renderInventoryTable();
  }
  function closeListModal() {
    const modal = document.getElementById('invListModal');
    if (modal) modal.classList.remove('open');
  }

  function submitManual() {
    const input = document.getElementById('invManualInput');
    if (!input) return;
    const code = (input.value || '').trim();
    if (!code) return;
    handleScannedCode(code);
    input.value = '';
  }

  function escapeHtml(v) {
    return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }
  function jsEsc(v) { return String(v ?? '').replace(/\\/g,'\\\\').replace(/'/g,"\\'"); }

  document.addEventListener('DOMContentLoaded', () => {
    renderInventoryTable();
  });

  global.AlisanInventory = {
    syncFromRows,
    adjust,
    resetCounts,
    openScanModal,
    closeScanModal,
    openListModal,
    closeListModal,
    submitManual,
    downloadExcel,
    sendToOffice,
  };
})(window);
