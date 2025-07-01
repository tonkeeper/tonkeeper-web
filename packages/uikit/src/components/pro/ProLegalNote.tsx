import { type FC } from 'react';
import styled from 'styled-components';

import { Body3 } from '../Text';
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
            <ButtonStyled
                as="button"
                onClick={() => openTab({ url: 'https://tonkeeper.com/terms' })}
            >
                {t('legal_terms')}
            </ButtonStyled>
            <LegalNote> {t('and')} </LegalNote>
            <ButtonStyled
                as="button"
                onClick={() => openTab({ url: 'https://tonkeeper.com/privacy' })}
            >
                {t('legal_privacy')}
            </ButtonStyled>
            <LegalNote>. </LegalNote>
            <ButtonStyled
                as="button"
                onClick={() => openTab({ url: 'https://tonkeeper.com/restore' })}
            >
                {t('restore_purchases')}
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

const ButtonStyled = styled(Body3)`
    display: inline;
    height: max-content;
    padding: 0;
    color: ${props => props.theme.textPrimary};
    opacity: 1;
    transition: opacity 0.3s;

    &:hover {
        opacity: 0.7;
    }
`;
