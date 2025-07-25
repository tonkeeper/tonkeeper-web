import { ExtensionBuilder, notify } from './extension-builder';

export async function buildChrome() {
    const builder = new ExtensionBuilder('chrome');

    notify(`Create Chrome Build ${builder.version}`);

    await builder.build({
        REACT_APP_EXTENSION_TYPE: 'Chrome',
        REACT_APP_STORE_URL:
            'https://chromewebstore.google.com/detail/tonkeeper-%E2%80%94-wallet-for-to/omaabbefbmiijedngplfjmnooppbclkk/reviews'
    });

    builder.archive();

    console.log('Chrome build successfully created');
}
