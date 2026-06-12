(function initBuildPrintPagesUseCase(global) {
  global.Alisan = global.Alisan || {};
  global.Alisan.application = global.Alisan.application || {};
  global.Alisan.application.useCases = global.Alisan.application.useCases || {};

  function execute(labels, settings) {
    const cleanSettings = global.Alisan.domain.entities.LabelSettings.sanitizeSettings(settings);
    const columns = cleanSettings.columns;
    const blank = cleanSettings.blankColumn;
    const blankIndex = columns === 2 && blank === 'left' ? 0 : (columns === 2 && blank === 'right' ? 1 : -1);

    // If a column is blanked, we should only place real labels in the active column.
    const stride = blankIndex >= 0 ? 1 : columns;
    const pages = [];
    for (let i = 0; i < labels.length; i += stride) {
      const page = new Array(columns).fill(null).map(() => ({ blank: true }));
      if (blankIndex >= 0) {
        const activeIndex = blankIndex === 0 ? 1 : 0;
        page[activeIndex] = labels[i] || { blank: true };
      } else {
        const chunk = labels.slice(i, i + columns);
        chunk.forEach((label, idx) => { page[idx] = label; });
      }
      pages.push(page);
    }
    if (!pages.length) {
      pages.push(new Array(columns).fill(null).map(() => ({ blank: true })));
    }
    return pages;
  }

  global.Alisan.application.useCases.BuildPrintPagesUseCase = { execute };
})(window);
