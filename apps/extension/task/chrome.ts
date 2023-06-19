import common from './common';

const updateChromeManifest = (path: string, version: string) => {
  const manifestChromeData = common.readManifest(path);
  manifestChromeData.version = version;

  common.writeManifest(path, manifestChromeData);
};

export default {
  updateChromeManifest,
};
