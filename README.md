# Tonkeeper Web Monorepo

Tonkeeper Web is a non-custodial crypto wallet and gateway to blockchain dApps.

## Build web script

You should have a `Docker` installed and running on your computer.

```sh
yarn

yarn build:web
```

Compressed build can be found in `/apps/web/build` once they're built.

## Build extension script

You should have a `Docker` installed and running on your computer.

```sh
yarn

yarn build:extension
```

Compressed builds can be found in `/apps/extension/dist/chrome` and `/apps/extension/dist/firefox` once they're built.
