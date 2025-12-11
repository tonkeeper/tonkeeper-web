import { type FC } from 'react';
import styled from 'styled-components';

import { Body3, Body3Class } from '../Text';
import { ExternalLink } from '../shared/ExternalLink';
import { useTranslation } from '../../hooks/translation';
import { useLegalLinks } from '../../state/legal';
import { SubscriptionSource } from '@tonkeeper/core/dist/pro';

interface IProps {
    onManage: () => Promise<void>;
    selectedSource: SubscriptionSource;
}

export const ProLegalNote: FC<IProps> = ({ onManage, selectedSource }) => {
    const { t } = useTranslation();

    const isCrypto = selectedSource === SubscriptionSource.EXTENSION;
    const { termsLink, privacyLink } = useLegalLinks();

    return (
        <LegalNoteWrapper>
            <LegalNote>
                {t(isCrypto ? 'pro_terms_privacy_crypto_note' : 'pro_terms_privacy_restore_note')}{' '}
            </LegalNote>
            <ExternalLinkStyled
                onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
                href={termsLink}
            >
                {t('pro_terms')}
            </ExternalLinkStyled>
            <LegalNote> {t('and')} </LegalNote>
            <ExternalLinkStyled
                onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
                href={privacyLink}
            >
                {t('pro_privacy')}
            </ExternalLinkStyled>
            <LegalNote>. </LegalNote>
            {!isCrypto && (
                <>
                    <ButtonStyled as="button" type="button" onClick={onManage}>
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
    line-height: 14px;
    color: ${p => p.theme.textSecondary};
`;

const LegalNote = styled(Body3)`
    display: inline;
    line-height: 14px;
    color: ${p => p.theme.textSecondary};
`;

const ButtonStyled = styled(Body3)`
    display: inline;
    height: max-content;
    padding: 0;
    line-height: 14px;
    color: ${props => props.theme.textPrimary};
    opacity: 1;
    transition: opacity 0.3s;

    @media (pointer: fine) {
        &:hover {
            opacity: 0.7;
        }
    }
`;

const ExternalLinkStyled = styled(ExternalLink)`
    ${Body3Class};
    line-height: 14px;
    color: ${props => props.theme.textPrimary};
    opacity: 1;
    transition: opacity 0.3s;

    @media (pointer: fine) {
        &:hover {
            opacity: 0.7;
        }
    }
`;
