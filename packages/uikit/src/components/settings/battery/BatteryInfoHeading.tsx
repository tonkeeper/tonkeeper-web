import styled from 'styled-components';
import { Body2, Label2 } from '../../Text';
import { useTranslation } from '../../../hooks/translation';
import { BatteryBalance, useBatteryBalance } from '../../../state/battery';
import { FC, SVGAttributes } from 'react';
import { Dot } from '../../Dot';
import { BatterySettingsNotification } from './BatterySettingsNotification';
import { useDisclosure } from '../../../hooks/useDisclosure';
import { useActiveTonWalletConfig } from '../../../state/wallet';
import { TonWalletConfig } from '@tonkeeper/core/dist/entries/wallet';
import {
    BatteryChargingIcon,
    BatteryFullIcon,
    BatteryHalfIcon,
    BatteryQuarterIcon
} from './BatteryIcons';

const mediumBatteryValue = 250;
const smallBatteryValue = 150;

export const BatteryBalanceIcon: FC<{ balance: BatteryBalance } & SVGAttributes<SVGElement>> = ({
    balance,
    ...props
}) => {
    if (balance.tonUnitsBalance.weiAmount.isZero()) {
        return <BatteryChargingIcon {...props} />;
    }

    if (balance.batteryUnitsBalance.lte(smallBatteryValue)) {
        return <BatteryQuarterIcon color="accentOrange" {...props} />;
    }

    if (balance.batteryUnitsBalance.lte(mediumBatteryValue)) {
        return <BatteryHalfIcon {...props} />;
    }

    return <BatteryFullIcon {...props} />;
};

const Container = styled.div`
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 1rem;

    > svg {
        height: 128px;
        width: auto;
    }
`;

const TextBlock = styled.div`
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 4px;

    > ${Body2} {
        color: ${p => p.theme.textSecondary};
    }
`;

const DotStyled = styled(Dot)`
    color: ${p => p.theme.textSecondary};
`;

const Body2Highlighted = styled(Body2)`
    color: ${p => p.theme.accentBlueConstant};
    cursor: pointer;
`;

export const BatteryInfoHeading = () => {
    const { t } = useTranslation();
    const { data: balance } = useBatteryBalance();
    const { isOpen, onClose, onOpen } = useDisclosure();
    const { data: config } = useActiveTonWalletConfig();

    if (!balance || !config) {
        return null;
    }

    let willBePaidText;
    if (Object.values(config.batterySettings).some(Boolean)) {
        const translationsMap = {
            enabledForSwaps: 'battery_transactions_type_swap',
            enabledForTokens: 'battery_transactions_type_transfer',
            enabledForNfts: 'battery_transactions_types_nft'
        };
        const willBePaidItems = [t('battery_transactions_type_usdt_trc20_transfer')]
            .concat(
                Object.entries(config.batterySettings)
                    .filter(([_, v]) => v)
                    .map(([k]) => t(translationsMap[k as keyof TonWalletConfig['batterySettings']]))
            )
            .join(', ');

        willBePaidText = t('battery_info_will_be_paid', { items: willBePaidItems });
    }

    return (
        <Container>
            <BatteryBalanceIcon balance={balance} />
            <TextBlock>
                <Label2>
                    {t('battery_title')}
                    {!balance.batteryUnitsBalance.isZero() && (
                        <>
                            <DotStyled />
                            {t('battery_charges', {
                                charges: balance.batteryUnitsBalance.toString()
                            })}
                        </>
                    )}
                </Label2>
                {balance.batteryUnitsBalance.isZero() ? (
                    <div>
                        <Body2>{t('battery_capabilities_description_web')}</Body2>{' '}
                        <Body2Highlighted onClick={onOpen}>
                            {t('battery_capabilities_supported_transactions_label')}
                        </Body2Highlighted>
                    </div>
                ) : (
                    !!willBePaidText && <Body2>{willBePaidText}</Body2>
                )}
            </TextBlock>
            <BatterySettingsNotification isOpen={isOpen} onClose={onClose} hideSelection />
        </Container>
    );
};
