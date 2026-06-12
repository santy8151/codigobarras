(function initLabelData(global) {
  global.Alisan = global.Alisan || {};
  global.Alisan.domain = global.Alisan.domain || {};
  global.Alisan.domain.entities = global.Alisan.domain.entities || {};

  const aliases = {
    product: [
      'producto', 'nombre', 'nombreproducto', 'nombre_producto', 'descripcion', 'descripción',
      'referencia', 'item', 'producto_servicio', 'detalle', 'articulo', 'artículo'
    ],
    code: [
      'codigo', 'código', 'codigobarras', 'codigo_barras', 'cod_barras', 'codigodelproducto',
      'codigo_producto', 'sku', 'barcode', 'bar_code', 'id', 'ean', 'upc', 'serial', 'nomenclatura'
    ],
    date: [
      'fecha', 'fecha_ingreso', 'fechaentrada', 'fecha_entrada', 'fecha_ingreso_de_entrada',
      'fecha_de_entrada', 'date', 'ingreso', 'entrada'
    ],
    company: ['empresa', 'compania', 'compañia', 'company', 'marca', 'proveedor'],
    price: ['precio', 'valor', 'price', 'costo', 'venta', 'precio_venta', 'valor_venta']
  };

  function normalizeKey(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');
  }

  function findValue(row, aliasList) {
    const entries = Object.entries(row || {});
    const normalizedAliases = aliasList.map(normalizeKey);

    for (const [key, value] of entries) {
      const normalized = normalizeKey(key);
      if (normalizedAliases.includes(normalized)) return clean(value);
    }

    for (const [key, value] of entries) {
      const normalized = normalizeKey(key);
      if (normalizedAliases.some((alias) => normalized.includes(alias) || alias.includes(normalized))) {
        return clean(value);
      }
    }
    return '';
  }

  function clean(value) {
    return String(value ?? '').trim();
  }

  function truncate(value, max) {
    const text = clean(value);
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
  }

  function mapRowToLabel(row, defaultCompany) {
    const product = findValue(row, aliases.product) || Object.values(row || {}).map(clean).find(Boolean) || 'PRODUCTO';
    const code = findValue(row, aliases.code) || '000000000000';
    const date = findValue(row, aliases.date);
    const company = findValue(row, aliases.company) || defaultCompany || 'ALISAN PG S.A.S';
    const price = findValue(row, aliases.price);

    return {
      product: truncate(product.toUpperCase(), 38),
      code: code.replace(/\s+/g, ''),
      date: truncate(date, 12),
      company: truncate(company.toUpperCase(), 24),
      price: truncate(price, 16),
      raw: row || {},
    };
  }

  global.Alisan.domain.entities.LabelData = {
    aliases,
    normalizeKey,
    mapRowToLabel,
  };
})(window);
