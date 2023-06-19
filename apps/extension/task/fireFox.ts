import common from './common';

const updateFireFoxManifest = (buildDirFireFox: string, version: string) => {
  const manifestFFData = common.readManifest(buildDirFireFox);

  manifestFFData.version = version;
  manifestFFData.background = {
    scripts: ['background.js'],
  };

  manifestFFData.permissions = [
    'storage',
    'unlimitedStorage',
    'clipboardWrite',
    'activeTab',
  ];
  manifestFFData.host_permissions = ['<all_urls>'];

  manifestFFData.browser_specific_settings = {
    gecko: {
      id: 'wallet@tonkeeper.com',
      strict_min_version: '109.0',
    },
  };

  common.writeManifest(buildDirFireFox, manifestFFData);
};

export default {
  updateFireFoxManifest,
};
