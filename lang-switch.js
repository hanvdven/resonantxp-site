// lang-switch.js — footer language switcher
// Handles: detect current language, mark active flag, swap to equivalent
// page in another language on click. Uses flag-icons for cross-platform flag rendering.
(function () {
  const FLAG_CODES = { en: 'gb', nl: 'nl', de: 'de' };

  function injectFlagIcons() {
    if (document.querySelector('[data-flag-icons]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.setAttribute('data-flag-icons', '');
    link.href = 'https://cdn.jsdelivr.net/npm/flag-icons@7.2.3/css/flag-icons.min.css';
    document.head.appendChild(link);
  }

  function renderFlags() {
    document.querySelectorAll('.lang-flag').forEach(btn => {
      const code = FLAG_CODES[btn.dataset.lang];
      if (!code) return;
      btn.textContent = '';
      const span = document.createElement('span');
      span.className = 'fi fi-' + code;
      span.setAttribute('aria-hidden', 'true');
      btn.appendChild(span);
    });
  }

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

  function setup() {
    injectFlagIcons();
    renderFlags();
    init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
  window.addEventListener('popstate', init);
})();
