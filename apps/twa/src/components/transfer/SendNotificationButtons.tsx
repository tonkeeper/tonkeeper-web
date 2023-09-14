import { useTranslation } from '@tonkeeper/uikit/dist/hooks/translation';
import { defaultTheme } from '@tonkeeper/uikit/dist/styles/defaultTheme';
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
        button.setBackgroundColor((defaultTheme as any).buttonPrimaryBackground);
        button.setTextColor((defaultTheme as any).textPrimary);
        button.show();
        button.enable();
    }, []);

    useEffect(() => {
        button.on('click', onClick);
        return () => {
            button.off('click', onClick);
        };
    }, [onClick, button]);

    useEffect(() => {
        if (isLoading) {
            button.showProgress();
        } else {
            button.hideProgress();
        }
    }, [isLoading]);

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

    useEffect(() => {
        if (isDisabled) {
            button.disable();
        } else {
            button.enable();
        }
    }, [isDisabled]);

    useEffect(() => {
        if (isLoading) {
            button.showProgress();
        } else {
            button.hideProgress();
        }
    }, [isLoading]);

    return <></>;
};

export const ConfirmTwaMainButton = ({
    isLoading,
    isDisabled,
    onClick
}: {
    isLoading: boolean;
    isDisabled: boolean;
    onClick: () => Promise<void>;
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
                await onClick();
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

    useEffect(() => {
        if (isLoading) {
            button.showProgress();
        } else {
            button.hideProgress();
        }
    }, [isLoading]);

    return <></>;
};
