import { type FC } from 'react';
import styled from 'styled-components';

import { Body3 } from '../Text';
import { Button } from '../fields/Button';
import { useTranslation } from '../../hooks/translation';
import { useOpenBrowserTab } from '../../state/dapp-browser';

interface IProps {
    isCrypto?: boolean;
}

export const ProLegalNote: FC<IProps> = ({ isCrypto = false }) => {
    const { t } = useTranslation();
    const { mutate: openTab } = useOpenBrowserTab();

    // TODO Close settings page after opening a tab

    return isCrypto ? (
        <LegalNoteWrapper />
    ) : (
        <LegalNoteWrapper>
            <LegalNote>{t('pro_terms_privacy_restore_note')} </LegalNote>
            <ButtonStyled onClick={() => openTab({ url: 'https://tonkeeper.com/terms' })}>
                <Body3 as="span">{t('legal_terms')}</Body3>
            </ButtonStyled>
            <LegalNote> {t('and')} </LegalNote>
            <ButtonStyled onClick={() => openTab({ url: 'https://tonkeeper.com/privacy' })}>
                <Body3 as="span">{t('legal_privacy')}</Body3>
            </ButtonStyled>
            <LegalNote>. </LegalNote>
            <ButtonStyled onClick={() => openTab({ url: 'https://tonkeeper.com/restore' })}>
                <Body3 as="span">{t('restore_purchases')}</Body3>
            </ButtonStyled>
            <LegalNote>.</LegalNote>
        </LegalNoteWrapper>
    );
};

const LegalNoteWrapper = styled.p`
    display: inline;
    text-align: center;
    color: ${p => p.theme.textSecondary};
`;

const LegalNote = styled(Body3)`
    display: inline;
    color: ${p => p.theme.textSecondary};
`;

const ButtonStyled = styled(Button)`
    display: inline;
    padding: 0;
    height: auto;
    color: ${props => props.theme.textPrimary};
    background: none;

    :hover {
        background: none;
        color: ${props => props.theme.textAccent};
    }
`;
