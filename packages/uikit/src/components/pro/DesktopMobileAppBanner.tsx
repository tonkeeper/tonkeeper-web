import styled, { useTheme } from 'styled-components';
import { Body2, Label2 } from '../Text';
import { useTranslation } from '../../hooks/translation';
import { ExternalLink } from '../shared/ExternalLink';
import { useAppContext } from '../../hooks/appContext';
import { useMutateUserUIPreferences } from '../../state/theme';
import { FC } from 'react';
import ReactPortal from '../ReactPortal';
import { QRCode } from 'react-qrcode-logo';
import { useMobileBannerUrl } from '../../hooks/browser/useMobileBannerUrl';

const CloseButton = styled.button`
    position: absolute;
    top: 0;
    right: 0;
`;

const Wrapper = styled.div`
    display: flex;
    border-radius: ${p => p.theme.cornerSmall};
    overflow: hidden;
    position: fixed;
    bottom: 16px;
    right: 16px;
    z-index: 101;

    ${CloseButton} {
        opacity: 0;
        transition: opacity 0.15s ease-in-out;
    }

    &:hover ${CloseButton} {
        opacity: 1;
    }
`;

const LeftPart = styled.div`
    padding: 14px 16px;
    max-width: 280px;
    background-color: ${p => p.theme.backgroundContent};
    display: flex;
    flex-direction: column;
`;

const Body2Secondary = styled(Body2)`
    color: ${p => p.theme.textSecondary};
    word-break: break-word;
`;

const RightPart = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    background-color: ${p => p.theme.constantWhite};
`;

const QRWrapper = styled.div`
    height: 120px;
    width: 120px;

    > canvas {
        height: 100% !important;
        width: 100% !important;
    }
`;

export const DesktopMobileAppBanner: FC<{ className?: string }> = ({ className }) => {
    const { t } = useTranslation();
    const url = useMobileBannerUrl();
    const theme = useTheme();
    const { mainnetConfig } = useAppContext();
    const { mutate } = useMutateUserUIPreferences();

    if (!url) {
        return null;
    }

    return (
        <ReactPortal wrapperId="body">
            <Wrapper className={className}>
                <LeftPart>
                    <Label2>{t('pro_download_mobile_banner_title')}</Label2>
                    <Body2Secondary>
                        {t('pro_download_mobile_banner_description')}{' '}
                        {!!mainnetConfig.pro_landing_url && (
                            <ExternalLink href={mainnetConfig.pro_landing_url} colored contents>
                                <Body2>{t('pro_download_mobile_banner_description_link')}</Body2>
                            </ExternalLink>
                        )}
                    </Body2Secondary>
                </LeftPart>
                <RightPart>
                    <QRWrapper>
                        <QRCode
                            ecLevel="M"
                            value={url}
                            bgColor={theme.constantWhite}
                            fgColor={theme.constantBlack}
                            quietZone={0}
                        />
                    </QRWrapper>
                </RightPart>
                <CloseButton onClick={() => mutate({ dismissMobileQRBanner: true })}>
                    <CloseIcon />
                </CloseButton>
            </Wrapper>
        </ReactPortal>
    );
};

const CloseIcon = () => {
    return (
        <svg
            width="56"
            height="56"
            viewBox="0 0 56 56"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <mask
                id="mask0_58342_195969"
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width="56"
                height="56"
            >
                <rect width="56" height="56" fill="white" />
            </mask>
            <g mask="url(#mask0_58342_195969)">
                <g filter="url(#filter0_f_58342_195969)">
                    <circle cx="44" cy="12" r="32" fill="white" />
                </g>
            </g>
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M30.4697 14.4697C30.7626 14.1768 31.2374 14.1768 31.5303 14.4697L36 18.9393L40.4697 14.4697C40.7626 14.1768 41.2374 14.1768 41.5303 14.4697C41.8232 14.7626 41.8232 15.2374 41.5303 15.5303L37.0607 20L41.5303 24.4697C41.8232 24.7626 41.8232 25.2374 41.5303 25.5303C41.2374 25.8232 40.7626 25.8232 40.4697 25.5303L36 21.0607L31.5303 25.5303C31.2374 25.8232 30.7626 25.8232 30.4697 25.5303C30.1768 25.2374 30.1768 24.7626 30.4697 24.4697L34.9393 20L30.4697 15.5303C30.1768 15.2374 30.1768 14.7626 30.4697 14.4697Z"
                fill="#8D8D93"
            />
            <defs>
                <filter
                    id="filter0_f_58342_195969"
                    x="0"
                    y="-32"
                    width="88"
                    height="88"
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                >
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="BackgroundImageFix"
                        result="shape"
                    />
                    <feGaussianBlur stdDeviation="6" result="effect1_foregroundBlur_58342_195969" />
                </filter>
            </defs>
        </svg>
    );
};

export default DesktopMobileAppBanner;
