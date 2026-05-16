// background-ff.js — Firefox MV2 background script
// Identical logic to background.js but using MV2 APIs (browser.* instead of chrome.*)
// Firefox supports both chrome.* and browser.* so this is a thin compatibility shim

// Context menus
browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({ id: 'shelf-add-page',      title: '+ Stack this page',      contexts: ['page','frame'] });
  browser.contextMenus.create({ id: 'shelf-add-link',      title: '+ Stack this link',      contexts: ['link'] });
  browser.contextMenus.create({ id: 'shelf-add-image',     title: '+ Stack this image',     contexts: ['image'] });
  browser.contextMenus.create({ id: 'shelf-add-selection', title: '+ Stack selection as note', contexts: ['selection'] });
});

browser.contextMenus.onClicked.addListener((info, tab) => {
  let url = tab.url, title = tab.title || '', thumb = '', note = '';
  if (info.menuItemId === 'shelf-add-link') { url = info.linkUrl; title = info.selectionText || ''; }
  else if (info.menuItemId === 'shelf-add-image') { thumb = info.srcUrl; }
  else if (info.menuItemId === 'shelf-add-selection') { note = info.selectionText || ''; }

  // In Firefox MV2, we use tabs.executeScript instead of scripting.executeScript
  browser.tabs.executeScript(tab.id, { code: `
    (function() {
      const og = p => { const el = document.querySelector('meta[property="og:'+p+'"]') || document.querySelector('meta[name="twitter:'+p+'"]'); return el ? el.getAttribute('content') : null; };
      return { title: og('title') || document.title, description: og('description') || '', image: og('image') || '', url: og('url') || location.href };
    })()
  ` }).then(results => {
    const meta = (results && results[0]) || {};
    browser.tabs.sendMessage(tab.id, {
      type: 'SHOW_STACK_OVERLAY',
      data: { url, title: title || meta.title || tab.title || '', thumb: thumb || meta.image || '', note }
    });
  }).catch(() => {
    browser.tabs.sendMessage(tab.id, { type: 'SHOW_STACK_OVERLAY', data: { url, title, thumb, note } });
  });
});

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_TABS') {
    browser.tabs.query({}).then(tabs => {
      const tabData = tabs
        .map(t => ({ id: t.id, title: t.title || 'Untitled', url: t.url || '', favIconUrl: t.favIconUrl || '', active: t.active, windowId: t.windowId }))
        .filter(t => t.url && !t.url.startsWith('moz-extension://') && !t.url.startsWith('about:') && !t.url.startsWith('chrome://'));
      sendResponse({ tabs: tabData });
    });
    return true;
  }
});
