import BigNumber from 'bignumber.js';
import { FC, ReactNode, useMemo, useState } from 'react';

import { AccountMultichain } from '@tonkeeper/core/dist/entries/account';
import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';
import { WalletConnectNetwork } from '@tonkeeper/core/dist/service/walletConnect/wcChains';
import {
    WalletConnectEvmTransaction,
    WalletConnectRequestPayload
} from '@tonkeeper/core/dist/service/walletConnect/wcRequestTypes';
import {
    DappTransactionSummary,
    EvmDecodedCall,
    evmRequestedFee,
    personalSignText,
    revealHiddenCharacters,
    summarizeEvmTransaction,
    summarizeTronTransaction
} from '@tonkeeper/core/dist/service/walletConnect/wcRequestSummary';

import { formatAmount, formatCount } from '@tonkeeper/core/dist/utils/numberFormat';
import { useAppContext } from '../../../../hooks/appContext';
import { formatFiatCurrency } from '../../../../hooks/balance';
import { useTranslation } from '../../../../hooks/translation';
import IcChevronDown16 from '../../../../icons/components/IcChevronDown16';
import IcExclamationmarkTriangle16 from '../../../../icons/components/IcExclamationmarkTriangle16';
import Wallet16 from '../../../../icons/components/Wallet16';
import { cn } from '../../../../libs/css';
import { NetworkFeeValue } from '../../../../components/transfer/multichain/NetworkFeeValue';
import { useMultichainWalletAssets } from '../../../../state/multichain/useMultichainWalletAssets';
import { useWalletConnectSendFee } from '../../../../state/walletConnectRequest';
import { MultichainDetailCell } from '../MultichainDetailCell';
import { isNativeRow, networkIcon, networkLabel, parseAssetIdHead } from '../multichain-utils';

/**
 * Stand-in for the chain's native coin until the wallet's asset list, which
 * carries the backend's symbol and decimals, has loaded.
 */
const FALLBACK_NATIVE_COIN: Record<WalletConnectNetwork, { symbol: string; decimals: number }> = {
    eth: { symbol: 'ETH', decimals: 18 },
    base: { symbol: 'ETH', decimals: 18 },
    arb: { symbol: 'ETH', decimals: 18 },
    bsc: { symbol: 'BNB', decimals: 18 },
    tron: { symbol: 'TRX', decimals: 6 }
};

interface Coin {
    symbol: string;
    decimals: number;
    price?: BigNumber;
}

/**
 * The chain's native coin and a lookup of tokens the wallet's asset list
 * knows, so amounts read in whole units with a symbol where possible.
 */
export const useDappRequestAssets = (network: WalletConnectNetwork) => {
    const { data } = useMultichainWalletAssets();
    return useMemo(() => {
        const assets = data?.assets ?? [];
        const onNetwork = assets.filter(a => parseAssetIdHead(a.assetId).network === network);
        const nativeAsset = onNetwork.find(a => isNativeRow(a.assetId));
        const coin: Coin = nativeAsset
            ? {
                  symbol: nativeAsset.symbol,
                  decimals: nativeAsset.decimals,
                  price: nativeAsset.price
              }
            : FALLBACK_NATIVE_COIN[network];
        const tokenOf = (contract: string): MultichainWalletAsset | undefined =>
            onNetwork.find(
                a => a.assetId.split('/').pop()?.toLowerCase() === contract.toLowerCase()
            );
        return { nativeAsset, coin, tokenOf };
    }, [data, network]);
};

const toUnits = (amount: bigint, decimals: number): BigNumber =>
    new BigNumber(amount.toString()).shiftedBy(-decimals);

const visible = (text: string): string => revealHiddenCharacters(text).text;

const headlineKey = (
    request: WalletConnectRequestPayload,
    summary: DappTransactionSummary | undefined
): string => {
    switch (request.kind) {
        case 'personal_sign':
        case 'eth_signTypedData_v4':
        case 'tron_signMessage':
            return 'connect_confirm_sign_message';
        case 'eth_sendTransaction':
            return summary?.kind === 'transfer' && !!summary.value
                ? 'connect_confirm_transfer'
                : 'connect_confirm_send_transaction';
        case 'eth_signTransaction':
        case 'tron_signTransaction':
            return 'connect_confirm_sign_transaction';
    }
};

const messageText = (request: WalletConnectRequestPayload): string | undefined => {
    switch (request.kind) {
        case 'personal_sign':
            return personalSignText(request.message);
        case 'tron_signMessage':
            return request.message;
        case 'eth_signTypedData_v4':
            return JSON.stringify(
                { domain: request.typedData.domain, message: request.typedData.message },
                null,
                2
            );
        default:
            return undefined;
    }
};

const rawDetails = (request: WalletConnectRequestPayload): string => {
    switch (request.kind) {
        case 'personal_sign':
        case 'tron_signMessage':
            return request.message;
        case 'eth_signTypedData_v4':
            return JSON.stringify(request.typedData, null, 2);
        case 'eth_signTransaction':
        case 'eth_sendTransaction':
        case 'tron_signTransaction':
            return JSON.stringify(request.transaction, null, 2);
    }
};

const domainField = (value: unknown): string | undefined =>
    value === undefined || value === null
        ? undefined
        : visible(typeof value === 'string' ? value : JSON.stringify(value));

export const DappRequestNotice: FC<{ tone: 'red' | 'orange'; children: ReactNode }> = ({
    tone,
    children
}) => (
    <div
        className={cn(
            'flex gap-2 border-b border-separatorCommon px-4 py-3 text-body2',
            tone === 'red' ? 'text-accentRed' : 'text-accentOrange'
        )}
    >
        <IcExclamationmarkTriangle16 className="mt-0.5 size-4 shrink-0" />
        <span>{children}</span>
    </div>
);

export const DappRequestTextBlock: FC<{ label: ReactNode; text: string; mono?: boolean }> = ({
    label,
    text,
    mono
}) => (
    <div className="flex flex-col gap-1 border-b border-separatorCommon px-4 py-3">
        <span className="text-body1 text-textSecondary">{label}</span>
        <span
            className={cn(
                'max-h-60 overflow-y-auto whitespace-pre-wrap break-all text-body2 text-textPrimary',
                mono && 'font-mono'
            )}
        >
            {text}
        </span>
    </div>
);

export const DappRequestCard: FC<{ children: ReactNode }> = ({ children }) => (
    <div className="overflow-hidden rounded-medium bg-backgroundContent [&>*:last-child]:border-b-0">
        {children}
    </div>
);

const SendFeeCell: FC<{ request: WalletConnectRequestPayload; coin: Coin }> = ({
    request,
    coin
}) => {
    const { t } = useTranslation();
    const { fiat } = useAppContext();
    const fee = useWalletConnectSendFee(request);
    const human = fee.data ? toUnits(fee.data.feeAmount, fee.data.feeDecimals) : undefined;
    return (
        <MultichainDetailCell
            label={t('send_network_fee')}
            value={
                <NetworkFeeValue
                    loading={fee.isLoading}
                    error={fee.isError}
                    onRetry={() => fee.refetch()}
                    value={
                        human && coin.price
                            ? formatFiatCurrency(fiat, human.multipliedBy(coin.price))
                            : human
                            ? `${formatAmount(human)} ${fee.data!.feeSymbol}`
                            : undefined
                    }
                    unit={human && coin.price ? fee.data?.feeSymbol : undefined}
                />
            }
            valueClassName="break-all"
        />
    );
};

/** The fee the dApp set — the one an `eth_signTransaction` signature commits to. */
const RequestedFeeCell: FC<{ transaction: WalletConnectEvmTransaction; coin: Coin }> = ({
    transaction,
    coin
}) => {
    const { t } = useTranslation();
    const { fiat } = useAppContext();
    const amount = evmRequestedFee(transaction);
    if (amount === undefined) return null;
    const human = toUnits(amount, coin.decimals);
    return (
        <MultichainDetailCell
            label={t('send_network_fee')}
            value={
                <NetworkFeeValue
                    value={
                        coin.price
                            ? formatFiatCurrency(fiat, human.multipliedBy(coin.price))
                            : `${formatAmount(human)} ${coin.symbol}`
                    }
                    unit={coin.price ? coin.symbol : undefined}
                />
            }
            sub={t('connect_request_provided_by_dapp')}
            valueClassName="break-all"
        />
    );
};

const DecodedCallRows: FC<{
    call: EvmDecodedCall;
    token: MultichainWalletAsset | undefined;
}> = ({ call, token }) => {
    const { t } = useTranslation();
    const tokenAmount = (amount: bigint) =>
        token
            ? formatAmount(toUnits(amount, token.decimals), { unit: token.symbol })
            : formatCount(amount);

    switch (call.method) {
        case 'approve':
        case 'increaseAllowance':
            return (
                <>
                    <MultichainDetailCell
                        label={t('connect_request_action')}
                        value={t(
                            call.method === 'approve'
                                ? 'connect_request_action_approve'
                                : 'connect_request_action_increase_allowance'
                        )}
                    />
                    <MultichainDetailCell
                        label={t('connect_request_spender')}
                        value={call.spender}
                        valueClassName="break-all"
                    />
                    <MultichainDetailCell
                        label={t('connect_request_allowance')}
                        value={
                            call.unlimited ? (
                                <span className="text-accentRed">
                                    {t('connect_request_unlimited')}
                                    {token && ` ${token.symbol}`}
                                </span>
                            ) : (
                                tokenAmount(call.amount)
                            )
                        }
                        valueClassName="break-all"
                    />
                    {call.unlimited && (
                        <DappRequestNotice tone="red">
                            {t('connect_request_unlimited_warning')}
                        </DappRequestNotice>
                    )}
                </>
            );
        case 'setApprovalForAll':
            return (
                <>
                    <MultichainDetailCell
                        label={t('connect_request_action')}
                        value={t(
                            call.approved
                                ? 'connect_request_action_approve_all'
                                : 'connect_request_action_revoke_all'
                        )}
                    />
                    <MultichainDetailCell
                        label={t('connect_request_operator')}
                        value={call.operator}
                        valueClassName="break-all"
                    />
                    {call.approved && (
                        <DappRequestNotice tone="red">
                            {t('connect_request_approve_all_warning')}
                        </DappRequestNotice>
                    )}
                </>
            );
        case 'transfer':
        case 'transferFrom':
            return (
                <>
                    <MultichainDetailCell
                        label={t('connect_request_action')}
                        value={t(
                            call.method === 'transfer'
                                ? 'connect_request_action_transfer'
                                : 'connect_request_action_transfer_from'
                        )}
                    />
                    {call.method === 'transferFrom' && (
                        <MultichainDetailCell
                            label={t('connect_request_from')}
                            value={call.from}
                            valueClassName="break-all"
                        />
                    )}
                    <MultichainDetailCell
                        label={t('send_confirm_recipient')}
                        value={call.recipient}
                        valueClassName="break-all"
                    />
                    <MultichainDetailCell
                        label={t('send_amount')}
                        value={tokenAmount(call.amount)}
                        valueClassName="break-all"
                    />
                </>
            );
    }
};

export const DappRequestHero: FC<{ network: string; headline: ReactNode }> = ({
    network,
    headline
}) => {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col items-center pb-8 pt-2">
            <span className="flex size-24 items-center justify-center overflow-hidden rounded-full bg-backgroundContentTint pb-0 [&>svg]:size-24">
                {networkIcon(network)}
            </span>
            <p className="pt-5 text-body1 text-textSecondary">{t('send_confirm_action')}</p>
            <p className="text-center text-h3 text-textPrimary">
                {headline} <span className="text-textTertiary">{networkLabel(network)}</span>
            </p>
        </div>
    );
};

export const DappRequestWalletCell: FC<{ name: string; address: string }> = ({ name, address }) => {
    const { t } = useTranslation();
    return (
        <MultichainDetailCell
            label={t('send_confirm_wallet')}
            value={
                <span className="inline-flex items-center justify-end gap-1.5">
                    <Wallet16 className="h-5 w-5" />
                    {name}
                </span>
            }
            sub={<span className="break-all">{address}</span>}
            valueClassName="break-all"
        />
    );
};

export const DappRequestAppCell: FC<{ dappName?: string; dappUrl?: string }> = ({
    dappName,
    dappUrl
}) => {
    const { t } = useTranslation();
    if (!dappName && !dappUrl) return null;
    return (
        <MultichainDetailCell
            label={t('connect_confirm_app')}
            value={
                <span className="text-textAccent">
                    {dappUrl ? dappDomainOf(dappUrl) : dappName}
                </span>
            }
            valueClassName="break-all"
        />
    );
};

/** The request's raw payload behind a toggle. Key it by request so each one opens collapsed. */
export const DappRequestAdvancedDetails: FC<{ raw: string }> = ({ raw }) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);

    return (
        <DappRequestCard>
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="flex w-full items-center justify-between px-4 py-4 text-left transition-colors hover:bg-backgroundContentTint"
            >
                <span className="text-body1 text-textSecondary">
                    {t('connect_advanced_details')}
                </span>
                <IcChevronDown16
                    className={cn(
                        'size-4 text-textTertiary transition-transform',
                        open && 'rotate-180'
                    )}
                />
            </button>
            {open && (
                <div className="max-h-60 overflow-y-auto whitespace-pre-wrap break-all px-4 pb-4 font-mono text-body3 text-textSecondary">
                    {raw}
                </div>
            )}
        </DappRequestCard>
    );
};

/**
 * What a dApp request asks the wallet to sign: header, the request's rows
 * (wallet and signer, app, network, amount, recipient or contract, fee), the
 * decoded contract action or the signed message, and the raw payload behind
 * a toggle. Shared by every dApp confirm surface so they show the same thing.
 */
export const DappRequestDetails: FC<{
    request: WalletConnectRequestPayload;
    account: AccountMultichain | undefined;
    dappName?: string;
    dappUrl?: string;
}> = ({ request, account, dappName, dappUrl }) => {
    const { t } = useTranslation();
    const { fiat } = useAppContext();
    const { coin, tokenOf } = useDappRequestAssets(request.network);

    const tron = useMemo(
        () =>
            request.kind === 'tron_signTransaction'
                ? summarizeTronTransaction(request.transaction)
                : undefined,
        [request]
    );
    const summary = useMemo(
        () =>
            request.kind === 'eth_sendTransaction' || request.kind === 'eth_signTransaction'
                ? summarizeEvmTransaction(request.transaction)
                : tron?.summary,
        [request, tron]
    );
    const message = useMemo(() => {
        const text = messageText(request);
        return text === undefined ? undefined : revealHiddenCharacters(text);
    }, [request]);
    const raw = useMemo(() => visible(rawDetails(request)), [request]);

    const typedDomain =
        request.kind === 'eth_signTypedData_v4' ? request.typedData.domain : undefined;
    const domainName = domainField(typedDomain?.name);
    const verifyingContract = domainField(typedDomain?.verifyingContract);
    const anyNetwork =
        typedDomain !== undefined &&
        (typedDomain.chainId === undefined || typedDomain.chainId === null);

    const amount = summary?.value !== undefined ? toUnits(summary.value, coin.decimals) : undefined;
    const token = summary?.kind === 'call' ? tokenOf(summary.to) : undefined;

    const requestLabel = (() => {
        switch (request.kind) {
            case 'personal_sign':
                return t('connect_request_personal_signature');
            case 'eth_signTypedData_v4':
                return t('connect_request_typed_data');
            case 'tron_signMessage':
                return t('connect_request_tron_message');
            case 'tron_signTransaction':
                return t('connect_request_tron_transaction');
            default:
                return summary?.kind === 'deploy'
                    ? t('connect_request_contract_deployment')
                    : undefined;
        }
    })();

    return (
        <>
            <DappRequestHero
                network={request.network}
                headline={t(headlineKey(request, summary), { symbol: coin.symbol })}
            />

            <div className="flex flex-col gap-4">
                <DappRequestCard>
                    {account && (
                        <DappRequestWalletCell
                            name={account.name}
                            address={visible(request.address)}
                        />
                    )}
                    <DappRequestAppCell dappName={dappName} dappUrl={dappUrl} />
                    <MultichainDetailCell
                        label={t('send_confirm_network')}
                        value={networkLabel(request.network)}
                        valueClassName="break-all"
                    />
                    {requestLabel && (
                        <MultichainDetailCell
                            label={t('connect_request_request')}
                            value={requestLabel}
                            valueClassName="break-all"
                        />
                    )}
                    {domainName !== undefined && (
                        <MultichainDetailCell
                            label={t('connect_request_domain_name')}
                            value={domainName}
                            valueClassName="break-all"
                        />
                    )}
                    {verifyingContract !== undefined && (
                        <MultichainDetailCell
                            label={t('connect_request_contract')}
                            value={verifyingContract}
                            valueClassName="break-all"
                        />
                    )}
                    {summary && (
                        <MultichainDetailCell
                            label={t('send_amount')}
                            value={
                                amount
                                    ? `${formatAmount(amount)} ${coin.symbol}`
                                    : visible(
                                          (request as { transaction: WalletConnectEvmTransaction })
                                              .transaction.value ?? ''
                                      )
                            }
                            sub={
                                amount && coin.price
                                    ? formatFiatCurrency(fiat, amount.multipliedBy(coin.price))
                                    : undefined
                            }
                            valueClassName="break-all"
                        />
                    )}
                    {summary && summary.kind !== 'deploy' && (
                        <MultichainDetailCell
                            label={t(
                                summary.kind === 'transfer'
                                    ? 'send_confirm_recipient'
                                    : 'connect_request_contract'
                            )}
                            value={visible(summary.to)}
                            sub={token ? `${token.name} (${token.symbol})` : undefined}
                            valueClassName="break-all"
                        />
                    )}
                    {request.kind === 'eth_sendTransaction' && (
                        <SendFeeCell request={request} coin={coin} />
                    )}
                    {request.kind === 'eth_signTransaction' && (
                        <RequestedFeeCell transaction={request.transaction} coin={coin} />
                    )}
                </DappRequestCard>

                {tron && (tron.summary === undefined || tron.hasUnreadFields) && (
                    <DappRequestCard>
                        <DappRequestNotice tone="orange">
                            {t('connect_request_tron_unread_warning')}
                        </DappRequestNotice>
                        {tron.summary === undefined && (
                            <MultichainDetailCell
                                label={t('connect_request_action')}
                                value={tron.contractType}
                                valueClassName="break-all"
                            />
                        )}
                    </DappRequestCard>
                )}
                {summary?.kind === 'call' && (
                    <DappRequestCard>
                        {summary.call ? (
                            <DecodedCallRows call={summary.call} token={token} />
                        ) : (
                            <>
                                <DappRequestNotice tone="orange">
                                    {t('connect_request_blind_sign_warning')}
                                </DappRequestNotice>
                                <DappRequestTextBlock
                                    label={t('connect_request_data')}
                                    text={visible(summary.data)}
                                    mono
                                />
                            </>
                        )}
                    </DappRequestCard>
                )}
                {summary?.kind === 'deploy' && (
                    <DappRequestCard>
                        <DappRequestNotice tone="orange">
                            {t('connect_request_deploy_warning')}
                        </DappRequestNotice>
                        <DappRequestTextBlock
                            label={t('connect_request_data')}
                            text={visible(summary.data)}
                            mono
                        />
                    </DappRequestCard>
                )}
                {message && (
                    <DappRequestCard>
                        {anyNetwork && (
                            <DappRequestNotice tone="orange">
                                {t('connect_request_any_network_warning')}
                            </DappRequestNotice>
                        )}
                        {message.hasHidden && (
                            <DappRequestNotice tone="red">
                                {t('connect_request_hidden_characters_warning')}
                            </DappRequestNotice>
                        )}
                        <DappRequestTextBlock
                            label={t('connect_request_message')}
                            text={message.text}
                            mono={request.kind === 'eth_signTypedData_v4'}
                        />
                    </DappRequestCard>
                )}

                <DappRequestAdvancedDetails key={`${request.topic}:${request.id}`} raw={raw} />
            </div>
        </>
    );
};

export const dappDomainOf = (url: string): string => {
    try {
        return new URL(url).hostname;
    } catch (e) {
        return url;
    }
};
