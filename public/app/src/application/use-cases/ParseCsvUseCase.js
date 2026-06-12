(function initParseCsvUseCase(global) {
  global.Alisan = global.Alisan || {};
  global.Alisan.application = global.Alisan.application || {};
  global.Alisan.application.useCases = global.Alisan.application.useCases || {};

  function execute(text) {
    return global.Alisan.infrastructure.csv.CsvParser.parse(text);
  }

  global.Alisan.application.useCases.ParseCsvUseCase = { execute };
})(window);
