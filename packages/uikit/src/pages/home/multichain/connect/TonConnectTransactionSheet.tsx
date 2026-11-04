import { FC, Suspense, useEffect, useMemo, useState } from 'react';

import { TonConnectTransactionPayload } from '@tonkeeper/core/dist/entries/tonConnect';
import { NotEnoughBalanceError } from '@tonkeeper/core/dist/errors/NotEnoughBalanceError';
import { getErrorText } from '@tonkeeper/core/dist/errors/TranslatableError';
import { isUserCancellation } from '@tonkeeper/core/dist/errors/UserCancelledError';
import { ActionSimplePreview } from '@tonkeeper/core/dist/tonApiV2';
import { formatAddress } from '@tonkeeper/core/dist/utils/common';

import type { TonTransactionNotificationProps } from '../../../../components/connect/TonTransactionNotification';
import { ConfirmActionResult } from '../../../../components/shared/ConfirmActionResult';
import { NetworkFeeValue } from '../../../../components/transfer/multichain/NetworkFeeValue';
import {
    useFeeTextFormatter,
    useNativeAsset
} from '../../../../components/transfer/multichain/SendConfirmShell';
import {
    FeeMethodBatteryIcon,
    SendFeeMethodSheet
} from '../../../../components/transfer/multichain/SendFeeMethodSheet';
import { AssetIcon } from '../../../../components/transfer/multichain/multichainSendShared';
import { useTonConnectConfirmOperation } from '../../../../hooks/analytics/ton-connect';
import { useAppSdk } from '../../../../hooks/appSdk';
import {
    EXTERNAL_SENDER_CHOICE,
    TonSenderChoiceUserAvailable,
    TonSenderTypeUserAvailable,
    useTonConnectAvailableSendersChoices
} from '../../../../hooks/blockchain/useSender';
import { useTranslation } from '../../../../hooks/translation';
import IcBatteryFlash44 from '../../../../icons/components/IcBatteryFlash44';
import { Button, Modal, ModalFooter, ModalFooterPortal } from '../../../../primitives';
import {
    useTonConnectTransactionEstimation,
    useTonConnectTransactionSendMutation
} from '../../../../state/tonConnectTransaction';
import { useActiveAccount } from '../../../../state/wallet';
import { MultichainDetailCell } from '../MultichainDetailCell';
import { networkLabel } from '../multichain-utils';
import {
    DappRequestAdvancedDetails,
    DappRequestAppCell,
    DappRequestCard,
    DappRequestHero,
    DappRequestNotice,
    DappRequestWalletCell
} from './DappRequestDetails';

/** How long the "Done" result stays up before the dApp gets its answer and the sheet closes. */
const DONE_HOLD_MS = 300;

/**
 * "Confirm Action" sheet for a TonConnect `sendTransaction` request on a
 * multichain account: the emulated actions, the fee with its payment-method
 * picker, and the raw messages. Confirming signs with the request's wallet
 * and broadcasts; the BOC goes back through `handleClose`.
 */
export const TonConnectTransactionSheet: FC<TonTransactionNotificationProps> = ({
    params,
    handleClose,
    waitInvalidation,
    walletId,
    dappUrl
}) => {
    const [busy, setBusy] = useState(false);

    return (
        <Modal
            isOpen={params !== null}
            onClose={() => {
                if (!busy) handleClose();
            }}
            variant="content"
        >
            {params && (
                // The sender choices read the battery service config through
                // a suspending hook; the boundary keeps that inside the sheet.
                <Suspense fallback={null}>
                    <TransactionContent
                        params={params}
                        handleClose={handleClose}
                        waitInvalidation={waitInvalidation}
                        walletId={walletId}
                        dappUrl={dappUrl}
                        onBusyChange={setBusy}
                    />
                </Suspense>
            )}
        </Modal>
    );
};

/**
 * The request priced with one fee payment method. Every method the wallet can
 * use is estimated up front so the picker can show each one's price.
 */
const useMethodEstimate = (
    params: TonConnectTransactionPayload,
    choices: TonSenderChoiceUserAvailable[] | undefined,
    type: TonSenderTypeUserAvailable,
    choicesLoading: boolean
) => {
    const choice = choices?.find(c => c.type === type);
    const query = useTonConnectTransactionEstimation(params, choice ?? EXTERNAL_SENDER_CHOICE, {
        paramsLoading: choicesLoading || !choice
    });
    return choice ? { choice, ...query } : undefined;
};

type MethodEstimate = NonNullable<ReturnType<typeof useMethodEstimate>>;

const TransactionContent: FC<
    Omit<TonTransactionNotificationProps, 'params'> & {
        params: TonConnectTransactionPayload;
        onBusyChange: (busy: boolean) => void;
    }
> = ({ params, handleClose, waitInvalidation, walletId, dappUrl, onBusyChange }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const account = useActiveAccount();
    const nativeTon = useNativeAsset('ton');
    const feeText = useFeeTextFormatter();

    const { data: choices, isLoading: choicesLoading } =
        useTonConnectAvailableSendersChoices(params);
    const battery = useMethodEstimate(params, choices, 'battery', choicesLoading);
    const external = useMethodEstimate(params, choices, 'external', choicesLoading);
    const gasless = useMethodEstimate(params, choices, 'gasless', choicesLoading);

    // Listed in the order the choices come in, which puts the preferred
    // method first; that one is the default until the user picks another.
    const methods = (choices ?? [])
        .map(c => ({ battery, external, gasless }[c.type]))
        .filter((m): m is MethodEstimate => m !== undefined);
    const [pickedType, setPickedType] = useState<TonSenderTypeUserAvailable>();
    const selected = methods.find(m => m.choice.type === pickedType) ?? methods[0];
    const estimate = selected?.data;

    const send = useTonConnectTransactionSendMutation(params, estimate, {
        senderChoice: selected?.choice ?? EXTERNAL_SENDER_CHOICE,
        waitInvalidation,
        walletId
    });

    useEffect(() => {
        onBusyChange(send.isLoading || send.isSuccess);
    }, [send.isLoading, send.isSuccess, onBusyChange]);
    useEffect(() => () => onBusyChange(false), [onBusyChange]);

    useEffect(() => {
        if (send.error && !isUserCancellation(send.error)) console.error(send.error);
    }, [send.error]);

    const confirmOperation = useTonConnectConfirmOperation('sendTransaction');

    const onConfirm = async () => {
        if (!selected) return;
        confirmOperation.start();
        try {
            const boc = await send.mutateAsync();
            confirmOperation.succeed();
            sdk.hapticNotification('success');
            setTimeout(() => handleClose({ boc, senderChoice: selected.choice }), DONE_HOLD_MS);
        } catch (e) {
            confirmOperation.fail(e);
            if (!isUserCancellation(e)) sdk.hapticNotification('error');
        }
    };

    const loading = choicesLoading || !selected || selected.isLoading;
    const insufficient = selected?.error instanceof NotEnoughBalanceError;
    const estimationFailed = !loading && !estimate && !insufficient;

    const usable = methods.filter(m => m.data);
    const canPick = usable.length > 1;
    const [pickerOpen, setPickerOpen] = useState(false);
    const priced = estimate ? feeText(estimate.fee) : undefined;

    const methodIcon = (choice: TonSenderChoiceUserAvailable) => {
        switch (choice.type) {
            case 'battery':
                return (
                    <FeeMethodBatteryIcon>
                        <IcBatteryFlash44 />
                    </FeeMethodBatteryIcon>
                );
            case 'external':
                return nativeTon ? (
                    <AssetIcon asset={nativeTon} size={44} withChainBadge={false} />
                ) : null;
            case 'gasless':
                return choice.asset.image ? (
                    <img src={choice.asset.image} alt="" className="size-11 rounded-full" />
                ) : null;
        }
    };
    const methodTitle = (choice: TonSenderChoiceUserAvailable) => {
        switch (choice.type) {
            case 'battery':
                return t('battery_title');
            case 'external':
                return nativeTon?.symbol ?? '';
            case 'gasless':
                return choice.asset.symbol;
        }
    };

    const sendError =
        send.isError && !isUserCancellation(send.error)
            ? getErrorText(send.error, { t })
            : undefined;
    const raw = useMemo(() => JSON.stringify(params, null, 2), [params]);

    const action = send.isSuccess ? (
        <ConfirmActionResult variant="done" label={t('send_done')} />
    ) : (
        <Button
            variant="primaryBlue"
            size="large"
            fullWidth
            loading={send.isLoading}
            disabled={!estimate || send.isLoading}
            onClick={onConfirm}
        >
            {t('confirm')}
        </Button>
    );

    return (
        <div className="flex min-h-full flex-col">
            <DappRequestHero network="ton" headline={t('connect_confirm_send_transaction')} />

            <div className="flex flex-col gap-4">
                <DappRequestCard>
                    <DappRequestWalletCell
                        name={account.name}
                        address={formatAddress(account.activeTonWallet.rawAddress)}
                    />
                    <DappRequestAppCell dappUrl={dappUrl} />
                    <MultichainDetailCell
                        label={t('send_confirm_network')}
                        value={networkLabel('ton')}
                    />
                    <MultichainDetailCell
                        label={canPick ? t('send_network_fee') : t('transaction_fee')}
                        value={
                            <NetworkFeeValue
                                loading={loading}
                                error={estimationFailed}
                                onRetry={() => selected?.refetch()}
                                value={
                                    priced
                                        ? canPick
                                            ? priced.row.value
                                            : priced.amount
                                        : undefined
                                }
                                unit={canPick ? priced?.row.unit : undefined}
                                onChange={canPick ? () => setPickerOpen(true) : undefined}
                            />
                        }
                        sub={canPick ? undefined : priced?.fiatText}
                        valueClassName="break-all"
                    />
                </DappRequestCard>

                {estimate && (
                    <EmulatedActionsCard
                        previews={estimate.event.actions.map(item => item.simplePreview)}
                    />
                )}
                {estimationFailed && (
                    <DappRequestCard>
                        <DappRequestNotice tone="orange">
                            {t('send_fee_estimation_error')}
                        </DappRequestNotice>
                    </DappRequestCard>
                )}

                <DappRequestAdvancedDetails raw={raw} />
            </div>

            {(insufficient || sendError) && (
                <p className="px-1 pt-3 text-center text-body2 text-accentRed">
                    {insufficient ? t('send_screen_steps_amount_insufficient_balance') : sendError}
                </p>
            )}

            <ModalFooterPortal>
                <ModalFooter>{action}</ModalFooter>
            </ModalFooterPortal>

            <SendFeeMethodSheet
                isOpen={pickerOpen}
                onClose={() => setPickerOpen(false)}
                options={usable.map(m => {
                    const parts = feeText(m.data!.fee);
                    return {
                        key: m.choice.type,
                        icon: methodIcon(m.choice),
                        title: methodTitle(m.choice),
                        subtitle: parts.fiatText
                            ? `≈ ${parts.fiatText} (${parts.amount})`
                            : `≈ ${parts.amount}`
                    };
                })}
                selected={selected?.choice.type}
                onSelect={setPickedType}
            />
        </div>
    );
};

/** The emulated transaction's actions, each as the API previews it. */
export const EmulatedActionsCard: FC<{ previews: ActionSimplePreview[] }> = ({ previews }) => {
    if (previews.length === 0) return null;
    return (
        <DappRequestCard>
            {previews.map(({ name, description, value }, index) => (
                <div
                    key={index}
                    className="flex items-start gap-3 border-b border-separatorCommon px-4 py-3"
                >
                    <div className="min-w-0 flex-1">
                        <p className="text-label1 text-textPrimary">{name}</p>
                        <p className="break-words text-body2 text-textSecondary">{description}</p>
                    </div>
                    {value && (
                        <span className="max-w-[50%] shrink-0 break-words text-right text-label1 text-textPrimary">
                            {value}
                        </span>
                    )}
                </div>
            ))}
        </DappRequestCard>
    );
};
