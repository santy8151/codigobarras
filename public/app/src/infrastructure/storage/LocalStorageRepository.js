(function initLocalStorageRepository(global) {
  global.Alisan = global.Alisan || {};
  global.Alisan.infrastructure = global.Alisan.infrastructure || {};
  global.Alisan.infrastructure.storage = global.Alisan.infrastructure.storage || {};

  const SETTINGS_KEY = 'alisan-label-digitalpos-settings-v2';
  const UI_KEY = 'alisan-label-digitalpos-ui-v2';

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  function loadUi() {
    try {
      const raw = localStorage.getItem(UI_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function saveUi(uiState) {
    localStorage.setItem(UI_KEY, JSON.stringify(uiState));
  }

  global.Alisan.infrastructure.storage.LocalStorageRepository = {
    loadSettings,
    saveSettings,
    loadUi,
    saveUi,
  };
})(window);
