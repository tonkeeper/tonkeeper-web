import { FC } from 'react';
import { Notification } from '../Notification';
import { styled } from 'styled-components';
import { Body1, Body2Class, H2 } from '../Text';
import { useTranslation } from '../../hooks/translation';
import { BorderSmallResponsive } from '../shared/Styles';
import { Button } from '../fields/Button';

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const Title = styled(H2)`
    margin-bottom: 0.5rem;
    text-align: center;
`;

const Description = styled(Body1)`
    color: ${p => p.theme.textSecondary};
    text-align: center;
    margin-bottom: 2rem;
`;

const InfoBox = styled.ul`
    background-color: ${p => p.theme.backgroundContent};
    ${BorderSmallResponsive};
    padding: 0 12px 0 24px;
    margin: 0 0 2rem;
`;

const InfoItem = styled.li`
    padding: 8px 16px 8px 0;

    ${Body2Class};
`;

const ButtonsContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;

    > * {
        width: 100%;
    }
`;

export const UnverifiedNftNotification: FC<{
    isOpen: boolean;
    onClose: (action?: 'mark_spam' | 'mark_trusted') => void;
    isTrusted: boolean;
}> = ({ isOpen, onClose, isTrusted }) => {
    const { t } = useTranslation();

    return (
        <Notification isOpen={isOpen} handleClose={() => onClose()}>
            {() => (
                <ContentWrapper>
                    <Title>{t('suspiciousNFTDetails_title')}</Title>
                    <Description>{t('suspiciousNFTDetails_subtitle')}</Description>
                    <InfoBox>
                        <InfoItem>{t('suspiciousNFTDetails_paragraphs_p1')}</InfoItem>
                        <InfoItem>{t('suspiciousNFTDetails_paragraphs_p2')}</InfoItem>
                        <InfoItem>{t('suspiciousNFTDetails_paragraphs_p3')}</InfoItem>
                    </InfoBox>
                    <ButtonsContainer>
                        <Button warn onClick={() => onClose('mark_spam')}>
                            {t('suspiciousNFTDetails_buttons_report')}
                        </Button>
                        {!isTrusted && (
                            <Button secondary onClick={() => onClose('mark_trusted')}>
                                {t('suspiciousNFTDetails_buttons_not_spam')}
                            </Button>
                        )}
                    </ButtonsContainer>
                </ContentWrapper>
            )}
        </Notification>
    );
};
