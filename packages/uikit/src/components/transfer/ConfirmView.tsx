import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Asset, isTonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/asset';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET, TRON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { RecipientData, isTonRecipientData, Estimation } from '@tonkeeper/core/dist/entries/send';
import React, {
    Children,
    FC,
    PropsWithChildren,
    createContext,
    isValidElement,
    useContext,
    useState,
    useEffect
} from 'react';
import styled from 'styled-components';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { formatFiatCurrency } from '../../hooks/balance';
import { useTranslation } from '../../hooks/translation';
import { useAssetAmountFiatEquivalent, useAssetImage } from '../../state/asset';
import { CheckmarkCircleIcon, ExclamationMarkCircleIcon } from '../Icon';
import { Gap } from '../Layout';
import { ListBlock } from '../List';
import {
    FullHeightBlockResponsive,
    NotificationBackButton,
    NotificationCancelButton,
    NotificationFooter,
    NotificationFooterPortal,
    NotificationTitleBlock
} from '../Notification';
import { Label2 } from '../Text';
import { TransferComment } from '../activity/ActivityDetailsLayout';
import {
    ActionFeeDetailsUniversal,
    FeeDetailsPropsTon,
    FeeDetailsPropsUniversal
} from '../activity/NotificationCommon';
import {
    ConfirmViewImage,
    ImageMock,
    Info,
    SendingTitle,
    Title,
    UnverifiedTokenLabel
} from './Confirm';
import { AmountListItem, RecipientListItem } from './ConfirmListItem';
import { ButtonBlock, ConfirmMainButton, ConfirmMainButtonProps, ResultButton } from './common';
import { UserCancelledError } from '../../libs/errors/UserCancelledError';
import { TxConfirmationCustomError } from '../../libs/errors/TxConfirmationCustomError';

import { NotEnoughBalanceError } from '@tonkeeper/core/dist/errors/NotEnoughBalanceError';
import { NotEnoughBatteryBalanceError } from '@tonkeeper/core/dist/errors/NotEnoughBatteryBalanceError';
import { JettonVerificationType } from '@tonkeeper/core/dist/tonApiV2';
import {
    AllChainsSenderOptions,
    AllChainsSenderType
} from '../../hooks/blockchain/sender/sender-type';
import { KeychainGetError } from '@tonkeeper/core/dist/errors/KeychainError';

type MutationProps = Pick<
    ReturnType<typeof useMutation<boolean, Error>>,
    'mutateAsync' | 'isLoading' | 'error' | 'reset'
>;

type ConfirmViewContextValue = {
    recipient?: RecipientData;
    assetAmount: AssetAmount;
    estimation: {
        data: Pick<Estimation, 'fee'> | undefined;
        error?: unknown;
        isLoading: boolean;
    };
    formState: {
        done: boolean;
        isLoading: boolean;
        error: Error | null | undefined;
    };
    handleSubmit: () => Promise<boolean>;
    onClose: () => void;
    onBack?: () => void;
};
export const ConfirmViewContext = createContext<ConfirmViewContextValue>(
    {} as ConfirmViewContextValue
);

export function useConfirmViewContext() {
    return useContext(ConfirmViewContext);
}

type ConfirmViewProps<T extends Asset> = PropsWithChildren<
    {
        className?: string;
        recipient?: RecipientData;
        assetAmount: AssetAmount<T>;
        onBack?: () => void;
        onClose: (confirmed?: boolean) => void;
        fitContent?: boolean;
        onSenderTypeChange?: (type: AllChainsSenderType) => void;
        availableSendersOptions?: AllChainsSenderOptions[];
        selectedSenderType?: AllChainsSenderType;
        estimation: {
            data: Pick<Estimation<T>, 'fee'> | undefined;
            isLoading: boolean;
            error?: Error | null;
        };
    } & MutationProps
>;

export function ConfirmView<T extends Asset = Asset>({
    children,
    estimation,
    recipient,
    onBack,
    onClose,
    assetAmount,
    fitContent,
    className,
    onSenderTypeChange,
    selectedSenderType,
    availableSendersOptions,
    ...mutation
}: ConfirmViewProps<T>) {
    const { mutateAsync, isLoading, reset } = mutation;
    const client = useQueryClient();

    const error = mutation.error || estimation.error;

    let titleBlock = (
        <ConfirmViewTitleSlot>
            <ConfirmViewTitle />
        </ConfirmViewTitleSlot>
    );
    let heading = (
        <ConfirmViewHeadingSlot>
            <ConfirmViewHeading />
        </ConfirmViewHeadingSlot>
    );
    let details = (
        <ConfirmViewDetailsSlot>
            <ConfirmViewDetailsRecipient />
            <ConfirmViewDetailsAmount />
            <ConfirmViewDetailsFee
                onSenderTypeChange={onSenderTypeChange}
                selectedSenderType={selectedSenderType}
                availableSendersOptions={availableSendersOptions}
            />
            <ConfirmViewDetailsComment />
        </ConfirmViewDetailsSlot>
    );
    let additionalDetails = <ConfirmViewAdditionalBottomSlot />;
    let buttons = (
        <ConfirmViewButtonsSlot>
            <NotificationFooterPortal>
                <NotificationFooter>
                    <ConfirmViewButtons MainButton={ConfirmMainButton} />
                </NotificationFooter>
            </NotificationFooterPortal>
        </ConfirmViewButtonsSlot>
    );

    Children.map(children, child => {
        if (isValidElement(child)) {
            switch (child.type) {
                case ConfirmViewTitleSlot:
                    titleBlock = child;
                    return;
                case ConfirmViewHeadingSlot:
                    heading = child;
                    return;
                case ConfirmViewDetailsSlot:
                    details = child;
                    return;
                case ConfirmViewAdditionalBottomSlot:
                    additionalDetails = child;
                    return;
                case ConfirmViewButtonsSlot:
                    buttons = child;
                    return;
            }
        }
    });
    const [done, setDone] = useState(false);

    const { standalone } = useAppContext();
    const sdk = useAppSdk();

    useEffect(() => {
        if (estimation.error) {
            sdk.hapticNotification('error');
        }
    }, [estimation.error]);

    const handleSubmit = async () => {
        if (isLoading) return false;
        reset();
        try {
            const isDone = await mutateAsync();
            if (isDone) {
                sdk.hapticNotification('success');
                setDone(true);
                setTimeout(() => {
                    setTimeout(() => client.invalidateQueries(), 100);
                    onClose(true);
                }, 2000);
            }
            return isDone;
        } catch (e) {
            sdk.hapticNotification('error');
            console.error(e);
            return false;
        }
    };

    const onSubmit: React.FormEventHandler<HTMLFormElement> = async e => {
        e.stopPropagation();
        e.preventDefault();
    };

    return (
        <ConfirmViewContext.Provider
            value={{
                recipient,
                assetAmount,
                estimation,
                formState: { done, isLoading, error },
                onClose: () => onClose(),
                onBack,
                handleSubmit
            }}
        >
            <FullHeightBlockResponsive
                onSubmit={onSubmit}
                standalone={standalone}
                fitContent={fitContent}
                className={className}
            >
                {titleBlock}
                {heading}
                <ListBlock margin={false} fullWidth>
                    {details}
                </ListBlock>
                {additionalDetails}
                <Gap />

                <ButtonBlock>{buttons}</ButtonBlock>
            </FullHeightBlockResponsive>
        </ConfirmViewContext.Provider>
    );
}

const ConfirmViewHeadingStyled = styled.div`
    margin-bottom: 1rem;
`;

export const ConfirmViewTitleSlot: FC<PropsWithChildren> = ({ children }) => <>{children}</>;
export const ConfirmViewTitle: FC<PropsWithChildren> = () => {
    const { onClose, onBack } = useConfirmViewContext();
    return (
        <NotificationTitleBlock>
            {onBack ? <NotificationBackButton onBack={onBack} /> : <div />}
            <NotificationCancelButton handleClose={() => onClose()} />
        </NotificationTitleBlock>
    );
};

export const ConfirmViewHeadingSlot: FC<PropsWithChildren<{ className?: string }>> = ({
    children,
    className
}) => <ConfirmViewHeadingStyled className={className}>{children}</ConfirmViewHeadingStyled>;

export const ConfirmViewHeading: FC<PropsWithChildren<{ className?: string; title?: string }>> = ({
    className,
    title
}) => {
    const { t } = useTranslation();
    const { recipient, assetAmount } = useConfirmViewContext();
    const image = useAssetImage(assetAmount.asset);

    const fallbackTitles = {
        [TON_ASSET.id]: t('txActions_signRaw_types_tonTransfer'),
        [TRON_USDT_ASSET.id]: t('txActions_USDT_transfer')
    };

    if (!title) {
        if (recipient && isTonRecipientData(recipient) && recipient.toAccount.name) {
            title = recipient.toAccount.name;
        } else {
            title =
                fallbackTitles[assetAmount.asset.id] || t('txActions_signRaw_types_jettonTransfer');
        }
    }

    const icon =
        recipient && isTonRecipientData(recipient) ? recipient.toAccount.icon || image : image;
    return (
        <Info className={className}>
            {icon ? (
                <ConfirmViewImage noRadius={assetAmount.asset.noImageCorners} full src={image} />
            ) : (
                <ImageMock full />
            )}
            {isTonAsset(assetAmount.asset) &&
                assetAmount.asset.verification !== JettonVerificationType.Whitelist && (
                    <UnverifiedTokenLabel>{t('approval_unverified_token')}</UnverifiedTokenLabel>
                )}
            <SendingTitle>{t('confirm_sending_title')}</SendingTitle>
            <Title>{title}</Title>
        </Info>
    );
};

export const ConfirmViewAdditionalBottomSlot: FC<PropsWithChildren> = ({ children }) => (
    <>{children}</>
);
export const ConfirmViewDetailsSlot: FC<PropsWithChildren> = ({ children }) => <>{children}</>;

export const ConfirmViewDetailsRecipient: FC = () => {
    const { recipient } = useConfirmViewContext();
    if (!recipient) {
        return null;
    }
    return <RecipientListItem recipient={recipient} />;
};

export const ConfirmViewDetailsAmount: FC = () => {
    const { fiat } = useAppContext();
    const { assetAmount } = useConfirmViewContext();
    const { data: fiatAmountBN } = useAssetAmountFiatEquivalent(assetAmount);

    const fiatAmount = fiatAmountBN ? formatFiatCurrency(fiat, fiatAmountBN) : undefined;

    return (
        <AmountListItem
            coinAmount={assetAmount.stringAssetRelativeAmount}
            fiatAmount={fiatAmount}
        />
    );
};

export const ConfirmViewDetailsFee: FC<FeeDetailsPropsUniversal | FeeDetailsPropsTon> = props => {
    const { estimation } = useConfirmViewContext();

    return (
        <ActionFeeDetailsUniversal
            fee={estimation.isLoading ? undefined : estimation.error ? null : estimation.data?.fee}
            {...props}
        />
    );
};
export const ConfirmViewDetailsComment: FC = () => {
    const { recipient } = useConfirmViewContext();
    if (!recipient || !isTonRecipientData(recipient)) {
        return null;
    }
    return <TransferComment comment={recipient.comment} />;
};

const ExclamationMarkCircleIconStyled = styled(ExclamationMarkCircleIcon)`
    min-width: 32px;
    min-height: 32px;
`;

const ErrorLabelStyled = styled(Label2)`
    text-align: center;
`;

const ResultErrorButtonStyled = styled(ResultButton)`
    height: unset;
    min-height: 56px;
`;

export const ConfirmViewButtonsSlot: FC<PropsWithChildren> = ({ children }) => <>{children}</>;

export const ConfirmViewButtons: FC<{
    MainButton: ConfirmMainButtonProps;
}> = ({ MainButton }) => {
    const {
        formState: { done, error, isLoading },
        estimation: { isLoading: estimationLoading, data: estimation },
        onClose,
        handleSubmit
    } = useConfirmViewContext();
    const { t } = useTranslation();

    const isValid = !isLoading && !estimationLoading;

    if (done) {
        return (
            <ResultButton done>
                <CheckmarkCircleIcon />
                <Label2>{t('send_screen_steps_done_done_label')}</Label2>
            </ResultButton>
        );
    }

    if (error && !(error instanceof UserCancelledError)) {
        let errorText;

        switch (true) {
            case error instanceof KeychainGetError:
                errorText = t('keychain_read_error');
                break;
            case error instanceof TxConfirmationCustomError:
                errorText = error.message;
                break;
            case error instanceof NotEnoughBalanceError:
                errorText = t('confirm_error_insufficient_balance_light');
                break;
            case error instanceof NotEnoughBatteryBalanceError:
                errorText = t('confirm_error_insufficient_battery_balance');
                break;
            case error instanceof Error && error.message !== 'Response returned an error code':
                errorText = error.message;
                break;
            default:
                if (!estimation) {
                    errorText = t('send_fee_estimation_error');
                } else {
                    errorText = t('send_publish_tx_error');
                }
        }

        return (
            <ResultErrorButtonStyled>
                <ExclamationMarkCircleIconStyled />
                <ErrorLabelStyled>{errorText}</ErrorLabelStyled>
            </ResultErrorButtonStyled>
        );
    }

    return (
        <MainButton
            isDisabled={!isValid}
            isLoading={isLoading}
            onClick={handleSubmit}
            onClose={onClose}
        />
    );
};
