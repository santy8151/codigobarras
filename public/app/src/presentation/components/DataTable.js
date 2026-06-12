(function initDataTable(global) {
  global.Alisan = global.Alisan || {};
  global.Alisan.presentation = global.Alisan.presentation || {};
  global.Alisan.presentation.components = global.Alisan.presentation.components || {};

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  function render(container, headers, rows, selectedIndexes, onToggle, onPreview, options) {
    const opts = options || {};
    const editable = opts.editableColumns instanceof Set ? opts.editableColumns : new Set();
    const onEdit = typeof opts.onEdit === 'function' ? opts.onEdit : () => {};

    if (!rows.length) {
      container.innerHTML = `<div class="empty">Aún no hay datos. Carga un CSV o pega la base de datos.</div>`;
      return;
    }

    const head = headers.map((h) => {
      const tag = editable.has(h) ? '<span class="edit-tag" title="Columna editable">✎</span>' : '';
      return `<th>${escapeHtml(h)} ${tag}</th>`;
    }).join('');

    const body = rows.map((row, index) => {
      const cells = headers.map((h) => {
        const value = escapeHtml(row[h]);
        if (editable.has(h)) {
          return `<td class="editable-cell" data-col="${escapeHtml(h)}" contenteditable="true" spellcheck="false">${value}</td>`;
        }
        return `<td>${value}</td>`;
      }).join('');
      const checked = selectedIndexes.has(index) ? 'checked' : '';
      return `
        <tr data-index="${index}" class="${checked ? 'selected' : ''}">
          <td class="checkbox-cell"><input type="checkbox" ${checked} /></td>
          ${cells}
        </tr>
      `;
    }).join('');

    container.innerHTML = `<table><thead><tr><th></th>${head}</tr></thead><tbody>${body}</tbody></table>`;

    container.querySelectorAll('tbody tr').forEach((tr) => {
      const index = Number(tr.dataset.index);
      tr.addEventListener('click', (event) => {
        const target = event.target;
        if (target && target.tagName === 'INPUT') {
          onToggle(index);
          return;
        }
        if (target && target.classList && target.classList.contains('editable-cell')) {
          return; // let user edit, do not switch preview
        }
        onPreview(index);
      });
    });

    container.querySelectorAll('.editable-cell').forEach((cell) => {
      cell.addEventListener('blur', () => {
        const tr = cell.closest('tr');
        if (!tr) return;
        const index = Number(tr.dataset.index);
        onEdit(index, cell.dataset.col, cell.textContent.trim());
      });
      cell.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          cell.blur();
        }
      });
    });
  }

  global.Alisan.presentation.components.DataTable = { render };
})(window);
