import { FC } from 'react';
import { Notification } from '../../Notification';
import { createGlobalStyle, styled } from 'styled-components';
import { Body2, Label2 } from '../../Text';
import { Button } from '../../fields/Button';
import { useTranslation } from '../../../hooks/translation';

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
        ${p => p.theme.displayType === 'full-width' && 'max-width: 400px;'}
      }
    `;

export const ConfirmImportNotification: FC<{
    isOpen: boolean;
    onClose: (confirmed?: boolean) => void;
    tokenSymbol: string;
}> = ({ isOpen, onClose, tokenSymbol }) => {
    const { t } = useTranslation();
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
                        <Label2>
                            {t('swap_import_token_title').replace('%token%', tokenSymbol)}
                        </Label2>
                        <DescriptionBlock>{t('swap_unknown_token_description')}</DescriptionBlock>
                        <ButtonsBlock>
                            <Button primary onClick={() => onClose(false)}>
                                {t('cancel')}
                            </Button>
                            <Button secondary onClick={() => onClose(true)}>
                                {t('swap_import')}
                            </Button>
                        </ButtonsBlock>
                    </ConfirmImportNotificationContent>
                )}
            </Notification>
        </>
    );
};
