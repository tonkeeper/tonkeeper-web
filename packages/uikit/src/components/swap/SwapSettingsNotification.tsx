import { FC, useLayoutEffect, useRef, useState } from 'react';
import { styled } from 'styled-components';
import { Notification } from '../Notification';
import { Body3, Label2 } from '../Text';
import { RadioFlatInput } from '../shared/RadioFlatInput';
import { BorderSmallResponsive } from '../shared/Styles';
import { Button } from '../fields/Button';
import { useTranslation } from '../../hooks/translation';
import { useSwapOptions, useMutateSwapOptions, SwapOptions } from '../../state/swap/useSwapOptions';
import { getDecimalSeparator, getNotDecimalSeparator } from '@tonkeeper/core/dist/utils/formatting';

const SettingSection = styled.div`
    display: flex;
    flex-direction: column;
    padding-bottom: 16px;
`;

const SettingTextBlock = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px 0;
`;

const DescriptionText = styled(Body3)`
    color: ${p => p.theme.textSecondary};
`;

const OptionsRow = styled.div`
    display: flex;
    gap: 8px;
`;

const RadioStyled = styled(RadioFlatInput)`
    height: 36px;
    width: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const RadioStyledFlex = styled(RadioFlatInput)`
    height: 36px;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const CustomInputContainer = styled.label<{ $active: boolean }>`
    height: 36px;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
    padding: 0 12px;
    box-sizing: border-box;
    ${BorderSmallResponsive};
    background: ${p => p.theme.fieldBackground};
    border: 1px solid ${p => (p.$active ? p.theme.accentBlue : 'transparent')};
    transition: border-color 0.15s ease-in-out;
    cursor: pointer;
`;

const CustomInputField = styled.input`
    border: none;
    outline: none;
    background: transparent;
    color: ${p => p.theme.textPrimary};
    font-family: inherit;
    font-size: inherit;
    width: 100%;
    text-align: center;
    padding: 0;

    &::placeholder {
        color: ${p => p.theme.textSecondary};
    }
`;

const Suffix = styled(Body3)`
    color: ${p => p.theme.textSecondary};
    flex-shrink: 0;
`;

const ButtonsRow = styled.div`
    display: flex;
    gap: 8px;
    padding: 16px 0;

    > * {
        flex: 1;
    }
`;

const StyledNotification = styled(Notification)`
    max-width: 400px;
`;

const PRICE_IMPACT_OPTIONS = [
    { label: '10%', value: 0.1 },
    { label: '20%', value: 0.2 },
    { label: '30%', value: 0.3 }
] as const;

const SLIPPAGE_PRESETS = [
    { label: '0.5%', value: 50 },
    { label: '1%', value: 100 },
    { label: '5%', value: 500 }
] as const;

const SwapSettingsContent: FC<{ afterClose: (action?: () => void) => void }> = ({ afterClose }) => {
    const { t } = useTranslation();
    const { data: options } = useSwapOptions();
    const { mutateAsync } = useMutateSwapOptions();

    const [priceImpact, setPriceImpact] = useState<number>(0.3);
    const [slippageMode, setSlippageMode] = useState<'preset' | 'custom'>('preset');
    const [slippageBps, setSlippageBps] = useState<number>(50);
    const [customValue, setCustomValue] = useState<string>('');
    const customInputRef = useRef<HTMLInputElement>(null);

    useLayoutEffect(() => {
        if (!options) return;
        setPriceImpact(options.maxPriceImpact);

        const isPreset = SLIPPAGE_PRESETS.some(p => p.value === options.slippageBps);
        if (isPreset) {
            setSlippageMode('preset');
            setSlippageBps(options.slippageBps);
            setCustomValue('');
        } else {
            setSlippageMode('custom');
            setCustomValue(String(options.slippageBps / 100).replace('.', getDecimalSeparator()));
        }
    }, [options]);

    const parseCustomValue = (val: string) => parseFloat(val.replace(getDecimalSeparator(), '.'));

    const handleSave = () => {
        let finalSlippageBps: number;
        if (slippageMode === 'custom') {
            const parsed = parseCustomValue(customValue);
            if (isNaN(parsed) || parsed <= 0 || parsed > 50) return;
            finalSlippageBps = Math.round(parsed * 100);
        } else {
            finalSlippageBps = slippageBps;
        }

        const update: Partial<SwapOptions> = {
            slippageBps: finalSlippageBps,
            maxPriceImpact: priceImpact
        };

        afterClose(() => {
            mutateAsync(update);
        });
    };

    const isCustomValid =
        slippageMode !== 'custom' ||
        (() => {
            const parsed = parseCustomValue(customValue);
            return !isNaN(parsed) && parsed > 0 && parsed <= 50;
        })();

    return (
        <>
            <SettingSection>
                <SettingTextBlock>
                    <Label2>{t('swap_price_impact')}</Label2>
                    <DescriptionText>{t('swap_price_impact_description')}</DescriptionText>
                </SettingTextBlock>
                <OptionsRow>
                    {PRICE_IMPACT_OPTIONS.map(opt => (
                        <RadioStyled
                            key={opt.value}
                            name="priceImpact"
                            checked={priceImpact === opt.value}
                            onChange={() => setPriceImpact(opt.value)}
                        >
                            {opt.label}
                        </RadioStyled>
                    ))}
                    <RadioStyledFlex
                        name="priceImpact"
                        checked={priceImpact === Infinity}
                        onChange={() => setPriceImpact(Infinity)}
                    >
                        {t('swap_price_impact_ignore_variant')}
                    </RadioStyledFlex>
                </OptionsRow>
            </SettingSection>

            <SettingSection>
                <SettingTextBlock>
                    <Label2>{t('swap_slippage_tolerance')}</Label2>
                    <DescriptionText>{t('swap_slippage_tolerance_description')}</DescriptionText>
                </SettingTextBlock>
                <OptionsRow>
                    {SLIPPAGE_PRESETS.map(opt => (
                        <RadioStyled
                            key={opt.value}
                            name="slippage"
                            checked={slippageMode === 'preset' && slippageBps === opt.value}
                            onChange={() => {
                                setSlippageMode('preset');
                                setSlippageBps(opt.value);
                                setCustomValue('');
                            }}
                        >
                            {opt.label}
                        </RadioStyled>
                    ))}
                    <CustomInputContainer
                        $active={slippageMode === 'custom'}
                        onClick={() => customInputRef.current?.focus()}
                    >
                        <CustomInputField
                            ref={customInputRef}
                            placeholder={t('swap_slippage_tolerance_placeholder_custom')}
                            value={customValue}
                            onChange={e => {
                                const decSep = getDecimalSeparator();
                                const notDecSep = getNotDecimalSeparator();
                                const val = e.target.value.replace(notDecSep, decSep);
                                const normalized = val.replace(decSep, '.');
                                if (normalized === '' || /^\d*\.?\d{0,2}$/.test(normalized)) {
                                    setCustomValue(val);
                                    setSlippageMode('custom');
                                }
                            }}
                            onFocus={() => setSlippageMode('custom')}
                        />
                        <Suffix>%</Suffix>
                    </CustomInputContainer>
                </OptionsRow>
            </SettingSection>

            <ButtonsRow>
                <Button secondary onClick={() => afterClose()}>
                    {t('cancel')}
                </Button>
                <Button primary disabled={!isCustomValid} onClick={handleSave}>
                    {t('save')}
                </Button>
            </ButtonsRow>
        </>
    );
};

export const SwapSettingsNotification: FC<{
    isOpen: boolean;
    onClose: () => void;
}> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();

    return (
        <StyledNotification isOpen={isOpen} handleClose={onClose} title={t('swap_settings')}>
            {afterClose => <SwapSettingsContent afterClose={afterClose} />}
        </StyledNotification>
    );
};
