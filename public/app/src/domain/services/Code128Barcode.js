(function initCode128Barcode(global) {
  global.Alisan = global.Alisan || {};
  global.Alisan.domain = global.Alisan.domain || {};
  global.Alisan.domain.services = global.Alisan.domain.services || {};

  const PATTERNS = [
    '212222','222122','222221','121223','121322','131222','122213','122312','132212','221213',
    '221312','231212','112232','122132','122231','113222','123122','123221','223211','221132',
    '221231','213212','223112','312131','311222','321122','321221','312212','322112','322211',
    '212123','212321','232121','111323','131123','131321','112313','132113','132311','211313',
    '231113','231311','112133','112331','132131','113123','113321','133121','313121','211331',
    '231131','213113','213311','213131','311123','311321','331121','312113','312311','332111',
    '314111','221411','431111','111224','111422','121124','121421','141122','141221','112214',
    '112412','122114','122411','142112','142211','241211','221114','413111','241112','134111',
    '111242','121142','121241','114212','124112','124211','411212','421112','421211','212141',
    '214121','412121','111143','111341','131141','114113','114311','411113','411311','113141',
    '114131','311141','411131','211412','211214','211232','2331112'
  ];

  const START_B = 104;
  const START_C = 105;
  const STOP = 106;

  function encode(value) {
    const text = String(value || '').trim();
    if (!text) return encodeCodeB('000000');
    if (/^\d+$/.test(text) && text.length % 2 === 0) return encodeCodeC(text);
    return encodeCodeB(text);
  }

  function encodeCodeB(text) {
    const values = [];
    for (const char of String(text)) {
      const code = char.charCodeAt(0);
      if (code < 32 || code > 127) {
        values.push('?'.charCodeAt(0) - 32);
      } else {
        values.push(code - 32);
      }
    }
    const checksum = checksumFor(START_B, values);
    return [START_B, ...values, checksum, STOP];
  }

  function encodeCodeC(text) {
    const values = [];
    for (let i = 0; i < text.length; i += 2) {
      values.push(Number(text.slice(i, i + 2)));
    }
    const checksum = checksumFor(START_C, values);
    return [START_C, ...values, checksum, STOP];
  }

  function checksumFor(startCode, values) {
    let sum = startCode;
    values.forEach((value, index) => {
      sum += value * (index + 1);
    });
    return sum % 103;
  }

  function escapeAttr(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  function toSvg(value, options) {
    const opts = Object.assign({ height: 100, className: 'barcode-svg' }, options || {});
    const encoded = encode(value);
    const modules = encoded.map((n) => PATTERNS[n]).join('');
    const totalWidth = modules.split('').reduce((sum, n) => sum + Number(n), 0);
    let x = 0;
    const rects = [];

    for (const pattern of encoded.map((n) => PATTERNS[n])) {
      for (let i = 0; i < pattern.length; i += 1) {
        const width = Number(pattern[i]);
        if (i % 2 === 0) {
          rects.push(`<rect x="${x}" y="0" width="${width}" height="${opts.height}" />`);
        }
        x += width;
      }
    }

    return `<svg class="${escapeAttr(opts.className)}" viewBox="0 0 ${totalWidth} ${opts.height}" preserveAspectRatio="none" role="img" aria-label="Código de barras ${escapeAttr(value)}" xmlns="http://www.w3.org/2000/svg">${rects.join('')}</svg>`;
  }

  global.Alisan.domain.services.Code128Barcode = { encode, toSvg };
})(window);
