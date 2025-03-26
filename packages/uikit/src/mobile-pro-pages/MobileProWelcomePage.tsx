import styled from 'styled-components';
import { Body1, H2 } from '../components/Text';
import { Button } from '../components/fields/Button';
import { useAddWalletNotification } from '../components/modals/AddWalletNotificationControlled';

const Container = styled.div`
    height: 100%;
    padding-bottom: env(safe-area-inset-bottom);
    display: flex;
    flex-direction: column;

    > * {
        flex: 1;
    }
`;

const Content = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;

    ${Body1} {
        color: ${p => p.theme.textSecondary};
        margin-top: 4px;
        margin-bottom: 32px;
    }
`;

const ButtonsContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
    padding: 16px 32px 32px;
    flex: 1;
    justify-content: flex-end;
`;

export const MobileProWelcomePage = () => {
    const { onOpen } = useAddWalletNotification();
    return (
        <Container>
            <Icon>
                <LightsIcon />
                <LogoIcon />
            </Icon>
            <Content>
                <H2>Tonkeeper Pro</H2>
                <Body1>Create a new wallet or add an existing one</Body1>
                <ButtonsContainer>
                    <Button
                        size="large"
                        primary
                        onClick={() => onOpen({ walletType: 'create-standard' })}
                    >
                        Create New Wallet
                    </Button>
                    <Button size="large" secondary onClick={() => onOpen({ walletType: 'import' })}>
                        Import Existing Wallet
                    </Button>
                    <Button size="large" secondary onClick={() => onOpen()}>
                        Other Options
                    </Button>
                </ButtonsContainer>
            </Content>
        </Container>
    );
};

const Icon = styled.div`
    position: relative;
    padding-bottom: 8px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding-top: env(safe-area-inset-top);

    &::after {
        content: '';
        position: absolute;
        inset: 0;
        backdrop-filter: blur(72px);
        background: ${p => p.theme.backgroundPage};
        mask: radial-gradient(
            ellipse 60% 40% at 50% 90%,
            rgba(0, 0, 0, 0) 30%,
            rgba(0, 0, 0, 1) 215%
        );
    }

    & > svg:first-child {
        position: absolute;
        bottom: 16px;
    }
`;

const LightsIcon = () => {
    return (
        <svg
            width="390"
            height="406"
            viewBox="0 0 390 406"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                opacity="0.48"
                d="M195 340L-405 70L195 -200L795 70L195 340Z"
                fill="url(#paint0_linear_55773_29818)"
                fillOpacity="0.88"
            />
            <path
                opacity="0.28"
                d="M615 -244.998L195 -433.998L-225 -244.998L194.997 405.998L615 -244.998Z"
                fill="url(#paint1_linear_55773_29818)"
                fillOpacity="0.88"
            />
            <path
                opacity="0.44"
                d="M-224.999 -244.998L195.001 -433.998L195.004 405.998L-224.999 -244.998Z"
                fill="url(#paint2_linear_55773_29818)"
                fillOpacity="0.88"
            />
            <path
                opacity="0.12"
                d="M195 339.726L-404.391 70L195 -199.726L794.391 70L195 339.726Z"
                fill="white"
                fillOpacity="0.88"
                stroke="white"
                strokeWidth="0.5"
            />
            <path
                opacity="0.12"
                d="M195 -433.724L614.632 -244.889L194.997 405.537L-224.632 -244.889L195 -433.724Z"
                fill="white"
                fillOpacity="0.88"
                stroke="white"
                strokeWidth="0.5"
            />
            <path
                opacity="0.12"
                d="M194.752 405.15L195 -433.611L-224.633 -244.889L194.752 405.15Z"
                fill="white"
                fillOpacity="0.88"
                stroke="white"
                strokeWidth="0.5"
            />
            <defs>
                <linearGradient
                    id="paint0_linear_55773_29818"
                    x1="195"
                    y1="-200"
                    x2="195"
                    y2="340"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="white" stopOpacity="0" />
                    <stop offset="1" stopColor="white" stopOpacity="0.4" />
                </linearGradient>
                <linearGradient
                    id="paint1_linear_55773_29818"
                    x1="195"
                    y1="-433.998"
                    x2="195"
                    y2="405.998"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="white" stopOpacity="0" />
                    <stop offset="1" stopColor="white" stopOpacity="0.4" />
                </linearGradient>
                <linearGradient
                    id="paint2_linear_55773_29818"
                    x1="-14.9974"
                    y1="-433.998"
                    x2="-14.9974"
                    y2="405.998"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="white" stopOpacity="0" />
                    <stop offset="1" stopColor="white" stopOpacity="0.4" />
                </linearGradient>
            </defs>
        </svg>
    );
};

const LogoIcon = () => {
    return (
        <svg
            width="144"
            height="144"
            viewBox="0 0 144 144"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M132 43L72 136L12 43L72 16L132 43Z" fill="black" />
            <path d="M72 69.9999L132 43L72 136V69.9999Z" fill="url(#paint0_linear_55773_29825)" />
            <path d="M72 69.9999L12 43L72 136V69.9999Z" fill="url(#paint1_linear_55773_29825)" />
            <path d="M72 70L12 43L72 16L132 43L72 70Z" fill="white" />
            <defs>
                <linearGradient
                    id="paint0_linear_55773_29825"
                    x1="72"
                    y1="16"
                    x2="72"
                    y2="136"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="white" />
                    <stop offset="1" stopColor="white" stopOpacity="0.32" />
                </linearGradient>
                <linearGradient
                    id="paint1_linear_55773_29825"
                    x1="71.9997"
                    y1="69.9999"
                    x2="71.9996"
                    y2="136"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="white" stopOpacity="0.88" />
                    <stop offset="1" stopColor="white" stopOpacity="0.32" />
                </linearGradient>
            </defs>
        </svg>
    );
};
