import styled, { useTheme } from 'styled-components';
import { Body2, Label2 } from '../../Text';
import { useTranslation } from '../../../hooks/translation';
import { BatteryBalance, useBatteryBalance, useBatteryPacks } from '../../../state/battery';
import { FC } from 'react';
import { Dot } from '../../Dot';
import { BatterySettingsNotification } from './BatterySettingsNotification';
import { useDisclosure } from '../../../hooks/useDisclosure';
import { useActiveTonWalletConfig } from '../../../state/wallet';
import { TonWalletConfig } from '@tonkeeper/core/dist/entries/wallet';

export const BatteryIconCharging = () => {
    const theme = useTheme();

    return (
        <svg
            width="68"
            height="114"
            viewBox="0 0 68 114"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                opacity="0.64"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M23.0435 10.0162C23.5411 4.40199 28.2565 0 34.0001 0C39.7437 0 44.4591 4.40199 44.9567 10.0162C53.2387 10.0931 57.9328 10.5333 61.4046 13.0557C62.7629 14.0426 63.9574 15.2371 64.9443 16.5954C68 20.8013 68 26.8009 68 38.8V85.2C68 97.1991 68 103.199 64.9443 107.405C63.9574 108.763 62.7629 109.957 61.4046 110.944C57.1987 114 51.1991 114 39.2 114H28.8C16.8009 114 10.8013 114 6.59544 110.944C5.23712 109.957 4.0426 108.763 3.05573 107.405C0 103.199 0 97.1991 0 85.2V38.8C0 26.8009 0 20.8013 3.05573 16.5954C4.0426 15.2371 5.23712 14.0426 6.59544 13.0557C10.0673 10.5333 14.7614 10.0931 23.0435 10.0162ZM4 35.6C4 26.6006 4 22.101 6.2918 18.9466C7.03195 17.9278 7.92784 17.032 8.94658 16.2918C12.101 14 16.6006 14 25.6 14H42.4C51.3994 14 55.899 14 59.0534 16.2918C60.0722 17.032 60.968 17.9278 61.7082 18.9466C64 22.101 64 26.6006 64 35.6V88.4C64 97.3994 64 101.899 61.7082 105.053C60.968 106.072 60.0722 106.968 59.0534 107.708C55.899 110 51.3994 110 42.4 110H25.6C16.6006 110 12.101 110 8.94658 107.708C7.92784 106.968 7.03195 106.072 6.2918 105.053C4 101.899 4 97.3994 4 88.4V35.6Z"
                fill={theme.iconTertiary}
            />
            <path
                d="M23.8021 57.4375L32.9172 46.4994C35.7678 43.0787 37.1931 41.3683 38.2361 41.8466C39.2791 42.3249 38.9131 44.521 38.1811 48.9132L37.3739 53.7563C37.1968 54.8188 37.1082 55.3501 37.3758 55.7466C37.6433 56.1432 38.1691 56.26 39.2206 56.4937L40.8899 56.8647C45.1897 57.8202 47.3396 58.2979 47.8835 59.8926C48.4274 61.4872 47.0175 63.1791 44.1977 66.5629L35.0826 77.501C32.232 80.9217 30.8067 82.6321 29.7637 82.1538C28.7207 81.6755 29.0867 79.4794 29.8187 75.0872L30.6259 70.2441C30.803 69.1816 30.8915 68.6503 30.624 68.2538C30.3565 67.8572 29.8307 67.7404 28.7792 67.5067L27.1099 67.1358C22.8101 66.1802 20.6602 65.7025 20.1163 64.1078C19.5724 62.5132 20.9823 60.8213 23.8021 57.4375Z"
                fill={theme.accentBlueConstant}
            />
        </svg>
    );
};

const BatteryIconFull = () => {
    const theme = useTheme();

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="128"
            height="128"
            viewBox="0 0 128 128"
            fill="none"
        >
            <path
                opacity="0.64"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M53.0435 16.0162C53.5411 10.402 58.2565 6 64.0001 6C69.7437 6 74.4591 10.402 74.9567 16.0162C83.2387 16.0931 87.9328 16.5333 91.4046 19.0557C92.7629 20.0426 93.9574 21.2371 94.9443 22.5954C98 26.8013 98 32.8009 98 44.8V91.2C98 103.199 98 109.199 94.9443 113.405C93.9574 114.763 92.7629 115.957 91.4046 116.944C87.1987 120 81.1991 120 69.2 120H58.8C46.8009 120 40.8013 120 36.5954 116.944C35.2371 115.957 34.0426 114.763 33.0557 113.405C30 109.199 30 103.199 30 91.2V44.8C30 32.8009 30 26.8013 33.0557 22.5954C34.0426 21.2371 35.2371 20.0426 36.5954 19.0557C40.0673 16.5333 44.7614 16.0931 53.0435 16.0162ZM34 41.6C34 32.6006 34 28.101 36.2918 24.9466C37.032 23.9278 37.9278 23.032 38.9466 22.2918C42.101 20 46.6006 20 55.6 20H72.4C81.3994 20 85.899 20 89.0534 22.2918C90.0722 23.032 90.968 23.9278 91.7082 24.9466C94 28.101 94 32.6006 94 41.6V94.4C94 103.399 94 107.899 91.7082 111.053C90.968 112.072 90.0722 112.968 89.0534 113.708C85.899 116 81.3994 116 72.4 116H55.6C46.6006 116 42.101 116 38.9466 113.708C37.9278 112.968 37.032 112.072 36.2918 111.053C34 107.899 34 103.399 34 94.4V41.6Z"
                fill={theme.iconTertiary}
            />
            <path
                d="M38 36.8C38 32.3196 38 30.0794 38.8719 28.3681C39.6389 26.8628 40.8628 25.6389 42.3681 24.8719C44.0794 24 46.3196 24 50.8 24H77.2C81.6804 24 83.9206 24 85.6319 24.8719C87.1372 25.6389 88.3611 26.8628 89.1281 28.3681C90 30.0794 90 32.3196 90 36.8V99.2C90 103.68 90 105.921 89.1281 107.632C88.3611 109.137 87.1372 110.361 85.6319 111.128C83.9206 112 81.6804 112 77.2 112H50.8C46.3196 112 44.0794 112 42.3681 111.128C40.8628 110.361 39.6389 109.137 38.8719 107.632C38 105.921 38 103.68 38 99.2V36.8Z"
                fill={theme.accentBlueConstant}
            />
        </svg>
    );
};

const BatteryIconHalf = () => {
    const theme = useTheme();

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="128"
            height="128"
            viewBox="0 0 128 128"
            fill="none"
        >
            <path
                opacity="0.64"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M53.0435 16.0162C53.5411 10.402 58.2565 6 64.0001 6C69.7437 6 74.4591 10.402 74.9567 16.0162C83.2387 16.0931 87.9328 16.5333 91.4046 19.0557C92.7629 20.0426 93.9574 21.2371 94.9443 22.5954C98 26.8013 98 32.8009 98 44.8V91.2C98 103.199 98 109.199 94.9443 113.405C93.9574 114.763 92.7629 115.957 91.4046 116.944C87.1987 120 81.1991 120 69.2 120H58.8C46.8009 120 40.8013 120 36.5954 116.944C35.2371 115.957 34.0426 114.763 33.0557 113.405C30 109.199 30 103.199 30 91.2V44.8C30 32.8009 30 26.8013 33.0557 22.5954C34.0426 21.2371 35.2371 20.0426 36.5954 19.0557C40.0673 16.5333 44.7614 16.0931 53.0435 16.0162ZM34 41.6C34 32.6006 34 28.101 36.2918 24.9466C37.032 23.9278 37.9278 23.032 38.9466 22.2918C42.101 20 46.6006 20 55.6 20H72.4C81.3994 20 85.899 20 89.0534 22.2918C90.0722 23.032 90.968 23.9278 91.7082 24.9466C94 28.101 94 32.6006 94 41.6V94.4C94 103.399 94 107.899 91.7082 111.053C90.968 112.072 90.0722 112.968 89.0534 113.708C85.899 116 81.3994 116 72.4 116H55.6C46.6006 116 42.101 116 38.9466 113.708C37.9278 112.968 37.032 112.072 36.2918 111.053C34 107.899 34 103.399 34 94.4V41.6Z"
                fill={theme.iconTertiary}
            />
            <path
                d="M38 80.8C38 76.3196 38 74.0794 38.8719 72.3681C39.6389 70.8628 40.8628 69.6389 42.3681 68.8719C44.0794 68 46.3196 68 50.8 68H77.2C81.6804 68 83.9206 68 85.6319 68.8719C87.1372 69.6389 88.3611 70.8628 89.1281 72.3681C90 74.0794 90 76.3196 90 80.8V99.2C90 103.68 90 105.921 89.1281 107.632C88.3611 109.137 87.1372 110.361 85.6319 111.128C83.9206 112 81.6804 112 77.2 112H50.8C46.3196 112 44.0794 112 42.3681 111.128C40.8628 110.361 39.6389 109.137 38.8719 107.632C38 105.921 38 103.68 38 99.2V80.8Z"
                fill={theme.accentBlueConstant}
            />
        </svg>
    );
};

const BatteryIconQuarter = () => {
    const theme = useTheme();

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="128"
            height="128"
            viewBox="0 0 128 128"
            fill="none"
        >
            <path
                opacity="0.64"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M53.0435 16.0162C53.5411 10.402 58.2565 6 64.0001 6C69.7437 6 74.4591 10.402 74.9567 16.0162C83.2387 16.0931 87.9328 16.5333 91.4046 19.0557C92.7629 20.0426 93.9574 21.2371 94.9443 22.5954C98 26.8013 98 32.8009 98 44.8V91.2C98 103.199 98 109.199 94.9443 113.405C93.9574 114.763 92.7629 115.957 91.4046 116.944C87.1987 120 81.1991 120 69.2 120H58.8C46.8009 120 40.8013 120 36.5954 116.944C35.2371 115.957 34.0426 114.763 33.0557 113.405C30 109.199 30 103.199 30 91.2V44.8C30 32.8009 30 26.8013 33.0557 22.5954C34.0426 21.2371 35.2371 20.0426 36.5954 19.0557C40.0673 16.5333 44.7614 16.0931 53.0435 16.0162ZM34 41.6C34 32.6006 34 28.101 36.2918 24.9466C37.032 23.9278 37.9278 23.032 38.9466 22.2918C42.101 20 46.6006 20 55.6 20H72.4C81.3994 20 85.899 20 89.0534 22.2918C90.0722 23.032 90.968 23.9278 91.7082 24.9466C94 28.101 94 32.6006 94 41.6V94.4C94 103.399 94 107.899 91.7082 111.053C90.968 112.072 90.0722 112.968 89.0534 113.708C85.899 116 81.3994 116 72.4 116H55.6C46.6006 116 42.101 116 38.9466 113.708C37.9278 112.968 37.032 112.072 36.2918 111.053C34 107.899 34 103.399 34 94.4V41.6Z"
                fill={theme.iconTertiary}
            />
            <path
                d="M38.0767 104C38.08 105.569 38.3878 106.682 38.8719 107.632C39.6389 109.137 40.8627 110.361 42.368 111.128C44.0793 112 46.3195 112 50.7999 112H77.1999C81.6803 112 83.9206 112 85.6318 111.128C87.1371 110.361 88.361 109.137 89.128 107.632C89.6121 106.682 89.92 105.568 89.9232 103.999C89.92 102.431 89.612 101.318 89.1279 100.368C88.361 98.8628 87.1371 97.6389 85.6318 96.8719C83.9205 96 81.6803 96 77.1999 96H50.7999C46.3195 96 44.0793 96 42.368 96.8719C40.8627 97.6389 39.6388 98.8628 38.8718 100.368C38.3878 101.318 38.08 102.431 38.0767 104Z"
                fill={theme.accentOrange}
            />
        </svg>
    );
};

const BatteryIcon: FC<{ balance: BatteryBalance }> = ({ balance }) => {
    const packs = useBatteryPacks();

    if (balance.tonUnitsBalance.weiAmount.isZero()) {
        return <BatteryIconCharging />;
    }

    if (balance.tonUnitsBalance.isLTE(packs.find(p => p.type === 'small')!.value)) {
        return <BatteryIconQuarter />;
    }

    if (balance.tonUnitsBalance.isLTE(packs.find(p => p.type === 'medium')!.value)) {
        return <BatteryIconHalf />;
    }

    return <BatteryIconFull />;
};

const Container = styled.div`
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 1rem;
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
            <BatteryIcon balance={balance} />
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
