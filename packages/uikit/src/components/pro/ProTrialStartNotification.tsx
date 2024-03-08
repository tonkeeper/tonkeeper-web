import { FC } from 'react';
import { Notification } from '../Notification';
import styled from 'styled-components';
import { Body2, Label2 } from '../Text';
import { Button } from '../fields/Button';
import { useActivateTrialMutation } from '../../state/pro';
import { TelegramIcon } from '../Icon';

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    max-width: 360px;
    margin: 0 auto;
    padding-bottom: 8px;

    & > ${Body2} {
        color: ${props => props.theme.textSecondary};
    }
`;

const FooterStyled = styled.div`
    padding: 1rem 0;
`;

const ButtonStyled = styled(Button)`
    display: flex;
    gap: 0.5rem;
    justify-content: center;
`;

const ImageStyled = styled.img`
    width: 56px;
    height: 56px;
    margin-bottom: 1rem;
`;

export const ProTrialStartNotification: FC<{ isOpen: boolean; onClose: () => void }> = ({
    isOpen,
    onClose
}) => {
    const { mutateAsync, isLoading } = useActivateTrialMutation();

    const onConfirm = async () => {
        await mutateAsync();
        onClose();
    };

    return (
        <Notification
            isOpen={isOpen}
            handleClose={onClose}
            footer={
                <FooterStyled>
                    <ButtonStyled primary fullWidth loading={isLoading} onClick={onConfirm}>
                        <TelegramIcon />
                        Connect Telegram
                    </ButtonStyled>
                </FooterStyled>
            }
        >
            {() => (
                <ContentWrapper>
                    <ImageStyled src="https://tonkeeper.com/assets/icon.ico" />
                    <Label2>Connect Telegram to Pro for Free</Label2>
                    <Body2>
                        Telegram connection is required solely for the purpose of verification that
                        you are not a bot.
                    </Body2>
                </ContentWrapper>
            )}
        </Notification>
    );
};
