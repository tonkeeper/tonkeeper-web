import React, { FC, PropsWithChildren, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Body1, Body2Class, Body3, H2, Label2Class } from '../Text';
import { useTranslation } from '../../hooks/translation';
import { Controller, FormProvider, useFieldArray, useForm, useFormContext } from 'react-hook-form';
import { BorderSmallResponsive } from '../shared/Styles';
import { Radio } from '../fields/Checkbox';
import { InputBlock, InputField } from '../fields/Input';
import { Button } from '../fields/Button';
import { IconButtonTransparentBackground } from '../fields/IconButton';
import { CloseIcon, DoneIcon } from '../Icon';
import { useAccountsState, useActiveWallet } from '../../state/wallet';
import { Account, isAccountTonWalletStandard } from '@tonkeeper/core/dist/entries/account';
import { TonWalletStandard } from '@tonkeeper/core/dist/entries/wallet';
import { AccountAndWalletInfo } from '../account/AccountAndWalletInfo';
import { DropDown } from '../DropDown';

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
    const { t } = useTranslation();
    return (
        <ContentWrapper>
            <Heading>{t('multisig_add_title')}</Heading>
            <SubHeading>{t('multisig_add_description')}</SubHeading>
            <MultisigCreatingForm />
        </ContentWrapper>
    );
};

const FormWrapper = styled.form`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

const Participants = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
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
};

const MultisigCreatingForm: FC = () => {
    const activeWallet = useActiveWallet();
    const methods = useForm<MultisigUseForm>({
        defaultValues: {
            firstParticipant: {
                address: activeWallet.rawAddress,
                role: 'proposer-and-signer'
            },
            participants: [{ address: '', role: 'proposer-and-signer' }]
        }
    });
    const { control, handleSubmit } = methods;
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'participants'
    });

    const onSubmit = v => {
        console.log(v);
    };

    return (
        <FormWrapper onSubmit={handleSubmit(onSubmit)}>
            <FormProvider {...methods}>
                <FirstParticipantCard />
                <Participants>
                    {fields.map((field, index) => (
                        <ExternalParticipantCard
                            key={field.id}
                            fieldIndex={index}
                            onRemove={() => remove(index)}
                        />
                    ))}
                </Participants>
            </FormProvider>
            <Button
                secondary
                type="button"
                size="small"
                fitContent
                onClick={() => append({ address: '', role: 'proposer-and-signer' })}
            >
                Add Participant
            </Button>
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

const ExternalParticipantCard: FC<{ fieldIndex: number; onRemove: () => void }> = ({
    fieldIndex,
    onRemove
}) => {
    const { control } = useFormContext<MultisigUseForm>();
    const [focus, setFocus] = useState(false);
    return (
        <ParticipantCard registerAs={`participants.${fieldIndex}.role`}>
            <ExternalParticipantCardFirstRow>
                <Controller
                    rules={{
                        required: 'Required'
                    }}
                    render={({ field, fieldState }) => (
                        <InputBlock size="small" valid={!fieldState.invalid} focus={focus}>
                            <InputField
                                {...field}
                                size="small"
                                onFocus={() => setFocus(true)}
                                onBlur={() => setFocus(false)}
                                placeholder="Wallet Address"
                            />
                        </InputBlock>
                    )}
                    name={`participants.${fieldIndex}.address`}
                    control={control}
                />
                <IconButtonTransparentBackground onClick={onRemove}>
                    <CloseIcon />
                </IconButtonTransparentBackground>
            </ExternalParticipantCardFirstRow>
        </ParticipantCard>
    );
};

const FirstParticipantSelectHost = styled.div`
    display: flex;
    flex-direction: column;
    padding: 8px 12px;
    width: 100%;
    box-sizing: border-box;

    > :first-child {
        color: ${p => p.theme.textSecondary};
    }
`;

const AccountAndWalletInfoStyled = styled(AccountAndWalletInfo)`
    color: ${p => p.theme.textPrimary};
`;

const DropDownContent = styled.div`
    background: ${p => p.theme.backgroundContentTint};
    ${BorderSmallResponsive};
`;

const DropDownStyled = styled(DropDown)`
    width: 100%;
`;

const DropDownItem = styled.div`
    padding: 10px 12px;
    display: flex;
    justify-content: space-between;
    cursor: pointer;

    > svg {
        color: ${p => p.theme.accentBlue};
    }
`;

const FirstParticipantCard: FC = () => {
    const { control, watch } = useFormContext<MultisigUseForm>();
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

    const selectedAddress = watch('firstParticipant.address');
    const selectedWallet = wallets[selectedAddress];

    return (
        <ParticipantCardStyled registerAs="firstParticipant.role">
            <Controller
                rules={{
                    required: 'Required'
                }}
                render={({ field: { onChange } }) => (
                    <DropDownStyled
                        containerClassName="dd-create-multisig-container"
                        payload={onClose => (
                            <DropDownContent>
                                {Object.values(wallets).map(item => (
                                    <>
                                        <DropDownItem
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
                                            {selectedAddress === item.wallet.rawAddress && (
                                                <DoneIcon />
                                            )}
                                        </DropDownItem>
                                        <Divider />
                                    </>
                                ))}
                            </DropDownContent>
                        )}
                    >
                        <FirstParticipantSelectHost>
                            <Body3>Wallet</Body3>
                            <AccountAndWalletInfoStyled
                                noPrefix
                                account={selectedWallet.account}
                                walletId={selectedWallet.wallet.id}
                            />
                        </FirstParticipantSelectHost>
                    </DropDownStyled>
                )}
                name={'firstParticipant.address'}
                control={control}
            />
        </ParticipantCardStyled>
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
