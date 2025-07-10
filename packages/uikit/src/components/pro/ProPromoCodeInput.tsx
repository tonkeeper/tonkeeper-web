import { type FC } from 'react';
import { useTranslation } from '../../hooks/translation';
import { Input } from '../fields/Input';
import { styled } from 'styled-components';
import { Body2Class, Label2 } from '../Text';
import { useAppSdk } from '../../hooks/appSdk';

interface IProps {
    value: string;
    onChange: (value: string) => void;
    promoCode: string | undefined;
}

export const ProPromoCodeInput: FC<IProps> = props => {
    const sdk = useAppSdk();
    const { value, onChange, promoCode } = props;
    const { t } = useTranslation();

    const handlePasteValue = async () => {
        const valueFromClipboard = await sdk.pasteFromClipboard();

        onChange(valueFromClipboard);
    };

    return (
        <InputStyled
            id="crypto-promocode"
            size="small"
            isSuccess={promoCode !== undefined}
            value={value}
            onChange={onChange}
            label={t('battery_promocode_title')}
            rightElement={
                !value && (
                    <ButtonStyled onClick={handlePasteValue} as="button" type="button">
                        {t('paste')}
                    </ButtonStyled>
                )
            }
            clearButton
        />
    );
};

const InputStyled = styled(Input)`
    input {
        ${Body2Class};
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
