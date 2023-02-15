export enum Language {
  en = 0,
  ru = 1,
}

export const defaultLanguage: Language = Language.en;

export const languages = [Language.en, Language.ru];

export const localizationSecondaryText = (lang: Language): string => {
  switch (lang) {
    case Language.en:
      return 'English';
    case Language.ru:
      return 'Русский';
  }
};

export const localizationText = (lang?: Language) => {
  switch (lang) {
    case Language.en:
      return 'en';
    case Language.ru:
      return 'ru';
    default:
      return 'en';
  }
};

export const localizationFrom = (lang: string) => {
  switch (lang) {
    case 'en':
      return Language.en;
    case 'ru':
      return Language.ru;
    default:
      return Language.en;
  }
};
