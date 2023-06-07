# Tonkeeper Web Monorepo

Tonkeeper Web is a non-custodial crypto wallet and gateway to blockchain dApps.

Tonkeeper Extension supports Firefox 109.0 or higher version, Google Chrome, and Chromium-based browsers. We recommend using the latest available browser version.

## Building locally

- Install `Node.js` version 16 or 19
- Install `Yarn` version 1.18.0
- Install and run `Docker Desktop` 

### Build web script

```sh
yarn

yarn build:web
```

Compressed build can be found in `/apps/web/build` once they're built.

### Build extension script

```sh
yarn

yarn build:extension
```

Compressed builds can be found in `/apps/extension/dist/chrome` and `/apps/extension/dist/firefox` once they're built.
