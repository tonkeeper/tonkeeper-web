import { Notification } from '../../Notification';
import React, { FC, useEffect, useMemo, useState } from 'react';
import { Image, ImageMock } from '../../transfer/Confirm';
import { MultiSendForm } from '../../../state/multiSend';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import styled from 'styled-components';
import { useAssetImage } from '../../../state/asset';
import { Body1, Body2, Body2Class, Body3, Body3Class, Label2, Num2 } from '../../Text';
import { useRate } from '../../../state/rates';
import { useAppContext } from '../../../hooks/appContext';
import { formatFiatCurrency } from '../../../hooks/balance';
import { ListBlock, ListItem } from '../../List';
import { useTranslation } from '../../../hooks/translation';
import { useEstimateMultiTransfer } from '../../../hooks/blockchain/useEstimateMultiTransferFee';
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
import { NotEnoughBalanceError } from '@tonkeeper/core/dist/errors/NotEnoughBalanceError';
import { AccountAndWalletInfo } from '../../account/AccountAndWalletInfo';
import { ActionFeeDetailsUniversal } from '../../activity/NotificationCommon';
import {
    SenderChoiceUserAvailable,
    SenderTypeUserAvailable,
    useAvailableSendersChoices
} from '../../../hooks/blockchain/useSender';
import { TonEstimation } from '@tonkeeper/core/dist/entries/send';

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

const ActionFeeDetailsUniversalStyled = styled(ActionFeeDetailsUniversal)`
    padding: 0;

    > * {
        padding: 7px 12px 8px !important;
    }

    ${Body1} {
        ${Body2Class}
    }

    ${Body2} {
        ${Body3Class}
    }
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

const RecipientsContainer = styled.div`
    display: flex;
    flex-direction: column;
    text-align: right;
`;

const ShowAllButton = styled(Body3)`
    color: ${p => p.theme.textAccent};
    cursor: pointer;
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
    const { data: rate, isFetched: isRateFetched } = useRate(
        typeof asset.address === 'string' ? asset.address : asset.address.toRawString()
    );
    const { willBeSent, willBeSentBN, bnAmounts } = useMemo(
        () => getWillBeMultiSendValue(form.rows, asset, rate || { prices: 0 }),
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

    const operationType = useMemo(() => {
        return {
            type: 'multisend-transfer',
            asset
        } as const;
    }, [asset]);
    const { data: availableSendersChoices } = useAvailableSendersChoices(operationType);
    useEffect(() => {
        if (availableSendersChoices) {
            onSenderTypeChange(availableSendersChoices[0].type);
        }
    }, [availableSendersChoices]);

    const [selectedSenderType, onSenderTypeChange] = useState<SenderTypeUserAvailable>();

    const selectedSenderChoice = useMemo(() => {
        if (!availableSendersChoices) {
            return undefined;
        }

        return availableSendersChoices.find(c => c.type === selectedSenderType);
    }, [availableSendersChoices, selectedSenderType]);

    const {
        isLoading: estimateLoading,
        data: estimateData,
        error: estimateError
    } = useEstimateMultiTransfer(formTokenized, asset);

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
                        <AccountAndWalletInfo />
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
                    <ActionFeeDetailsUniversalStyled
                        fee={estimateData?.fee}
                        availableSendersChoices={availableSendersChoices}
                        selectedSenderType={selectedSenderType}
                        onSenderTypeChange={onSenderTypeChange}
                    />
                </ListBlockStyled>
                <ButtonBlock
                    form={formTokenized}
                    asset={asset}
                    estimation={estimateData}
                    onSuccess={() => {
                        setTimeout(() => {
                            onClose();
                            navigate(AppRoute.activity);
                        }, 2000);
                    }}
                    isLoading={estimateLoading || !isRateFetched}
                    estimationError={estimateError}
                    selectedSenderChoice={selectedSenderChoice!}
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

const ExclamationMarkCircleIconStyled = styled(ExclamationMarkCircleIcon)`
    flex-shrink: 0;
`;

const ResultButtonStyled = styled(ResultButton)`
    height: fit-content;

    ${Label2} {
        text-align: center;
    }
`;

const ButtonBlock: FC<{
    onSuccess: () => void;
    isLoading: boolean;
    form: MultiSendFormTokenized;
    asset: TonAsset;
    estimation: TonEstimation | undefined;
    estimationError: Error | null;
    selectedSenderChoice: SenderChoiceUserAvailable | undefined;
}> = ({ onSuccess, form, asset, estimation, isLoading, estimationError, selectedSenderChoice }) => {
    const { t } = useTranslation();
    const {
        mutateAsync: send,
        error,
        isLoading: isSending,
        data: doneSend
    } = useSendMultiTransfer();

    const onClick = async () => {
        const confirmed = await send({
            form,
            asset,
            estimation: estimation!,
            senderChoice: selectedSenderChoice!
        });
        if (confirmed) {
            onSuccess();
        }
    };

    if (estimationError instanceof NotEnoughBalanceError) {
        return (
            <ResultButtonStyled>
                <ExclamationMarkCircleIconStyled />
                <Label2>
                    {t('multisend_confirm_error_insufficient_ton_for_fee')
                        .replace('%balance%', estimationError.balance.stringAssetRelativeAmount)
                        .replace(
                            '%required%',
                            estimationError.requiredBalance.stringAssetRelativeAmount
                        )}
                </Label2>
            </ResultButtonStyled>
        );
    }

    if (estimationError) {
        return (
            <ResultButton>
                <ExclamationMarkCircleIconStyled />
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
                <ExclamationMarkCircleIconStyled />
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
