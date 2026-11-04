import { FC, useEffect } from 'react';
import { setNumberFormatLanguage } from '@tonkeeper/core/dist/utils/numberFormat';
import { useTranslation } from '../hooks/translation';

/**
 * Keeps `<html lang>` and the number format in step with the app language.
 * The attribute drives the `:root:lang(vi)` whole-UI font switch in
 * tailwind.css (TT Firs Neue cannot draw most of Vietnamese) and gives the
 * browser the correct defaults for hyphenation and spellcheck. The number
 * locale is set during render rather than in an effect so the app subtree,
 * which renders after this sibling, already formats with it. Mount once per
 * shell, inside the TranslationContext provider and before the app content.
 */
export const DocumentLanguageSync: FC = () => {
    const { i18n } = useTranslation();
    setNumberFormatLanguage(i18n.language);

    useEffect(() => {
        document.documentElement.lang = i18n.language;
    }, [i18n.language]);

    return null;
};
