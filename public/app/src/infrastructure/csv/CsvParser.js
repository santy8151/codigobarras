(function initCsvParser(global) {
  global.Alisan = global.Alisan || {};
  global.Alisan.infrastructure = global.Alisan.infrastructure || {};
  global.Alisan.infrastructure.csv = global.Alisan.infrastructure.csv || {};

  function detectDelimiter(line) {
    const candidates = [',', ';', '\t'];
    let best = ',';
    let bestCount = -1;
    candidates.forEach((delimiter) => {
      const count = splitCsvLine(line, delimiter).length;
      if (count > bestCount) {
        best = delimiter;
        bestCount = count;
      }
    });
    return best;
  }

  function splitCsvLine(line, delimiter) {
    const cells = [];
    let current = '';
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      const next = line[i + 1];
      if (char === '"') {
        if (quoted && next === '"') {
          current += '"';
          i += 1;
        } else {
          quoted = !quoted;
        }
      } else if (char === delimiter && !quoted) {
        cells.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    cells.push(current.trim());
    return cells;
  }

  function splitRows(text) {
    const rows = [];
    let current = '';
    let quoted = false;
    const normalized = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    for (let i = 0; i < normalized.length; i += 1) {
      const char = normalized[i];
      const next = normalized[i + 1];
      if (char === '"') {
        if (quoted && next === '"') {
          current += '"';
          i += 1;
        } else {
          quoted = !quoted;
          current += char;
        }
      } else if (char === '\n' && !quoted) {
        if (current.trim()) rows.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    if (current.trim()) rows.push(current);
    return rows;
  }

  function parse(text) {
    const lines = splitRows(text);
    if (lines.length === 0) return { headers: [], rows: [] };
    const delimiter = detectDelimiter(lines[0]);
    const headers = splitCsvLine(lines[0], delimiter).map((h, index) => h || `COLUMNA_${index + 1}`);
    const rows = lines.slice(1).map((line) => {
      const cells = splitCsvLine(line, delimiter);
      const row = {};
      headers.forEach((header, index) => {
        row[header] = cells[index] || '';
      });
      return row;
    }).filter((row) => Object.values(row).some((value) => String(value).trim() !== ''));
    return { headers, rows };
  }

  global.Alisan.infrastructure.csv.CsvParser = { parse };
})(window);
