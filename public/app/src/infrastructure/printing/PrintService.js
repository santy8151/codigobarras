(function initPrintService(global) {
  global.Alisan = global.Alisan || {};
  global.Alisan.infrastructure = global.Alisan.infrastructure || {};
  global.Alisan.infrastructure.printing = global.Alisan.infrastructure.printing || {};

  function print() {
    document.body.classList.add('is-printing');
    setTimeout(() => {
      window.print();
      setTimeout(() => document.body.classList.remove('is-printing'), 400);
    }, 80);
  }

  global.Alisan.infrastructure.printing.PrintService = { print };
})(window);
