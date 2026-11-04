import { FC } from 'react';
import { useTranslation } from '../../hooks/translation';
import { useScreenshotWarning } from '../../hooks/useScreenshotWarning';
import { Button } from '../../primitives/Button';
import { ModalFooter, ModalFooterPortal } from '../../primitives/Modal';

/**
 * Create-flow recovery phrase display. Renders the freshly generated
 * 12/24-word mnemonic as a numbered two-column grid and advances to the
 * verification step.
 */
export const BackupShow: FC<{
    mnemonic: string[];
    onCheck: () => void;
}> = ({ mnemonic, onCheck }) => {
    const { t } = useTranslation();
    useScreenshotWarning();

    const captionKey = mnemonic.length === 12 ? 'secret_words_caption_12' : 'secret_words_caption';

    return (
        <div className="mx-auto flex w-full max-w-[524px] flex-col">
            <div className="flex flex-col items-center gap-1 pb-4 text-center">
                <h2 className="text-h2 text-textPrimary">{t('secret_words_title')}</h2>
                <p className="text-balance text-body1 text-textSecondary">{t(captionKey)}</p>
            </div>

            <div
                className="mx-auto grid w-full max-w-[310px] gap-x-4 gap-y-2 py-4"
                style={{
                    gridTemplateRows: `repeat(${mnemonic.length / 2}, minmax(0, 1fr))`,
                    gridAutoFlow: 'column'
                }}
            >
                {mnemonic.map((word, index) => (
                    <div key={index} className="flex items-baseline gap-1 pr-4">
                        <span
                            aria-hidden
                            className="w-6 select-none text-right text-body2 text-textSecondary"
                        >
                            {index + 1}.
                        </span>
                        <span className="text-body1 text-textPrimary">{word}</span>
                    </div>
                ))}
            </div>

            <ModalFooterPortal>
                <ModalFooter>
                    <Button size="large" variant="primaryBlue" fullWidth onClick={onCheck}>
                        {t('check_backup_button')}
                    </Button>
                </ModalFooter>
            </ModalFooterPortal>
        </div>
    );
};
