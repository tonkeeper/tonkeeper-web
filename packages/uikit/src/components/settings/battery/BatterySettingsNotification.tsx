import { FC, useEffect, useState } from 'react';
import { Notification, NotificationFooterPortal } from '../../Notification';
import { useActiveTonWalletConfig, useMutateActiveTonWalletConfig } from '../../../state/wallet';
import styled, { css } from 'styled-components';
import { Body1Body2Responsive, Body3, H2Label2Responsive, Label2 } from '../../Text';
import { useTranslation } from '../../../hooks/translation';
import { ListBlockDesktopAdaptive, ListItem, ListItemPayload } from '../../List';
import { Checkbox } from '../../fields/Checkbox';
import { TonWalletConfig } from '@tonkeeper/core/dist/entries/wallet';
import { Button } from '../../fields/Button';
import { useBatteryServiceConfig } from '../../../state/battery';

const NotificationStyled = styled(Notification)<{ $hideSelection?: boolean }>`
    max-width: 400px;

    ${p =>
        p.$hideSelection
            ? css`
                  .dialog-header {
                      padding-top: 8px;
                      padding-bottom: 8px;
                  }
              `
            : css`
                  .dialog-header {
                      padding-top: 6px;
                      padding-bottom: 0;
                      height: 32px;
                      box-sizing: border-box;
                  }
              `}
`;

export const BatterySettingsNotification: FC<{
    isOpen: boolean;
    onClose: () => void;
    hideSelection?: boolean;
}> = ({ isOpen, onClose, hideSelection }) => {
    useActiveTonWalletConfig();
    const { t } = useTranslation();

    return (
        <NotificationStyled
            isOpen={isOpen}
            handleClose={onClose}
            title={hideSelection ? t('battery_transactions_title') : undefined}
            $hideSelection={hideSelection}
        >
            {() => (
                <BatterySettingsNotificationContentConfigProvider
                    onClose={onClose}
                    hideSelection={hideSelection}
                />
            )}
        </NotificationStyled>
    );
};

const Heading = styled.div`
    display: flex;
    flex-direction: column;
    text-align: center;
    align-items: center;
    gap: 4px;
    width: 304px;
    text-wrap: balance;
    margin: 0 auto 24px;
`;

const ListItemText = styled.div`
    display: flex;
    flex-direction: column;

    ${Body3} {
        color: ${p => p.theme.textSecondary};
    }
`;

const TronDisclaimer = styled(Body3)`
    margin-top: 6px;
    color: ${p => p.theme.accentOrange} !important;
`;

const ListBlockStyled = styled(ListBlockDesktopAdaptive)<{ $hideSelection?: boolean }>`
    ${p =>
        p.theme.displayType === 'full-width' &&
        css`
            margin: 0 -1rem;
        `}

    > * {
        cursor: ${p => (p.$hideSelection ? 'auto' : 'pointer')};
    }

    ${p =>
        p.$hideSelection &&
        css`
            > *:last-child {
                > * {
                    border-bottom: none !important;
                }
            }
        `}
`;

const CheckboxStyled = styled(Checkbox)`
    pointer-events: none;
`;

const ButtonsBlock = styled.div`
    display: flex;
    gap: 0.5rem;
    padding-top: 1rem;

    > * {
        flex: 1;
    }
`;

const BatterySettingsNotificationContentConfigProvider: FC<{
    onClose: () => void;
    hideSelection?: boolean;
}> = ({ onClose, hideSelection }) => {
    const { data: config } = useActiveTonWalletConfig();

    if (!config) {
        return null;
    }

    return (
        <BatterySettingsNotificationContent
            batterySettings={config.batterySettings}
            hideSelection={hideSelection}
            onClose={onClose}
        />
    );
};

const BatterySettingsNotificationContent: FC<{
    batterySettings: TonWalletConfig['batterySettings'];
    hideSelection?: boolean;
    onClose: () => void;
}> = ({ batterySettings, onClose, hideSelection }) => {
    const { t } = useTranslation();
    const batteryConfig = useBatteryServiceConfig();

    const [batterySettingsOptimistic, setBatterySettingsOptimistic] = useState(batterySettings);
    const { mutateAsync } = useMutateActiveTonWalletConfig();

    useEffect(() => {
        setBatterySettingsOptimistic(batterySettings);
    }, [batterySettings]);

    const onToggleCheckbox = (key: keyof TonWalletConfig['batterySettings']) => {
        if (!hideSelection) {
            setBatterySettingsOptimistic(v => ({ ...v, [key]: !v[key] }));
        }
    };

    const onSave = async () => {
        await mutateAsync({ batterySettings: batterySettingsOptimistic });
        onClose();
    };

    const batterySwapCharges = batteryConfig.meanPrices.batteryMeanPriceSwap;
    const batteryJettonCharges = batteryConfig.meanPrices.batteryMeanPriceJetton;
    const batteryNFTCharges = batteryConfig.meanPrices.batteryMeanPriceNft;
    const batteryTRC20Charges = batteryConfig.meanPrices.batteryMeanPriceTronUsdt;

    return (
        <>
            {!hideSelection && (
                <Heading>
                    <H2Label2Responsive>{t('battery_transactions_settings')}</H2Label2Responsive>
                    <Body1Body2Responsive secondary>
                        {t('battery_transactions_description')}
                    </Body1Body2Responsive>
                </Heading>
            )}
            <ListBlockStyled $hideSelection={hideSelection}>
                {!!batteryTRC20Charges && (
                    <ListItem hover={false}>
                        <ListItemPayload>
                            <ListItemText>
                                <Label2>{t('battery_settings_trc20_transfer_title')}</Label2>
                                <Body3>
                                    {t('battery_settings_token_transfer_price', {
                                        charges: batteryTRC20Charges
                                    })}
                                </Body3>
                                <TronDisclaimer>
                                    {t('battery_settings_trc20_transfer_disclamer')}
                                </TronDisclaimer>
                            </ListItemText>
                            {!hideSelection && <CheckboxStyled disabled checked />}
                        </ListItemPayload>
                    </ListItem>
                )}
                {!!batterySwapCharges && (
                    <ListItem hover={false} onClick={() => onToggleCheckbox('enabledForSwaps')}>
                        <ListItemPayload>
                            <ListItemText>
                                <Label2>{t('battery_settings_swap_title')}</Label2>
                                <Body3>
                                    {t('battery_settings_swap_price', {
                                        charges: batterySwapCharges
                                    })}
                                </Body3>
                            </ListItemText>
                            {!hideSelection && (
                                <CheckboxStyled
                                    checked={batterySettingsOptimistic.enabledForSwaps}
                                />
                            )}
                        </ListItemPayload>
                    </ListItem>
                )}
                {!!batteryNFTCharges && (
                    <ListItem hover={false} onClick={() => onToggleCheckbox('enabledForNfts')}>
                        <ListItemPayload>
                            <ListItemText>
                                <Label2>{t('battery_settings_nft_title')}</Label2>
                                <Body3>
                                    {t('battery_settings_nft_price', {
                                        charges: batteryNFTCharges
                                    })}
                                </Body3>
                            </ListItemText>
                            {!hideSelection && (
                                <CheckboxStyled
                                    checked={batterySettingsOptimistic.enabledForNfts}
                                />
                            )}
                        </ListItemPayload>
                    </ListItem>
                )}
                {!!batteryJettonCharges && (
                    <ListItem hover={false} onClick={() => onToggleCheckbox('enabledForTokens')}>
                        <ListItemPayload>
                            <ListItemText>
                                <Label2>{t('battery_settings_token_transfer_title')}</Label2>
                                <Body3>
                                    {t('battery_settings_token_transfer_price', {
                                        charges: batteryJettonCharges
                                    })}
                                </Body3>
                            </ListItemText>
                            {!hideSelection && (
                                <CheckboxStyled
                                    checked={batterySettingsOptimistic.enabledForTokens}
                                />
                            )}
                        </ListItemPayload>
                    </ListItem>
                )}
            </ListBlockStyled>
            {!hideSelection && (
                <ButtonsBlock>
                    <Button secondary onClick={onClose}>
                        {t('cancel')}
                    </Button>
                    <Button primary onClick={onSave}>
                        {t('save')}
                    </Button>
                </ButtonsBlock>
            )}
            {hideSelection && (
                <NotificationFooterPortal>
                    <div />
                </NotificationFooterPortal>
            )}
        </>
    );
};
