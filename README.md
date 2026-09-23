# BrainGain

A dark, mobile-first recommendation feed. The static frontend lives in this repository and is served by GitHub Pages. The existing private Google Sheet is the source of truth; its bound Apps Script project serves the JSON API.

## Features

For You shows unwatched recommendations in newest-first Sheet row order. Liked and Watched have separate tabs; Watchlist comes from the separate Sheet tab. Search and type filters apply within each tab. Cards have Like/Unlike, Watched/Unwatch, details, and YouTube previews. Refresh reloads the Sheet.

## Files

- `index.html`: page structure
- `style.css`: dark mobile UI
- `app.js`: rendering and API client; `API_URL` points to the Apps Script web-app `/exec` endpoint

## Apps Script setup

The private Sheet has `Recommended` and `Watchlist` tabs. The `Recommended` tab must include `Title`, `Liked`, and `Watched` headers. Other headers such as Type, Year, Creator / Director, Tags, Why / Note, Based On, Score, Link, Thumbnail, and Platform are passed through. Row numbers are used as item IDs; mutations also verify the title so a stale page cannot silently change a different row.

The Sheet-bound project exposes `doGet(e)`: `action=list` returns JSON containing `recommended`, `watchlist`, and `updatedAt`; `action=like|watched&row=N&value=true|false&title=...` writes only the selected state cell. A validated `callback` wraps responses as JSONP because the static frontend cannot use `google.script.run` or rely on Apps Script CORS headers. The web app executes as the Sheet owner. Redeploy a new version after changing Code.gs. Keep the Sheet ID and Apps Script source in the private project, outside this public repository.

## Publishing

In GitHub Settings → Pages, select Deploy from a branch, `main`, `/(root)`. The site loads the `/exec` URL from `app.js`. A public Pages site needs an Apps Script deployment accessible to its visitors. This endpoint has no user authentication for the two state writes, so anyone with the endpoint URL can change Liked or Watched values. Do not put credentials, tokens, cookies, or private Sheet data in this repository. If private write access is needed, use an authenticated backend rather than a static frontend.
