import React, { FC, useEffect, useRef, useState } from 'react';
import { ControllerFieldState, ControllerRenderProps } from 'react-hook-form/dist/types/controller';
import { useFormContext } from 'react-hook-form';
import { TonRecipient } from '@tonkeeper/core/dist/entries/send';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { useAsyncValidator } from '../../../hooks/useAsyncValidator';
import { InputBlockStyled, InputFieldStyled } from './InputStyled';
import { SpinnerRing, XMarkCircleIcon } from '../../Icon';
import styled from 'styled-components';
import { Body2 } from '../../Text';
import { IconButton } from '../../fields/IconButton';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { useTranslation } from '../../../hooks/translation';
import { Address } from '@ton/core';
import { useMultiSendReceiverValidator } from '../../../state/multiSend';

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
                receiver: TonRecipient | null;
            }[];
        },
        `rows.${number}.receiver`
    >;
    fieldState: ControllerFieldState;
}> = ({ field, fieldState }) => {
    const { t } = useTranslation();
    const methods = useFormContext();
    const [focus, setFocus] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const inputTouched = useRef(false);

    const validator = useMultiSendReceiverValidator();

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
                    inputTouched.current = true;
                    setInputValue(e.target.value);
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
                <IconButton
                    onClick={() => {
                        inputTouched.current = true;
                        setInputValue('');
                    }}
                >
                    <XMarkCircleIcon />
                </IconButton>
            )}
        </InputBlockStyled>
    );
};
