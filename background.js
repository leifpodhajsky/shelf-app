// background.js — Shelf Service Worker (Chrome MV3)

// ── INSTALL ──
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id:'shelf-add-page',      title:'+ Stack this page',         contexts:['page','frame'] });
  chrome.contextMenus.create({ id:'shelf-add-link',      title:'+ Stack this link',         contexts:['link'] });
  chrome.contextMenus.create({ id:'shelf-add-image',     title:'+ Stack this image',        contexts:['image'] });
  chrome.contextMenus.create({ id:'shelf-add-selection', title:'+ Stack selection as note', contexts:['selection'] });
});

// ── CONTEXT MENU ──
chrome.contextMenus.onClicked.addListener((info, tab) => {
  let url = tab.url, title = tab.title || '', thumb = '', note = '';
  if (info.menuItemId === 'shelf-add-link')      { url = info.linkUrl; title = info.selectionText || ''; }
  else if (info.menuItemId === 'shelf-add-image') { thumb = info.srcUrl; }
  else if (info.menuItemId === 'shelf-add-selection') { note = info.selectionText || ''; }
  chrome.scripting.executeScript({ target: { tabId: tab.id }, func: extractPageMeta })
    .then(results => {
      const meta = (results && results[0] && results[0].result) || {};
      chrome.tabs.sendMessage(tab.id, {
        type: 'SHOW_STACK_OVERLAY',
        data: { url, title: title || meta.title || tab.title || '', thumb: thumb || meta.image || '', note }
      });
    }).catch(() => {
      chrome.tabs.sendMessage(tab.id, { type: 'SHOW_STACK_OVERLAY', data: { url, title, thumb, note } });
    });
});

function extractPageMeta() {
  const og = p => { const el = document.querySelector(`meta[property="og:${p}"]`) || document.querySelector(`meta[name="twitter:${p}"]`); return el ? el.getAttribute('content') : null; };
  return { title: og('title') || document.title || '', description: og('description') || '', image: og('image') || '', url: og('url') || location.href };
}

// ── KEYBOARD COMMANDS ──
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  switch (command) {
    case 'open-shelf':
      chrome.tabs.create({ url: chrome.runtime.getURL('shelf.html') });
      break;
    case 'stack-current-tab':
      chrome.scripting.executeScript({ target: { tabId: tab.id }, func: extractPageMeta })
        .then(results => {
          const meta = (results && results[0] && results[0].result) || {};
          chrome.tabs.sendMessage(tab.id, {
            type: 'SHOW_STACK_OVERLAY',
            data: { url: tab.url, title: meta.title || tab.title || '', thumb: meta.image || '', note: '' }
          });
        }).catch(() => {
          chrome.tabs.sendMessage(tab.id, { type: 'SHOW_STACK_OVERLAY', data: { url: tab.url, title: tab.title || '', thumb: '', note: '' }});
        });
      break;
    case 'search-shelf':
      chrome.tabs.create({ url: chrome.runtime.getURL('shelf.html') + '?focus=search' });
      break;
  }
});

// ── MESSAGE HANDLER ──
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_TABS') {
    chrome.tabs.query({}, tabs => {
      const tabData = tabs
        .map(t => ({ id: t.id, title: t.title || 'Untitled', url: t.url || '', favIconUrl: t.favIconUrl || '', active: t.active, windowId: t.windowId }))
        .filter(t => t.url && !t.url.startsWith('chrome://') && !t.url.startsWith('chrome-extension://') && !t.url.startsWith('about:') && !t.url.startsWith('edge://'));
      sendResponse({ tabs: tabData });
    });
    return true;
  }
  if (message.type === 'AUTO_TAG') {
    // Fetch + AI tag from background where CSP is more permissive
    autoTagItem(message.url, message.title).then(result => sendResponse(result)).catch(() => sendResponse(null));
    return true;
  }
});

// ── SMART AUTO-TAGGING via Claude API ──
async function autoTagItem(url, title) {
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Given this URL and title, suggest: 1) the content type, 2) up to 4 short tags, 3) a one-sentence description. Return ONLY JSON, no markdown:
{"type":"video|book|music|article|fashion|doc|meme|other","tags":["tag1","tag2"],"note":"One sentence."}

URL: ${url}
Title: ${title}`
        }]
      })
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const text = data.content?.[0]?.text || '{}';
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch (e) { return null; }
}
