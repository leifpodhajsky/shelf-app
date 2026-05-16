# Deploying Shelf to GitHub Pages

This gives you a public URL for the privacy policy (required by both stores) and optionally hosts the full web app.

---

## Step 1 — Create a GitHub repository

1. Go to [github.com/new](https://github.com/new)
2. Name it `shelf` (or `shelf-app`)
3. Set visibility to **Public** (required for free GitHub Pages)
4. Click **Create repository**

---

## Step 2 — Upload the extension files

**Option A — GitHub web UI (easiest)**

1. In your new repo, click **Add file → Upload files**
2. Drag everything from the `shelf-extension/` folder into the upload area
3. Commit with message: `Initial release`

**Option B — Git CLI**

```bash
cd shelf-extension/
git init
git add .
git commit -m "Initial release"
git remote add origin https://github.com/YOURUSERNAME/shelf.git
git push -u origin main
```

---

## Step 3 — Enable GitHub Pages

1. In your repo, go to **Settings → Pages**
2. Under **Source**, select **Deploy from a branch**
3. Branch: `main` · Folder: `/ (root)`
4. Click **Save**
5. Wait ~60 seconds, then your site is live at:
   `https://YOURUSERNAME.github.io/shelf/`

---

## Step 4 — Your live URLs

| Page | URL |
|---|---|
| Landing page | `https://YOURUSERNAME.github.io/shelf/` |
| App | `https://YOURUSERNAME.github.io/shelf/shelf.html` |
| Privacy policy | `https://YOURUSERNAME.github.io/shelf/privacy.html` |
| Terms | `https://YOURUSERNAME.github.io/shelf/terms.html` |
| About | `https://YOURUSERNAME.github.io/shelf/about.html` |
| Contact | `https://YOURUSERNAME.github.io/shelf/contact.html` |

---

## Step 5 — Add privacy URL to store listings

**Chrome Web Store:**
When creating your listing at [chrome.google.com/webstore/devconsole](https://chrome.google.com/webstore/devconsole), paste your privacy URL into the "Privacy practices" field:
```
https://YOURUSERNAME.github.io/shelf/privacy.html
```

**Firefox AMO:**
At [addons.mozilla.org/developers](https://addons.mozilla.org/developers), add it in the "Privacy policy" field of your add-on listing.

---

## Step 6 — Custom domain (optional)

If you own a domain (e.g. `shelf.app`):

1. In repo **Settings → Pages → Custom domain**, enter your domain
2. At your DNS provider, add a CNAME record:
   - Name: `www` (or `@` for root)
   - Value: `YOURUSERNAME.github.io`
3. Check **Enforce HTTPS**
4. Update the privacy policy URL in store listings to your custom domain

---

## PWA install

Once deployed, anyone visiting `https://YOURUSERNAME.github.io/shelf/shelf.html` on:
- **Chrome/Edge desktop**: sees an install prompt in the address bar (↓ icon)
- **Chrome Android**: gets "Add to Home Screen" banner
- **Safari iOS**: tap Share → Add to Home Screen

The service worker (`sw.js`) caches the app shell for offline use.

---

## Keeping it updated

After any code changes, push to GitHub:
```bash
git add .
git commit -m "Update v1.0.x"
git push
```
GitHub Pages auto-deploys within ~60 seconds. For the extension, also update the `version` field in `manifest.json` and resubmit to both stores.
