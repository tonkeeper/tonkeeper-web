import { FC } from 'react';
import { Notification } from '../../Notification';
import { createGlobalStyle, styled } from 'styled-components';
import { Body2, Label2 } from '../../Text';
import { Button } from '../../fields/Button';

const ConfirmImportNotificationContent = styled.div`
    display: flex;
    flex-direction: column;
    text-align: center;
`;

const DescriptionBlock = styled(Body2)`
    display: block;
    margin-top: 4px;
    color: ${p => p.theme.textSecondary};
`;

const ButtonsBlock = styled.div`
    width: 100%;
    display: flex;
    gap: 8px;
    margin-top: 24px;

    > * {
        flex: 1;
    }
`;

const WrapperStyles = createGlobalStyle`
      .confirm-import-swap-token-notification {
        max-width: 400px;
      }
    `;

export const ConfirmImportNotification: FC<{
    isOpen: boolean;
    onClose: (confirmed?: boolean) => void;
    tokenSymbol: string;
}> = ({ isOpen, onClose, tokenSymbol }) => {
    return (
        <>
            <WrapperStyles />
            <Notification
                isOpen={isOpen}
                handleClose={onClose}
                wrapperClassName="confirm-import-swap-token-notification"
            >
                {() => (
                    <ConfirmImportNotificationContent>
                        <Label2>Import {tokenSymbol} token?</Label2>
                        <DescriptionBlock>
                            This token isn't included in the active token list. Make sure you are
                            aware of the risks associated with imported tokens.
                        </DescriptionBlock>
                        <ButtonsBlock>
                            <Button primary onClick={() => onClose(false)}>
                                Cancel
                            </Button>
                            <Button secondary onClick={() => onClose(true)}>
                                Import
                            </Button>
                        </ButtonsBlock>
                    </ConfirmImportNotificationContent>
                )}
            </Notification>
        </>
    );
};
