import * as osLocale from 'os-locale';
import resources from '@tonkeeper/locales/dist/i18n/resources.json';

const locale = osLocale.osLocaleSync();
const all = resources as unknown as Record<string, (typeof resources)['en']>;

export const translation = (all[locale] ?? all[locale.slice(0, 2)] ?? resources.en).translation;
