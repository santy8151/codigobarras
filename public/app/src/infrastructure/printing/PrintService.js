(function initPrintService(global) {
  global.Alisan = global.Alisan || {};
  global.Alisan.infrastructure = global.Alisan.infrastructure || {};
  global.Alisan.infrastructure.printing = global.Alisan.infrastructure.printing || {};

  function collectStyles() {
    const parts = [];
    document.querySelectorAll('link[rel="stylesheet"]').forEach((l) => {
      parts.push(`<link rel="stylesheet" href="${l.href}">`);
    });
    document.querySelectorAll('style').forEach((s) => {
      parts.push(`<style>${s.textContent}</style>`);
    });
    return parts.join('\n');
  }

  // Opens a dedicated print window. This works even when the app is
  // embedded inside an iframe (Lovable preview, etc.) where calling
  // window.print() on the parent is blocked or never shows the dialog.
  function print() {
    const root = document.getElementById('printRoot');
    if (!root || !root.innerHTML.trim()) {
      window.print();
      return;
    }
    const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Imprimir etiquetas</title>
${collectStyles()}
<style>
  html, body { margin: 0; padding: 0; background: white; }
  #printRoot { display: block !important; }
  @media screen {
    body { padding: 16px; background: #f4f6f8; font-family: system-ui, sans-serif; }
    .print-hint { max-width: 520px; margin: 0 auto 16px; padding: 12px 14px;
      background: #fff7df; border: 1px solid #ffd777; border-radius: 12px;
      font-size: 13px; line-height: 1.4; }
    .print-hint button { margin-top: 8px; padding: 8px 12px; border: 0;
      border-radius: 8px; background: #111827; color: white; font-weight: 700; cursor: pointer; }
    #printRoot { background: white; padding: 12px; border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0,0,0,.1); max-width: max-content; margin: 0 auto; }
  }
  @media print {
    .print-hint { display: none !important; }
  }
</style>
</head>
<body>
  <div class="print-hint">
    Si no se abre el diálogo de impresión automáticamente, haz clic en el botón.
    <br><button onclick="window.print()">Imprimir ahora</button>
  </div>
  <div id="printRoot">${root.innerHTML}</div>
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () { try { window.print(); } catch (e) {} }, 250);
    });
    window.addEventListener('afterprint', function () {
      setTimeout(function () { window.close(); }, 200);
    });
  <\/script>
</body>
</html>`;

    const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
    if (!win) {
      alert('El navegador bloqueó la ventana de impresión. Permite las ventanas emergentes para este sitio.');
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
  }

  global.Alisan.infrastructure.printing.PrintService = { print };
})(window);
