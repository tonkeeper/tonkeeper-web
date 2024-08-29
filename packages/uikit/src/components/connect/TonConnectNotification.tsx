import { useQuery } from '@tanstack/react-query';
import {
    ConnectItemReply,
    ConnectRequest,
    DAppManifest
} from '@tonkeeper/core/dist/entries/tonConnect';
import { getManifest } from '@tonkeeper/core/dist/service/tonConnect/connectService';
import React, { FC, useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { TxConfirmationCustomError } from '../../libs/errors/TxConfirmationCustomError';
import { QueryKey } from '../../libs/queryKey';
import { useIsActiveWalletLedger } from '../../state/ledger';
import { useConnectTonConnectAppMutation } from '../../state/tonConnect';
import { useIsActiveWalletWatchOnly } from '../../state/wallet';
import { CheckmarkCircleIcon, ExclamationMarkCircleIcon } from '../Icon';
import { Notification, NotificationBlock } from '../Notification';
import { Body2, Body3, H2, Label2 } from '../Text';
import { AccountAndWalletInfo } from '../account/AccountAndWalletInfo';
import { Button } from '../fields/Button';
import { ResultButton } from '../transfer/common';

const Title = styled(H2)`
    text-align: center;
    user-select: none;
`;
const SubTitle = styled(Body2)`
    margin-top: 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    color: ${props => props.theme.textSecondary};
    text-align: center;
    user-select: none;
`;

const Notes = styled(Body3)`
    display: block;
    color: ${props => props.theme.textTertiary};
    text-align: center;
    user-select: none;
    max-width: 300px;
`;

const ImageRow = styled.div`
    display: flex;
    width: 100%;
    gap: 3rem;
    justify-content: center;
`;

const Image = styled.img`
    width: 72px;
    height: 72px;

    border-radius: ${props => props.theme.cornerMedium};
`;

const LedgerError = styled(Body2)`
    margin: 0.5rem 0;
    color: ${p => p.theme.accentRed};
`;

const getDomain = (url: string) => {
    try {
        const data = new URL(url);
        return data.hostname;
    } catch (e) {
        return url;
    }
};

const ConnectContent: FC<{
    origin?: string;
    params: ConnectRequest;
    manifest: DAppManifest;
    handleClose: (result?: ConnectItemReply[], manifest?: DAppManifest) => void;
}> = ({ params, manifest, origin, handleClose }) => {
    const activeIsLedger = useIsActiveWalletLedger();
    const isReadOnly = useIsActiveWalletWatchOnly();

    const sdk = useAppSdk();
    const [done, setDone] = useState(false);

    const { t } = useTranslation();

    useEffect(() => {
        if (sdk.twaExpand) {
            sdk.twaExpand();
        }
    }, []);

    const [error, setError] = useState<Error | null>(null);
    const { mutateAsync, isLoading } = useConnectTonConnectAppMutation();

    const onSubmit: React.FormEventHandler<HTMLFormElement> = async e => {
        e.preventDefault();
        try {
            const result = await mutateAsync({ request: params, manifest, webViewUrl: origin });
            setDone(true);
            setTimeout(() => handleClose(result, manifest), 300);
        } catch (err) {
            setDone(true);
            setError(err as Error);
        }
    };

    let shortUrl = manifest.url;
    try {
        shortUrl = new URL(manifest.url).hostname;
    } catch {
        /* eslint-stub */
    }

    const tonProofRequested = params.items.some(item => item.name === 'ton_proof');
    const cantConnectLedger = activeIsLedger && tonProofRequested;

    return (
        <NotificationBlock onSubmit={onSubmit}>
            <ImageRow>
                <Image src="https://tonkeeper.com/assets/tonconnect-icon.png" />
                <Image src={manifest.iconUrl} />
            </ImageRow>

            <div>
                <Title>{t('ton_login_title_web').replace('%{name}', shortUrl)}</Title>
                <SubTitle>
                    {t('ton_login_caption').replace('%{name}', getDomain(manifest.name))}{' '}
                    <AccountAndWalletInfo />
                </SubTitle>
            </div>

            <>
                {done && !error && (
                    <ResultButton done>
                        <CheckmarkCircleIcon />
                        <Label2>{t('ton_login_success')}</Label2>
                    </ResultButton>
                )}
                {done && error && (
                    <ResultButton>
                        <ExclamationMarkCircleIcon />
                        <Label2>
                            {error instanceof TxConfirmationCustomError
                                ? error.message
                                : t('error_occurred')}
                        </Label2>
                    </ResultButton>
                )}
                {!done && (
                    <Button
                        size="large"
                        fullWidth
                        primary
                        loading={isLoading}
                        disabled={isLoading || cantConnectLedger || isReadOnly}
                        type="submit"
                    >
                        {t('ton_login_connect_button')}
                    </Button>
                )}
                {cantConnectLedger && (
                    <LedgerError>{t('ledger_operation_not_supported')}</LedgerError>
                )}
                {isReadOnly && <LedgerError>{t('operation_not_supported')}</LedgerError>}
            </>
            <Notes>{t('ton_login_notice')}</Notes>
        </NotificationBlock>
    );
};

const useManifest = (params: ConnectRequest | null) => {
    const sdk = useAppSdk();
    const { t } = useTranslation();

    return useQuery<DAppManifest, Error>(
        [QueryKey.estimate, params],
        async () => {
            sdk.uiEvents.emit('copy', {
                method: 'copy',
                params: t('loading')
            });

            try {
                return await getManifest(params!);
            } catch (e) {
                if (e instanceof Error) {
                    sdk.uiEvents.emit('copy', {
                        method: 'copy',
                        params: e.message
                    });
                }
                throw e;
            }
        },
        {
            enabled: params != null
        }
    );
};

export const TonConnectNotification: FC<{
    origin?: string;
    params: ConnectRequest | null;
    handleClose: (result?: ConnectItemReply[], manifest?: DAppManifest) => void;
}> = ({ params, origin, handleClose }) => {
    const { data: manifest } = useManifest(params);

    const Content = useCallback(() => {
        if (!params || !manifest) return undefined;
        return (
            <ConnectContent
                origin={origin}
                params={params}
                manifest={manifest}
                handleClose={handleClose}
            />
        );
    }, [origin, params, manifest, handleClose]);

    return (
        <Notification isOpen={manifest != null} handleClose={() => handleClose()}>
            {Content}
        </Notification>
    );
};
