import { FC, MouseEventHandler, ReactNode } from 'react';
import { Button } from '../../primitives/Button';
import { useTranslation } from '../../hooks/translation';
import { cn } from '../../libs/css';
import { useStartScreenExtraAction } from '../../hooks/startScreenExtraAction';

/**
 * The start screen column: the brand mark, the app name, the create / import
 * buttons and the Terms of Use caption, bottom-anchored in the mockup's own
 * 390px so the glow behind it stays in proportion with the content on any
 * viewport. From `md` up the column stops filling the height and the bare
 * layout centers it, so a tall desktop window doesn't leave a screen of empty
 * space above it.
 *
 * Shared between the interactive `StartScreen` and the boot `Loading` screen:
 * the loader renders this same column with `contentHidden` so its animated
 * mark occupies exactly the box the start screen draws the static logo in,
 * and the mark appears to stay in place across the hand-over. That is also why
 * the shell's extra way in comes from context rather than a prop — the loader
 * has to reserve the same room for it without knowing what it is.
 */
export const StartScreenView: FC<{
    logo: ReactNode;
    contentHidden?: boolean;
    onCreate?: () => void;
    onImport?: () => void;
    termsHref?: string;
    onTermsClick?: MouseEventHandler<HTMLAnchorElement>;
}> = ({ logo, contentHidden, onCreate, onImport, termsHref, onTermsClick }) => {
    const { t } = useTranslation();
    const extraAction = useStartScreenExtraAction();

    return (
        <div className="relative mx-auto flex w-full max-w-[390px] flex-1 flex-col justify-end md:flex-none">
            <div className="relative mx-auto size-[108px] shrink-0 text-iconPrimary">{logo}</div>

            <div className={cn(contentHidden && 'invisible')}>
                <div className="flex flex-col items-center gap-1 px-8 pb-8 pt-8 text-center">
                    <h1 className="text-h2 text-textPrimary">{t('appName')}</h1>
                    <p className="text-balance text-body1 text-textSecondary">
                        {t('import_add_wallet_description')}
                    </p>
                </div>

                <div className="flex flex-col gap-4 px-8 pb-8 pt-4">
                    <Button size="large" variant="primaryBlue" fullWidth onClick={onCreate}>
                        {t('start_screen_create_wallet_button')}
                    </Button>
                    <Button size="large" variant="secondary" fullWidth onClick={onImport}>
                        {t('start_screen_import_wallet_button')}
                    </Button>
                    {extraAction}
                </div>

                <p className="px-8 pb-4 text-center text-body2 text-textTertiary">
                    {t('start_screen_terms_caption')}{' '}
                    <a
                        href={termsHref ?? '#'}
                        onClick={onTermsClick}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cursor-pointer text-accentBlue hover:underline"
                    >
                        {t('start_screen_terms_link')}
                    </a>
                </p>
            </div>
        </div>
    );
};
