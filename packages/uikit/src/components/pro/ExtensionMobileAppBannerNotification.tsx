import styled, { useTheme } from 'styled-components';
import { Body1, H2 } from '../Text';
import { useTranslation } from '../../hooks/translation';
import { useMutateUserUIPreferences } from '../../state/theme';
import { FC, useEffect, useState } from 'react';
import { Notification } from '../Notification';
import { QRCode } from 'react-qrcode-logo';
import { ExternalLink } from '../shared/ExternalLink';
import { Button } from '../fields/Button';
import { useMobileBannerUrl } from '../../hooks/browser/useMobileBannerUrl';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    text-align: center;
    align-items: center;
`;

const QRWrapper = styled.div`
    padding: 16px;
    border-radius: ${p => p.theme.cornerSmall};
    background-color: ${p => p.theme.constantWhite};
    margin-bottom: 20px;
    width: fit-content;
`;

const Body1Secondary = styled(Body1)`
    color: ${p => p.theme.textSecondary};
    margin-bottom: 32px;
    max-width: 366px;
    text-wrap: balance;
`;

const H2Styled = styled(H2)`
    margin-bottom: 4px;
    max-width: 326px;
    text-wrap: balance;
`;

const ExternalLinkStyled = styled(ExternalLink)`
    width: 100%;
`;

export const ExtensionMobileAppBannerNotification: FC<{ className?: string }> = ({ className }) => {
    const { t } = useTranslation();
    const url = useMobileBannerUrl();
    const theme = useTheme();
    const { mutate } = useMutateUserUIPreferences();
    const [isOpen, setIsOpen] = useState(false);

    const isIphone = !!navigator?.userAgent && /iPhone/.test(navigator.userAgent);

    useEffect(() => {
        if (url) {
            setIsOpen(true);
        }
    }, [url]);

    const onClose = () => {
        setIsOpen(false);
        mutate({ dismissMobileQRBanner: true });
    };

    return (
        <Notification isOpen={isOpen} handleClose={onClose}>
            {() =>
                !!url && (
                    <Wrapper className={className}>
                        <QRWrapper>
                            <QRCode
                                size={160}
                                value={url}
                                bgColor={theme.constantWhite}
                                fgColor={theme.constantBlack}
                                quietZone={0}
                            />
                        </QRWrapper>
                        <H2Styled>{t('pro_download_mobile_banner_title')}</H2Styled>
                        <Body1Secondary>
                            {t('pro_download_mobile_banner_description')}
                        </Body1Secondary>
                        <ExternalLinkStyled href={url}>
                            {isIphone ? (
                                <Button primary size="large" fullWidth>
                                    {t('update_download')}
                                </Button>
                            ) : (
                                <Button secondary size="large" fullWidth>
                                    {t('pro_download_mobile_banner_description_link')}
                                </Button>
                            )}
                        </ExternalLinkStyled>
                    </Wrapper>
                )
            }
        </Notification>
    );
};

export default ExtensionMobileAppBannerNotification;
