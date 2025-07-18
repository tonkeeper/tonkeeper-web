import { ExtensionBuilder, notify } from './extension-builder';

const updateFireFoxManifest = (builder: ExtensionBuilder) => {
    const manifestFFData = builder.readManifest();

    manifestFFData.version = builder.version;
    manifestFFData.background = {
        scripts: ['background.js']
    };

    manifestFFData.permissions = ['storage', 'unlimitedStorage', 'clipboardWrite', 'activeTab'];
    manifestFFData.host_permissions = ['<all_urls>'];

    manifestFFData.browser_specific_settings = {
        gecko: {
            id: 'wallet@tonkeeper.com',
            strict_min_version: '109.0'
        }
    };

    builder.writeManifest(manifestFFData);
};

export async function buildFirefox() {
    const builder = new ExtensionBuilder('firefox');

    notify(`Create FireFox Build ${builder.version}`);

    await builder.build({
        REACT_APP_EXTENSION_TYPE: 'FireFox',
        REACT_APP_STORE_URL: 'https://addons.mozilla.org/en-US/firefox/addon/tonkeeper/'
    });

    updateFireFoxManifest(builder);

    builder.archive();

    console.log('Chrome build successfully created');
}
