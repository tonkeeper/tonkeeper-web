import { AmountHeaderBlockComponent } from '@tonkeeper/uikit/dist/components/transfer/common';
import { useBackButton } from '@twa.js/sdk-react';
import { FC, useEffect } from 'react';
import styled from 'styled-components';

export const HideTwaBackButton = () => {
    const button = useBackButton();

    useEffect(() => {
        return () => {
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

    useEffect(() => {
        backButton.on('click', onClose);
        return () => {
            backButton.off('click', onClose);
        };
    }, [onClose, backButton]);

    return <Padding />;
};

export const AmountTwaHeaderBlock: AmountHeaderBlockComponent = ({ children, onBack }) => {
    const backButton = useBackButton();

    useEffect(() => {
        backButton.show();
    }, []);

    useEffect(() => {
        backButton.on('click', onBack);
        return () => {
            backButton.off('click', onBack);
        };
    }, [onBack, backButton]);

    return <Padding>{children}</Padding>;
};
