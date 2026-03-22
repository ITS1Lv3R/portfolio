(function () {
  var params = new URLSearchParams(window.location.search);
  var urlLang = params.get('lang');
  if (urlLang === 'en' || urlLang === 'ru') {
    try { localStorage.setItem('idev_lang', urlLang); } catch (_) {}
  }
  var stored;
  try { stored = localStorage.getItem('idev_lang'); } catch (_) {}
  window.__idevLang = (stored === 'en' || stored === 'ru') ? stored : 'ru';
  document.documentElement.lang = window.__idevLang;
})();
