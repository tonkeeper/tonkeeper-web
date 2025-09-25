import { useQuery } from '@tanstack/react-query';
import {
    CONNECT_EVENT_ERROR_CODES,
    ConnectRequest,
    DAppManifest,
    TonConnectEventPayload
} from '@tonkeeper/core/dist/entries/tonConnect';
import {
    checkDappOriginMatchesManifest,
    getBrowserPlatform,
    getDeviceInfo,
    getManifest
} from '@tonkeeper/core/dist/service/tonConnect/connectService';
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { QueryKey } from '../../libs/queryKey';
import { useGetTonConnectConnectResponse } from '../../state/tonConnect';
import { useAccountsState, useActiveAccount } from '../../state/wallet';
import { CheckmarkCircleIcon, ExclamationMarkCircleIcon, SwitchIcon } from '../Icon';
import { Notification, NotificationBlock } from '../Notification';
import { Body2, Body3, H2, Label2 } from '../Text';
import { AccountAndWalletInfo } from '../account/AccountAndWalletInfo';
import { Button } from '../fields/Button';
import { ResultButton } from '../transfer/common';
import { SelectDropDown, SelectDropDownHost, SelectField } from '../fields/Select';
import { DropDownContent, DropDownItem, DropDownItemsDivider } from '../DropDown';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { isStandardTonWallet, WalletId, WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import { TonConnectConnectionParams } from '@tonkeeper/core/dist/service/tonConnect/connectionService';
import { useTrackTonConnectConnectionRequest } from '../../hooks/analytics/events-hooks';
import { useAnalyticsTrack } from '../../hooks/analytics';
import { AnalyticsEventTcConnect } from '@tonkeeper/core/dist/analytics';
import { TonConnectError } from '@tonkeeper/core/dist/entries/exception';
import { originFromUrl } from '@tonkeeper/core/dist/utils/url';
import { getErrorText } from '@tonkeeper/core/dist/errors/TranslatableError';

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

const ErrorDescription = styled(Body2)`
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
    appName: string;
    handleClose: (
        result: {
            replyItems: TonConnectEventPayload;
            manifest: DAppManifest;
            account: Account;
            walletId: WalletId;
        } | null
    ) => void;
}> = ({ params, manifest, origin, handleClose, appName }) => {
    const activeAccount = useActiveAccount();
    const [selectedAccountAndWallet, setSelectedAccountAndWallet] = useState<{
        account: Account;
        walletId: WalletId;
    }>({ account: activeAccount, walletId: activeAccount.activeTonWallet.id });

    const isReadOnly = selectedAccountAndWallet.account.type === 'watch-only';

    const sdk = useAppSdk();
    const [done, setDone] = useState(false);

    const { t } = useTranslation();

    useEffect(() => {
        if (sdk.twaExpand) {
            sdk.twaExpand();
        }
    }, []);

    const [error, setError] = useState<Error | null>(null);
    const { mutateAsync, isLoading } = useGetTonConnectConnectResponse();
    useTrackTonConnectConnectionRequest(params.manifestUrl);
    const track = useAnalyticsTrack();

    const onSubmit: React.FormEventHandler<HTMLFormElement> = async e => {
        e.preventDefault();
        try {
            const replyItems = await mutateAsync({
                request: params,
                manifest,
                webViewOrigin: origin ?? null,
                ...selectedAccountAndWallet
            });

            const wallet = selectedAccountAndWallet.account.getTonWallet(
                selectedAccountAndWallet.walletId
            );

            const maxMessages =
                wallet && isStandardTonWallet(wallet) && wallet.version === WalletVersion.V5R1
                    ? 255
                    : 4;

            setDone(true);
            setTimeout(
                () =>
                    handleClose({
                        replyItems: {
                            items: replyItems,
                            device: getDeviceInfo(
                                getBrowserPlatform(),
                                sdk.version,
                                maxMessages,
                                appName
                            )
                        },
                        manifest,
                        ...selectedAccountAndWallet
                    }),
                300
            );
            track(
                new AnalyticsEventTcConnect({ dapp_url: manifest.url, allow_notifications: false })
            );
        } catch (err) {
            setDone(true);
            console.error(err);
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
    const cantConnectProof =
        selectedAccountAndWallet.account.type === 'ton-multisig' && tonProofRequested;
    const manifestUrlMismatch =
        origin !== undefined &&
        !checkDappOriginMatchesManifest({ origin, manifestUrl: manifest.url });

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
                </SubTitle>
            </div>

            <SelectAccountDropDown
                selectedAccountAndWallet={selectedAccountAndWallet}
                onSelect={setSelectedAccountAndWallet}
            />

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
                        <Label2>{getErrorText(error, { t })}</Label2>
                    </ResultButton>
                )}
                {!done && (
                    <Button
                        size="large"
                        fullWidth
                        primary
                        loading={isLoading}
                        disabled={
                            isLoading || cantConnectProof || isReadOnly || manifestUrlMismatch
                        }
                        type="submit"
                    >
                        {t('ton_login_connect_button')}
                    </Button>
                )}
                {cantConnectProof && (
                    <ErrorDescription>{t('operation_not_supported')}</ErrorDescription>
                )}
                {isReadOnly && <ErrorDescription>{t('operation_not_supported')}</ErrorDescription>}
                {manifestUrlMismatch && (
                    <ErrorDescription>
                        {t('manifest_mismatch_error', {
                            actual: origin,
                            declared: originFromUrl(manifest.url) ?? manifest.url
                        })}
                    </ErrorDescription>
                )}
            </>
            <Notes>{t('ton_login_notice')}</Notes>
        </NotificationBlock>
    );
};

const SelectAccountDropDown: FC<{
    className?: string;
    selectedAccountAndWallet: { account: Account; walletId: WalletId };
    onSelect: (accountAndWallet: { account: Account; walletId: WalletId }) => void;
}> = ({ selectedAccountAndWallet, className, onSelect }) => {
    const accounts = useAccountsState();
    const accountsAndWallets = useMemo(() => {
        return accounts.flatMap(account =>
            account.allTonWallets.map(w => ({
                account,
                walletId: w.id
            }))
        );
    }, [accounts]);

    return (
        <SelectDropDown
            right="0"
            top="-64px"
            width="100%"
            payload={onClose => (
                <DropDownContent>
                    {accountsAndWallets.map(accountAndWallet => (
                        <>
                            <DropDownItem
                                key={`${accountAndWallet.account.id}-${accountAndWallet.walletId}`}
                                isSelected={
                                    accountAndWallet.account.id ===
                                        selectedAccountAndWallet.account.id &&
                                    accountAndWallet.walletId === selectedAccountAndWallet.walletId
                                }
                                onClick={() => {
                                    onClose();
                                    onSelect?.(accountAndWallet);
                                }}
                            >
                                <AccountAndWalletInfo
                                    account={accountAndWallet.account}
                                    walletId={accountAndWallet.walletId}
                                    noPrefix
                                />
                            </DropDownItem>
                            <DropDownItemsDivider />
                        </>
                    ))}
                </DropDownContent>
            )}
        >
            <SelectField className={className}>
                <SelectDropDownHost>
                    <AccountAndWalletInfo
                        account={selectedAccountAndWallet.account}
                        walletId={selectedAccountAndWallet.walletId}
                        noPrefix
                    />
                    <SwitchIcon />
                </SelectDropDownHost>
            </SelectField>
        </SelectDropDown>
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
    params: Pick<TonConnectConnectionParams, 'request' | 'appName'> | null;
    handleClose: (
        result:
            | {
                  replyItems: TonConnectEventPayload;
                  manifest: DAppManifest;
                  account: Account;
                  walletId: WalletId;
              }
            | null
            | TonConnectError
    ) => void;
}> = ({ params, origin, handleClose }) => {
    const { data: manifest } = useManifest(params?.request ?? null);

    const manifestUrlMismatch = Boolean(
        origin !== undefined &&
            manifest?.url &&
            !checkDappOriginMatchesManifest({ origin, manifestUrl: manifest?.url })
    );

    const modalCloseHandler = () => {
        let closeParameter = null;
        if (manifestUrlMismatch) {
            closeParameter = new TonConnectError(
                'Manifest url and app origin mismatch',
                CONNECT_EVENT_ERROR_CODES.MANIFEST_CONTENT_ERROR
            );
        }

        handleClose(closeParameter);
    };

    const Content = useCallback(() => {
        if (!params || !manifest) return undefined;
        return (
            <ConnectContent
                origin={origin}
                params={params.request}
                manifest={manifest}
                handleClose={handleClose}
                appName={params.appName}
            />
        );
    }, [origin, params, manifest, handleClose]);

    return (
        <Notification isOpen={manifest != null} handleClose={modalCloseHandler} onTopOfBrowser>
            {Content}
        </Notification>
    );
};
