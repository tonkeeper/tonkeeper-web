window.tonk = 'patched';

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
(function() {
  "use strict";
  const tonConnectTonkeeperAppName = "tonkeeper";
  const tonConnectTonkeeperProAppName = tonConnectTonkeeperAppName;
  const tonConnectTonkeeperWalletInfo = {
    name: "Tonkeeper",
    image: "https://tonkeeper.com/assets/tonconnect-icon.png",
    tondns: "tonkeeper.ton",
    about_url: "https://tonkeeper.com"
  };
  const tonConnectTonkeeperProWalletInfo = tonConnectTonkeeperWalletInfo;
  function getBrowserPlatform() {
    var _a, _b;
    const platform = (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((_b = (_a = window == null ? void 0 : window.navigator) == null ? void 0 : _a.userAgentData) == null ? void 0 : _b.platform) || (window == null ? void 0 : window.navigator.platform)
    );
    const userAgent = window == null ? void 0 : window.navigator.userAgent;
    const macosPlatforms = ["macOS", "Macintosh", "MacIntel", "MacPPC", "Mac68K"];
    const windowsPlatforms = ["Win32", "Win64", "Windows", "WinCE"];
    const iphonePlatforms = ["iPhone"];
    const iosPlatforms = ["iPad", "iPod"];
    let os = null;
    if (macosPlatforms.indexOf(platform) !== -1) {
      os = "mac";
    } else if (iphonePlatforms.indexOf(platform) !== -1) {
      os = "iphone";
    } else if (iosPlatforms.indexOf(platform) !== -1) {
      os = "ipad";
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
      os = "windows";
    } else if (/Android/.test(userAgent)) {
      os = "android";
    } else if (/Linux/.test(platform)) {
      os = "linux";
    }
    return os;
  }
  const getDeviceInfo = (platform, appVersion, maxMessages, appName) => {
    return {
      platform,
      appName,
      appVersion,
      maxProtocolVersion: 2,
      features: [
        "SendTransaction",
        {
          name: "SendTransaction",
          maxMessages,
          extraCurrencySupported: true
        },
        {
          name: "SignData",
          types: ["text", "binary", "cell"]
        }
      ]
    };
  };
  const version = "4.0.2";
  const packageJson = {
    version
  };
  class Subject {
    constructor() {
      __publicField(this, "subscribers", []);
    }
    subscribe(fn) {
      this.subscribers.push(fn);
      return () => {
        this.subscribers = this.subscribers.filter((sub) => sub !== fn);
      };
    }
    next(value) {
      this.subscribers.forEach((fn) => fn(value));
    }
  }
  const subject = () => new Subject();
  let queryIdCounter = 0;
  function postBridgeMessage(payload) {
    return new Promise((resolve) => {
      var _a, _b, _c;
      queryIdCounter = queryIdCounter + 1;
      const queryId = queryIdCounter.toString();
      messages$.subscribe((m) => {
        if (m.queryId === queryId) {
          resolve(m.payload);
        }
      });
      (_c = (_b = (_a = window.webkit) == null ? void 0 : _a.messageHandlers) == null ? void 0 : _b.browserMessages) == null ? void 0 : _c.postMessage({
        queryId,
        payload: JSON.stringify(payload)
      });
    });
  }
  const messages$ = subject();
  const events$ = subject();
  const bridgeEvents$ = events$;
  window.addEventListener("mainMessageReceived", (event) => {
    const { queryId, payload: rawPayload } = event.detail;
    const payload = JSON.parse(rawPayload);
    if (queryId) {
      messages$.next({
        queryId,
        payload
      });
    } else {
      events$.next(payload);
    }
  });
  const NATIVE_BRIDGE_METHODS = {
    TON_CONNECT: {
      CONNECT: "connect",
      RESTORE_CONNECTION: "restoreConnection",
      SEND: "SEND"
    }
  };
  function currentDeviceInfo(options) {
    return getDeviceInfo(
      getBrowserPlatform(),
      packageJson.version,
      255,
      tonConnectTonkeeperProAppName
    );
  }
  class MobileInjectedBridge {
    constructor() {
      __publicField(this, "protocolVersion", 2);
      __publicField(this, "walletInfo", tonConnectTonkeeperProWalletInfo);
      __publicField(this, "deviceInfo", currentDeviceInfo());
      __publicField(this, "isWalletBrowser", true);
    }
    connect(protocolVersion, message) {
      return postBridgeMessage({
        method: NATIVE_BRIDGE_METHODS.TON_CONNECT.CONNECT,
        params: {
          protocolVersion,
          message
        }
      });
    }
    restoreConnection() {
      return postBridgeMessage({
        method: NATIVE_BRIDGE_METHODS.TON_CONNECT.RESTORE_CONNECTION
      });
    }
    send(message) {
      return postBridgeMessage({
        method: NATIVE_BRIDGE_METHODS.TON_CONNECT.SEND,
        params: {
          message
        }
      });
    }
    listen(callback) {
      return bridgeEvents$.subscribe((event) => callback(event));
    }
  }
  window.tonkeeper.tonconnect = new MobileInjectedBridge();
})();
