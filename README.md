# BrainGain

Open the GitHub Pages address to enter BrainGain. The public page redirects to the Google Apps Script web app. Google asks for sign-in when needed and normally retains the Google session. The recommendation UI runs inside Apps Script, where `google.script.run` reads and updates the existing private Sheet.

## Access and data

The web app is deployed as **User accessing the web app** with access set to **Anyone with Google account**. A signed-in visitor must authorize the script and have access to the private Sheet to load recommendations or change state. Do not share the Sheet with people who should not see BrainGain. The Sheet ID and Apps Script source stay in the private Sheet-bound project; no credentials, tokens, cookies, or Sheet data belong in this public repository.

The Sheet has `Recommended` and `Watchlist` tabs. Only the `Liked` and `Watched` cells of `Recommended` are changed by the app. Row number and title are checked together before each write to avoid updating the wrong recommendation after a stale page.

## Features

For You hides watched items. All feeds sort by newest Sheet row first. Search and type filters work within For You, Liked, Watched, and Watchlist. Cards provide Like/Unlike, Watched/Unwatch, details, YouTube previews, and refresh.

## Deployment

GitHub Pages uses `main` / `(root)`. `index.html` is the sign-in entry and points to the current Apps Script `/exec` deployment. After changing the Sheet-bound `Code.gs` or `Index.html`, save and deploy a new version in Apps Script. The older `app.js` and `style.css` are retained as a static frontend prototype; the protected web app serves the active UI and styles from Apps Script.

The earlier cross-origin JSON API could not initiate Google's login flow from GitHub Pages. Serving the content from Apps Script makes the sign-in and Sheet permission check happen before data is available.
