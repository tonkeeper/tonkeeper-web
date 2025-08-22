import { ChangeEventHandler, FC, useId, useState } from 'react';
import { styled } from 'styled-components';
import {
    Notification,
    NotificationBlock,
    NotificationFooter,
    NotificationFooterPortal
} from '../../Notification';
import { H2, Label1, Label2 } from '../../Text';
import { Button } from '../../fields/Button';
import { handleSubmit } from '../../../libs/form';
import { ErrorBoundary } from '../../shared/ErrorBoundary';
import { fallbackRenderOver } from '../../Error';
import {
    useCreateSubscriptionV5,
    useFakeFeeEstimation,
    useSubscriptionDataEmulation
} from '../../../hooks/blockchain/subscription/useCreateSubscriptionV5';
import {
    ConfirmView,
    ConfirmViewAdditionalBottomSlot,
    ConfirmViewHeading,
    ConfirmViewHeadingSlot,
    ConfirmViewTitleSlot
} from '../../transfer/ConfirmView';
import { useDisclosure } from '../../../hooks/useDisclosure';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import BigNumber from 'bignumber.js';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { Address, toNano } from '@ton/core';
import { useActiveWallet } from '../../../state/wallet';
import { InputBlockStyled, InputFieldStyled } from '../multi-send/InputStyled';
import { useCancelSubscriptionV5 } from '../../../hooks/blockchain/subscription/useCancelSubscriptionV5';
import { ListBlock, ListItem, ListItemPayload } from '../../List';
import { Label } from '../../transfer/common';
import { DeployPreview } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/subscription-encoder/subscription-encoder';
import { toShortValue } from '@tonkeeper/core/dist/utils/common';

interface IProRecurrentNotificationProps {
    isOpen: boolean;
    onClose: () => void;
}

const BENEFICIARY_ADDRESS = 'UQDz0EzLNg7YbSXU0RC19NhoejPggncHE8_BDoXiMA53s0jK';
const EXTENSION_ADDRESS = 'EQAan1NbPjnnauNkQOcNKmjIXRIq_6em8edaiExGvlYY5lUE';

const deployReserve = new AssetAmount({
    asset: TON_ASSET,
    weiAmount: new BigNumber(toNano('0.05').toString())
});

const cancelAmount = new AssetAmount({
    asset: TON_ASSET,
    weiAmount: new BigNumber(toNano('0').toString())
});

export const ProRecurrentNotification: FC<IProRecurrentNotificationProps> = ({
    isOpen,
    onClose
}) => (
    <NotificationStyled hideButton isOpen={isOpen} handleClose={onClose}>
        {() => (
            <ErrorBoundary
                fallbackRender={fallbackRenderOver('Failed to display Pro Recurrent modal')}
            >
                <ProRecurrentNotificationContent />
            </ErrorBoundary>
        )}
    </NotificationStyled>
);

export const ProRecurrentNotificationContent = () => {
    const [currentTab, setCurrentTab] = useState(0);

    return (
        <div>
            <Title>{'Recurrent subscription'}</Title>

            <ButtonsWrapper>
                <Button disabled={currentTab === 0} onClick={() => setCurrentTab(0)}>
                    {'Create'}
                </Button>
                <Button disabled={currentTab === 1} onClick={() => setCurrentTab(1)}>
                    {'Cancel'}
                </Button>
            </ButtonsWrapper>

            {currentTab === 0 && <ProCreateContent />}
            {currentTab === 1 && <ProCancelContent />}
        </div>
    );
};

const ProCreateContent = () => {
    const formId = useId();
    const { isOpen, onClose, onOpen } = useDisclosure();
    const { mutateAsync, isLoading } = useCreateSubscriptionV5();
    const activeWallet = useActiveWallet();
    const estimateFeeMutation = useFakeFeeEstimation();
    const { mutateAsync: estimateFee } = estimateFeeMutation;
    const { mutateAsync: emulateSubscription } = useSubscriptionDataEmulation();

    const [formData, setFormData] = useState({
        fromWallet: activeWallet.id,
        beneficiaryAddress: BENEFICIARY_ADDRESS,
        periodSecs: 120,
        reserveTon: '1',
        paymentPerPeriodTon: '0.173',
        callerFeeTon: '0.001'
    });

    const [previewData, setPreviewData] = useState<DeployPreview | null>(null);

    const handleProAuth = async () => {
        onOpen();

        await estimateFee();
        const result = await emulateSubscription(formData);

        setPreviewData(result);
    };

    const handleFormData: ChangeEventHandler<HTMLInputElement> = ({ target }) => {
        setFormData(prevState => ({
            ...prevState,
            [target.name]: target.value
        }));
    };

    return (
        <ContentWrapper onSubmit={handleSubmit(handleProAuth)} id={formId}>
            <InputLabel>{'Beneficiary address'}</InputLabel>
            <InputBlockStyled valid={true} focus={false}>
                <InputFieldStyled
                    name="beneficiaryAddress"
                    value={formData.beneficiaryAddress}
                    onChange={handleFormData}
                    placeholder="Beneficiary address"
                />
            </InputBlockStyled>

            <InputLabel>{'Subscription price'}</InputLabel>
            <InputBlockStyled valid={true} focus={false}>
                <InputFieldStyled
                    name="paymentPerPeriodTon"
                    type="number"
                    step={0.01}
                    value={formData.paymentPerPeriodTon}
                    onChange={handleFormData}
                    placeholder="Subscription price"
                />
            </InputBlockStyled>

            <InputLabel>{'Reserve amount in Ton'}</InputLabel>
            <InputBlockStyled valid={true} focus={false}>
                <InputFieldStyled
                    name="reserveTon"
                    type="number"
                    step={0.1}
                    value={formData.reserveTon}
                    onChange={handleFormData}
                    placeholder="Reserve amount in Ton"
                />
            </InputBlockStyled>

            <InputLabel>{'Caller fee in Ton'}</InputLabel>
            <InputBlockStyled valid={true} focus={false}>
                <InputFieldStyled
                    name="callerFeeTon"
                    type="number"
                    step={0.01}
                    value={formData.callerFeeTon}
                    onChange={handleFormData}
                    placeholder="Caller fee in Ton"
                />
            </InputBlockStyled>

            <InputLabel>{'Charge period in seconds'}</InputLabel>
            <InputBlockStyled valid={true} focus={false}>
                <InputFieldStyled
                    name="periodSecs"
                    type="number"
                    step={1}
                    value={formData.periodSecs}
                    onChange={handleFormData}
                    placeholder="Charge period in seconds"
                />
            </InputBlockStyled>

            <NotificationFooterPortal>
                <NotificationFooter>
                    <Button
                        primary
                        fullWidth
                        size="large"
                        type="submit"
                        form={formId}
                        loading={isLoading}
                    >
                        <Label2>{'Subscribe'}</Label2>
                    </Button>
                </NotificationFooter>
            </NotificationFooterPortal>

            <Notification isOpen={isOpen} handleClose={onClose}>
                {() => (
                    <ConfirmView
                        assetAmount={deployReserve}
                        onClose={onClose}
                        estimation={{ ...estimateFeeMutation }}
                        {...estimateFeeMutation}
                        mutateAsync={async () => mutateAsync(formData)}
                    >
                        <ConfirmViewTitleSlot />
                        <ConfirmViewHeadingSlot>
                            <ConfirmViewHeading title="Create subscription" />
                        </ConfirmViewHeadingSlot>

                        <ConfirmViewAdditionalBottomSlot>
                            <InputLabel>{'Subscription details'}</InputLabel>

                            <ListBlock margin={false} fullWidth>
                                {previewData !== null &&
                                    Object.entries(previewData).map(([key, value]) => (
                                        <ListItem key={key} hover={false}>
                                            <ListItemPayload>
                                                <Label>
                                                    {(() => {
                                                        if (key === 'firstChargingDate') {
                                                            return 'First charge date';
                                                        }

                                                        if (key === 'gracePeriodSecs') {
                                                            return 'Grace period';
                                                        }

                                                        if (key === 'periodSecs') {
                                                            return 'Charging period';
                                                        }

                                                        if (key === 'withdrawAddress') {
                                                            return 'Withdraw address';
                                                        }

                                                        if (key === 'callerFeeNano') {
                                                            return 'Caller fee';
                                                        }

                                                        if (key === 'paymentPerPeriodNano') {
                                                            return 'Subscription price';
                                                        }

                                                        if (key === 'reserveNano') {
                                                            return 'Fee reservation amount';
                                                        }

                                                        return key;
                                                    })()}
                                                </Label>
                                                <Label1>
                                                    {(() => {
                                                        if (key === 'firstChargingDate') {
                                                            return 'Today';
                                                        }

                                                        if (key === 'withdrawAddress') {
                                                            return toShortValue(
                                                                (value as Address).toString({
                                                                    bounceable: false
                                                                })
                                                            );
                                                        }

                                                        if (
                                                            key === 'periodSecs' ||
                                                            key === 'gracePeriodSecs'
                                                        ) {
                                                            return formatPeriodSecs(
                                                                value as number
                                                            );
                                                        }

                                                        if (
                                                            key === 'paymentPerPeriodNano' ||
                                                            key === 'callerFeeNano' ||
                                                            key === 'reserveNano'
                                                        ) {
                                                            return new AssetAmount({
                                                                weiAmount: value as BigNumber.Value,
                                                                asset: TON_ASSET
                                                            }).toStringAssetRelativeAmount();
                                                        }

                                                        return '-';
                                                    })()}
                                                </Label1>
                                            </ListItemPayload>
                                        </ListItem>
                                    ))}
                            </ListBlock>
                        </ConfirmViewAdditionalBottomSlot>
                    </ConfirmView>
                )}
            </Notification>
        </ContentWrapper>
    );
};

const ProCancelContent = () => {
    const formId = useId();
    const { isOpen, onClose, onOpen } = useDisclosure();
    const { mutateAsync, isLoading } = useCancelSubscriptionV5();
    const activeWallet = useActiveWallet();
    const estimateFeeMutation = useFakeFeeEstimation();
    const { mutateAsync: estimateFee } = estimateFeeMutation;

    const [formData, setFormData] = useState({
        fromWallet: activeWallet.id,
        extensionAddress: EXTENSION_ADDRESS
    });

    const handleProAuth = async () => {
        onOpen();

        await estimateFee();
    };

    const handleFormData: ChangeEventHandler<HTMLInputElement> = ({ target }) => {
        setFormData(prevState => ({
            ...prevState,
            [target.name]: target.value
        }));
    };

    return (
        <ContentWrapper onSubmit={handleSubmit(handleProAuth)} id={formId}>
            <InputLabel>{'Extension address'}</InputLabel>
            <InputBlockStyled valid={true} focus={false}>
                <InputFieldStyled
                    name="extensionAddress"
                    value={formData.extensionAddress}
                    onChange={handleFormData}
                    placeholder="Extension address"
                />
            </InputBlockStyled>

            <NotificationFooterPortal>
                <NotificationFooter>
                    <Button
                        primary
                        fullWidth
                        size="large"
                        type="submit"
                        form={formId}
                        loading={isLoading}
                    >
                        <Label2>{'Cancel subscription'}</Label2>
                    </Button>
                </NotificationFooter>
            </NotificationFooterPortal>

            <Notification isOpen={isOpen} handleClose={onClose}>
                {() => (
                    <ConfirmView
                        assetAmount={cancelAmount}
                        onClose={onClose}
                        estimation={{ ...estimateFeeMutation }}
                        {...estimateFeeMutation}
                        mutateAsync={async () => mutateAsync(formData)}
                    >
                        <ConfirmViewTitleSlot />
                        <ConfirmViewHeadingSlot>
                            <ConfirmViewHeading title="Cancel subscription" />
                        </ConfirmViewHeadingSlot>
                    </ConfirmView>
                )}
            </Notification>
        </ContentWrapper>
    );
};

const Title = styled(H2)`
    text-align: center;
`;

const ContentWrapper = styled(NotificationBlock)`
    position: relative;
    padding: 0 0 2rem;
    overflow: hidden;
`;

const ButtonsWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    margin: 2rem 0;
`;

const InputLabel = styled(Label2)`
    text-align: left;
    margin: 1rem auto 0 0;
    padding: 0;
`;

const NotificationStyled = styled(Notification)`
    max-width: 650px;
    @media (pointer: fine) {
        &:hover {
            [data-swipe-button] {
                color: ${p => p.theme.textSecondary};
            }
        }
    }
`;

// TODO Temporary took from GPT
export function formatPeriodSecs(total: number): string {
    const MIN = 60,
        HOUR = 3600,
        DAY = 86400,
        WEEK = 7 * DAY,
        MONTH = 30 * DAY;

    const plural = (n: number, [one, few, many]: [string, string, string]) =>
        `${n} ${
            n % 10 === 1 && n % 100 !== 11
                ? one
                : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)
                ? few
                : many
        }`;

    const units = [
        { size: MONTH, forms: ['месяц', 'месяца', 'месяцев'] },
        { size: WEEK, forms: ['неделя', 'недели', 'недель'] },
        { size: DAY, forms: ['день', 'дня', 'дней'] },
        { size: HOUR, forms: ['час', 'часа', 'часов'] },
        { size: MIN, forms: ['минута', 'минуты', 'минут'] },
        { size: 1, forms: ['секунда', 'секунды', 'секунд'] }
    ];

    let sec = Math.max(0, Math.floor(total));
    if (sec === 0) return '0 секунд';

    const parts: string[] = [];
    for (const u of units) {
        const n = Math.floor(sec / u.size);
        if (n > 0) {
            parts.push(plural(n, u.forms as any));
            sec -= n * u.size;
            if (parts.length === 2) break;
        }
    }
    return parts.join(' ');
}
