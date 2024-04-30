import { Notification } from '../../Notification';
import React, { FC, useEffect, useMemo } from 'react';
import { Image, ImageMock } from '../../transfer/Confirm';
import { MultiSendForm } from '../../../state/multiSend';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import styled from 'styled-components';
import { useAssetImage } from '../../../state/asset';
import { Body2, Body3, Label2, Num2 } from '../../Text';
import { useRate } from '../../../state/rates';
import { useAppContext } from '../../../hooks/appContext';
import { formatFiatCurrency } from '../../../hooks/balance';
import { ListBlock, ListItem } from '../../List';
import { useWalletState } from '../../../state/wallet';
import { WalletEmoji } from '../../shared/emoji/WalletEmoji';
import { useTranslation } from '../../../hooks/translation';
import { useEstimateMultiTransfer } from '../../../hooks/blockchain/useEstimateMultiTransferFee';
import { Skeleton } from '../../shared/Skeleton';
import BigNumber from 'bignumber.js';
import { getWillBeMultiSendValue } from './utils';
import { unShiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import { ResultButton } from '../../transfer/common';
import { CheckmarkCircleIcon, ExclamationMarkCircleIcon } from '../../Icon';
import { Button } from '../../fields/Button';
import {
    MultiSendFormTokenized,
    useSendMultiTransfer
} from '../../../hooks/blockchain/useSendMultiTransfer';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '../../../libs/routes';
import { useDisclosure } from '../../../hooks/useDisclosure';
import { MultiSendReceiversNotification } from './MultiSendReceiversNotification';

const ConfirmWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const TransferLabel = styled(Body2)`
    color: ${p => p.theme.textSecondary};
    margin-top: 12px;
`;

const FiatValue = styled(Body2)`
    color: ${p => p.theme.textSecondary};
    margin-bottom: 24px;
`;

export const MultiSendConfirmNotification: FC<{
    isOpen: boolean;
    onClose: () => void;
    form: MultiSendForm | undefined;
    asset: TonAsset;
    listName: string;
}> = ({ isOpen, onClose, form, asset, listName }) => {
    return (
        <Notification isOpen={isOpen} handleClose={onClose}>
            {() => (
                <MultiSendConfirmContent
                    form={form!}
                    asset={asset}
                    listName={listName}
                    onClose={onClose}
                />
            )}
        </Notification>
    );
};

const ListBlockStyled = styled(ListBlock)`
    width: 100%;
    margin-bottom: 1rem;
`;

const ListItemStyled = styled(ListItem)`
    box-sizing: border-box;
    padding: 8px 12px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    width: 100%;

    &:not(:first-child) {
        border-top: 1px solid ${props => props.theme.separatorCommon};
    }

    & + & > div {
        border-top: none;
        padding-top: 0;
    }

    & > ${Body2} {
        color: ${p => p.theme.textSecondary};
    }
`;

const WalletNameStyled = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
`;

const RecipientsContainer = styled.div`
    display: flex;
    flex-direction: column;
    text-align: right;
`;

const ShowAllButton = styled(Body3)`
    color: ${p => p.theme.textAccent};
    cursor: pointer;
`;

const FeeContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    text-align: right;

    > ${Body3} {
        color: ${p => p.theme.textSecondary};
    }
`;

const MultiSendConfirmContent: FC<{
    form: MultiSendForm;
    asset: TonAsset;
    listName: string;
    onClose: () => void;
}> = ({ form, asset, listName, onClose }) => {
    const { t } = useTranslation();
    const {
        isOpen: allRowsIsOpen,
        onClose: allRowsOnClose,
        onOpen: allRowsOnOpen
    } = useDisclosure();
    const image = useAssetImage(asset);
    const { data: rate } = useRate(
        typeof asset.address === 'string' ? asset.address : asset.address.toRawString()
    );
    const { data: tonRate } = useRate('TON');

    const { willBeSent, willBeSentBN, bnAmounts } = useMemo(
        () => getWillBeMultiSendValue(form.rows, asset, rate ? { prices: rate.prices } : undefined),
        [form.rows, asset, rate?.prices]
    );

    const formTokenized = useMemo(() => {
        const rows = form.rows.map((row, index) => ({
            ...row,
            weiAmount: unShiftedDecimals(bnAmounts[index], asset.decimals).decimalPlaces(
                0,
                BigNumber.ROUND_FLOOR
            )
        }));

        return { rows };
    }, [form.rows, bnAmounts, asset.decimals]);

    const { fiat } = useAppContext();
    const willBeSentInFiat = formatFiatCurrency(
        fiat,
        willBeSentBN?.multipliedBy(rate?.prices || 0)
    );

    const { account } = useAppContext();
    const { data: wallet } = useWalletState(account.activePublicKey!);

    const {
        mutateAsync: estimate,
        isLoading: estimateLoading,
        data: estimateData,
        error: estimateError
    } = useEstimateMultiTransfer();

    useEffect(() => {
        estimate({ form: formTokenized, asset }).catch(() => setTimeout(onClose, 5000));
    }, [asset, formTokenized]);

    const tonFee = estimateData?.fee.stringAssetRelativeAmount;
    const fiatFee = formatFiatCurrency(
        fiat,
        estimateData?.fee.relativeAmount.multipliedBy(tonRate?.prices || 0) || new BigNumber(0)
    );

    const navigate = useNavigate();

    return (
        <>
            <ConfirmWrapper>
                {image ? <Image full src={image} /> : <ImageMock full />}
                <TransferLabel>{t('confirm_modal_transfer')}</TransferLabel>
                <Num2>{willBeSent}</Num2>
                <FiatValue>{willBeSentInFiat}</FiatValue>
                <ListBlockStyled noUserSelect>
                    <ListItemStyled hover={false}>
                        <Body2>{t('send_screen_steps_comfirm_wallet')}</Body2>
                        {wallet && (
                            <WalletNameStyled>
                                <WalletEmoji
                                    emojiSize="16px"
                                    containerSize="16px"
                                    emoji={wallet.emoji}
                                />
                                <Label2>{wallet.name || t('wallet_title')}</Label2>
                            </WalletNameStyled>
                        )}
                    </ListItemStyled>
                    <ListItemStyled hover={false}>
                        <Body2>{t('recipients')}</Body2>
                        <RecipientsContainer>
                            <Label2>
                                {form.rows.length}&nbsp;{t('multi_send_wallets')}
                            </Label2>
                            <ShowAllButton onClick={allRowsOnOpen}>
                                {t('multi_send_show_all')}
                            </ShowAllButton>
                        </RecipientsContainer>
                    </ListItemStyled>
                    <ListItemStyled hover={false}>
                        <Body2>{t('multi_send_list')}</Body2>
                        <Label2>{listName}</Label2>
                    </ListItemStyled>
                    <ListItemStyled hover={false}>
                        <Body2>{t('confirm_sending_fee')}</Body2>
                        <FeeContainer>
                            {estimateError ? null : estimateLoading || !tonRate ? (
                                <>
                                    <Skeleton margin="3px 0" width="100px" height="14px" />
                                    <Skeleton margin="2px 0" width="80px" height="12px" />
                                </>
                            ) : (
                                <>
                                    <Label2>≈ {tonFee}</Label2>
                                    <Body3>{fiatFee}</Body3>
                                </>
                            )}
                        </FeeContainer>
                    </ListItemStyled>
                </ListBlockStyled>
                <ButtonBlock
                    form={formTokenized}
                    asset={asset}
                    feeEstimation={estimateData?.fee.weiAmount}
                    onSuccess={() => {
                        setTimeout(() => {
                            onClose();
                            navigate(AppRoute.activity);
                        }, 2000);
                    }}
                    isLoading={estimateLoading || !rate}
                    estimationError={!!estimateError}
                />
            </ConfirmWrapper>
            <MultiSendReceiversNotification
                onClose={allRowsOnClose}
                isOpen={allRowsIsOpen}
                form={formTokenized}
                asset={asset}
            />
        </>
    );
};

const ButtonBlock: FC<{
    onSuccess: () => void;
    isLoading: boolean;
    form: MultiSendFormTokenized;
    asset: TonAsset;
    feeEstimation: BigNumber | undefined;
    estimationError: boolean;
}> = ({ onSuccess, form, asset, feeEstimation, isLoading, estimationError }) => {
    const { t } = useTranslation();
    const {
        mutateAsync: send,
        error,
        isLoading: isSending,
        data: doneSend
    } = useSendMultiTransfer();

    const onClick = async () => {
        const confirmed = await send({ form, asset, feeEstimation: feeEstimation! });
        if (confirmed) {
            onSuccess();
        }
    };

    if (estimationError) {
        return (
            <ResultButton>
                <ExclamationMarkCircleIcon />
                <Label2>{t('send_fee_estimation_error')}</Label2>
            </ResultButton>
        );
    }

    if (doneSend) {
        return (
            <ResultButton done>
                <CheckmarkCircleIcon />
                <Label2>{t('send_screen_steps_done_done_label')}</Label2>
            </ResultButton>
        );
    }

    if (error) {
        return (
            <ResultButton>
                <ExclamationMarkCircleIcon />
                <Label2>{t('send_publish_tx_error')}</Label2>
            </ResultButton>
        );
    }

    return (
        <Button
            fullWidth
            primary
            onClick={onClick}
            loading={isSending || isLoading}
            disabled={isSending || isLoading}
        >
            {t('confirm_sending_submit')}
        </Button>
    );
};
