import { IAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { FC, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAppSdk } from '../hooks/appSdk';
import { useTranslation } from '../hooks/translation';
import { AppRoute } from '../libs/routes';
import { ChevronLeftIcon } from './Icon';
import { Label2 } from './Text';
import { RoundedButton } from './fields/RoundedButton';

const BackBlock = styled.div`
    position: absolute;
    top: 1rem;
    left: 1rem;
    z-index: 5;
`;

export const useNativeBackButton = (sdk: IAppSdk, onClick: () => void) => {
    useEffect(() => {
        const { nativeBackButton } = sdk;
        if (!nativeBackButton) return () => {};
        nativeBackButton.show();

        nativeBackButton.on('click', onClick);
        return () => {
            nativeBackButton.off('click', onClick);
            nativeBackButton.hide();
        };
    }, [sdk, onClick]);
};

export const BackButtonBlock: FC<{ onClick: () => void; className?: string }> = ({
    onClick,
    className
}) => {
    const sdk = useAppSdk();
    useNativeBackButton(sdk, onClick);
    if (sdk.nativeBackButton) {
        return <></>;
    } else {
        return (
            <BackBlock className={className}>
                <RoundedButton onClick={onClick}>
                    <ChevronLeftIcon />
                </RoundedButton>
            </BackBlock>
        );
    }
};

const LogoutButtonBlock = styled.div`
    flex-shrink: 0;

    cursor: pointer;
    padding: 6px 12px;
    border-radius: ${props => props.theme.cornerMedium};
    color: ${props => props.theme.textPrimary};
    background-color: ${props => props.theme.backgroundContent};
    transition: background-color 0.1s ease;
    display: flex;
    justify-content: center;
    align-items: center;

    &:hover {
        background-color: ${props => props.theme.backgroundContentTint};
    }
`;

const LogoutBlock = styled.div`
    position: absolute;
    top: 1rem;
    right: 1rem;
    z-index: 5;
`;

export const LogoutButton = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const back = useCallback(() => navigate(AppRoute.home), [navigate]);
    useNativeBackButton(sdk, back);

    if (sdk.nativeBackButton) {
        return <></>;
    } else {
        return (
            <LogoutBlock>
                <LogoutButtonBlock onClick={back}>
                    <Label2>{t('info_about_inactive_back')}</Label2>
                </LogoutButtonBlock>
            </LogoutBlock>
        );
    }
};

export const LaterButton: FC<{ skip: () => void }> = ({ skip }) => {
    const { t } = useTranslation();

    return (
        <LogoutBlock>
            <LogoutButtonBlock onClick={skip}>
                <Label2>{t('reminder_notifications_later_button')}</Label2>
            </LogoutButtonBlock>
        </LogoutBlock>
    );
};
