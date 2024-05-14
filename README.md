# Tonkeeper Web Monorepo

Tonkeeper Web is a non-custodial crypto wallet and gateway to blockchain dApps.

Tonkeeper Extension supports Firefox 109.0 or higher version, Google Chrome, and Chromium-based
browsers. We recommend using the latest available browser version.

## Building locally

```sh
# Install `Node.js` version v20.7.0
nvm use

# Install `Yarn` version 4.0.2
corepack enable
```

### Build web script

```sh
# Install dependencies
yarn

# Build web app
yarn build:web
```

Compressed build could be found in `/apps/web/build` once they're built.

### Build extension script

```sh
# Install dependencies
yarn

# Build extension apps
yarn build:extension
```

Compressed builds could be found in `/apps/extension/dist/chrome` and `/apps/extension/dist/firefox`
once they're built.

### Build desktop script

```sh
# Install dependencies
yarn

# Build desktop for current OS
yarn build:desktop
```

Application for your platform could be found in `/apps/desktop/out` once they're built.

#### Mac Environment variables:

You can generate an App Store Connect API key to authenticate `notarytool` by going to the
[App Store Connect](https://appstoreconnect.apple.com/access/api) access page and using the "Keys"
tab. This API key will look something like `AuthKey_ABCD123456.p8` and can only be downloaded once.

| Env variable       | Description                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `APPLE_API_KEY`    | Filesystem path string to your API key file.                                                                       |
| `APPLE_API_KEY_ID` | 10-character alphanumeric ID string. In the previous `AuthKey_ABCD123456.p8` example, this would be `ABCD123456`.  |
| `APPLE_API_ISSUER` | UUID that identifies the API key issuer. You will find this ID in the "Keys" tab where you generated your API key. |

Keychain - Certificate Type - `Developer ID Application`

## License

(c) Copyright 2024 Ton APPS UK Limited Released under the
[Apache License, Version 2.0](LICENSE.txt).
