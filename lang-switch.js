// lang-switch.js — footer language switcher
// Handles: detect current language, mark active flag, swap to equivalent
// page in another language on click.
(function () {
  function currentLang() {
    const p = location.pathname;
    if (p.startsWith('/nl/')) return 'nl';
    if (p.startsWith('/de/')) return 'de';
    return 'en';
  }

  function pathFor(lang) {
    let p = location.pathname.replace(/^\/(nl|de)\//, '/');
    if (lang === 'en') return p;
    if (p === '/') return '/' + lang + '/';
    return '/' + lang + p;
  }

  function init() {
    const cur = currentLang();
    document.querySelectorAll('.lang-flag').forEach(btn => {
      const lang = btn.dataset.lang;
      btn.classList.toggle('active', lang === cur);
      btn.setAttribute('aria-current', lang === cur ? 'true' : 'false');
      btn.onclick = () => {
        if (lang === cur) return;
        location.href = pathFor(lang);
      };
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.addEventListener('popstate', init);
})();
