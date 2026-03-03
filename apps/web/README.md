# @tonkeeper/web

Tonkeeper Web — browser-based wallet on The Open Network.

## Scripts

```bash
yarn start          # run Vite dev server (http://localhost:5173)
yarn build          # production build
yarn preview        # preview production build
```

## Local HTTPS proxy (macOS only)

Some browser APIs (Clipboard, Credential Management) and Safari require HTTPS even on localhost. OAuth callback testing requires the real `wallet.tonkeeper.com` domain.

`yarn dev:https` launches an interactive menu to toggle local HTTPS proxies:

| Domain | Purpose |
|---|---|
| `wallet.tonkeeper.local` | Day-to-day local HTTPS development |
| `wallet.tonkeeper.com` | OAuth callback testing (overrides the real domain!) |

Under the hood it generates trusted certificates via `mkcert` (stored in `.ssl/`, git-ignored), writes nginx reverse-proxy configs (`:443` → `localhost:5173`), and adds `/etc/hosts` entries.

**Prerequisites:** `brew install nginx mkcert && mkcert -install`

> The script is macOS-specific (Homebrew, `dscacheutil`, `mDNSResponder`). Linux/Windows users can set up a similar proxy manually.
