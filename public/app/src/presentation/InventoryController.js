/* Inventory Controller - camera barcode scanning, count tracking, edit + delete + create */
(function initInventoryController(global) {
  const STORAGE_KEY = 'alisan_inventory_v1';
  const OFFICE_EMAIL_KEY = 'alisan_office_email_v1';

  let inventory = loadInventory();
  let videoStream = null;
  let detector = null;
  let scanRAF = null;
  let lastScannedCode = null;
  let lastScanAt = 0;
  let scanMode = 'confirm'; // 'confirm' | 'create' | 'delete'

  function loadInventory() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch (e) { return {}; }
  }
  function saveInventory() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory)); } catch (e) {}
  }

  function syncFromRows(rows) {
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
          fecha: r.FECHA || r.fecha || '',
          expected: 0, counted: 0, lastScan: null,
        };
      } else {
        inventory[code].product = r.PRODUCTO || inventory[code].product;
        inventory[code].empresa = r.EMPRESA || inventory[code].empresa;
        inventory[code].precio = r.PRECIO || inventory[code].precio;
        inventory[code].fecha = r.FECHA || inventory[code].fecha;
      }
    });
    Object.keys(seen).forEach((code) => { inventory[code].expected = seen[code]; });
    // drop inventory entries whose code no longer exists in rows (deleted)
    Object.keys(inventory).forEach((code) => {
      if (!(code in seen)) { inventory[code].expected = 0; }
    });
    saveInventory();
    renderInventoryTable();
  }

  function adjust(code, delta) {
    if (!inventory[code]) {
      inventory[code] = { code, product: '(no en lista)', empresa: '', precio: '', fecha: '', expected: 0, counted: 0, lastScan: null };
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

  // ── Camera ──
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
      status.textContent = scanMode === 'delete'
        ? 'Apunta al código del producto que deseas eliminar.'
        : scanMode === 'create'
          ? 'Apunta al código para crear un nuevo producto (o escribe abajo).'
          : 'Apunta la cámara al código de barras para confirmar.';
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
    try { if (navigator.vibrate) navigator.vibrate(80); } catch (e) {}
    if (scanMode === 'confirm') {
      adjust(code, 1);
      renderScanFeedback(code);
    } else if (scanMode === 'delete') {
      renderDeletePanel(code);
    } else if (scanMode === 'create') {
      renderCreatePanel(code);
    }
  }

  // ── Feedback panels ──
  function getRowByCode(code) {
    if (global.AlisanFindRowByCode) return global.AlisanFindRowByCode(code);
    return null;
  }

  function renderScanFeedback(code) {
    const box = document.getElementById('invScanFeedback');
    if (!box) return;
    const it = inventory[code];
    if (!it) { box.innerHTML = ''; return; }
    const row = getRowByCode(code) || {};
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
        <div class="inv-card-title">${escapeHtml(row.PRODUCTO || it.product || '(sin nombre)')}</div>
        <div class="inv-card-code">${escapeHtml(code)}</div>
        <div class="inv-card-status">${status.text}</div>
        <div class="inv-card-actions">
          <button type="button" class="inv-btn-minus" onclick="AlisanInventory.adjust('${jsEsc(code)}', -1)">−1</button>
          <span class="inv-card-counted">${counted}</span>
          <button type="button" class="inv-btn-plus" onclick="AlisanInventory.adjust('${jsEsc(code)}', 1)">+1</button>
        </div>
        <div class="inv-edit-form">
          <div class="inv-edit-title">Editar datos (se guardan en el CSV / Excel):</div>
          <label>Producto<input type="text" data-fld="PRODUCTO" value="${escapeHtml(row.PRODUCTO || it.product || '')}"></label>
          <label>Código<input type="text" data-fld="CODIGO" value="${escapeHtml(code)}"></label>
          <label>Fecha<input type="text" data-fld="FECHA" value="${escapeHtml(row.FECHA || it.fecha || '')}"></label>
          <label>Precio<input type="text" data-fld="PRECIO" value="${escapeHtml(row.PRECIO || it.precio || '')}"></label>
          <button type="button" class="primary full" onclick="AlisanInventory.saveEdit('${jsEsc(code)}')">💾 Guardar cambios</button>
        </div>
      </div>
    `;
  }

  function renderDeletePanel(code) {
    const box = document.getElementById('invScanFeedback');
    if (!box) return;
    const row = getRowByCode(code);
    const name = (row && row.PRODUCTO) || (inventory[code] && inventory[code].product) || '(no encontrado)';
    box.innerHTML = `
      <div class="inv-card inv-status-bad">
        <div class="inv-card-title">${escapeHtml(name)}</div>
        <div class="inv-card-code">${escapeHtml(code)}</div>
        <div class="inv-card-status">${row ? 'Producto encontrado en la lista' : 'No está en la lista actual'}</div>
        <button type="button" class="primary full" onclick="AlisanInventory.confirmDelete('${jsEsc(code)}')">🗑️ Eliminar de la lista</button>
      </div>
    `;
  }

  function renderCreatePanel(code) {
    const box = document.getElementById('invScanFeedback');
    if (!box) return;
    const existing = getRowByCode(code);
    box.innerHTML = `
      <div class="inv-card inv-status-ok">
        <div class="inv-card-title">${existing ? '⚠ Ya existe, se actualizará' : '➕ Nuevo producto'}</div>
        <div class="inv-card-code">${escapeHtml(code)}</div>
        <div class="inv-edit-form">
          <label>Producto<input type="text" id="invCreateProducto" value="${escapeHtml(existing ? existing.PRODUCTO : '')}"></label>
          <label>Código<input type="text" id="invCreateCodigo" value="${escapeHtml(code)}"></label>
          <label>Fecha<input type="text" id="invCreateFecha" placeholder="dd/mm/aaaa" value="${escapeHtml(existing ? existing.FECHA : new Date().toLocaleDateString('es-CO'))}"></label>
          <label>Precio<input type="text" id="invCreatePrecio" value="${escapeHtml(existing ? existing.PRECIO : '')}"></label>
          <button type="button" class="primary full" onclick="AlisanInventory.saveCreate()">💾 Guardar pedido</button>
        </div>
      </div>
    `;
  }

  function saveEdit(code) {
    const box = document.getElementById('invScanFeedback');
    if (!box) return;
    const patch = {};
    box.querySelectorAll('input[data-fld]').forEach((i) => { patch[i.dataset.fld] = i.value; });
    const newCode = (patch.CODIGO || '').trim();
    const updated = global.AlisanUpdateRowByCode && global.AlisanUpdateRowByCode(code, patch);
    if (!updated) {
      // not in list yet → add it
      global.AlisanAddRow && global.AlisanAddRow(patch);
    }
    if (inventory[code]) {
      inventory[code].product = patch.PRODUCTO || inventory[code].product;
      inventory[code].precio = patch.PRECIO || inventory[code].precio;
      inventory[code].fecha = patch.FECHA || inventory[code].fecha;
      if (newCode && newCode !== code) {
        inventory[newCode] = Object.assign({}, inventory[code], { code: newCode });
        delete inventory[code];
      }
      saveInventory();
    }
    toast('✓ Cambios guardados en el CSV');
  }

  function confirmDelete(code) {
    if (!confirm('¿Eliminar definitivamente el producto con código ' + code + '?')) return;
    const ok = global.AlisanDeleteRowByCode && global.AlisanDeleteRowByCode(code);
    if (inventory[code]) { delete inventory[code]; saveInventory(); }
    document.getElementById('invScanFeedback').innerHTML =
      `<div class="inv-card inv-status-ok"><div class="inv-card-status">${ok ? '✓ Eliminado' : 'No estaba en la lista'} (${escapeHtml(code)})</div></div>`;
    renderInventoryTable();
    toast(ok ? '✓ Producto eliminado' : 'Código no encontrado');
  }

  function saveCreate() {
    const producto = (document.getElementById('invCreateProducto').value || '').trim();
    const codigo = (document.getElementById('invCreateCodigo').value || '').trim();
    const fecha = (document.getElementById('invCreateFecha').value || '').trim();
    const precio = (document.getElementById('invCreatePrecio').value || '').trim();
    if (!producto || !codigo) { toast('Producto y código son obligatorios'); return; }
    const existing = getRowByCode(codigo);
    if (existing) {
      global.AlisanUpdateRowByCode(codigo, { PRODUCTO: producto, FECHA: fecha, PRECIO: precio });
    } else {
      global.AlisanAddRow({ PRODUCTO: producto, CODIGO: codigo, FECHA: fecha, PRECIO: precio });
    }
    document.getElementById('invScanFeedback').innerHTML =
      `<div class="inv-card inv-status-ok"><div class="inv-card-title">${escapeHtml(producto)}</div><div class="inv-card-status">✓ Guardado en el CSV</div></div>`;
    toast('✓ Pedido guardado');
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
          <button type="button" onclick="AlisanInventory.confirmDelete('${jsEsc(it.code)}')">🗑️</button>
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

  function openScanModal(mode) {
    scanMode = ['confirm','create','delete'].includes(mode) ? mode : 'confirm';
    const modal = document.getElementById('invScanModal');
    if (!modal) return;
    const title = document.getElementById('invScanTitle');
    if (title) {
      title.textContent = scanMode === 'delete' ? '🗑️ Eliminar producto (apunta el código)'
        : scanMode === 'create' ? '➕ Crear pedido de producto (apunta el código)'
        : '📷 Confirmar inventario';
    }
    modal.classList.add('open');
    document.getElementById('invScanFeedback').innerHTML = '';
    document.getElementById('invManualBox').style.display = scanMode === 'create' ? 'block' : 'none';
    lastScannedCode = null;
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

  function toast(message) {
    const node = document.createElement('div');
    node.className = 'toast';
    node.textContent = message;
    document.body.appendChild(node);
    setTimeout(() => node.classList.add('show'), 10);
    setTimeout(() => { node.classList.remove('show'); setTimeout(() => node.remove(), 200); }, 2400);
  }

  document.addEventListener('DOMContentLoaded', () => { renderInventoryTable(); });

  global.AlisanInventory = {
    syncFromRows, adjust, resetCounts,
    openScanModal, closeScanModal, openListModal, closeListModal,
    submitManual, downloadExcel, sendToOffice,
    saveEdit, confirmDelete, saveCreate,
  };
})(window);
