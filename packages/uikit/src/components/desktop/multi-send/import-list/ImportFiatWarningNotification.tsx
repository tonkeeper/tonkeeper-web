import { Notification } from '../../../Notification';
import { FC } from 'react';
import { styled } from 'styled-components';
import { Body2, Label2 } from '../../../Text';
import { Button } from '../../../fields/Button';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';

const ModalContent = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
`;

const Body2Styled = styled(Body2)`
    margin-top: 4px;
    margin-bottom: 24px;
    color: ${p => p.theme.textSecondary};
`;

const FullWidthButton = styled(Button)`
    width: 100%;
`;

const ButtonStyled = styled(FullWidthButton)`
    margin-bottom: 8px;
`;

export const ImportFiatWarningNotification: FC<{
    isOpen: boolean;
    onClose: (confirmed?: boolean) => void;
    newFiat?: FiatCurrencies | null;
}> = ({ isOpen, onClose, newFiat }) => {
    return (
        <Notification isOpen={isOpen} handleClose={() => onClose()}>
            {() => (
                <ModalContent>
                    <Label2>
                        The currency in the wallet and the currency in the file do not match.
                    </Label2>
                    <Body2Styled>Switch or replace currency to continue.</Body2Styled>
                    <ButtonStyled onClick={() => onClose(true)} primary>
                        Switch wallet currency to {newFiat}
                    </ButtonStyled>
                    <FullWidthButton onClick={() => onClose()} secondary>
                        Cancel
                    </FullWidthButton>
                </ModalContent>
            )}
        </Notification>
    );
};
