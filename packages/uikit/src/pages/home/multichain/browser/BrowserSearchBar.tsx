import { FC, FormEvent } from 'react';

import { useTranslation } from '../../../../hooks/translation';
import { Button, SearchField } from '../../../../primitives';
import IcMagnifyingGlass16 from '../../../../icons/components/IcMagnifyingGlass16';
import { typedUrl } from './browser-utils';

/**
 * The "Search or enter address" field. Typing drives the local catalog
 * search rendered by the page; submitting a URL-shaped value opens it
 * directly, and anything else goes to `onSubmitQuery` — the surfaces that
 * can search the web pass the engine there.
 */
export const BrowserSearchBar: FC<{
    value: string;
    onChange: (value: string) => void;
    onOpenUrl: (url: string) => void;
    onSubmitQuery?: (query: string) => void;
    autoFocus?: boolean;
}> = ({ value, onChange, onOpenUrl, onSubmitQuery, autoFocus }) => {
    const { t } = useTranslation();

    const onSubmit = (e: FormEvent) => {
        e.preventDefault();
        const url = typedUrl(value);
        if (url !== undefined) {
            onOpenUrl(url);
            return;
        }
        if (value.trim() !== '') {
            onSubmitQuery?.(value.trim());
        }
    };

    return (
        <form onSubmit={onSubmit}>
            <SearchField
                value={value}
                onChange={onChange}
                autoFocus={autoFocus}
                placeholder={t('browser_search_placeholder')}
            />
        </form>
    );
};

/**
 * Resting state of the desktop search: the mockup docks a compact button over
 * the catalog rather than a full-width field, and opens the field on click.
 */
export const BrowserSearchButton: FC<{ onClick: () => void }> = ({ onClick }) => {
    const { t } = useTranslation();

    return (
        <Button
            variant="tertiary"
            size="small"
            leftIcon={<IcMagnifyingGlass16 />}
            onClick={onClick}
        >
            {t('browser_search_placeholder')}
        </Button>
    );
};
