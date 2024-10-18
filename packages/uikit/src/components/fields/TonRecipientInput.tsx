import { TonRecipient } from '@tonkeeper/core/dist/entries/send';
import {
    formatAddress,
    seeIfValidTonAddress,
    toShortValue
} from '@tonkeeper/core/dist/utils/common';
import React, { ForwardedRef, forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { ErrorOption, UseFormSetError } from 'react-hook-form';
import styled from 'styled-components';
import { SpinnerRing, XMarkCircleIcon } from '../Icon';
import { Body2 } from '../Text';
import { useTranslation } from '../../hooks/translation';
import { useAsyncValidator } from '../../hooks/useAsyncValidator';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { IconButton } from './IconButton';
import { useAppContext } from '../../hooks/appContext';
import { Address } from '@ton/core';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { seeIfInvalidDns } from '../transfer/RecipientView';
import { DNSApi } from '@tonkeeper/core/dist/tonApiV2';
import { TextareaAutosize } from './TextareaAutosize';
import { InputBlock, Label } from './Input';

const SpinnerRingStyled = styled(SpinnerRing)`
    transform: scale(1.2);
`;

const Body2Secondary = styled(Body2)`
    white-space: nowrap;
    color: ${p => p.theme.textSecondary};
`;

const AddressText = styled(Body2Secondary)`
    white-space: nowrap;
    cursor: pointer;
`;

const AlignCenter = styled.div`
    align-self: center;
    display: flex;
    align-items: center;
    flex-shrink: 0;
    gap: 6px;

    > * {
        flex-shrink: 0;
    }
`;

const InputBlockStyled = styled(InputBlock)`
    padding-right: 1rem;
`;

const fieldName = 'field';
type FieldValues = Record<typeof fieldName, TonRecipient>;

export const TonRecipientInput = forwardRef<
    HTMLInputElement,
    {
        onChange?: (recipient: TonRecipient | undefined) => void;
        onIsErroredChange?: (isErrored: boolean) => void;
        onIsLoadingChange?: (isLoading: boolean) => void;
        onStateChange?: (state: {
            isLoading: boolean;
            isErrored: boolean;
            value: TonRecipient | undefined;
        }) => void;
        className?: string;
        placeholder?: string;
        isFormSubmitted?: boolean;
    }
>(
    (
        {
            onStateChange,
            onChange,
            onIsErroredChange,
            onIsLoadingChange,
            className,
            placeholder,
            isFormSubmitted
        },
        ref
    ) => {
        const { t } = useTranslation();
        const [focus, setFocus] = useState(false);
        const [inputValue, setInputValue] = useState('');
        const inputTouched = useRef(false);

        const validator = useTonRecipientValidator();

        const [error, setError] = useState<ErrorOption>();
        const clearErrors = useCallback(() => {
            setError(undefined);
        }, []);

        const setErrorMethod: UseFormSetError<FieldValues> = useCallback((_, e) => {
            setError(e);
        }, []);

        useEffect(() => {
            onIsErroredChange?.(!!error);
        }, [onIsErroredChange, error]);

        useEffect(() => {
            if (isFormSubmitted) {
                setError({
                    message: 'Required'
                });
            }
        }, [isFormSubmitted]);

        const [validationState, validationProduct] = useAsyncValidator<
            string,
            string,
            TonRecipient
        >(
            {
                clearErrors: clearErrors,
                setError: setErrorMethod
            },
            inputValue,
            fieldName,
            validator
        );
        const isValidating = validationState === 'validating';

        useEffect(() => {
            onIsLoadingChange?.(isValidating);
        }, [onIsLoadingChange, isValidating]);

        useEffect(() => {
            if (!inputTouched.current) {
                return;
            }
            onChange?.(validationProduct);
        }, [onChange, validationProduct]);

        useEffect(() => {
            if (!inputTouched.current) {
                return;
            }

            onStateChange?.({
                isErrored: !!error,
                isLoading: isValidating,
                value: validationProduct
            });
        }, [onStateChange, validationProduct, isValidating, error]);

        const { onCopy, copied } = useCopyToClipboard(validationProduct?.address ?? '');

        return (
            <InputBlockStyled focus={focus} valid={!error} scanner className={className}>
                <TextareaAutosize
                    ref={ref as ForwardedRef<HTMLTextAreaElement>}
                    value={inputValue}
                    onChange={e => {
                        inputTouched.current = true;
                        setInputValue(e.target.value);
                    }}
                    onFocus={() => setFocus(true)}
                    onBlur={() => setFocus(false)}
                />
                <Label active={!!inputValue}>
                    {placeholder ?? t('transactionDetails_recipient')}
                </Label>

                <AlignCenter>
                    {isValidating && <SpinnerRingStyled />}
                    {!isValidating &&
                        validationProduct &&
                        'dns' in validationProduct &&
                        (copied ? (
                            <Body2Secondary>{t('address_copied')}</Body2Secondary>
                        ) : (
                            <AddressText onClick={onCopy}>
                                {toShortValue(formatAddress(validationProduct.address))}
                            </AddressText>
                        ))}
                    {!isValidating && inputValue && (
                        <IconButton
                            onClick={() => {
                                inputTouched.current = true;
                                setInputValue('');
                            }}
                        >
                            <XMarkCircleIcon />
                        </IconButton>
                    )}
                </AlignCenter>
            </InputBlockStyled>
        );
    }
);

export const useTonRecipientValidator = () => {
    const { api } = useAppContext();
    return useCallback<
        (
            val: string
        ) => Promise<ErrorOption | undefined | null | { success: true; result: TonRecipient }>
    >(
        async (value: string) => {
            value = value.trim();

            if (!value) {
                return {
                    message: 'Empty receiver'
                };
            }

            if (seeIfValidTonAddress(value)) {
                let bounce = false;
                if (Address.isFriendly(value)) {
                    bounce = Address.parseFriendly(value).isBounceable;
                }

                return {
                    success: true,
                    result: {
                        address: value,
                        bounce,
                        blockchain: BLOCKCHAIN_NAME.TON
                    }
                };
            }

            if (seeIfInvalidDns(value)) {
                return {
                    message: 'Wrong address format'
                };
            }
            value = value.toLowerCase();

            try {
                const result = await new DNSApi(api.tonApiV2).dnsResolve({ domainName: value });
                if (result.wallet) {
                    return {
                        success: true,
                        result: {
                            address: result.wallet.address,
                            dns: result.wallet,
                            blockchain: BLOCKCHAIN_NAME.TON
                        }
                    };
                } else {
                    return {
                        message: 'Wrong DNS wallet'
                    };
                }
            } catch (e) {
                console.error(e);
                return {
                    message: 'Wrong DNS wallet'
                };
            }
        },
        [api]
    );
};
