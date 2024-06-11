import { Notification } from '../../../Notification';
import { FC } from 'react';
import { styled } from 'styled-components';
import { Body2, Label2 } from '../../../Text';
import { Button } from '../../../fields/Button';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { useTranslation } from '../../../../hooks/translation';

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
    const { t } = useTranslation();
    return (
        <Notification isOpen={isOpen} handleClose={() => onClose()}>
            {() => (
                <ModalContent>
                    <Label2>{t('import_multisend_fiat_warn_title')}</Label2>
                    <Body2Styled>{t('import_multisend_fiat_warn_description')}</Body2Styled>
                    <ButtonStyled onClick={() => onClose(true)} primary>
                        {t('import_multisend_fiat_warn_switch_button')}&nbsp;{newFiat}
                    </ButtonStyled>
                    <FullWidthButton onClick={() => onClose()} secondary>
                        {t('cancel')}
                    </FullWidthButton>
                </ModalContent>
            )}
        </Notification>
    );
};
