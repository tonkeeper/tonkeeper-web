import { type FC } from 'react';
import styled from 'styled-components';
import { isCryptoStrategy } from '@tonkeeper/core/dist/entries/pro';

import { Body3, Body3Class } from '../Text';
import { useAppSdk } from '../../hooks/appSdk';
import { ExternalLink } from '../shared/ExternalLink';
import { useTranslation } from '../../hooks/translation';

interface IProps {
    onManage: () => Promise<void>;
}

export const ProLegalNote: FC<IProps> = ({ onManage }) => {
    const sdk = useAppSdk();
    const { t } = useTranslation();

    const isCrypto = isCryptoStrategy(sdk.subscriptionStrategy);

    return (
        <LegalNoteWrapper>
            <LegalNote>
                {t(`pro_terms_privacy_restore_note${isCrypto ? '_crypto' : ''}`)}{' '}
            </LegalNote>
            <ExternalLinkStyled
                onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
                href="https://tonkeeper.com/pro-terms"
            >
                {t('pro_terms')}
            </ExternalLinkStyled>
            <LegalNote> {t('and')} </LegalNote>
            <ExternalLinkStyled
                onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
                href="https://tonkeeper.com/privacy"
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
