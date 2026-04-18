let currentLink = null;
let currentCard = null;
let hoverTimer = null;
const summaryCache = {};

document.addEventListener('mouseover', (e) => {
  const link = e.target.closest('a');
  if (!link || !link.href || link === currentLink) return;
  if (!link.href.startsWith('http')) return;

  clearTimeout(hoverTimer);

  hoverTimer = setTimeout(() => {
    currentLink = link;
    removeCard();
    showCard(link);

    const url = link.href;

    if (summaryCache[url]) {
      updateCard(summaryCache[url]);
      return;
    }

    chrome.runtime.sendMessage(
      { type: 'getSummary', url },
      (response) => {
        if (!currentCard) return;
        if (response?.summary) {
          summaryCache[url] = response.summary;
          updateCard(response.summary);
        } else {
          updateCard(response?.error || 'could not load preview.');
        }
      }
    );
  }, 300);
});

document.addEventListener('mouseout', (e) => {
  const link = e.target.closest('a');
  if (!link) return;
  clearTimeout(hoverTimer);
  const related = e.relatedTarget;
  if (related && (related === currentCard || currentCard?.contains(related))) return;
  currentLink = null;
  removeCard();
});

function showCard(link) {
  const card = document.createElement('div');
  card.id = 'readit-preview';

  const rect = link.getBoundingClientRect();
  const top = window.scrollY + rect.bottom + 8;
  const left = Math.min(window.scrollX + rect.left, window.innerWidth + window.scrollX - 320);

  card.style.cssText = `
    position: absolute;
    top: ${top}px;
    left: ${left}px;
    width: 300px;
    background: #fff;
    border: 0.5px solid rgba(0,0,0,0.12);
    border-radius: 10px;
    padding: 12px 14px;
    font-family: sans-serif;
    font-size: 13px;
    color: #333;
    line-height: 1.6;
    z-index: 999999;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    pointer-events: auto;
  `;

  const tag = document.createElement('div');
  tag.style.cssText = `
    font-size: 10px;
    color: #378ADD;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    font-weight: 700;
    margin-bottom: 6px;
  `;
  tag.textContent = 'read-it preview';

  const body = document.createElement('div');
  body.id = 'readit-preview-text';
  body.style.cssText = `color: #555; font-size: 13px; line-height: 1.6;`;
  body.textContent = 'loading...';

  const hint = document.createElement('div');
  hint.style.cssText = `margin-top: 8px; font-size: 10px; color: #bbb;`;
  hint.textContent = 'shift+click to save';

  card.appendChild(tag);
  card.appendChild(body);
  card.appendChild(hint);
  document.body.appendChild(card);
  currentCard = card;

  card.addEventListener('mouseleave', () => {
    currentLink = null;
    removeCard();
  });
}

function updateCard(text) {
  const el = document.getElementById('readit-preview-text');
  if (el) el.textContent = text;
}

function removeCard() {
  const existing = document.getElementById('readit-preview');
  if (existing) existing.remove();
  currentCard = null;
}

document.addEventListener('click', (e) => {
  if (!e.shiftKey) return;
  const link = e.target.closest('a');
  if (!link || !link.href) return;
  e.preventDefault();

  const url = link.href;
  const pageTitle = document.title;
  const group = pageTitle
    .split(/[|\-–—]/)[0]
    .trim()
    .toLowerCase()
    .slice(0, 40) || 'uncategorized';

  chrome.storage.local.get(['queue'], (result) => {
    const queue = result.queue || [];
    if (queue.some(item => item.url === url)) {
      showToast('already saved');
      return;
    }
    queue.push({ url, note: pageTitle, group, savedAt: new Date().toISOString() });
    chrome.storage.local.set({ queue }, () => showToast('added to queue'));
  });
});

function getPageColors() {
  const bg = window.getComputedStyle(document.body).backgroundColor;
  const isTransparent = bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent';
  return deriveToastColors(isTransparent
    ? window.getComputedStyle(document.documentElement).backgroundColor
    : bg);
}

function deriveToastColors(bg) {
  const match = bg.match(/\d+/g);
  if (!match) return { bg: 'rgba(30,30,30,0.9)', text: 'rgba(255,255,255,0.7)' };
  const [r, g, b] = match.map(Number);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  const isDark = brightness < 128;
  const shift = isDark ? 20 : -15;
  const tr = Math.min(255, Math.max(0, r + shift));
  const tg = Math.min(255, Math.max(0, g + shift));
  const tb = Math.min(255, Math.max(0, b + shift));
  return {
    bg: `rgba(${tr}, ${tg}, ${tb}, 0.95)`,
    text: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.45)'
  };
}

function showToast(message) {
  const existing = document.getElementById('readit-toast');
  if (existing) existing.remove();
  const { bg, text } = getPageColors();
  const toast = document.createElement('div');
  toast.id = 'readit-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${bg};
    color: ${text};
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-family: sans-serif;
    letter-spacing: 0.02em;
    z-index: 999999;
    opacity: 1;
    transition: opacity 0.4s ease;
    pointer-events: none;
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, 1800);
}