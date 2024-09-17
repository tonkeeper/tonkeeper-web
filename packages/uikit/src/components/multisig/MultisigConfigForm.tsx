import React, { FC, useCallback, useContext, useEffect, useId, useMemo, useState } from 'react';
import { AddWalletContext } from '../create/AddWalletContext';
import { useConfirmDiscardNotification } from '../modals/ConfirmDiscardNotificationControlled';
import { useAccountsState, useActiveAccount } from '../../state/wallet';
import { Controller, FormProvider, useFieldArray, useForm, useFormContext } from 'react-hook-form';
import {
    NotificationFooterPortal,
    useSetNotificationOnBack,
    useSetNotificationOnCloseInterceptor
} from '../Notification';
import { useTranslation } from '../../hooks/translation';
import {
    AsyncValidationState,
    AsyncValidatorsStateProvider,
    useAsyncValidator
} from '../../hooks/useAsyncValidator';
import { Button } from '../fields/Button';
import styled from 'styled-components';
import { Body2, Body3, Body3Class, Label2 } from '../Text';
import { seeIfValidTonAddress } from '@tonkeeper/core/dist/utils/common';
import { Address } from '@ton/core';
import { InputBlock, InputField } from '../fields/Input';
import { IconButtonTransparentBackground } from '../fields/IconButton';
import { CloseIcon, SwitchIcon } from '../Icon';
import { AccountAndWalletInfo } from '../account/AccountAndWalletInfo';
import {
    SelectDropDown,
    SelectDropDownHost,
    SelectDropDownHostText,
    SelectField
} from '../fields/Select';
import { useAppContext } from '../../hooks/appContext';
import { AccountsApi } from '@tonkeeper/core/dist/tonApiV2';
import { deployMultisigAssetAmount } from '@tonkeeper/core/dist/service/multisig/deploy';
import { Account, isAccountTonWalletStandard } from '@tonkeeper/core/dist/entries/account';
import { TonWalletStandard } from '@tonkeeper/core/dist/entries/wallet';
import { DropDownContent, DropDownItem, DropDownItemsDivider } from '../DropDown';
import { Dot } from '../Dot';

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

export type MultisigUseForm = {
    firstParticipant: string;
    participants: { address: string }[];
    quorum: number;
};

const FormTopLabel = styled(Body3)`
    color: ${p => p.theme.textSecondary};
`;

const Body3Secondary = styled(Body3)`
    color: ${p => p.theme.textSecondary};
`;

export const MultisigConfigForm: FC<{
    onSubmit: (form: MultisigUseForm) => void;
    formId?: string;
    defaultValues?: MultisigUseForm;
    skipBalanceCheck?: boolean;
}> = ({ onSubmit, formId, skipBalanceCheck }) => {
    const { navigateHome } = useContext(AddWalletContext);
    const { onOpen: openConfirmDiscard } = useConfirmDiscardNotification();
    const activeAccount = useActiveAccount();
    const accounts = useAccountsState();

    let activeWallet = activeAccount.activeTonWallet;
    if (activeAccount.type === 'watch-only' || activeAccount.type === 'ton-multisig') {
        activeWallet = accounts.find(
            acc => acc.type !== 'watch-only' && acc.type !== 'ton-multisig'
        )!.activeTonWallet;
    }

    const context = useFormContext<MultisigUseForm>();
    let methods = useForm<MultisigUseForm>({
        defaultValues: {
            firstParticipant: activeWallet.rawAddress,
            participants: [{ address: '' }],
            quorum: 2
        }
    });

    if (context) {
        methods = context;
    }

    const {
        control,
        handleSubmit,
        formState: { isDirty }
    } = methods;
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'participants'
    });

    const onNotificationBack = useMemo(
        () =>
            navigateHome
                ? () => {
                      if (!isDirty) {
                          navigateHome();
                      } else {
                          openConfirmDiscard({
                              onClose: discard => {
                                  if (discard) {
                                      navigateHome();
                                  }
                              }
                          });
                      }
                  }
                : undefined,
        [openConfirmDiscard, navigateHome, isDirty]
    );

    const onNotificationCloseInterceptor = useCallback(
        (closeHandle: () => void) => {
            if (!isDirty) {
                closeHandle();
            } else {
                openConfirmDiscard({
                    onClose: discard => {
                        if (discard) {
                            closeHandle();
                        }
                    }
                });
            }
        },
        [openConfirmDiscard, isDirty]
    );

    useSetNotificationOnBack(onNotificationBack);
    useSetNotificationOnCloseInterceptor(onNotificationCloseInterceptor);
    const { t } = useTranslation();

    const fallbackFormId = useId();
    const formIdToSet = formId ?? fallbackFormId;
    const [formState, setFormState] = useState<AsyncValidationState>('idle');

    return (
        <FormWrapper onSubmit={handleSubmit(onSubmit)} id={formIdToSet}>
            <FormProvider {...methods}>
                <AsyncValidatorsStateProvider onStateChange={setFormState}>
                    <FormTopLabel>{t('create_multisig_participants')}</FormTopLabel>
                    <FirstParticipantCard skipBalanceCheck={skipBalanceCheck} />
                    <Body3Secondary>{t('create_multisig_what_are_signers')}</Body3Secondary>
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
                        onClick={() => append({ address: '' })}
                    >
                        {t('create_multisig_add_participant')}
                    </Button>
                    <QuorumInput />
                </AsyncValidatorsStateProvider>
            </FormProvider>
            {formId === undefined && (
                <NotificationFooterPortal>
                    <SubmitButtonContainer>
                        <Button
                            primary
                            type="submit"
                            fullWidth
                            form={formIdToSet}
                            loading={formState === 'validating'}
                            disabled={formState !== 'succeed'}
                        >
                            {t('create_multisig_create_wallet')}
                        </Button>
                    </SubmitButtonContainer>
                </NotificationFooterPortal>
            )}
        </FormWrapper>
    );
};

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
    const { t } = useTranslation();
    const { control, watch } = useFormContext<MultisigUseForm>();
    const [focus, setFocus] = useState(false);

    const participants = watch('participants');

    return (
        <Controller
            rules={{
                required: 'Required',
                validate: v => {
                    if (!seeIfValidTonAddress(v)) {
                        return t('create_multisig_invalid_address_error');
                    }

                    try {
                        if (
                            participants.filter(p =>
                                Address.parse(p.address).equals(Address.parse(v))
                            ).length > 1
                        ) {
                            return t('create_multisig_duplicated_address_error');
                        }
                    } catch (e) {
                        return;
                    }
                }
            }}
            render={({ field, fieldState: { error, invalid } }) => (
                <>
                    <ExternalParticipantCardFirstRow>
                        <InputBlock size="small" valid={!invalid} focus={focus}>
                            <InputField
                                {...field}
                                size="small"
                                onFocus={() => setFocus(true)}
                                onBlur={() => setFocus(false)}
                                placeholder={t('wallet_address')}
                            />
                        </InputBlock>
                        <IconButtonTransparentBackground onClick={onRemove}>
                            <CloseIcon />
                        </IconButtonTransparentBackground>
                    </ExternalParticipantCardFirstRow>
                    {error && <FormError noPaddingTop>{error.message}</FormError>}
                </>
            )}
            name={`participants.${fieldIndex}.address`}
            control={control}
        />
    );
};

const AccountAndWalletInfoStyled = styled(AccountAndWalletInfo)`
    color: ${p => p.theme.textPrimary};
`;

const SelectDropDownHostStyled = styled(SelectDropDownHost)`
    background-color: ${p => p.theme.fieldBackground};
`;

const FirstParticipantCard: FC<{ skipBalanceCheck?: boolean }> = ({ skipBalanceCheck }) => {
    const methods = useFormContext<MultisigUseForm>();
    const { watch, control } = methods;
    const { api } = useAppContext();
    const selectedAddress = watch('firstParticipant');

    const asyncValidator = useCallback(
        async (accountId: string) => {
            if (skipBalanceCheck) {
                return;
            }

            const wallet = await new AccountsApi(api.tonApiV2).getAccount({ accountId });

            if (deployMultisigAssetAmount.weiAmount.gt(wallet.balance)) {
                return { message: 'Not enough TON balance for deploy' };
            }
        },
        [api, skipBalanceCheck]
    );

    useAsyncValidator(methods, selectedAddress, 'firstParticipant', asyncValidator);
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
    const { t } = useTranslation();

    return (
        <Controller
            rules={{
                required: 'Required'
            }}
            render={({ field: { onChange }, fieldState: { error } }) => (
                <>
                    <SelectDropDown
                        width="350px"
                        maxHeight="250px"
                        right="32px"
                        top="16px"
                        payload={onClose => (
                            <DropDownContent>
                                {Object.values(wallets).map(item => (
                                    <>
                                        <DropDownItem
                                            isSelected={selectedAddress === item.wallet.rawAddress}
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
                        <SelectDropDownHostStyled isErrored={!!error}>
                            <SelectDropDownHostText>
                                <Body3>{t('wallet_title')}</Body3>
                                <AccountAndWalletInfoStyled
                                    noPrefix
                                    account={selectedWallet.account}
                                    walletId={selectedWallet.wallet.id}
                                />
                            </SelectDropDownHostText>
                            <SwitchIcon />
                        </SelectDropDownHostStyled>
                    </SelectDropDown>
                    {error && <FormError noPaddingTop>{error.message}</FormError>}
                </>
            )}
            name={'firstParticipant'}
            control={control}
        />
    );
};

const QuorumAndDeadlineInputsContainer = styled.div`
    margin-top: 32px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
`;

const DropDownItemText = styled.div`
    display: flex;
    flex-direction: column;

    > ${Body3} {
        color: ${p => p.theme.textSecondary};
    }
`;

const QuorumInput = () => {
    const { t } = useTranslation();
    const {
        control,
        watch,
        trigger,
        formState: { isSubmitted }
    } = useFormContext<MultisigUseForm>();
    const selectedSignersNumber = watch('quorum');
    const totalSignersNumber = watch('participants').length + 1;
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
                            return t('create_multisig_quorum_zero_participants_error');
                        }

                        if (v > totalSignersNumber) {
                            return t('create_multisig_quorum_invalid_number_participants_error');
                        }
                    }
                }}
                render={({ field: { onChange }, fieldState: { error } }) => (
                    <SelectDropDown
                        bottom="50%"
                        right="32px"
                        top="unset"
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
                        <SelectField>
                            <SelectDropDownHost isErrored={!!error}>
                                <SelectDropDownHostText>
                                    <Body3>{t('create_multisig_quorum')}</Body3>
                                    <Body2>
                                        {selectedSignersNumber}{' '}
                                        {t('create_multisig_quorum_participants')}
                                        {selectedSignersPercent !== null && (
                                            <>
                                                <Dot />
                                                {selectedSignersPercent}%
                                            </>
                                        )}
                                    </Body2>
                                </SelectDropDownHostText>
                                <SwitchIcon />
                            </SelectDropDownHost>
                        </SelectField>
                        {error && <FormError>{error.message}</FormError>}
                    </SelectDropDown>
                )}
                name={'quorum'}
                control={control}
            />
            <Body3Secondary>{t('create_multisig_can_change_hint')}</Body3Secondary>
        </QuorumAndDeadlineInputsContainer>
    );
};
