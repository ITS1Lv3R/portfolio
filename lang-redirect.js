(function () {
  'use strict';
  var KEY = 'idev_lang';
  var path = window.location.pathname;
  var isEn = path.indexOf('/en') === 0 || path === '/en' || path === '/en/';

  function getStored() {
    try {
      return localStorage.getItem(KEY);
    } catch (_) {}
    return null;
  }

  function setStored(lang) {
    try {
      localStorage.setItem(KEY, lang);
    } catch (_) {}
  }

  function goTo(lang) {
    if (lang === 'en') {
      if (!isEn) window.location.replace('/en/');
    } else {
      if (isEn) window.location.replace('/');
    }
  }

  function fetchCountry(cb) {
    var done = false;
    function finish(code) {
      if (done) return;
      done = true;
      cb(code || null);
    }
    fetch('/cdn-cgi/trace')
      .then(function (r) { return r.text(); })
      .then(function (text) {
        var m = text.match(/loc=([A-Z]{2})/);
        finish(m ? m[1] : null);
      })
      .catch(function () {
        fetch('https://ipapi.co/json/')
          .then(function (r) { return r.json(); })
          .then(function (d) { finish(d && d.country_code); })
          .catch(function () { finish(null); });
      });
  }

  var stored = getStored();
  if (stored === 'en') {
    goTo('en');
    return;
  }
  if (stored === 'ru') {
    goTo('ru');
    return;
  }
  fetchCountry(function (country) {
    if (country === 'RU') {
      if (isEn) goTo('ru');
    } else {
      if (!isEn) goTo('en');
    }
  });
})();
