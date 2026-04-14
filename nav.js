// ============================================================
// nav.js — client-side routing (true crossfade)
// Header blijft staan, alleen <main> fade
// Background + header kleuren transitionen via CSS
// ============================================================

const FADE_DURATION = 280;

const scrollMemory = new Map();
let isNavigating = false;

// ===== SCROLL =====
function saveScroll() {
  scrollMemory.set(location.pathname, window.scrollY);
}

function restoreScroll(url) {
  const path = new URL(url, location.origin).pathname;
  const saved = scrollMemory.get(path);
  window.scrollTo({ top: saved ?? 0, behavior: 'instant' });
}

// ===== NAVIGATIE =====
async function navigateTo(url, pushState = true) {
  if (isNavigating) return;

  const targetPath = new URL(url, location.origin).pathname;
  if (targetPath === location.pathname && pushState) return;

  isNavigating = true;
  saveScroll();

  const currentMain = document.querySelector('main');

  try {
    // 🔥 1. start fetch meteen (parallel)
    const fetchPromise = fetch(url).then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    });

    // 🔥 2. fade out current main
    if (currentMain) {
      currentMain.style.opacity = '0';
    }

    // wacht exact fade duration
    await new Promise(r => setTimeout(r, FADE_DURATION));

    // 🔥 3. wacht op HTML (als nog niet klaar)
    const html = await fetchPromise;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const newMain = doc.querySelector('main');
    if (!newMain) throw new Error('Geen <main> gevonden');

    // 🔥 4. update body class (→ triggert background transition)
    document.body.className = doc.body.className;

    // 🔥 5. swap main (onzichtbaar)
    newMain.style.opacity = '0';

    if (currentMain) {
      currentMain.replaceWith(newMain);
    } else {
      document.body.appendChild(newMain);
    }

    // Re-execute inline scripts from new main (needed for pages like field-notes)
    newMain.querySelectorAll('script:not([src])').forEach(s => {
      const clone = document.createElement('script');
      clone.textContent = s.textContent;
      document.head.appendChild(clone);
      document.head.removeChild(clone);
    });

    document.title = doc.title;

    if (pushState) {
      history.pushState({ url }, '', url);
    }

    restoreScroll(url);
    updateActiveNav(url);

    // force reflow (belangrijk voor animatie)
    newMain.offsetHeight;

    // 🔥 6. fade in nieuwe main
    newMain.style.opacity = '1';

  } catch (err) {
    console.warn('nav.js fallback', err);
    window.location.href = url;
    return;
  } finally {
    isNavigating = false;
  }
}

// ===== NAV STATE =====
function updateActiveNav(url) {
  const path = new URL(url, location.origin).pathname;

  document.querySelectorAll('.nav-links a').forEach(link => {
    const linkPath = new URL(link.href, location.origin).pathname;
    link.classList.toggle('active', linkPath === path);
  });
}

// ===== LINK INTERCEPT =====
function isInternalLink(href) {
  if (!href) return false;
  if (href.startsWith('http') || href.startsWith('//')) return false;
  if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return false;
  return href.endsWith('.html') || !href.includes('.');
}

document.addEventListener('click', e => {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

  const link = e.target.closest('a');
  if (!link) return;

  const href = link.getAttribute('href');
  if (!isInternalLink(href)) return;

  e.preventDefault();
  navigateTo(href);
}, true);

// ===== HISTORY =====
window.addEventListener('popstate', e => {
  const url = e.state?.url ?? location.pathname;
  navigateTo(url, false);
});

// ===== INIT =====
history.replaceState({ url: location.pathname }, '', location.pathname);

const navInitInterval = setInterval(() => {
  if (document.querySelectorAll('.nav-links a').length > 0) {
    updateActiveNav(location.pathname);
    clearInterval(navInitInterval);
  }
}, 50);