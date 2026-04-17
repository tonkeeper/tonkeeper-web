import { TonConnectTransactionPayload } from '@tonkeeper/core/dist/entries/tonConnect';
import { PoolInfo } from '@tonkeeper/core/dist/tonApiV2';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import {
    isTransactionFeeRefund,
    TransactionFee
} from '@tonkeeper/core/dist/entries/crypto/transaction-fee';
import { assertUnreachableSoft } from '@tonkeeper/core/dist/utils/types';
import BigNumber from 'bignumber.js';
import React, {
    FC,
    PropsWithChildren,
    ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useState
} from 'react';
import styled, { css } from 'styled-components';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { formatFiatCurrency } from '../../hooks/balance';
import { useTranslation } from '../../hooks/translation';
import {
    BATTERY_SENDER_CHOICE,
    EXTERNAL_SENDER_CHOICE,
    SenderChoice,
    TonSenderChoiceUserAvailable,
    useTonConnectAvailableSendersChoices
} from '../../hooks/blockchain/useSender';
import { useAssetAmountFiatEquivalent } from '../../state/asset';
import { useActiveAccount } from '../../state/wallet';
import { useIsActiveAccountMultisig } from '../../state/multisig';
import { MultisigOrderLifetimeMinutes } from '../../libs/multisig';
import { NotEnoughBalanceError } from '@tonkeeper/core/dist/errors/NotEnoughBalanceError';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { getErrorText } from '@tonkeeper/core/dist/errors/TranslatableError';
import {
    useTonConnectTransactionEstimation,
    useTonConnectTransactionSendMutation
} from '../connect/TonTransactionNotification';
import { SelectSenderDropdown } from '../activity/NotificationCommon';
import { Notification, NotificationFooter, NotificationFooterPortal } from '../Notification';
import { SkeletonImage, SkeletonText } from '../shared/Skeleton';
import { Body2, Body3, H2, Label2, Num2 } from '../Text';
import { Button } from '../fields/Button';
import { MainButton, ResultButton, TransferViewHeaderBlock } from '../transfer/common';
import { MultisigOrderFormView } from '../transfer/MultisigOrderFormView';
import { CheckmarkCircleIcon, ErrorIcon, ExclamationMarkCircleIcon } from '../Icon';
import { WalletEmoji } from '../shared/emoji/WalletEmoji';
import { StakingPoolIcon } from './StakingPoolIcon';

const ButtonGap = styled.div`
    height: 1rem;
`;

const Root = styled.div``;

const TextPart = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 8px;
`;

const PoolIconWrap = styled.div`
    padding-bottom: 12px;
`;

const HeroLabel = styled(Body2)`
    color: ${p => p.theme.textSecondary};
    font-weight: 400;
    text-align: center;
    padding-bottom: 0;
`;

const HeroAmount = styled(Num2)`
    padding: 0 32px 4px;
`;

const HeroFiat = styled(Body2)`
    color: ${p => p.theme.textSecondary};
    font-weight: 400;
    text-align: center;
    padding: 0 32px 24px;
`;

const ListCard = styled.div`
    background: ${p => p.theme.backgroundContent};
    border-radius: ${p => p.theme.corner2xSmall};
    overflow: hidden;
    width: 100%;
`;

const Cell = styled.div`
    padding: 8px 12px;
    display: flex;
    gap: 8px;
    min-width: 0;
    justify-content: space-between;
    position: relative;
    &::after {
        content: '';
        position: absolute;
        bottom: 0;
        right: 0;
        width: calc(100% - 12px);
        height: 0.5px;
        background: ${p => p.theme.separatorAlternate};
    }
`;

const LabelCell = styled(Body2)`
    color: ${p => p.theme.textSecondary};
    font-weight: 400;
    flex-shrink: 0;
`;

const WalletRowRight = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
`;

const WalletName = styled(Body2)`
    color: ${p => p.theme.textPrimary};
    font-weight: 510;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const EmojiWrap = styled.div`
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    position: relative;

    > * {
        position: absolute;
        top: 0;
        left: 0;
    }
`;

const FooterSlot = styled.div`
    padding-top: 0;
    width: 100%;
    box-sizing: border-box;
    background: ${p => p.theme.backgroundPage};

    ${p =>
        p.theme.displayType === 'full-width' &&
        css`
            padding: 16px;
        `}
`;

const ErrorStyled = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 1rem 16px 0;
`;

const Header = styled(H2)`
    text-align: center;
`;

const ExclamationMarkCircleIconStyled = styled(ExclamationMarkCircleIcon)`
    min-width: 32px;
    min-height: 32px;
`;

const SenderChoiceBlock = styled.div`
    padding: 0 16px 12px;
`;

const Body3Secondary = styled(Body3)`
    color: ${p => p.theme.textSecondary};
`;

const Text = styled.div<{ right?: boolean; noWrap?: boolean }>`
    display: flex;
    flex-direction: column;
    ${props =>
        props.right
            ? css`
                  text-align: right;
              `
            : undefined}

    ${props =>
        props.noWrap
            ? css`
                  flex-grow: 1;
                  overflow: hidden;
              `
            : undefined}
`;

const CellValue: FC<PropsWithChildren<{ secondary?: ReactNode }>> = ({ children, secondary }) => {
    return (
        <Text right>
            <Label2>{children}</Label2>
            {secondary && <Body3Secondary>{secondary}</Body3Secondary>}
        </Text>
    );
};

const StakingFeeValue: FC<{ fee: TransactionFee }> = ({ fee }) => {
    const { t } = useTranslation();
    const { fiat } = useAppContext();

    if (fee.type === 'battery') {
        return <CellValue>{t('battery_n_battery_charges', { charges: fee.charges })}</CellValue>;
    }

    if (fee.type === 'free-transfer') {
        return (
            <CellValue secondary={t('confirm_view_fee_row_free_pro_subtitle')}>
                {t('free')}
            </CellValue>
        );
    }

    if (fee.type === 'ton-asset' || fee.type === 'tron-asset' || fee.type === 'ton-asset-relayed') {
        return <StakingFeeTokenValue fee={fee} fiat={fiat} />;
    }

    assertUnreachableSoft(fee);
    return null;
};

const StakingFeeTokenValue: FC<{
    fee: Extract<TransactionFee, { type: 'ton-asset' | 'tron-asset' | 'ton-asset-relayed' }>;
    fiat: ReturnType<typeof useAppContext>['fiat'];
}> = ({ fee, fiat }) => {
    const { data: fiatAmountBN, isLoading } = useAssetAmountFiatEquivalent(fee.extra);
    const fiatAmount = formatFiatCurrency(fiat, fiatAmountBN?.abs() || '0');

    if (isLoading) {
        return <CellValue>…</CellValue>;
    }

    return (
        <CellValue secondary={fiatAmountBN ? `≈ ${fiatAmount}` : undefined}>
            {isTransactionFeeRefund(fee)
                ? fee.extra.stringAssetAbsoluteRelativeAmount
                : `≈ ${fee.extra.stringAssetAbsoluteRelativeAmount}`}
        </CellValue>
    );
};

const useActiveWalletLabel = () => {
    const account = useActiveAccount();
    let name = account.name;
    let emoji = account.emoji;
    if (account.type === 'mam') {
        const wallet = account.activeTonWallet;
        const derivation = account.getTonWalletsDerivation(wallet.id);
        if (derivation) {
            name = derivation.name;
            emoji = derivation.emoji;
        }
    }
    return { name, emoji };
};

const StakingModalSkeleton: FC<{ showApyRow?: boolean }> = ({ showApyRow = true }) => {
    const { t } = useTranslation();

    return (
        <Root>
            <TextPart>
                <PoolIconWrap>
                    <SkeletonImage width="56px" />
                </PoolIconWrap>
                <HeroLabel aria-hidden>
                    <SkeletonText size="small" width="96px" />
                </HeroLabel>
                <HeroAmount aria-hidden>
                    <SkeletonText size="large" width="min(200px, 55vw)" />
                </HeroAmount>
                <HeroFiat aria-hidden>
                    <SkeletonText size="small" width="88px" />
                </HeroFiat>
            </TextPart>

            <ListCard>
                <Cell>
                    <LabelCell>
                        <SkeletonText size="small" width="72px" />
                    </LabelCell>
                    <CellValue>
                        <WalletRowRight>
                            <EmojiWrap>
                                <SkeletonImage width="16px" />
                            </EmojiWrap>
                            <SkeletonText width="100px" />
                        </WalletRowRight>
                    </CellValue>
                </Cell>
                <Cell>
                    <LabelCell>
                        <SkeletonText size="small" width="96px" />
                    </LabelCell>
                    <CellValue>
                        <SkeletonText width="110px" />
                    </CellValue>
                </Cell>
                <Cell>
                    <LabelCell>
                        <SkeletonText size="small" width="64px" />
                    </LabelCell>
                    <CellValue secondary={<SkeletonText size="small" width="72px" />}>
                        <SkeletonText width="80px" />
                    </CellValue>
                </Cell>
                {showApyRow && (
                    <Cell>
                        <LabelCell>
                            <SkeletonText size="small" width="64px" />
                        </LabelCell>
                        <CellValue secondary={<SkeletonText size="small" width="30px" />}>
                            <SkeletonText width="60px" />
                        </CellValue>
                    </Cell>
                )}
                <Cell>
                    <SkeletonText size="small" width="88px" />
                    <CellValue secondary={<SkeletonText size="small" width="30px" />}>
                        <SkeletonText width="60px" />
                    </CellValue>
                </Cell>
            </ListCard>

            <ButtonGap />
            <FooterSlot>
                <NotificationFooterPortal>
                    <NotificationFooter>
                        <Button size="large" type="button" fullWidth loading>
                            {t('confirm')}
                        </Button>
                    </NotificationFooter>
                </NotificationFooterPortal>
            </FooterSlot>
        </Root>
    );
};

export type StakingTransactionModalVariant = 'stake' | 'unstake';

const StakingModalContent: FC<{
    params: TonConnectTransactionPayload;
    pool: PoolInfo;
    amount: string;
    variant: StakingTransactionModalVariant;
    handleClose: (result?: { boc: string; senderChoice: SenderChoice }) => void;
    waitInvalidation?: boolean;
    multisigTTL?: MultisigOrderLifetimeMinutes;
}> = ({ params, pool, amount, variant, handleClose, waitInvalidation, multisigTTL }) => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const { name: walletName, emoji: walletEmoji } = useActiveWalletLabel();

    const { data: availableSendersChoices, isLoading: isChoicesLoading } =
        useTonConnectAvailableSendersChoices(params);
    const [selectedSenderType, onSenderTypeChange] = useState<TonSenderChoiceUserAvailable['type']>(
        EXTERNAL_SENDER_CHOICE.type
    );
    const availableSendersChoicesKey = useMemo(
        () => availableSendersChoices?.map(c => c.type).join('\0') ?? '',
        [availableSendersChoices]
    );
    useEffect(() => {
        const first = availableSendersChoices?.[0];
        if (first && first.type !== selectedSenderType) {
            onSenderTypeChange(first.type);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [availableSendersChoicesKey]);

    const senderChoice: SenderChoice = useMemo(() => {
        if (selectedSenderType === BATTERY_SENDER_CHOICE.type) {
            return BATTERY_SENDER_CHOICE;
        }

        if (selectedSenderType === EXTERNAL_SENDER_CHOICE.type) {
            return EXTERNAL_SENDER_CHOICE;
        }

        if (selectedSenderType === 'gasless') {
            return (
                availableSendersChoices?.find(s => s.type === 'gasless') || EXTERNAL_SENDER_CHOICE
            );
        }

        throw new Error('Unexpected sender choice');
    }, [selectedSenderType, availableSendersChoices]);

    const {
        data: estimate,
        isLoading: isEstimating,
        isError,
        error
    } = useTonConnectTransactionEstimation(params, senderChoice, {
        multisigTTL,
        paramsLoading: isChoicesLoading
    });
    const {
        mutateAsync,
        isLoading,
        error: sendError,
        data: sendResult
    } = useTonConnectTransactionSendMutation(params, estimate, {
        multisigTTL,
        waitInvalidation,
        senderChoice
    });

    useEffect(() => {
        if (sdk.twaExpand) {
            sdk.twaExpand();
            sdk.hapticNotification('success');
        }
    }, []);

    const amountBN = useMemo(() => {
        const bn = new BigNumber(amount);
        return bn.isNaN() ? new BigNumber(0) : bn;
    }, [amount]);

    const stakeAssetAmount = useMemo(
        () => AssetAmount.fromRelativeAmount({ asset: TON_ASSET, amount: amountBN }),
        [amountBN]
    );

    const { data: stakeFiatBN } = useAssetAmountFiatEquivalent(stakeAssetAmount);
    const { fiat } = useAppContext();
    const stakeFiatFormatted = stakeFiatBN ? formatFiatCurrency(fiat, stakeFiatBN) : undefined;

    const onSubmit = async () => {
        try {
            const result = await mutateAsync();
            sdk.hapticNotification('success');
            setTimeout(() => handleClose({ boc: result, senderChoice }), 300);
        } catch (e) {
            sdk.hapticNotification('error');
            setTimeout(() => handleClose(), 3000);
            console.error(e);
        }
    };

    const showApyRow = variant === 'stake';

    if (isEstimating) {
        return <StakingModalSkeleton showApyRow={showApyRow} />;
    }

    const done = sendResult !== undefined;
    const isNotEnoughBalance = error && error instanceof NotEnoughBalanceError;

    const showSenderPicker =
        !!availableSendersChoices && availableSendersChoices.length > 1 && !isNotEnoughBalance;

    return (
        <Root>
            {isNotEnoughBalance ? (
                <>
                    <ErrorStyled>
                        <ErrorIcon />
                        <Header>{t('send_screen_steps_amount_insufficient_balance')}</Header>
                    </ErrorStyled>
                    <SenderChoiceBlock>
                        <SelectSenderDropdown
                            blockchain={BLOCKCHAIN_NAME.TON}
                            availableSendersOptions={availableSendersChoices}
                            onSenderTypeChange={onSenderTypeChange}
                            selectedSenderType={selectedSenderType}
                        />
                    </SenderChoiceBlock>
                </>
            ) : (
                <>
                    <TextPart>
                        <PoolIconWrap>
                            <StakingPoolIcon pool={pool} size={56} />
                        </PoolIconWrap>
                        <HeroLabel>
                            {t(
                                variant === 'stake'
                                    ? 'staking_action_stake'
                                    : 'staking_action_unstake'
                            )}
                        </HeroLabel>
                        <HeroAmount>{stakeAssetAmount.stringAssetRelativeAmount}</HeroAmount>
                        {stakeFiatFormatted && <HeroFiat>{stakeFiatFormatted}</HeroFiat>}
                    </TextPart>

                    <ListCard>
                        <Cell>
                            <LabelCell>{t('staking_confirm_modal_wallet')}</LabelCell>
                            <WalletRowRight>
                                <EmojiWrap>
                                    <WalletEmoji
                                        emojiSize="16px"
                                        containerSize="16px"
                                        emoji={walletEmoji}
                                    />
                                </EmojiWrap>
                                <WalletName>{walletName}</WalletName>
                            </WalletRowRight>
                        </Cell>
                        <Cell>
                            <LabelCell>{t('staking_confirm_modal_provider')}</LabelCell>
                            <CellValue>{pool.name}</CellValue>
                        </Cell>
                        <Cell>
                            <LabelCell>{t('staking_confirm_modal_amount')}</LabelCell>
                            <CellValue secondary={stakeFiatFormatted}>
                                {stakeAssetAmount.stringAssetRelativeAmount}
                            </CellValue>
                        </Cell>
                        {showApyRow && (
                            <Cell>
                                <LabelCell>{t('staking_confirm_modal_apy')}</LabelCell>
                                <CellValue>≈ {pool.apy.toFixed(2)}%</CellValue>
                            </Cell>
                        )}
                        <Cell>
                            <LabelCell>{t('transaction_fee')}</LabelCell>
                            {estimate?.fee ? (
                                <StakingFeeValue fee={estimate.fee} />
                            ) : isError ? (
                                <CellValue>—</CellValue>
                            ) : (
                                <CellValue>…</CellValue>
                            )}
                        </Cell>
                    </ListCard>

                    {showSenderPicker && (
                        <SenderChoiceBlock>
                            <SelectSenderDropdown
                                blockchain={BLOCKCHAIN_NAME.TON}
                                availableSendersOptions={availableSendersChoices}
                                onSenderTypeChange={onSenderTypeChange}
                                selectedSenderType={selectedSenderType}
                            />
                        </SenderChoiceBlock>
                    )}
                </>
            )}

            <ButtonGap />
            <FooterSlot>
                <NotificationFooterPortal>
                    <NotificationFooter>
                        {sendError ? (
                            <ResultButton>
                                <ExclamationMarkCircleIconStyled />
                                <Label2>{getErrorText(sendError, { t })}</Label2>
                            </ResultButton>
                        ) : done ? (
                            <ResultButton done>
                                <CheckmarkCircleIcon />
                                <Label2>{t('ton_login_success')}</Label2>
                            </ResultButton>
                        ) : (
                            <Button
                                size="large"
                                type="button"
                                primary
                                fullWidth
                                loading={isLoading}
                                disabled={isLoading || isError}
                                onClick={onSubmit}
                            >
                                {t('confirm')}
                            </Button>
                        )}
                    </NotificationFooter>
                </NotificationFooterPortal>
            </FooterSlot>
        </Root>
    );
};

const NotificationStyled = styled(Notification)`
    ${p =>
        p.theme.displayType === 'full-width' &&
        css`
            max-width: 400px;
        `}
`;

export const StakingTransactionModal: FC<{
    params: TonConnectTransactionPayload | null;
    pool: PoolInfo | undefined;
    amount: string;
    variant?: StakingTransactionModalVariant;
    handleClose: (result?: { boc: string; senderChoice?: SenderChoice }) => void;
    waitInvalidation?: boolean;
}> = ({ params, pool, amount, variant = 'stake', handleClose, waitInvalidation }) => {
    const { t } = useTranslation();
    const isActiveAccountMultisig = useIsActiveAccountMultisig();
    const [multisigTTL, setMultisigTTL] = useState<MultisigOrderLifetimeMinutes | undefined>();

    const onClose = useCallback(
        (result?: { boc: string; senderChoice: SenderChoice }) => {
            setTimeout(() => setMultisigTTL(undefined), 400);
            handleClose(result);
        },
        [handleClose]
    );

    const Content = useCallback(() => {
        if (!params || !pool) return undefined;

        if (isActiveAccountMultisig && !multisigTTL) {
            return (
                <MultisigOrderFormView
                    onSubmit={form => setMultisigTTL(form.lifetime)}
                    MainButton={MainButton}
                    header={
                        <TransferViewHeaderBlock
                            title={t('multisig_create_order_title')}
                            onClose={onClose}
                        />
                    }
                    isAnimationProcess={false}
                />
            );
        }

        return (
            <StakingModalContent
                params={params}
                pool={pool}
                amount={amount}
                variant={variant}
                handleClose={onClose}
                waitInvalidation={waitInvalidation}
                multisigTTL={multisigTTL}
            />
        );
    }, [
        params,
        pool,
        amount,
        variant,
        onClose,
        waitInvalidation,
        isActiveAccountMultisig,
        multisigTTL,
        t
    ]);

    return (
        <NotificationStyled
            isOpen={params != null && pool != null}
            handleClose={onClose}
            onTopOfBrowser
            disableHeightAnimation
        >
            {Content}
        </NotificationStyled>
    );
};
