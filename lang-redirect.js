(function () {
  // Support legacy ?lang= links, save to localStorage and clean URL
  var params = new URLSearchParams(window.location.search);
  var urlLang = params.get('lang');
  if (urlLang === 'en' || urlLang === 'ru') {
    try { localStorage.setItem('idev_lang', urlLang); } catch (_) {}
    params.delete('lang');
    var clean = window.location.pathname + (params.toString() ? '?' + params.toString() : '') + window.location.hash;
    history.replaceState(null, '', clean);
  }
  var stored;
  try { stored = localStorage.getItem('idev_lang'); } catch (_) {}
  window.__idevLang = (stored === 'en' || stored === 'ru') ? stored : 'ru';
  document.documentElement.lang = window.__idevLang;
})();
