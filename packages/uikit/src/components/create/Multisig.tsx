import React, {
    FC,
    PropsWithChildren,
    useCallback,
    useEffect,
    useId,
    useMemo,
    useState
} from 'react';
import styled, { css } from 'styled-components';
import { Body1, Body2, Body2Class, Body3, Body3Class, H2, Label2, Label2Class } from '../Text';
import { useTranslation } from '../../hooks/translation';
import { Controller, FormProvider, useFieldArray, useForm, useFormContext } from 'react-hook-form';
import { BorderSmallResponsive } from '../shared/Styles';
import { Radio } from '../fields/Checkbox';
import { InputBlock, InputField } from '../fields/Input';
import { Button } from '../fields/Button';
import { IconButtonTransparentBackground } from '../fields/IconButton';
import { CloseIcon, SwitchIcon } from '../Icon';
import { useAccountsState, useActiveWallet } from '../../state/wallet';
import { Account, isAccountTonWalletStandard } from '@tonkeeper/core/dist/entries/account';
import { TonWalletStandard } from '@tonkeeper/core/dist/entries/wallet';
import { AccountAndWalletInfo } from '../account/AccountAndWalletInfo';
import { DropDown, DropDownContent, DropDownItem, DropDownItemsDivider } from '../DropDown';
import { Dot } from '../Dot';
import { Notification, NotificationFooterPortal } from '../Notification';
import { seeIfValidTonAddress } from '@tonkeeper/core/dist/utils/common';
import { useEstimateDeployMultisig } from '../../hooks/blockchain/multisig/useEstimateDeployMultisig';
import { useDeployMultisig } from '../../hooks/blockchain/multisig/useDeployMultisig';
import {
    ConfirmView,
    ConfirmViewHeading,
    ConfirmViewHeadingSlot,
    ConfirmViewTitleSlot
} from '../transfer/ConfirmView';
import { useDisclosure } from '../../hooks/useDisclosure';
import {
    deployMultisigAssetAmount,
    MultisigConfig
} from '@tonkeeper/core/dist/service/multisigService';
import { Address } from '@ton/core';
import {
    AsyncValidationState,
    AsyncValidatorsStateProvider,
    useAsyncValidator
} from '../../hooks/useAsyncValidator';
import { useAppContext } from '../../hooks/appContext';
import { AccountsApi } from '@tonkeeper/core/dist/tonApiV2';

const Body3Secondary = styled(Body3)`
    color: ${p => p.theme.textSecondary};
`;

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const Heading = styled(H2)`
    ${p => p.theme.displayType === 'full-width' && Label2Class};
    margin-bottom: 4px;
    text-align: center;
`;

const SubHeading = styled(Body1)`
    ${p => p.theme.displayType === 'full-width' && Body2Class};
    color: ${p => p.theme.textSecondary};
    margin-bottom: 24px;
    text-align: center;
`;

export const CreateMultisig: FC = () => {
    const [deployArgs, setDeployArgs] = useState<
        Parameters<typeof useDeployMultisig>[0] | undefined
    >();
    const { t } = useTranslation();
    const { isOpen, onClose, onOpen } = useDisclosure();
    const estimateMutation = useEstimateDeployMultisig();
    const deployMutation = useDeployMultisig(deployArgs);
    const { mutateAsync: estimateDeploy } = estimateMutation;

    const onSubmit = async (data: MultisigUseForm) => {
        onOpen();
        const fromWallet = data.firstParticipant.address;
        const multisigConfig: MultisigConfig = {
            proposers: data.participants
                .concat(data.firstParticipant)
                .filter(p => p.role === 'proposer')
                .map(v => Address.parse(v.address)),
            signers: data.participants
                .concat(data.firstParticipant)
                .filter(p => p.role === 'proposer-and-signer')
                .map(v => Address.parse(v.address)),
            threshold: data.quorum,
            allowArbitrarySeqno: true //TODO
        };
        const result = await estimateDeploy({ multisigConfig, fromWallet });
        setDeployArgs({ multisigConfig, fromWallet, feeWei: result?.fee.weiAmount });
    };

    return (
        <ContentWrapper>
            <Heading>{t('multisig_add_title')}</Heading>
            <SubHeading>{t('multisig_add_description')}</SubHeading>
            <MultisigCreatingForm onSubmit={onSubmit} />

            <Notification isOpen={isOpen} handleClose={onClose}>
                {() => (
                    <ConfirmView
                        assetAmount={deployMultisigAssetAmount}
                        onClose={onClose}
                        estimation={{ ...estimateMutation }}
                        {...deployMutation}
                    >
                        <ConfirmViewTitleSlot />
                        <ConfirmViewHeadingSlot>
                            <ConfirmViewHeading title="Deploy Multisig" />
                        </ConfirmViewHeadingSlot>
                    </ConfirmView>
                )}
            </Notification>
        </ContentWrapper>
    );
};

const FormWrapper = styled.form`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const Participants = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;
`;

const SubmitButtonContainer = styled.div`
    margin: 0 -16px;
    background: ${p => p.theme.backgroundPage};
    padding: 16px;
`;

type MultisigUseForm = {
    firstParticipant: {
        address: string;
        role: 'proposer-and-signer' | 'proposer';
    };
    participants: {
        address: string;
        role: 'proposer-and-signer' | 'proposer';
    }[];
    quorum: number;
    deadlineHours: number;
};

const MultisigCreatingForm: FC<{ onSubmit: (form: MultisigUseForm) => void }> = ({ onSubmit }) => {
    const activeWallet = useActiveWallet();
    const methods = useForm<MultisigUseForm>({
        defaultValues: {
            firstParticipant: {
                address: activeWallet.rawAddress,
                role: 'proposer-and-signer'
            },
            participants: [{ address: '', role: 'proposer-and-signer' }],
            quorum: 1,
            deadlineHours: 24
        }
    });
    const { control, handleSubmit } = methods;
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'participants'
    });

    const formId = useId();
    const [formState, setFormState] = useState<AsyncValidationState>('idle');

    return (
        <FormWrapper onSubmit={handleSubmit(onSubmit)} id={formId}>
            <FormProvider {...methods}>
                <AsyncValidatorsStateProvider onStateChange={setFormState}>
                    <FirstParticipantCard />
                    <Body3Secondary>
                        A signer can confirm transactions and propose changes, such as adding or
                        removing participants. A proposer can only propose changes.
                    </Body3Secondary>
                    <Participants>
                        {fields.map((field, index) => (
                            <ExternalParticipantCard
                                key={field.id}
                                fieldIndex={index}
                                onRemove={() => remove(index)}
                            />
                        ))}
                    </Participants>
                    <Button
                        secondary
                        type="button"
                        size="small"
                        fitContent
                        onClick={() => append({ address: '', role: 'proposer-and-signer' })}
                    >
                        Add Participant
                    </Button>
                    <QuorumAndDeadlineInputs />
                </AsyncValidatorsStateProvider>
            </FormProvider>
            <NotificationFooterPortal>
                <SubmitButtonContainer>
                    <Button
                        primary
                        type="submit"
                        fullWidth
                        form={formId}
                        loading={formState === 'validating'}
                        disabled={formState !== 'succeed'}
                    >
                        Create Wallet
                    </Button>
                </SubmitButtonContainer>
            </NotificationFooterPortal>
        </FormWrapper>
    );
};

const Divider = styled.div`
    height: 1px;
    background: ${p => p.theme.separatorCommon};
`;

const CardWrapper = styled.div`
    background: ${p => p.theme.fieldBackground};
    ${BorderSmallResponsive};
`;

const CardFooter = styled.div`
    padding: 9px;
    display: flex;
    gap: 12px;
`;

const ExternalParticipantCardFirstRow = styled.div`
    display: flex;
`;

const FormError = styled.div<{ noPaddingTop?: boolean }>`
    padding: 8px 0;
    color: ${p => p.theme.accentRed};
    ${Body3Class};

    ${p => p.noPaddingTop && 'padding-top: 0;'}
`;
const ExternalParticipantCard: FC<{ fieldIndex: number; onRemove: () => void }> = ({
    fieldIndex,
    onRemove
}) => {
    const { control } = useFormContext<MultisigUseForm>();
    const [focus, setFocus] = useState(false);
    return (
        <Controller
            rules={{
                required: 'Required',
                validate: v => {
                    if (!seeIfValidTonAddress(v)) {
                        return 'Invalid address';
                    }
                }
            }}
            render={({ field, fieldState: { error, invalid } }) => (
                <>
                    <ParticipantCard registerAs={`participants.${fieldIndex}.role`}>
                        <ExternalParticipantCardFirstRow>
                            <InputBlock size="small" valid={!invalid} focus={focus}>
                                <InputField
                                    {...field}
                                    size="small"
                                    onFocus={() => setFocus(true)}
                                    onBlur={() => setFocus(false)}
                                    placeholder="Wallet Address"
                                />
                            </InputBlock>
                            <IconButtonTransparentBackground onClick={onRemove}>
                                <CloseIcon />
                            </IconButtonTransparentBackground>
                        </ExternalParticipantCardFirstRow>
                    </ParticipantCard>
                    {error && <FormError noPaddingTop>{error.message}</FormError>}
                </>
            )}
            name={`participants.${fieldIndex}.address`}
            control={control}
        />
    );
};

const DropDownSelectHost = styled.div<{ isErrored?: boolean }>`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    ${BorderSmallResponsive};
    ${p =>
        p.isErrored &&
        css`
            border: 1px solid ${p.theme.fieldErrorBorder};
            background: ${p.theme.fieldErrorBackground};
        `}
`;

const DropDownSelectHostText = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    box-sizing: border-box;

    > :first-child {
        color: ${p => p.theme.textSecondary};
    }
`;

const AccountAndWalletInfoStyled = styled(AccountAndWalletInfo)`
    color: ${p => p.theme.textPrimary};
`;

const DropDownStyled = styled(DropDown)`
    width: 100%;
`;

const FirstParticipantCard: FC = () => {
    const methods = useFormContext<MultisigUseForm>();
    const { watch, control } = methods;
    const { api } = useAppContext();
    const selectedAddress = watch('firstParticipant.address');

    const asyncValidator = useCallback(
        async (accountId: string) => {
            const wallet = await new AccountsApi(api.tonApiV2).getAccount({ accountId });

            if (deployMultisigAssetAmount.weiAmount.gt(wallet.balance)) {
                return { message: 'Not enough TON balance for deploy' };
            }
        },
        [api]
    );

    useAsyncValidator(methods, selectedAddress, 'firstParticipant.address', asyncValidator);
    const accounts = useAccountsState();
    const wallets = useMemo(() => {
        const filtered = accounts.filter(isAccountTonWalletStandard).flatMap(a =>
            a.allTonWallets.map(w => ({
                account: a,
                wallet: w
            }))
        );

        return filtered.reduce(
            (acc, v) => ({ ...acc, [v.wallet.rawAddress]: v }),
            {} as Record<string, { wallet: TonWalletStandard; account: Account }>
        );
    }, [accounts]);

    const selectedWallet = wallets[selectedAddress];

    return (
        <Controller
            rules={{
                required: 'Required'
            }}
            render={({ field: { onChange }, fieldState: { error } }) => (
                <>
                    <ParticipantCardStyled registerAs="firstParticipant.role">
                        <DropDownStyled
                            containerClassName="dd-create-multisig-container"
                            payload={onClose => (
                                <DropDownContent>
                                    {Object.values(wallets).map(item => (
                                        <>
                                            <DropDownItem
                                                isSelected={
                                                    selectedAddress === item.wallet.rawAddress
                                                }
                                                key={item.wallet.id}
                                                onClick={() => {
                                                    onClose();
                                                    onChange(item.wallet.rawAddress);
                                                }}
                                            >
                                                <AccountAndWalletInfoStyled
                                                    noPrefix
                                                    account={item.account}
                                                    walletId={item.wallet.id}
                                                />
                                            </DropDownItem>
                                            <DropDownItemsDivider />
                                        </>
                                    ))}
                                </DropDownContent>
                            )}
                        >
                            <DropDownSelectHost isErrored={!!error}>
                                <DropDownSelectHostText>
                                    <Body3>Wallet</Body3>
                                    <AccountAndWalletInfoStyled
                                        noPrefix
                                        account={selectedWallet.account}
                                        walletId={selectedWallet.wallet.id}
                                    />
                                </DropDownSelectHostText>
                                <SwitchIcon />
                            </DropDownSelectHost>
                        </DropDownStyled>
                    </ParticipantCardStyled>
                    {error && <FormError noPaddingTop>{error.message}</FormError>}
                </>
            )}
            name={'firstParticipant.address'}
            control={control}
        />
    );
};

const ParticipantCard: FC<
    PropsWithChildren & {
        registerAs: 'firstParticipant.role' | `participants.${number}.role`;
        className?: string;
    }
> = ({ children, registerAs, className }) => {
    const { register } = useFormContext<MultisigUseForm>();

    return (
        <CardWrapper className={className}>
            {children}
            <Divider />
            <CardFooter>
                <Radio value="proposer-and-signer" {...register(registerAs)}>
                    Signer & Proposer
                </Radio>
                <Radio value="proposer" {...register(registerAs)}>
                    Proposer
                </Radio>
            </CardFooter>
        </CardWrapper>
    );
};

const ParticipantCardStyled = styled(ParticipantCard)`
    width: 100%;
    .dd-create-multisig-container {
        width: 350px;
        max-height: 250px;
        right: 32px;
        top: 16px;
    }
`;

const QuorumAndDeadlineInputsContainer = styled.div`
    margin-top: 32px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;

    .dd-create-multisig-container {
        bottom: 50%;
        right: 32px;
        top: unset;
    }
`;

const StandaloneField = styled.div`
    background: ${p => p.theme.fieldBackground};
    ${BorderSmallResponsive};
`;

const DropDownItemText = styled.div`
    display: flex;
    flex-direction: column;

    > ${Body3} {
        color: ${p => p.theme.textSecondary};
    }
`;

const timeToSignOptions = {
    '30_minutes': 0.5,
    '1_hour': 1,
    '6_hours': 6,
    '12_hours': 12,
    '24_hours': 24
};

const QuorumAndDeadlineInputs = () => {
    const { t } = useTranslation();
    const {
        control,
        watch,
        trigger,
        formState: { isSubmitted }
    } = useFormContext<MultisigUseForm>();
    const selectedSignersNumber = watch('quorum');
    const selectedDeadline = watch('deadlineHours');
    const selectedDeadlineTranslation = Object.entries(timeToSignOptions).find(
        ([_, v]) => v === selectedDeadline
    )![0];
    const firsIsSigner = watch('firstParticipant').role === 'proposer-and-signer' ? 1 : 0;
    const totalSignersNumber =
        watch('participants').filter(i => i.role === 'proposer-and-signer').length + firsIsSigner;
    const selectedSignersPercent =
        selectedSignersNumber > totalSignersNumber || totalSignersNumber === 0
            ? null
            : Math.round((selectedSignersNumber / totalSignersNumber) * 100);

    useEffect(() => {
        if (isSubmitted) {
            trigger('quorum');
        }
    }, [trigger, totalSignersNumber, isSubmitted]);

    return (
        <QuorumAndDeadlineInputsContainer>
            <Controller
                rules={{
                    required: 'Required',
                    validate: v => {
                        if (totalSignersNumber === 0) {
                            return 'At least one signer is required';
                        }

                        if (v > totalSignersNumber) {
                            return 'Invalid number of signers';
                        }
                    }
                }}
                render={({ field: { onChange }, fieldState: { error } }) => (
                    <DropDownStyled
                        containerClassName="dd-create-multisig-container"
                        payload={onClose => (
                            <DropDownContent>
                                {[...Array(totalSignersNumber)]
                                    .map((_, i) => i + 1)
                                    .map(item => (
                                        <>
                                            <DropDownItem
                                                isSelected={selectedSignersNumber === item}
                                                key={item}
                                                onClick={() => {
                                                    onClose();
                                                    onChange(item);
                                                }}
                                            >
                                                <DropDownItemText>
                                                    <Label2>{item} signers</Label2>
                                                    <Body3>
                                                        {Math.round(
                                                            (item / totalSignersNumber) * 100
                                                        )}
                                                        %
                                                    </Body3>
                                                </DropDownItemText>
                                            </DropDownItem>
                                            <DropDownItemsDivider />
                                        </>
                                    ))}
                            </DropDownContent>
                        )}
                    >
                        <StandaloneField>
                            <DropDownSelectHost isErrored={!!error}>
                                <DropDownSelectHostText>
                                    <Body3>Quorum</Body3>
                                    <Body2>
                                        {selectedSignersNumber} signers
                                        {selectedSignersPercent !== null && (
                                            <>
                                                <Dot />
                                                {selectedSignersPercent}%
                                            </>
                                        )}
                                    </Body2>
                                </DropDownSelectHostText>
                                <SwitchIcon />
                            </DropDownSelectHost>
                        </StandaloneField>
                        {error && <FormError>{error.message}</FormError>}
                    </DropDownStyled>
                )}
                name={'quorum'}
                control={control}
            />
            <Controller
                rules={{
                    required: 'Required'
                }}
                render={({ field: { onChange } }) => (
                    <DropDownStyled
                        containerClassName="dd-create-multisig-container"
                        payload={onClose => (
                            <DropDownContent>
                                {Object.entries(timeToSignOptions).map(([translation, value]) => (
                                    <>
                                        <DropDownItem
                                            isSelected={selectedDeadline === value}
                                            key={value}
                                            onClick={() => {
                                                onClose();
                                                onChange(value);
                                            }}
                                        >
                                            <Label2>{t(translation)}</Label2>
                                        </DropDownItem>
                                        <DropDownItemsDivider />
                                    </>
                                ))}
                            </DropDownContent>
                        )}
                    >
                        <StandaloneField>
                            <DropDownSelectHost>
                                <DropDownSelectHostText>
                                    <Body3>Time to sign a transaction</Body3>
                                    <Body2>{t(selectedDeadlineTranslation)}</Body2>
                                </DropDownSelectHostText>
                                <SwitchIcon />
                            </DropDownSelectHost>
                        </StandaloneField>
                    </DropDownStyled>
                )}
                name={'deadlineHours'}
                control={control}
            />
            <Body3Secondary>
                You can always change the number of participants, their roles, the time for signing
                a transaction, and the number of signatures required for a successful transaction.
            </Body3Secondary>
        </QuorumAndDeadlineInputsContainer>
    );
};
