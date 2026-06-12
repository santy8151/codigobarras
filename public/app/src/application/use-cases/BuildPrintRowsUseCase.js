(function initBuildPrintRowsUseCase(global) {
  global.Alisan = global.Alisan || {};
  global.Alisan.application = global.Alisan.application || {};
  global.Alisan.application.useCases = global.Alisan.application.useCases || {};

  function execute(rows, selectedIndexes, copies, defaultCompany, skipLabels) {
    const mapper = global.Alisan.domain.entities.LabelData.mapRowToLabel;
    const selected = Array.from(selectedIndexes || [])
      .sort((a, b) => a - b)
      .map((index) => rows[index])
      .filter(Boolean);

    const output = [];
    for (let i = 0; i < Number(skipLabels || 0); i += 1) {
      output.push({ blank: true });
    }

    selected.forEach((row) => {
      const label = mapper(row, defaultCompany);
      for (let i = 0; i < Math.max(1, Number(copies || 1)); i += 1) {
        output.push(label);
      }
    });
    return output;
  }

  global.Alisan.application.useCases.BuildPrintRowsUseCase = { execute };
})(window);
