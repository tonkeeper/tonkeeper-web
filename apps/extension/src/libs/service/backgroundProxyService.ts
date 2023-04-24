/**
 * The background service to manage proxy configuration
 * The service is responsible to manage enable and disable proxy configuration base users local configuration
 * Origin: https://github.com/OpenProduct/openmask-extension/blob/main/src/libs/service/backgroundProxyService.ts
 *
 * @author: KuznetsovNikita
 * @since: 0.8.0
 */

import browser from 'webextension-polyfill';
import { ProxyConfiguration } from '../../entries/proxy';
import { backgroundEventsEmitter } from '../event';

export const subscriptionProxyNotifications = () => {
  backgroundEventsEmitter.on('proxyChanged', (configuration) => {
    updateProxySetting(configuration.params);
  });
};

/**
 * Sample PROXY_PAC_SCRIPT example
 * function FindProxyForURL(url, host) {
 *      return host.endsWith('.ton')
 *        ? 'PROXY in2.ton.org:8080'
 *        : 'DIRECT';
 *    }
 */
const updateProxySetting = (configuration: ProxyConfiguration) => {
  if (!configuration.enabled) {
    browser.proxy.settings.set({
      scope: 'regular',
      value: {
        mode: 'direct',
      },
    });
  } else {
    const proxies = Object.entries(configuration.domains).map(
      ([end, proxy]) =>
        `case '${end}': return 'PROXY ${proxy.host}:${proxy.port}';`
    );

    const PROXY_PAC_SCRIPT = `function FindProxyForURL(url, host) {
              const paths = host.split(".");
              const end = paths && paths.length ? paths[paths.length - 1] : undefined;
  
              switch (end) {
                  ${proxies.join('\n')}
                  default: return 'DIRECT';
              }
          }`;

    browser.proxy.settings.set({
      scope: 'regular',
      value: {
        mode: 'pac_script',
        pacScript: {
          data: PROXY_PAC_SCRIPT,
        },
      },
    });
  }
};
