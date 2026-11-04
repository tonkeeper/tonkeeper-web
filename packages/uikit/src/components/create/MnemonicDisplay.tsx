import { FC } from 'react';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { useIsFullWidthMode } from '../../hooks/useIsFullWidthMode';
import { useActiveConfig } from '../../state/wallet';
import { cn } from '../../libs/css';
import { Body1, Body2, Body3, H2Label2Responsive } from '../Text';
import { ExclamationMarkCircleIcon } from '../Icon';
import { Button } from '../../primitives/Button';

/**
 * Renders a known mnemonic phrase as a 2-column numbered grid with a
 * heading + caption above. Used both inside the create flow (after
 * generating a fresh phrase) and in the settings recovery screen
 * (revealing an existing wallet's phrase).
 *
 * `type` switches the heading/caption between standard / MAM / TRON
 * variants and pulls in the appropriate explanation callout.
 */

const Caption: FC<{ children: React.ReactNode }> = ({ children }) => {
    const isFullWidth = useIsFullWidthMode();
    const className = cn(
        'select-none text-center text-textSecondary [text-wrap:balance]',
        isFullWidth && 'mx-auto block max-w-[450px]'
    );
    return isFullWidth ? (
        <Body2 className={className}>{children}</Body2>
    ) : (
        <Body1 className={className}>{children}</Body1>
    );
};

export const MnemonicDisplay: FC<{
    mnemonic: string[];
    type?: 'standard' | 'mam' | 'tron';
    allowCopy?: boolean;
    descriptionDown?: boolean;
}> = ({ mnemonic, type, allowCopy, descriptionDown }) => {
    const { t } = useTranslation();
    const config = useActiveConfig();
    const sdk = useAppSdk();
    const isFullWidth = useIsFullWidthMode();
    type ??= 'standard';

    const calloutCorner = isFullWidth ? 'rounded-corner2xSmall' : 'rounded-cornerSmall';

    const MamNotice = type === 'mam' && (
        <div className={cn('mb-6 flex gap-3 bg-backgroundContent px-3 py-2', calloutCorner)}>
            <div>
                <Body3 className="text-textSecondary">{t('mam_account_explanation') + ' '}</Body3>
                {!!config.mam_learn_more_url && (
                    <Body3
                        className="cursor-pointer text-accentBlueConstant"
                        onClick={() => sdk.openPage(config.mam_learn_more_url!)}
                    >
                        {t('learn_more')}
                    </Body3>
                )}
            </div>
            <ExclamationMarkCircleIcon className="mt-1 h-4 w-4 shrink-0 text-accentOrange" />
        </div>
    );

    return (
        <>
            <div
                className={cn('mb-4 flex flex-col text-center', isFullWidth ? 'gap-0.5' : 'gap-4')}
            >
                <H2Label2Responsive className={cn(!isFullWidth && 'px-10')}>
                    {t(
                        type === 'mam'
                            ? 'secret_words_account_title'
                            : type === 'tron'
                            ? 'export_trc_20_wallet'
                            : 'secret_words_title'
                    )}
                </H2Label2Responsive>
                {!descriptionDown && (
                    <Caption>
                        {t(
                            mnemonic.length === 12
                                ? 'secret_words_caption_12'
                                : 'secret_words_caption'
                        )}
                    </Caption>
                )}
            </div>

            {!descriptionDown && MamNotice}

            {type === 'tron' && (
                <div className={cn('mb-6 flex gap-3 bg-accentOrange/16 px-3 py-2', calloutCorner)}>
                    <div>
                        <Body3 className="text-accentOrange">
                            {t('tron_account_export_warning_explanation')}
                        </Body3>
                    </div>
                    <ExclamationMarkCircleIcon className="mt-1 h-4 w-4 shrink-0 text-accentOrange" />
                </div>
            )}

            <div
                className={cn(
                    'mb-4 grid grid-flow-col place-content-evenly gap-2 whitespace-normal',
                    mnemonic.length === 12
                        ? '[grid-template-rows:repeat(6,minmax(0,1fr))]'
                        : '[grid-template-rows:repeat(12,minmax(0,1fr))]'
                )}
            >
                {mnemonic.map((world, index) => (
                    <Body1 key={index}>
                        <Body2 className="inline-block w-6 select-none leading-6 text-textSecondary">
                            {' '}
                            {index + 1}.
                        </Body2>{' '}
                        {world}{' '}
                    </Body1>
                ))}
            </div>

            {descriptionDown && (
                <>
                    {MamNotice}
                    <Caption>
                        {t(
                            mnemonic.length === 12
                                ? 'secret_words_caption_12'
                                : 'secret_words_caption'
                        )}
                    </Caption>
                </>
            )}

            {allowCopy && (
                <Button
                    variant="tertiary"
                    size="medium"
                    onClick={() => sdk.copyToClipboard(mnemonic.join(' '), t('copied'))}
                    className="mt-4"
                >
                    {t('recovery_phrase_copy_button')}
                </Button>
            )}
        </>
    );
};
