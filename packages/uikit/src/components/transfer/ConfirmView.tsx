import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Asset } from '@tonkeeper/core/dist/entries/crypto/asset/asset';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET, TRON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import {
    RecipientData,
    TransferEstimation,
    isTonRecipientData
} from '@tonkeeper/core/dist/entries/send';
import React, {
    Children,
    FC,
    PropsWithChildren,
    createContext,
    isValidElement,
    useContext,
    useEffect,
    useState
} from 'react';
import styled from 'styled-components';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { formatFiatCurrency } from '../../hooks/balance';
import { useTranslation } from '../../hooks/translation';
import { useAssetAmountFiatEquivalent, useAssetImage } from '../../state/asset';
import { CheckmarkCircleIcon, ChevronLeftIcon, ExclamationMarkCircleIcon } from '../Icon';
import { Gap } from '../Layout';
import { ListBlock } from '../List';
import {
    FullHeightBlockResponsive,
    NotificationCancelButton,
    NotificationTitleBlock
} from '../Notification';
import { Label2 } from '../Text';
import { TransferComment } from '../activity/ActivityDetailsLayout';
import { ActionFeeDetailsUniversal } from '../activity/NotificationCommon';
import { RoundedButton } from '../fields/RoundedButton';
import { Image, ImageMock, Info, SendingTitle, Title } from './Confirm';
import { AmountListItem, RecipientListItem } from './ConfirmListItem';
import { ButtonBlock, ConfirmMainButton, ConfirmMainButtonProps, ResultButton } from './common';
import { UserCancelledError } from '../../libs/errors/UserCancelledError';
import { TxConfirmationCustomError } from '../../libs/errors/TxConfirmationCustomError';

type MutationProps = Pick<
    ReturnType<typeof useMutation<boolean, Error>>,
    'mutateAsync' | 'isLoading' | 'error' | 'reset'
>;

type ConfirmViewContextValue = {
    recipient: RecipientData;
    assetAmount: AssetAmount;
    estimation: {
        data: TransferEstimation | undefined;
        isLoading: boolean;
        isFetching: boolean;
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
        recipient: RecipientData;
        assetAmount: AssetAmount<T>;
        onBack?: () => void;
        onClose: (confirmed?: boolean) => void;
        fitContent?: boolean;
        estimation: {
            data: TransferEstimation<T> | undefined;
            isLoading: boolean;
            isFetching: boolean;
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
            <ConfirmViewDetailsFee />
            <ConfirmViewDetailsComment />
        </ConfirmViewDetailsSlot>
    );
    let buttons = (
        <ConfirmViewButtonsSlot>
            <ConfirmViewButtons MainButton={ConfirmMainButton} />
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
                case ConfirmViewButtonsSlot:
                    buttons = child;
                    return;
            }
        }
    });
    const [done, setDone] = useState(false);

    const { standalone } = useAppContext();

    const handleSubmit = async () => {
        if (isLoading) return false;
        reset();
        try {
            const isDone = await mutateAsync();
            if (isDone) {
                setDone(true);
                setTimeout(() => {
                    setTimeout(() => client.invalidateQueries(), 100);
                    onClose(true);
                }, 2000);
            }
            return isDone;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    const onSubmit: React.FormEventHandler<HTMLFormElement> = async e => {
        e.stopPropagation();
        e.preventDefault();
        handleSubmit();
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
            >
                {titleBlock}
                {heading}
                <ListBlock margin={false} fullWidth>
                    {details}
                </ListBlock>
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
            {onBack ? (
                <RoundedButton onClick={onBack}>
                    <ChevronLeftIcon />
                </RoundedButton>
            ) : (
                <div />
            )}
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

    title ||= isTonRecipientData(recipient)
        ? recipient.toAccount.name
        : fallbackTitles[assetAmount.asset.id] || t('txActions_signRaw_types_jettonTransfer');

    const icon = isTonRecipientData(recipient) ? recipient.toAccount.icon || image : image;
    return (
        <Info className={className}>
            {icon ? <Image full src={image} /> : <ImageMock full />}
            <SendingTitle>{t('confirm_sending_title')}</SendingTitle>
            <Title>{title}</Title>
        </Info>
    );
};

export const ConfirmViewDetailsSlot: FC<PropsWithChildren> = ({ children }) => <>{children}</>;

export const ConfirmViewDetailsRecipient: FC = () => {
    const { recipient } = useConfirmViewContext();
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

export const ConfirmViewDetailsFee: FC = () => {
    const { estimation } = useConfirmViewContext();

    return (
        <ActionFeeDetailsUniversal fee={estimation.isFetching ? undefined : estimation.data?.fee} />
    );
};
export const ConfirmViewDetailsComment: FC = () => {
    const { recipient } = useConfirmViewContext();
    if (!isTonRecipientData(recipient)) {
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
    const sdk = useAppSdk();

    const {
        formState: { done, error, isLoading },
        estimation: { isFetching: estimationLoading },
        onClose,
        handleSubmit
    } = useConfirmViewContext();
    const { t } = useTranslation();

    const isValid = !isLoading && !estimationLoading;

    useEffect(() => {
        if (done) {
            sdk.hapticNotification('success');
        }
    }, [done]);

    useEffect(() => {
        if (error) {
            sdk.hapticNotification('error');
        }
    }, [error]);

    if (done) {
        return (
            <ResultButton done>
                <CheckmarkCircleIcon />
                <Label2>{t('send_screen_steps_done_done_label')}</Label2>
            </ResultButton>
        );
    }

    if (error && !(error instanceof UserCancelledError)) {
        return (
            <ResultErrorButtonStyled>
                <ExclamationMarkCircleIconStyled />
                <ErrorLabelStyled>
                    {error instanceof TxConfirmationCustomError
                        ? error.message
                        : t('send_publish_tx_error')}
                </ErrorLabelStyled>
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
