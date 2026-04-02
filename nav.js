// ============================================================
// nav.js — client-side routing
// Laadt alleen <main> bij navigatie, header blijft intact.
// Overgang: fade through dark (optie C)
// ============================================================

const FADE_DURATION    = 280;  // fade out/in van <main>
const THROUGH_DURATION = 320;  // duur van het donkere vlak

// ===== DARK OVERLAY =====
// Eén overlay-div die over de hele pagina ligt tijdens de overgang
const overlay = document.createElement('div');
overlay.style.cssText = `
  position: fixed;
  inset: 0;
  background: #06070d;
  opacity: 0;
  pointer-events: none;
  z-index: 9999;
  transition: opacity ${THROUGH_DURATION}ms cubic-bezier(0.4,0,0.2,1);
`;
document.documentElement.appendChild(overlay);

function overlayFadeIn() {
  return new Promise(resolve => {
    overlay.style.opacity = '1';
    setTimeout(resolve, THROUGH_DURATION);
  });
}

function overlayFadeOut() {
  overlay.style.opacity = '0';
}

// ===== SCROLL GEHEUGEN =====
const scrollMemory = new Map();

function saveScroll() {
  scrollMemory.set(window.location.pathname, window.scrollY);
}

function restoreScroll(url) {
  const saved = scrollMemory.get(new URL(url, location.origin).pathname);
  window.scrollTo({ top: saved ?? 0, behavior: 'instant' });
}

// ===== NAVIGATIE =====
let isNavigating = false;

async function navigateTo(url, pushState = true) {
  if (isNavigating) return;
  const targetPath = new URL(url, location.origin).pathname;
  if (targetPath === location.pathname && pushState) return;

  isNavigating = true;
  saveScroll();

  try {
    // stap 1: overlay fadet naar donker
    await overlayFadeIn();

    // stap 2: fetch nieuwe pagina (terwijl scherm donker is)
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    const parser  = new DOMParser();
    const doc     = parser.parseFromString(html, 'text/html');
    const newMain = doc.querySelector('main');
    if (!newMain) throw new Error('Geen <main> gevonden');

    // stap 3: swap content terwijl scherm donker is — geen zichtbaar knipogen
    document.body.className = doc.body.className;
    const currentMain = document.querySelector('main');
    if (currentMain) currentMain.replaceWith(newMain);
    else document.body.appendChild(newMain);

    document.title = doc.title;
    if (pushState) history.pushState({ url }, '', url);
    restoreScroll(url);
    updateActiveNav(url);

    // stap 4: overlay fadet terug naar transparant
    overlayFadeOut();

  } catch (err) {
    console.warn('nav.js: fallback', err);
    overlayFadeOut();
    window.location.href = url;
    return;
  } finally {
    isNavigating = false;
  }
}

// ===== ACTIVE NAV =====
function updateActiveNav(url) {
  const path = new URL(url, location.origin).pathname;
  document.querySelectorAll('.nav-links a').forEach(link => {
    const linkPath = new URL(link.href, location.origin).pathname;
    link.classList.toggle('active', linkPath === path);
  });
}

// ===== LINK INTERCEPTIE =====
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
}, true); // capture phase — vangt ook header-links op

// ===== POPSTATE =====
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