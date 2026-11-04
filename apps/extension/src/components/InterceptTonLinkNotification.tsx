import { FC, useState } from 'react';
import { Button } from '@tonkeeper/uikit/dist/primitives/Button';
import { Checkbox } from '@tonkeeper/uikit/dist/primitives/Checkbox';
import { Modal } from '@tonkeeper/uikit/dist/primitives/Modal';
import { useTranslation } from '@tonkeeper/uikit/dist/hooks/translation';
import { useMutateGlobalPreferences } from '@tonkeeper/uikit/dist/state/global-preferences';
import { useDeeplinkHandlers } from '@tonkeeper/uikit/dist/hooks/deeplinks/useDeeplinkHandlers';
import { TonLinkOpenTarget } from '../libs/tonTransferLink';

const LinkIcon = () => {
    return (
        <svg
            className="mb-3 text-accentBlue"
            xmlns="http://www.w3.org/2000/svg"
            width="84"
            height="84"
            viewBox="0 0 84 84"
            fill="none"
        >
            <path
                d="M23.7827 30.5102C24.9601 29.4463 26.7785 29.4822 27.9135 30.6167C29.0851 31.7882 29.0851 33.6883 27.9135 34.8598L20.9682 41.8051C15.1072 47.6662 15.1074 57.1695 20.9682 63.0307C26.8293 68.8916 36.3317 68.8915 42.1928 63.0307L49.1391 56.0844C50.3105 54.9133 52.2098 54.9136 53.3813 56.0844C54.5529 57.256 54.5529 59.156 53.3813 60.3276L46.436 67.2729C38.2317 75.4772 24.9294 75.4772 16.7251 67.2729C8.52145 59.0686 8.52122 45.7671 16.7251 37.563L23.6714 30.6167L23.7827 30.5102ZM46.4565 33.0854C47.628 31.9141 49.5272 31.9141 50.6987 33.0854C51.8703 34.257 51.8703 36.157 50.6987 37.3286L37.2563 50.771C36.0847 51.9425 34.1847 51.9425 33.0131 50.771C31.8419 49.5995 31.8421 47.7003 33.0131 46.5288L46.4565 33.0854ZM37.563 16.7251C45.7671 8.52122 59.0686 8.52144 67.2729 16.7251C75.4772 24.9294 75.4772 38.2317 67.2729 46.436L64.3432 49.3657L64.2309 49.4721C63.0533 50.5363 61.2351 50.5007 60.1001 49.3657C58.9292 48.1941 58.9288 46.2949 60.1001 45.1235L63.0307 42.1928C68.8915 36.3317 68.8916 26.8293 63.0307 20.9682C57.1695 15.1074 47.6662 15.1072 41.8051 20.9682L38.8842 23.8891C37.7127 25.0607 35.8126 25.0607 34.6411 23.8891C33.4702 22.7176 33.4701 20.8183 34.6411 19.6469L37.563 16.7251Z"
                fill="currentColor"
            />
        </svg>
    );
};

export const InterceptTonLinkNotification: FC<{
    handleClose: (target?: TonLinkOpenTarget) => void;
    origin?: string;
    url: string | null;
}> = ({ origin, url, handleClose }) => {
    const { mutateAsync: saveGlobalPreferences } = useMutateGlobalPreferences();
    const { mutateAsync: processOpenedLink } = useDeeplinkHandlers();

    const onSubmit = async (target: TonLinkOpenTarget, rememberChoice: boolean) => {
        if (!url) return;
        if (rememberChoice) {
            await saveGlobalPreferences({
                interceptTonLinks: target === 'extension' ? 'always' : 'never'
            });
        }

        handleClose(target);

        if (target === 'extension') {
            await processOpenedLink(url);
        }
    };

    return (
        <Modal isOpen={!!url} onClose={() => handleClose()}>
            {url && <Content origin={origin} url={url} onSubmit={onSubmit} />}
        </Modal>
    );
};

const Content: FC<{
    origin?: string;
    url: string;
    onSubmit: (target: TonLinkOpenTarget, rememberChoice: boolean) => void;
}> = ({ origin, url, onSubmit }) => {
    const { t } = useTranslation();
    const [rememberChoice, setRememberChoice] = useState(false);

    return (
        <div className="flex flex-col items-center px-6 pb-4 text-center [text-wrap:balance]">
            <LinkIcon />
            <h2 className="mb-1 px-4 text-h2 text-textPrimary">
                {t('links_interceptor_modal_title')}
            </h2>
            <span className="mb-4 px-8 text-body1 text-textSecondary">
                {t('links_interceptor_modal_description')}
            </span>
            <div className="mb-4 flex w-full flex-col gap-1 rounded-cornerMedium bg-backgroundContent px-4 py-3 text-left">
                {origin && <span className="break-all text-label1 text-textPrimary">{origin}</span>}
                <span className="break-all text-body2 text-textSecondary">{url}</span>
            </div>
            <div className="flex w-full flex-col gap-2">
                <Button
                    variant="primaryBlue"
                    size="large"
                    fullWidth
                    onClick={() => onSubmit('extension', rememberChoice)}
                >
                    {t('links_interceptor_modal_continue_button')}
                </Button>
                <Button
                    variant="secondary"
                    size="large"
                    fullWidth
                    onClick={() => onSubmit('browser', rememberChoice)}
                >
                    {t('links_interceptor_modal_browser_button')}
                </Button>
            </div>
            <Checkbox className="mt-6" checked={rememberChoice} onChange={setRememberChoice}>
                {t('links_interceptor_modal_checkbox_label')}
            </Checkbox>
        </div>
    );
};
