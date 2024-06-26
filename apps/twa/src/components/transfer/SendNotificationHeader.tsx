import { useBackButton } from '@tma.js/sdk-react';
import { AmountHeaderBlockComponent } from '@tonkeeper/uikit/dist/components/transfer/common';
import { useAppSdk } from '@tonkeeper/uikit/dist/hooks/appSdk';
import { FC, useEffect } from 'react';
import styled from 'styled-components';

export const HideTwaBackButton = () => {
    const button = useBackButton();

    const sdk = useAppSdk();

    useEffect(() => {
        const handler = () => {
            sdk.uiEvents.emit('navigate', { method: 'navigate', params: undefined });
        };
        button.on('click', handler);
        return () => {
            button.off('click', handler);
            button.hide();
        };
    }, []);

    return <></>;
};

const Padding = styled.div`
    padding-top: 12px;
    margin-bottom: -4px;
`;
export const RecipientTwaHeaderBlock: FC<{ onClose: () => void }> = ({ onClose }) => {
    const backButton = useBackButton();

    useEffect(() => {
        backButton.show();
    }, []);

    useNativeBack(onClose);

    return <Padding />;
};

export const useNativeBack = (onClose: () => void) => {
    const backButton = useBackButton();
    useEffect(() => {
        backButton.on('click', onClose);
        return () => {
            backButton.off('click', onClose);
        };
    }, [onClose, backButton]);
};

export const AmountTwaHeaderBlock: AmountHeaderBlockComponent = ({ children, onBack }) => {
    const backButton = useBackButton();

    useEffect(() => {
        backButton.show();
    }, []);

    useNativeBack(onBack);

    return <Padding>{children}</Padding>;
};
