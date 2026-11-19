const $ = (selector) => document.querySelector(selector);
const tabsElement = $('#tabs');
const webviewsElement = $('#webviews');
const homePage = $('#homePage');
const addressInput = $('#address');
const panel = $('#panel');
const panelTitle = $('#panelTitle');
const panelContent = $('#panelContent');

const STORAGE_KEYS = {
  bookmarks: 'penguin.bookmarks.v1',
  history: 'penguin.history.v1',
  theme: 'penguin.theme.v1'
};
const readStore = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
};
const writeStore = (key, value) => localStorage.setItem(key, JSON.stringify(value));

let tabs = [];
let activeTabId = null;
let nextTabId = 1;
let bookmarks = readStore(STORAGE_KEYS.bookmarks, []);
let historyItems = readStore(STORAGE_KEYS.history, []);
let downloadsList = [];

function getActiveTab() {
  return tabs.find((tab) => tab.id === activeTabId) || null;
}

function createTab(initialUrl = '') {
  const id = nextTabId++;
  const view = document.createElement('webview');
  view.className = 'browser-view';
  view.setAttribute('partition', 'persist:penguin-browser');
  view.setAttribute('webpreferences', 'contextIsolation=yes,nodeIntegration=no,sandbox=yes,webSecurity=yes');
  view.setAttribute('src', 'about:blank');
  webviewsElement.appendChild(view);

  const tab = { id, title: 'New Tab', url: '', view, loading: false };
  tabs.push(tab);
  attachViewEvents(tab);
  setActiveTab(id);
  renderTabs();
  if (initialUrl) navigate(initialUrl, tab);
  return tab;
}

function attachViewEvents(tab) {
  const view = tab.view;
  view.addEventListener('did-start-loading', () => {
    tab.loading = true;
    if (tab.id === activeTabId) setStatus('Loading…');
    renderTabs();
  });
  view.addEventListener('did-stop-loading', () => {
    tab.loading = false;
    if (tab.id === activeTabId) {
      setStatus('Ready');
      updateNavigationButtons();
    }
    renderTabs();
  });
  view.addEventListener('page-title-updated', (event) => {
    tab.title = event.title || tab.url || 'New Tab';
    renderTabs();
  });
  view.addEventListener('did-navigate', (event) => {
    if (event.url === 'about:blank') return;
    tab.url = event.url;
    if (tab.id === activeTabId) updateAddressBar();
    addHistory(event.url, tab.title);
    renderTabs();
  });
  view.addEventListener('did-navigate-in-page', (event) => {
    if (event.url === 'about:blank') return;
    tab.url = event.url;
    if (tab.id === activeTabId) updateAddressBar();
  });
  view.addEventListener('did-fail-load', (event) => {
    if (event.errorCode === -3) return; // Navigation was intentionally cancelled.
    if (tab.id === activeTabId && event.isMainFrame) {
      setStatus(`Could not load page (${event.errorCode})`);
    }
  });
  view.addEventListener('new-window', (event) => {
    // Kept for compatibility with Electron versions that still emit this event.
    if (event.url) createTab(event.url);
  });
}

function normalizeInput(value) {
  const input = value.trim();
  if (!input) return '';
  if (/^(https?:\/\/|file:|about:)/i.test(input)) return input;
  const looksLikeAddress = /^(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/i.test(input) ||
    (/^[\w.-]+\.[a-z]{2,}(:\d+)?(\/.*)?$/i.test(input) && !/\s/.test(input));
  return looksLikeAddress ? `https://${input}` : `https://duckduckgo.com/?q=${encodeURIComponent(input)}`;
}

function navigate(value, tab = getActiveTab()) {
  if (!tab) return;
  const url = normalizeInput(value);
  if (!url) return;
  tab.url = url;
  tab.title = url;
  tab.view.src = url;
  showBrowserView(tab);
  updateAddressBar();
  renderTabs();
  closePanel();
}

function showBrowserView(tab) {
  homePage.classList.toggle('hidden', Boolean(tab.url));
  tabs.forEach((item) => {
    item.view.classList.toggle('active', item.id === tab.id && Boolean(item.url));
  });
  if (!tab.url) {
    homePage.classList.remove('hidden');
    tabs.forEach((item) => item.view.classList.remove('active'));
  }
}

function setActiveTab(id) {
  activeTabId = id;
  const tab = getActiveTab();
  if (!tab) return;
  showBrowserView(tab);
  updateAddressBar();
  updateNavigationButtons();
  renderTabs();
  setStatus(tab.loading ? 'Loading…' : 'Ready');
}

function renderTabs() {
  tabsElement.replaceChildren();
  tabs.forEach((tab) => {
    const button = document.createElement('button');
    button.className = `tab${tab.id === activeTabId ? ' active' : ''}`;
    button.type = 'button';
    button.title = tab.title;
    const favicon = document.createElement('span');
    favicon.textContent = tab.loading ? '◌' : (tab.url ? '◉' : '🐧');
    const title = document.createElement('span');
    title.className = 'tab-title';
    title.textContent = tab.title || 'New Tab';
    const close = document.createElement('span');
    close.className = 'tab-close';
    close.textContent = '×';
    close.title = 'Close tab';
    close.addEventListener('click', (event) => {
      event.stopPropagation();
      closeTab(tab.id);
    });
    button.append(favicon, title, close);
    button.addEventListener('click', () => setActiveTab(tab.id));
    tabsElement.appendChild(button);
  });
}

function closeTab(id) {
  const index = tabs.findIndex((tab) => tab.id === id);
  if (index < 0) return;
  const [removed] = tabs.splice(index, 1);
  removed.view.remove();
  if (tabs.length === 0) {
    createTab();
    return;
  }
  if (activeTabId === id) {
    const next = tabs[Math.max(0, index - 1)] || tabs[0];
    setActiveTab(next.id);
  } else {
    renderTabs();
  }
}

function updateAddressBar() {
  const tab = getActiveTab();
  addressInput.value = tab?.url && tab.url !== 'about:blank' ? tab.url : '';
  const secure = Boolean(tab?.url.startsWith('https://'));
  $('#securityIcon').textContent = secure ? '🔒' : '⌕';
  $('#securityIcon').title = secure ? 'Secure HTTPS connection' : 'Search or website address';
  updateBookmarkButton();
}

function updateNavigationButtons() {
  const tab = getActiveTab();
  $('#back').disabled = !tab || !tab.url || !tab.view.canGoBack();
  $('#forward').disabled = !tab || !tab.url || !tab.view.canGoForward();
  $('#reload').textContent = tab?.loading ? '×' : '↻';
  $('#reload').title = tab?.loading ? 'Stop loading' : 'Reload';
}

function setStatus(message) {
  $('#statusText').textContent = message;
}

function addHistory(url, title) {
  if (!url || !/^https?:\/\//i.test(url)) return;
  historyItems = historyItems.filter((item) => item.url !== url);
  historyItems.unshift({ url, title: title || url, visitedAt: Date.now() });
  historyItems = historyItems.slice(0, 150);
  writeStore(STORAGE_KEYS.history, historyItems);
}

function updateBookmarkButton() {
  const url = getActiveTab()?.url || '';
  const saved = bookmarks.some((item) => item.url === url);
  $('#bookmark').textContent = saved ? '★' : '☆';
  $('#bookmark').title = saved ? 'Remove bookmark' : 'Bookmark this page';
}

function toggleBookmark() {
  const tab = getActiveTab();
  if (!tab?.url || !/^https?:\/\//i.test(tab.url)) {
    setStatus('Open a website before bookmarking it');
    return;
  }
  const existing = bookmarks.findIndex((item) => item.url === tab.url);
  if (existing >= 0) bookmarks.splice(existing, 1);
  else bookmarks.unshift({ url: tab.url, title: tab.title || tab.url });
  writeStore(STORAGE_KEYS.bookmarks, bookmarks);
  updateBookmarkButton();
  setStatus(existing >= 0 ? 'Bookmark removed' : 'Page bookmarked');
}

function openPanel(title, contentBuilder) {
  panelTitle.textContent = title;
  panelContent.replaceChildren();
  contentBuilder(panelContent);
  panel.classList.remove('hidden');
}
function closePanel() { panel.classList.add('hidden'); }

function addPanelRow(container, label, detail, onClick, actionLabel = 'Open') {
  const row = document.createElement('div');
  row.className = 'panel-row';
  const body = document.createElement('div');
  body.className = 'panel-row-body';
  const main = document.createElement('div');
  main.className = 'panel-row-title';
  main.textContent = label;
  const sub = document.createElement('div');
  sub.className = 'panel-row-detail';
  sub.textContent = detail;
  body.append(main, sub);
  const action = document.createElement('button');
  action.type = 'button';
  action.textContent = actionLabel;
  action.addEventListener('click', onClick);
  row.append(body, action);
  container.appendChild(row);
}
function emptyMessage(container, message) {
  const p = document.createElement('p');
  p.className = 'panel-empty';
  p.textContent = message;
  container.appendChild(p);
}

function showBookmarks() {
  openPanel('Bookmarks', (container) => {
    if (!bookmarks.length) emptyMessage(container, 'Your saved pages will appear here. Press the ☆ button while visiting a website to bookmark it.');
    bookmarks.forEach((item) => addPanelRow(container, item.title, item.url, () => navigate(item.url)));
    if (bookmarks.length) {
      const clear = document.createElement('button');
      clear.className = 'panel-secondary';
      clear.textContent = 'Clear all bookmarks';
      clear.addEventListener('click', () => { bookmarks = []; writeStore(STORAGE_KEYS.bookmarks, bookmarks); showBookmarks(); updateBookmarkButton(); });
      container.appendChild(clear);
    }
  });
}

function showHistory() {
  openPanel('History', (container) => {
    if (!historyItems.length) emptyMessage(container, 'Pages you visit will appear here.');
    historyItems.forEach((item) => addPanelRow(item.title, item.url, new Date(item.visitedAt).toLocaleString(), () => navigate(item.url)));
    if (historyItems.length) {
      const clear = document.createElement('button');
      clear.className = 'panel-secondary';
      clear.textContent = 'Clear browsing history';
      clear.addEventListener('click', () => { historyItems = []; writeStore(STORAGE_KEYS.history, historyItems); showHistory(); });
      container.appendChild(clear);
    }
  });
}

function showDownloads() {
  openPanel('Downloads', (container) => {
    if (!downloadsList.length) emptyMessage(container, 'Downloads started by websites will appear here. Files are saved to your system Downloads folder.');
    downloadsList.slice().reverse().forEach((item) => {
      const size = item.total ? `${Math.round(item.received / item.total * 100)}%` : item.state;
      addPanelRow(item.filename, size, '', () => {}, item.state === 'completed' ? 'Done' : '…');
    });
  });
}

function showSettings() {
  openPanel('Settings', (container) => {
    const themeLine = document.createElement('div');
    themeLine.className = 'setting-line';
    const label = document.createElement('span');
    label.textContent = 'Appearance';
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.textContent = document.body.classList.contains('light') ? 'Switch to dark' : 'Switch to light';
    toggle.addEventListener('click', () => {
      document.body.classList.toggle('light');
      localStorage.setItem(STORAGE_KEYS.theme, document.body.classList.contains('light') ? 'light' : 'dark');
      showSettings();
    });
    themeLine.append(label, toggle);
    container.appendChild(themeLine);

    const engineLine = document.createElement('div');
    engineLine.className = 'setting-line';
    const engineLabel = document.createElement('span');
    engineLabel.textContent = 'Search engine';
    const engineValue = document.createElement('span');
    engineValue.textContent = 'DuckDuckGo';
    engineLine.append(engineLabel, engineValue);
    container.appendChild(engineLine);

    const about = document.createElement('p');
    about.className = 'panel-empty';
    about.textContent = 'Penguin Browser is an independent, Linux-inspired browser project. It uses Electron and Chromium for website rendering.';
    container.appendChild(about);
  });
}

$('#addressForm').addEventListener('submit', (event) => {
  event.preventDefault();
  navigate(addressInput.value);
});
$('#homeSearch').addEventListener('submit', (event) => {
  event.preventDefault();
  navigate($('#homeQuery').value);
});
$('#newTab').addEventListener('click', () => createTab());
$('#back').addEventListener('click', () => { const tab = getActiveTab(); if (tab?.view.canGoBack()) tab.view.goBack(); });
$('#forward').addEventListener('click', () => { const tab = getActiveTab(); if (tab?.view.canGoForward()) tab.view.goForward(); });
$('#reload').addEventListener('click', () => {
  const tab = getActiveTab();
  if (!tab?.url) return;
  if (tab.loading) tab.view.stop(); else tab.view.reload();
});
$('#home').addEventListener('click', () => {
  const tab = getActiveTab();
  if (!tab) return;
  tab.url = '';
  tab.title = 'New Tab';
  tab.view.src = 'about:blank';
  showBrowserView(tab);
  updateAddressBar();
  renderTabs();
  setStatus('Ready to explore');
});
$('#bookmark').addEventListener('click', toggleBookmark);
$('#history').addEventListener('click', showHistory);
$('#bookmarks').addEventListener('click', showBookmarks);
$('#downloads').addEventListener('click', showDownloads);
$('#settings').addEventListener('click', showSettings);
$('#closePanel').addEventListener('click', closePanel);
document.querySelectorAll('.quick-links [data-url]').forEach((button) => button.addEventListener('click', () => navigate(button.dataset.url)));

document.addEventListener('keydown', (event) => {
  const mac = window.penguin?.platform === 'darwin';
  const modifier = mac ? event.metaKey : event.ctrlKey;
  if (modifier && event.key.toLowerCase() === 'l') { event.preventDefault(); addressInput.focus(); addressInput.select(); }
  if (modifier && event.key.toLowerCase() === 't') { event.preventDefault(); createTab(); }
  if (modifier && event.key.toLowerCase() === 'w') { event.preventDefault(); closeTab(activeTabId); }
  if (modifier && event.key.toLowerCase() === 'r') { event.preventDefault(); $('#reload').click(); }
  if (event.key === 'Escape' && !panel.classList.contains('hidden')) closePanel();
});

window.penguin?.onNewTab((url) => createTab(url));
window.penguin?.onDownload((info) => {
  const existing = downloadsList.find((item) => item.filename === info.filename);
  if (existing) Object.assign(existing, info);
  else downloadsList.push(info);
  if (!panel.classList.contains('hidden') && panelTitle.textContent === 'Downloads') showDownloads();
});

const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
if (savedTheme === 'light') document.body.classList.add('light');
createTab();
