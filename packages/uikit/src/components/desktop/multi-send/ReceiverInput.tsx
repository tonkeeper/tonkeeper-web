import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import { ControllerFieldState, ControllerRenderProps } from 'react-hook-form/dist/types/controller';
import { ErrorOption, useFormContext } from 'react-hook-form';
import { useAppContext } from '../../../hooks/appContext';
import { TonRecipient } from '@tonkeeper/core/dist/entries/send';
import {
    formatAddress,
    seeIfValidTonAddress,
    toShortValue
} from '@tonkeeper/core/dist/utils/common';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { DNSApi } from '@tonkeeper/core/dist/tonApiV2';
import { useAsyncValidator } from '../../../hooks/useAsyncValidator';
import { InputBlockStyled, InputFieldStyled } from './InputStyled';
import { SpinnerRing, XMarkCircleIcon } from '../../Icon';
import styled from 'styled-components';
import { Body2 } from '../../Text';
import { IconButton } from '../../fields/IconButton';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { useTranslation } from '../../../hooks/translation';
import { seeIfInvalidDns } from '../../transfer/RecipientView';
import { Address } from '@ton/core';

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

const ReceiverInputFieldStyled = styled(InputFieldStyled)`
    min-width: 100px;
`;

export const ReceiverInput: FC<{
    field: ControllerRenderProps<
        {
            rows: {
                receiver: TonRecipient | undefined;
            }[];
        },
        `rows.${number}.receiver`
    >;
    fieldState: ControllerFieldState;
}> = ({ field, fieldState }) => {
    const { t } = useTranslation();
    const methods = useFormContext();
    const [focus, setFocus] = useState(false);
    const { api } = useAppContext();
    const [inputValue, setInputValue] = useState('');
    const inputTouched = useRef(false);

    const validator = useCallback<
        (
            val: string
        ) => Promise<ErrorOption | undefined | null | { success: true; result: TonRecipient }>
    >(
        async (value: string) => {
            value = value.trim();

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

    const [validationState, validationProduct] = useAsyncValidator<string, string, TonRecipient>(
        methods,
        inputValue,
        field.name,
        validator
    );
    const isValidating = validationState === 'validating';

    useEffect(() => {
        if (!inputTouched.current) {
            return;
        }
        field.onChange(validationProduct);
    }, [field.onChange, validationProduct]);

    useEffect(() => {
        if (!field.value) {
            return;
        }

        setInputValue(
            'dns' in field.value && field.value.dns.account.name
                ? field.value.dns.account.name
                : Address.parse(field.value.address).toString({ bounceable: false })
        );
    }, []);

    const { onCopy, copied } = useCopyToClipboard(
        validationProduct?.address
            ? Address.parse(validationProduct?.address).toString({ bounceable: false })
            : ''
    );

    return (
        <InputBlockStyled valid={!fieldState.invalid} focus={focus}>
            <ReceiverInputFieldStyled
                {...field}
                onFocus={() => setFocus(true)}
                onBlur={() => setFocus(false)}
                onChange={e => {
                    setInputValue(e.target.value);
                    inputTouched.current = true;
                }}
                value={inputValue}
                placeholder={t('transactionDetails_recipient')}
            />
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
                <IconButton onClick={() => setInputValue('')}>
                    <XMarkCircleIcon />
                </IconButton>
            )}
        </InputBlockStyled>
    );
};
