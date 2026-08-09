# AdSense Readiness

## Current state

ChordWiki Bar Formatter uses publisher ID `ca-pub-4561699699325989` for Google AdSense.
The public site loads the AdSense auto ads snippet from `index.html` and `privacy.html`.
The old `cgi/wiki.cgi` file was only a reference for the legacy renderer and is not part of the public site.

## What is already in place

- `index.html` and `privacy.html` include Google Analytics `G-5584BE36ZV` and the AdSense snippet
- CSP allows only the Google endpoints required by Analytics and AdSense
- The privacy policy explains Analytics, cookies, and ad usage

## Ongoing guidance

- Do not keep secrets in the public repository
- Keep the public site focused on the web app, not on the old CGI reference files
- If more public pages are added later, make sure they carry the required tags too
