const queueList = document.getElementById('queue-list');
const savedCount = document.getElementById('saved-count');
const themeBtn = document.getElementById('theme-btn');
const settingsBtn = document.getElementById('settings-btn');
const backBtn = document.getElementById('back-btn');
const mainView = document.getElementById('main');
const settingsView = document.getElementById('settings-view');

function initTheme() {
  chrome.storage.local.get(['theme'], (result) => {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(result.theme ? result.theme === 'dark' : systemDark);
  });
}

function applyTheme(isDark) {
  document.body.classList.toggle('dark', isDark);
  themeBtn.textContent = isDark ? '● dark' : '○ light';
}

themeBtn.addEventListener('click', () => {
  const isDark = document.body.classList.contains('dark');
  chrome.storage.local.set({ theme: isDark ? 'light' : 'dark' });
  applyTheme(!isDark);
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  chrome.storage.local.get(['theme'], (r) => { if (!r.theme) applyTheme(e.matches); });
});

settingsBtn.addEventListener('click', () => {
  mainView.style.display = 'none';
  settingsView.style.display = 'block';
});

backBtn.addEventListener('click', () => {
  mainView.style.display = 'block';
  settingsView.style.display = 'none';
});

function loadQueue() {
  chrome.storage.local.get(['queue'], (result) => {
    renderQueue(result.queue || []);
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function renderQueue(queue) {
  savedCount.textContent = queue.length > 0 ? `${queue.length} saved` : '';

  if (queue.length === 0) {
    queueList.innerHTML = `
      <div id="empty-state">
        nothing here yet.<br/>
        shift+click any link while browsing<br/>
        to add it to your queue.
      </div>`;
    return;
  }

  const groups = {};
  queue.forEach((item, index) => {
    const g = item.group || 'uncategorized';
    if (!groups[g]) groups[g] = [];
    groups[g].push({ ...item, index });
  });

  queueList.innerHTML = '';

  Object.entries(groups).forEach(([groupName, items]) => {
    const block = document.createElement('div');
    block.className = 'group-block';

    const labelDiv = document.createElement('div');
    labelDiv.className = 'group-label';
    labelDiv.innerHTML = `
      <div class="group-label-left">
        <span class="group-name">${capitalize(groupName)}</span>
        <span class="group-count">${items.length}</span>
      </div>
      <button class="trash-group" data-group="${groupName}" title="delete group">🗑</button>
    `;
    block.appendChild(labelDiv);

    items.forEach((item, i) => {
      const isNext = i === 0;
      const div = document.createElement('div');
      div.className = 'queue-item';
      div.innerHTML = `
        ${isNext ? '<div class="next-label">read next</div>' : ''}
        <div class="item-top">
          <a class="item-url ${isNext ? '' : 'dimmed'}" href="${item.url}" target="_blank">${item.url}</a>
          <button class="trash-item" data-index="${item.index}" title="remove">🗑</button>
        </div>
        <div class="item-note">${item.note}</div>
        <div class="item-actions">
          <button class="action-btn mark-btn" data-index="${item.index}">✓ mark as read</button>
          ${isNext ? `<button class="action-btn skip-btn" data-index="${item.index}">→ skip</button>` : ''}
        </div>
      `;
      block.appendChild(div);
    });

    queueList.appendChild(block);
  });

  document.querySelectorAll('.mark-btn').forEach(btn => {
    btn.addEventListener('click', (e) => removeItem(parseInt(e.target.getAttribute('data-index'))));
  });
  document.querySelectorAll('.skip-btn').forEach(btn => {
    btn.addEventListener('click', (e) => skipItem(parseInt(e.target.getAttribute('data-index'))));
  });
  document.querySelectorAll('.trash-item').forEach(btn => {
    btn.addEventListener('click', (e) => removeItem(parseInt(e.target.getAttribute('data-index'))));
  });
  document.querySelectorAll('.trash-group').forEach(btn => {
    btn.addEventListener('click', (e) => removeGroup(e.target.getAttribute('data-group')));
  });
}

function removeItem(index) {
  chrome.storage.local.get(['queue'], (result) => {
    const queue = result.queue || [];
    queue.splice(index, 1);
    chrome.storage.local.set({ queue }, loadQueue);
  });
}

function skipItem(index) {
  chrome.storage.local.get(['queue'], (result) => {
    const queue = result.queue || [];
    const item = queue.splice(index, 1)[0];
    queue.push(item);
    chrome.storage.local.set({ queue }, loadQueue);
  });
}

function removeGroup(groupName) {
  chrome.storage.local.get(['queue'], (result) => {
    const queue = (result.queue || []).filter(item => (item.group || 'uncategorized') !== groupName);
    chrome.storage.local.set({ queue }, loadQueue);
  });
}

initTheme();
loadQueue();