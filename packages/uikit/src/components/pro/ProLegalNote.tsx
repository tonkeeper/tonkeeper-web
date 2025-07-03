import styled from 'styled-components';

import { Body3 } from '../Text';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { isCryptoStrategy } from '@tonkeeper/core/dist/entries/pro';

export const ProLegalNote = () => {
    const sdk = useAppSdk();
    const { t } = useTranslation();

    const isCrypto = isCryptoStrategy(sdk.subscriptionStrategy);

    return (
        <LegalNoteWrapper>
            <LegalNote>
                {t(`pro_terms_privacy_restore_note${isCrypto ? '_crypto' : ''}`)}{' '}
            </LegalNote>
            <ButtonStyled
                as="button"
                type="button"
                onClick={() => sdk.openPage('https://tonkeeper.com/terms')}
            >
                {t('pro_terms')}
            </ButtonStyled>
            <LegalNote> {t('and')} </LegalNote>
            <ButtonStyled
                as="button"
                type="button"
                onClick={() => sdk.openPage('https://tonkeeper.com/privacy')}
            >
                {t('pro_privacy')}
            </ButtonStyled>
            <LegalNote>. </LegalNote>
            {!isCrypto && (
                <>
                    <ButtonStyled
                        as="button"
                        type="button"
                        onClick={() => sdk.openPage('https://tonkeeper.com/restore')}
                    >
                        {t('restore_purchases')}
                    </ButtonStyled>
                    <LegalNote>.</LegalNote>
                </>
            )}
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
