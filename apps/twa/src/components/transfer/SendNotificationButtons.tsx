import { ConfirmMainButtonProps } from '@tonkeeper/uikit/dist/components/transfer/common';
import { useTranslation } from '@tonkeeper/uikit/dist/hooks/translation';
import { useMainButton } from '@twa.js/sdk-react';
import { useEffect } from 'react';

export const HideTwaMainButton = () => {
    const button = useMainButton();

    useEffect(() => {
        return () => {
            button.hide();
        };
    }, []);

    return <></>;
};

export const useMainButtonLoading = (isLoading: boolean) => {
    const button = useMainButton();
    useEffect(() => {
        if (isLoading) {
            button.showProgress();
        } else {
            button.hideProgress();
        }
    }, [button, isLoading]);
};

export const RecipientTwaMainButton = ({
    isLoading,
    onClick
}: {
    isLoading: boolean;
    onClick: () => void;
}) => {
    const button = useMainButton();
    const { t } = useTranslation();

    useEffect(() => {
        button.setText(t('continue'));
        button.show();
        button.enable();
    }, []);

    useEffect(() => {
        button.on('click', onClick);
        return () => {
            button.off('click', onClick);
        };
    }, [onClick, button]);

    useMainButtonLoading(isLoading);

    return <></>;
};

export const AmountTwaMainButton = ({
    isLoading,
    isDisabled,
    onClick
}: {
    isLoading: boolean;
    isDisabled: boolean;
    onClick: () => void;
    ref: React.RefObject<HTMLDivElement>;
}) => {
    const button = useMainButton();
    const { t } = useTranslation();

    useEffect(() => {
        button.setText(t('continue'));
    }, []);

    useEffect(() => {
        button.on('click', onClick);
        return () => {
            button.off('click', onClick);
        };
    }, [onClick, button]);

    useMainButtonLoading(isLoading);

    return <></>;
};

export const ConfirmTwaMainButton: ConfirmMainButtonProps = ({
    isLoading,
    isDisabled,
    onClick
}) => {
    const button = useMainButton();
    const { t } = useTranslation();

    useEffect(() => {
        button.setText(t('confirm_sending_submit'));
    }, []);

    useEffect(() => {
        const handler = async () => {
            try {
                button.hide();
                const ok = await onClick();
                if (!ok) {
                    button.show();
                }
            } catch (e) {
                button.show();
            }
        };
        button.on('click', handler);
        return () => {
            button.off('click', handler);
        };
    }, [onClick, button]);

    useEffect(() => {
        if (isDisabled) {
            button.disable();
        } else {
            button.enable();
        }
    }, [isDisabled]);

    useMainButtonLoading(isLoading);

    return <></>;
};
