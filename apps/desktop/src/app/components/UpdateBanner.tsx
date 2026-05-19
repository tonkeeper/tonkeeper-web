import { FC, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Body3, Label2 } from '@tonkeeper/uikit/dist/components/Text';
import { Button } from '@tonkeeper/uikit/dist/components/fields/Button';
import { useAppSdk } from '@tonkeeper/uikit/dist/hooks/appSdk';

const DISMISS_KEY = 'update-banner-dismissed-version';

const Banner = styled.div`
    position: fixed;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 16px;
    background: ${p => p.theme.backgroundContent};
    border: 1px solid ${p => p.theme.separatorCommon};
    border-radius: ${p => p.theme.cornerSmall};
    padding: 12px 16px;
    box-shadow: 0 8px 24px rgb(0 0 0 / 18%);
`;

const TextColumn = styled.div`
    display: flex;
    flex-direction: column;

    ${Body3} {
        color: ${p => p.theme.textSecondary};
    }
`;

const Actions = styled.div`
    display: flex;
    gap: 8px;
`;

export const UpdateBanner: FC = () => {
    const sdk = useAppSdk();
    const [info, setInfo] = useState<{ version: string; url: string } | undefined>();

    useEffect(() => {
        return window.backgroundApi.onUpdateAvailable(value => setInfo(value));
    }, []);

    if (!info) return null;
    if (localStorage.getItem(DISMISS_KEY) === info.version) return null;

    return (
        <Banner>
            <TextColumn>
                <Label2>New version available</Label2>
                <Body3>Tonkeeper {info.version} is ready to download.</Body3>
            </TextColumn>
            <Actions>
                <Button
                    onClick={() => {
                        localStorage.setItem(DISMISS_KEY, info.version);
                        setInfo(undefined);
                    }}
                >
                    Later
                </Button>
                <Button primary onClick={() => sdk.openPage(info.url)}>
                    Download
                </Button>
            </Actions>
        </Banner>
    );
};
