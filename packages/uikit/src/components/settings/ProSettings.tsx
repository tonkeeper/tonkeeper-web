import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { ProPlan, ProState } from '@tonkeeper/core/dist/entries/pro';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { FC, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useFormatCoinValue } from '../../hooks/balance';
import { useTranslation } from '../../hooks/translation';
import { useAccountState } from '../../state/account';
import { useProLogout, useProPlans, useProState, useSelectWalletMutation } from '../../state/pro';
import { useWalletState } from '../../state/wallet';
import { InnerBody } from '../Body';
import { DoneIcon } from '../Icon';
import { ColumnText } from '../Layout';
import { ListBlock, ListItem, ListItemPayload } from '../List';
import { SubHeader } from '../SubHeader';
import { Body1, Label1, Title } from '../Text';
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
    const { data: accounts } = useAccountState();
    const { mutate } = useSelectWalletMutation();

    if (!accounts) return <></>;

    return (
        <>
            <SelectLabel>Select Wallet for authorization</SelectLabel>
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

const ProWallet: FC<{ data: ProState; onClick: () => void }> = ({ data, onClick }) => {
    return (
        <ListBlock>
            <ListItem onClick={onClick}>
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
    plans: ProPlan[];
    selected: string | null;
    setPlan: (id: string) => void;
}> = ({ plans, selected, setPlan }) => {
    const format = useFormatCoinValue();
    return (
        <>
            <ListBlock>
                {plans.map(plan => (
                    <ListItem onClick={() => setPlan(plan.id)}>
                        <ListItemPayload>
                            <ColumnText
                                noWrap
                                text={plan.name}
                                secondary={
                                    <>
                                        {format(plan.price)} {CryptoCurrency.TON}
                                    </>
                                }
                            />
                            <Radio
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

const ProContent: FC<{ data: ProState }> = ({ data }) => {
    const { t } = useTranslation();

    const ref = useRef<HTMLDivElement>(null);

    const { mutate: logOut } = useProLogout();
    const [selectedPlan, setPlan] = useState<string | null>(null);
    const [promo, setPromo] = useState('');

    const { data: plans } = useProPlans();

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

    if (!data.hasCookie) {
        return <SelectWallet />;
    }

    return (
        <div>
            <ProWallet data={data} onClick={logOut} />
            {data.subscription.valid ? (
                'valid'
            ) : (
                <>
                    <SelectProPlans plans={plans ?? []} setPlan={setPlan} selected={selectedPlan} />
                    <Line>
                        <Input
                            value={promo}
                            onChange={setPromo}
                            label={t('battery_promocode_title')}
                            clearButton
                        />
                    </Line>
                    <Line>
                        <Button primary size="large" fullWidth>
                            Buy
                        </Button>
                    </Line>
                    <div ref={ref}></div>
                </>
            )}
        </div>
    );
};

export const ProSettings = () => {
    const { t } = useTranslation();

    const { data } = useProState();
    return (
        <>
            <SubHeader />
            <InnerBody>
                <Block>
                    <Icon src="https://tonkeeper.com/assets/icon.ico" />
                    <Title>{t('tonkeeper_pro')}</Title>
                    <Description>{t('tonkeeper_pro_description')}</Description>
                </Block>
                {data ? <ProContent data={data} /> : undefined}
            </InnerBody>
        </>
    );
};
