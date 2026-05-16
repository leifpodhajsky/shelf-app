// content.js — Shelf content script
// Injects a floating "Add to Stack" overlay on right-click, and handles meta extraction

let shelfOverlay = null;
let lastRightClick = { x: 0, y: 0, linkUrl: '', imgUrl: '', selText: '' };

// ── LISTEN FOR META EXTRACTION REQUESTS ──
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXTRACT_META') {
    const og = (prop) => {
      const el = document.querySelector(`meta[property="og:${prop}"]`) ||
                  document.querySelector(`meta[name="twitter:${prop}"]`);
      return el ? el.getAttribute('content') : null;
    };
    const metaDesc = document.querySelector('meta[name="description"]');
    sendResponse({
      title: og('title') || document.title || '',
      description: og('description') || (metaDesc ? metaDesc.getAttribute('content') : '') || '',
      image: og('image') || '',
      url: og('url') || location.href,
      siteName: og('site_name') || new URL(location.href).hostname.replace('www.', '')
    });
    return true;
  }

  if (message.type === 'SHOW_STACK_OVERLAY') {
    showStackOverlay(message.data);
    sendResponse({ ok: true });
    return true;
  }
});

// ── TRACK RIGHT-CLICK CONTEXT ──
document.addEventListener('contextmenu', (e) => {
  lastRightClick.x = e.clientX;
  lastRightClick.y = e.clientY;
  lastRightClick.linkUrl = e.target.closest('a') ? e.target.closest('a').href : '';
  lastRightClick.imgUrl = e.target.tagName === 'IMG' ? e.target.src : '';
  lastRightClick.selText = window.getSelection().toString().trim();
});

// ── SHOW OVERLAY ──
function showStackOverlay(data) {
  // Remove existing overlay
  if (shelfOverlay) { shelfOverlay.remove(); shelfOverlay = null; }

  const url = data.url || location.href;
  const title = data.title || document.title || '';
  const note = data.note || '';
  const thumb = data.thumb || '';

  // Get saved items to show types/channels
  chrome.storage.local.get(['shelf3_items', 'shelf3_ctypes'], (stored) => {
    const items = JSON.parse(stored.shelf3_items || '[]');
    const customTypes = JSON.parse(stored.shelf3_ctypes || '[]');

    const BUILTIN = [
      {id:'book',name:'Book',icon:'📚'},
      {id:'video',name:'Video',icon:'▶'},
      {id:'music',name:'Music',icon:'♪'},
      {id:'meme',name:'Meme',icon:'😂'},
      {id:'doc',name:'Documentary',icon:'🎬'},
      {id:'article',name:'Article',icon:'📰'},
      {id:'fashion',name:'Fashion',icon:'👗'},
      {id:'other',name:'Other',icon:'◈'},
    ];
    const allTypes = [...BUILTIN, ...customTypes];
    const detectedType = autoDetectType(url);

    // Build overlay HTML
    const overlay = document.createElement('div');
    overlay.id = 'shelf-stack-overlay';
    overlay.innerHTML = `
      <div id="shelf-panel">
        <div id="shelf-panel-header">
          <span id="shelf-panel-logo">Shelf</span>
          <button id="shelf-panel-close">✕</button>
        </div>
        <div id="shelf-panel-body">
          <div class="shelf-field">
            <label>Adding</label>
            <div id="shelf-url-row">
              <img id="shelf-favicon" src="https://www.google.com/s2/favicons?sz=32&domain=${encodeURIComponent(new URL(url).hostname)}" onerror="this.style.display='none'" alt="">
              <span id="shelf-url-domain">${new URL(url).hostname.replace('www.','')}</span>
            </div>
          </div>
          <div class="shelf-field">
            <label>Title</label>
            <input type="text" id="shelf-title-input" value="${escAttr(title)}" placeholder="What's this?">
          </div>
          <div class="shelf-field">
            <label>Stack in</label>
            <div id="shelf-type-grid">
              ${allTypes.map(t => `
                <button class="shelf-type-btn ${t.id===detectedType?'sel':''}" data-type="${t.id}" onclick="shelfPickType(this,'${t.id}')">
                  <span>${t.icon}</span><span>${t.name}</span>
                </button>`).join('')}
            </div>
          </div>
          ${note ? `<div class="shelf-field"><label>Note</label><div id="shelf-note-preview">${escHtml(note.slice(0,120))}</div></div>` : ''}
          <div id="shelf-result"></div>
        </div>
        <div id="shelf-panel-footer">
          <button id="shelf-cancel-btn">Cancel</button>
          <button id="shelf-save-btn">+ Stack it</button>
        </div>
      </div>
    `;

    // Styles — injected inline to avoid CSP issues
    const style = document.createElement('style');
    style.textContent = `
      #shelf-stack-overlay {
        position: fixed; top: 0; right: 0; bottom: 0; left: 0;
        z-index: 2147483647;
        pointer-events: none;
      }
      #shelf-panel {
        position: fixed; top: 16px; right: 16px;
        width: 320px; max-height: 90vh;
        background: #16161a; color: #eeedf0;
        border: 1px solid rgba(255,255,255,.13);
        border-radius: 12px; overflow: hidden;
        box-shadow: 0 24px 64px rgba(0,0,0,.7);
        font-family: 'DM Sans', -apple-system, sans-serif;
        font-size: 13.5px; line-height: 1.5;
        pointer-events: all;
        animation: shelfSlideIn .22s cubic-bezier(.4,0,.2,1);
        display: flex; flex-direction: column;
      }
      @keyframes shelfSlideIn {
        from { opacity:0; transform: translateY(-12px) scale(.97); }
        to   { opacity:1; transform: none; }
      }
      #shelf-panel-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 14px 16px 10px;
        border-bottom: 1px solid rgba(255,255,255,.07);
        flex-shrink: 0;
      }
      #shelf-panel-logo {
        font-family: Georgia, 'Times New Roman', serif;
        font-size: 17px; font-weight: 700; color: #eeedf0;
        letter-spacing: -.01em;
      }
      #shelf-panel-close {
        background: none; border: none; cursor: pointer;
        color: #5c5a65; font-size: 16px; padding: 2px 5px;
        border-radius: 4px; transition: color .13s;
      }
      #shelf-panel-close:hover { color: #eeedf0; background: #1e1e24; }
      #shelf-panel-body { padding: 14px 16px; overflow-y: auto; flex: 1; }
      .shelf-field { margin-bottom: 12px; }
      .shelf-field label {
        display: block;
        font-family: 'DM Mono', 'Courier New', monospace;
        font-size: 9.5px; letter-spacing: .1em; text-transform: uppercase;
        color: #5c5a65; margin-bottom: 5px;
      }
      #shelf-url-row {
        display: flex; align-items: center; gap: 7px;
        background: #1e1e24; border-radius: 6px; padding: 7px 10px;
      }
      #shelf-favicon { width: 14px; height: 14px; border-radius: 3px; flex-shrink: 0; }
      #shelf-url-domain {
        font-family: 'DM Mono', monospace; font-size: 11px;
        color: #9997a0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      #shelf-title-input {
        width: 100%; background: #1e1e24; border: 1px solid rgba(255,255,255,.1);
        border-radius: 6px; padding: 8px 10px; color: #eeedf0;
        font-family: inherit; font-size: 13.5px; outline: none;
        transition: border-color .13s;
      }
      #shelf-title-input:focus { border-color: #c0392b; }
      #shelf-type-grid {
        display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px;
      }
      .shelf-type-btn {
        display: flex; flex-direction: column; align-items: center; gap: 2px;
        padding: 7px 4px; border: 1px solid rgba(255,255,255,.1);
        border-radius: 6px; cursor: pointer; background: transparent;
        color: #5c5a65; font-size: 10px;
        font-family: 'DM Mono', monospace; letter-spacing: .02em;
        transition: all .13s; text-align: center;
      }
      .shelf-type-btn span:first-child { font-size: 16px; }
      .shelf-type-btn:hover { border-color: rgba(255,255,255,.2); color: #eeedf0; background: #1e1e24; }
      .shelf-type-btn.sel { border-color: #c0392b; background: rgba(192,57,43,.15); color: #e05c4e; }
      #shelf-note-preview {
        font-size: 12px; color: #9997a0; font-style: italic;
        padding: 8px 10px; background: #1e1e24; border-radius: 6px;
        border-left: 3px solid #c0392b;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      #shelf-result {
        font-family: 'DM Mono', monospace; font-size: 11px;
        text-align: center; min-height: 16px; margin-top: 4px;
      }
      #shelf-result.ok { color: #3daa72; }
      #shelf-result.err { color: #e05c4e; }
      #shelf-panel-footer {
        padding: 10px 16px 14px;
        border-top: 1px solid rgba(255,255,255,.07);
        display: flex; gap: 8px; justify-content: flex-end;
        flex-shrink: 0;
      }
      #shelf-cancel-btn {
        background: transparent; border: 1px solid rgba(255,255,255,.1);
        border-radius: 6px; padding: 7px 14px; cursor: pointer;
        color: #9997a0; font-family: 'DM Mono', monospace;
        font-size: 10px; letter-spacing: .06em; text-transform: uppercase;
        transition: all .13s;
      }
      #shelf-cancel-btn:hover { border-color: rgba(255,255,255,.2); color: #eeedf0; }
      #shelf-save-btn {
        background: #c0392b; border: none; border-radius: 6px;
        padding: 7px 16px; cursor: pointer; color: #fff;
        font-family: 'DM Mono', monospace; font-size: 10px;
        letter-spacing: .06em; text-transform: uppercase;
        transition: background .13s; font-weight: 600;
      }
      #shelf-save-btn:hover { background: #e05c4e; }
      #shelf-save-btn:disabled { opacity: .5; cursor: default; }
    `;

    document.head.appendChild(style);
    document.body.appendChild(overlay);
    shelfOverlay = overlay;

    // Close handlers
    document.getElementById('shelf-panel-close').onclick = removeOverlay;
    document.getElementById('shelf-cancel-btn').onclick = removeOverlay;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) removeOverlay(); });

    // Track selected type
    window._shelfSelType = detectedType;

    // Save handler
    document.getElementById('shelf-save-btn').onclick = async () => {
      const titleVal = document.getElementById('shelf-title-input').value.trim();
      if (!titleVal) {
        document.getElementById('shelf-result').textContent = 'Please enter a title';
        document.getElementById('shelf-result').className = 'err';
        return;
      }
      const btn = document.getElementById('shelf-save-btn');
      btn.disabled = true;
      btn.textContent = 'Stacking…';

      const newItem = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
        title: titleVal,
        type: window._shelfSelType || 'other',
        url: url, note: note || '', thumb: thumb,
        creator: '', year: '', tags: [],
        date: new Date().toISOString(), fav: false, friendIds: [],
        ogDomain: new URL(url).hostname.replace('www.', ''),
      };

      chrome.storage.local.get('shelf3_items', (d) => {
        const existing = JSON.parse(d.shelf3_items || '[]');
        existing.unshift(newItem);
        chrome.storage.local.set({ shelf3_items: JSON.stringify(existing) }, () => {
          const result = document.getElementById('shelf-result');
          if (result) {
            result.textContent = '✓ Stacked!';
            result.className = 'ok';
          }
          if (btn) { btn.textContent = '✓ Stacked'; btn.style.background = '#3daa72'; }
          setTimeout(removeOverlay, 1200);
        });
      });
    };

    // Focus title input
    setTimeout(() => {
      const inp = document.getElementById('shelf-title-input');
      if (inp) { inp.focus(); inp.select(); }
    }, 100);
  });
}

function shelfPickType(btn, typeId) {
  window._shelfSelType = typeId;
  document.querySelectorAll('.shelf-type-btn').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
}

function removeOverlay() {
  if (shelfOverlay) { shelfOverlay.remove(); shelfOverlay = null; }
  const style = document.getElementById('shelf-stack-style');
  if (style) style.remove();
}

function autoDetectType(url) {
  const u = (url || '').toLowerCase();
  if (u.includes('youtube') || u.includes('youtu.be') || u.includes('vimeo')) return 'video';
  if (u.includes('spotify') || u.includes('soundcloud') || u.includes('music.apple')) return 'music';
  if (u.includes('goodreads') || u.includes('books.google')) return 'book';
  if (u.includes('imdb')) return 'doc';
  if (u.includes('ssense') || u.includes('farfetch') || u.includes('vogue') || u.includes('hypebeast')) return 'fashion';
  if (u.includes('medium') || u.includes('substack') || u.includes('nytimes') || u.includes('bbc.')) return 'article';
  if (u.includes('reddit') || u.includes('imgur') || u.includes('knowyourmeme')) return 'meme';
  return 'other';
}

function escAttr(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
// Make shelfPickType global so inline onclick works
window.shelfPickType = shelfPickType;
