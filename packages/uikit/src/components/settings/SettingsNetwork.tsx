import React, { FC, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { SettingsRoute, relative } from '../../libs/routes';
import { TonkeeperIcon } from '../Icon';
import { Body3, Label2 } from '../Text';

const Block = styled.div`
    user-select: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 1rem 0 1.563rem;
`;

export interface SettingsNetworkProps {
    version: string | undefined;
}

const Version = styled(Body3)`
    margin-top: 0.125rem;
    color: ${props => props.theme.textSecondary};
    user-select: none;
`;

const Icon = styled.span`
    margin-bottom: 0.25rem;

    color: ${props => props.theme.accentBlue};
`;

export const SettingsNetwork: FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { version } = useAppSdk();
    const sdk = useAppSdk();

    const ref = useRef<{ click: number; timer: NodeJS.Timeout | undefined }>({
        click: 0,
        timer: undefined
    });

    const onChange: React.MouseEventHandler<HTMLDivElement> = () => {
        clearTimeout(ref.current.timer);
        ref.current.click++;
        ref.current.timer = setTimeout(() => {
            ref.current.click = 0;
        }, 300);

        if (ref.current.click === 6) {
            navigate(relative(SettingsRoute.dev));
        }
    };

    return (
        <Block>
            <Icon onClick={onChange}>
                <TonkeeperIcon width="33" height="33" />
            </Icon>
            <Label2>Tonkeeper Web</Label2>
            <Version onClick={() => sdk.copyToClipboard(version, t('App_version_copied'))}>
                {t('settings_version')} {version}
            </Version>
        </Block>
    );
};
