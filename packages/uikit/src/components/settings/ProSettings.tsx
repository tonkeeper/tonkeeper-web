import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { ProState } from '@tonkeeper/core/dist/entries/pro';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { ProServiceTier } from '@tonkeeper/core/src/tonConsoleApi';
import { FC, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useFormatCoinValue } from '../../hooks/balance';
import { useTranslation } from '../../hooks/translation';
import { useAccountState } from '../../state/account';
import {
    useBuyProServiceMutation,
    useProLogout,
    useProPlans,
    useProState,
    useSelectWalletMutation
} from '../../state/pro';
import { useWalletState } from '../../state/wallet';
import { InnerBody } from '../Body';
import { DoneIcon } from '../Icon';
import { ColumnText } from '../Layout';
import { ListBlock, ListItem, ListItemPayload } from '../List';
import { SubHeader } from '../SubHeader';
import { Body1, Label1, Title } from '../Text';
import { SubscriptionStatus } from '../aside/SubscriptionInfo';
import { Button } from '../fields/Button';
import { Radio } from '../fields/Checkbox';
import { Input } from '../fields/Input';

const Block = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
`;

const Line = styled.div`
    margin-bottom: 32px;
`;

const Icon = styled.img`
    width: 144px;
    height: 144px;
    margin-bottom: 16px;
`;

const Description = styled(Body1)`
    color: ${props => props.theme.textSecondary};
    margin-bottom: 16px;
`;

const WalletItem: FC<{ publicKey: string }> = ({ publicKey }) => {
    const { t } = useTranslation();
    const { data: wallet } = useWalletState(publicKey);

    const address = wallet
        ? toShortValue(formatAddress(wallet.active.rawAddress, wallet.network))
        : undefined;

    return (
        <ColumnText
            noWrap
            text={wallet?.name ? wallet.name : `${t('wallet_title')}`}
            secondary={address}
        />
    );
};

const SelectLabel = styled(Label1)`
    padding-left: 16px;
    margin-bottom: 8px;
`;

const SelectWallet: FC = () => {
    const { t } = useTranslation();
    const { data: accounts } = useAccountState();
    const { mutate } = useSelectWalletMutation();

    if (!accounts) return <></>;

    return (
        <>
            <SelectLabel>{t('select_wallet_for_authorization')}</SelectLabel>
            <ListBlock>
                {accounts.publicKeys.map(publicKey => (
                    <ListItem onClick={() => mutate(publicKey)}>
                        <ListItemPayload>
                            <WalletItem publicKey={publicKey} />
                        </ListItemPayload>
                    </ListItem>
                ))}
            </ListBlock>
        </>
    );
};

const SelectIconWrapper = styled.span`
    padding-left: 0.5rem;
    color: ${props => props.theme.accentBlue};
    display: flex;
`;

const ProWallet: FC<{ data: ProState; onClick: () => void; disabled?: boolean }> = ({
    data,
    onClick,
    disabled
}) => {
    return (
        <ListBlock>
            <ListItem onClick={() => !disabled && onClick()}>
                <ListItemPayload>
                    <WalletItem publicKey={data.wallet.publicKey} />
                    <SelectIconWrapper>
                        <DoneIcon />
                    </SelectIconWrapper>
                </ListItemPayload>
            </ListItem>
        </ListBlock>
    );
};

const SelectProPlans: FC<{
    plans: ProServiceTier[];
    selected: number | null;
    setPlan: (id: number) => void;
    disabled?: boolean;
}> = ({ plans, selected, setPlan, disabled }) => {
    const format = useFormatCoinValue();
    return (
        <>
            <ListBlock>
                {plans.map(plan => (
                    <ListItem onClick={() => !disabled && setPlan(plan.id)}>
                        <ListItemPayload>
                            <ColumnText
                                noWrap
                                text={plan.name}
                                secondary={
                                    <>
                                        {format(plan.amount)} {CryptoCurrency.TON}
                                    </>
                                }
                            />
                            <Radio
                                disabled={disabled}
                                checked={selected === plan.id}
                                onChange={() => setPlan(plan.id)}
                            />
                        </ListItemPayload>
                    </ListItem>
                ))}
            </ListBlock>
        </>
    );
};

const BuyProService: FC<{ data: ProState; setReLogin: () => void }> = ({ data, setReLogin }) => {
    const { t } = useTranslation();

    const ref = useRef<HTMLDivElement>(null);

    const [selectedPlan, setPlan] = useState<number | null>(null);
    const [promo, setPromo] = useState('');

    const [plans, promoCode] = useProPlans(promo);

    const { mutate, isLoading } = useBuyProServiceMutation();

    useEffect(() => {
        if (plans && plans[0] && selectedPlan == null) {
            setPlan(plans[0].id);
        }
    }, [plans]);

    useEffect(() => {
        if (ref.current) {
            ref.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [ref.current]);

    return (
        <div>
            <ProWallet data={data} onClick={setReLogin} disabled={isLoading} />
            <SelectProPlans
                plans={plans ?? []}
                setPlan={setPlan}
                selected={selectedPlan}
                disabled={isLoading}
            />
            <Line>
                <Input
                    disabled={isLoading}
                    value={promo}
                    onChange={setPromo}
                    label={t('battery_promocode_title')}
                    clearButton
                />
            </Line>
            <Line>
                <Button
                    primary
                    size="large"
                    fullWidth
                    loading={isLoading}
                    onClick={() => mutate({ state: data, tierId: selectedPlan, promoCode })}
                >
                    {t('wallet_buy')}
                </Button>
            </Line>
            <div ref={ref}></div>
        </div>
    );
};

const StatusText = styled(Label1)`
    text-align: center;
    margin: 16px 0 32px;
    display: block;
`;

const PreServiceStatus: FC<{ data: ProState; setReLogin: () => void }> = ({ data, setReLogin }) => {
    const { t } = useTranslation();

    const { mutate: logOut, isLoading } = useProLogout();

    return (
        <div>
            <ProWallet data={data} onClick={setReLogin} />

            <StatusText>
                <SubscriptionStatus data={data} />
            </StatusText>

            <Button size="large" secondary fullWidth onClick={() => logOut()} loading={isLoading}>
                {t('settings_reset')}
            </Button>
        </div>
    );
};

const ProContent: FC<{ data: ProState }> = ({ data }) => {
    const [reLogin, setReLogin] = useState(false);

    if (!data.hasCookie || reLogin) {
        return <SelectWallet />;
    }
    if (data.subscription.valid) {
        return <PreServiceStatus data={data} setReLogin={() => setReLogin(true)} />;
    }
    return <BuyProService data={data} setReLogin={() => setReLogin(true)} />;
};

export const ProSettingsContent: FC<{ showLogo?: boolean }> = ({ showLogo = true }) => {
    const { t } = useTranslation();

    const { data } = useProState();

    return (
        <>
            <Block>
                {showLogo && <Icon src="https://tonkeeper.com/assets/icon.ico" />}
                <Title>{t('tonkeeper_pro')}</Title>
                <Description>{t('tonkeeper_pro_description')}</Description>
            </Block>
            {data ? <ProContent key={data.wallet.rawAddress} data={data} /> : undefined}
        </>
    );
};

export const ProSettings: FC = () => {
    return (
        <>
            <SubHeader />
            <InnerBody>
                <ProSettingsContent />
            </InnerBody>
        </>
    );
};