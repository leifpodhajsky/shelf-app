# Shelf — Browser Extension

> Stack books, videos, music, articles and anything you love. Share curated shelves with friends.

---

## Installing

### Chrome / Brave / Arc / Edge (Chromium)

1. Unzip `shelf-extension.zip`
2. Go to `chrome://extensions` (or `edge://extensions`)
3. Enable **Developer Mode** (top-right toggle)
4. Click **Load unpacked**
5. Select the `shelf-extension` folder
6. Shelf icon appears in your toolbar ✓

### Firefox

1. Unzip `shelf-extension.zip`  
2. **Rename** `manifest-firefox.json` → `manifest.json` (replacing the existing one)
3. Go to `about:debugging#/runtime/this-firefox`
4. Click **Load Temporary Add-on**
5. Select `manifest.json` inside the folder

> **For permanent Firefox install**: Package as `.xpi` using `web-ext build` and submit to addons.mozilla.org, or sideload via `about:config` → `xpinstall.signatures.required = false`.

---

## Files

```
shelf-extension/
├── manifest.json           Chrome/Edge/Brave (MV3)
├── manifest-firefox.json   Firefox (MV2) — rename to use
├── background.js           Chrome service worker
├── background-ff.js        Firefox background script
├── content.js              Injected on all pages (right-click overlay)
├── popup.html              Toolbar popup (quick save + open tabs)
├── shelf.html              Full shelf app (also opens via Options)
├── icons/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

---

## Features

| Feature | Description |
|---|---|
| **Right-click save** | Right-click any page, link, image or selected text → "Stack this…" |
| **Toolbar popup** | Click the Shelf icon to save current page or browse open tabs |
| **Open Tabs panel** | Slide open from the Shelf header to see and save all browser tabs |
| **Drag to shelf** | Drag tabs from the panel directly onto your shelf |
| **Shelf view** | Card grid with drag-to-reorder |
| **Stack view** | Grouped list by category, collapsible sections |
| **Feed view** | Instagram-style feed — YouTube/Spotify/Vimeo play inline |
| **Friends** | Assign items to friends, share as web page, JSON, text, or email |
| **Auth** | Local account system — create a profile, sign in/out |
| **Smart import** | Friend's share pages detect if you have an account and import items to a "From [friend]" section |
| **Light/Dark mode** | Toggle in header |
| **Export** | JSON, HTML web page, plain text, CSV |
| **Import** | JSON backups, image files, PDFs |

---

## Preparing for Chrome Web Store

1. Update `manifest.json` with your real extension ID (assigned by Chrome Web Store)
2. Replace placeholder icons with proper branded icons (128×128 PNG required)
3. Create a `_locales/en/messages.json` for internationalisation
4. Zip the extension folder: `zip -r shelf-chrome.zip shelf-extension/`
5. Submit at [chrome.google.com/webstore/devconsole](https://chrome.google.com/webstore/devconsole)

## Preparing for Firefox Add-ons (AMO)

1. Use `manifest-firefox.json` as your `manifest.json`
2. Install [web-ext](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/): `npm install -g web-ext`
3. Build: `web-ext build --source-dir=shelf-extension --artifacts-dir=dist`
4. Submit `.xpi` at [addons.mozilla.org/developers](https://addons.mozilla.org/developers/)

---

## Right-click Context Menu

Once installed, right-clicking any page shows:

- **+ Stack this page** — saves the URL with auto-detected title and OG image
- **+ Stack this link** — saves a specific link you right-clicked  
- **+ Stack this image** — saves the page with the image you right-clicked as thumbnail
- **+ Stack selection as note** — saves the current page with highlighted text as a note

The overlay appears as a floating panel in the top-right corner of the current page.

