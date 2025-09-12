import { type FC, useEffect, useRef } from 'react';

import { DoneIcon } from '../Icon';
import { Input } from '../fields/Input';
import { styled } from 'styled-components';
import { Body2Class, Label2 } from '../Text';
import { useAppSdk } from '../../hooks/appSdk';
import { useToast } from '../../hooks/useNotification';
import { useTranslation } from '../../hooks/translation';

interface IProps {
    value: string;
    onChange: (value: string) => void;
    promoCode: string | undefined;
}

export const ProPromoCodeInput: FC<IProps> = props => {
    const { value, onChange, promoCode } = props;

    const sdk = useAppSdk();
    const toast = useToast();
    const { t } = useTranslation();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const isValid = promoCode !== undefined;

    const handlePasteValue = async () => {
        try {
            const valueFromClipboard = await sdk.pasteFromClipboard();

            onChange(valueFromClipboard);
        } catch {
            toast(t('paste_failed'));
        }
    };

    const renderRightElement = () => {
        if (!value) {
            return (
                <ButtonStyled onClick={handlePasteValue} as="button" type="button">
                    {t('paste')}
                </ButtonStyled>
            );
        }

        if (isValid) {
            return <DoneIconStyled />;
        }

        return undefined;
    };

    return (
        <InputStyled
            id="crypto-promocode"
            ref={inputRef}
            isSuccess={promoCode !== undefined}
            value={value}
            onChange={onChange}
            label={t('battery_promocode_title')}
            rightElement={renderRightElement()}
            clearButton={!isValid}
        />
    );
};

const DoneIconStyled = styled(DoneIcon)`
    color: ${p => p.theme.accentGreen};
`;

const InputStyled = styled(Input)`
    input {
        ${Body2Class};
        text-transform: uppercase;
    }

    label {
        line-height: 24px;
    }
`;

const ButtonStyled = styled(Label2)`
    height: auto;
    padding: 0 0 0 1rem;
    margin-left: auto;
    color: ${props => props.theme.textAccent};
    opacity: 1;
    transition: opacity 0.3s;

    &:hover {
        opacity: 0.7;
    }
`;
