import {
    TonendpoinFiatCategory,
    TonendpoinFiatItem
} from '@tonkeeper/core/dist/tonkeeperApi/tonendpoint';
import React, { FC, useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { AppRoute, SettingsRoute } from '../../libs/routes';
import { useUserCountry } from '../../state/country';
import { useTonendpointBuyMethods } from '../../state/tonendpoint';
import { ListBlock } from '../List';
import {
    Notification,
    NotificationCancelButton,
    NotificationHeader,
    NotificationHeaderPortal,
    NotificationTitleBlock
} from '../Notification';
import { H3, Label2 } from '../Text';
import { CommonCountryButton } from '../fields/RoundedButton';
import { Action } from './Actions';
import { BuyItemNotification } from './BuyItemNotification';
import { BuyIcon, SellIcon } from './HomeIcons';

const BuyList: FC<{ items: TonendpoinFiatItem[]; kind: 'buy' | 'sell' }> = ({ items, kind }) => {
    return (
        <ListBlock margin={false}>
            {items
                .filter(item => !item.disabled)
                .map(item => (
                    <BuyItemNotification key={item.title} item={item} kind={kind} />
                ))}
        </ListBlock>
    );
};

const Block = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;
const ActionNotification: FC<{
    item: TonendpoinFiatCategory;
    kind: 'buy' | 'sell';
    handleClose: () => void;
}> = ({ item, kind, handleClose }) => {
    const navigate = useNavigate();
    const sdk = useAppSdk();

    const { data: country } = useUserCountry();

    const { t } = useTranslation();
    const { config } = useAppContext();
    return (
        <Block>
            <NotificationHeaderPortal>
                <NotificationHeader>
                    <NotificationTitleBlock>
                        <CommonCountryButton
                            country={country}
                            onClick={() => navigate(AppRoute.settings + SettingsRoute.country)}
                        />
                        <H3>{item.title}</H3>
                        <NotificationCancelButton handleClose={handleClose} />
                    </NotificationTitleBlock>
                </NotificationHeader>
            </NotificationHeaderPortal>
            <BuyList items={item.items} kind={kind} />
            <OtherBlock>
                <OtherLink
                    onClick={() => config.exchangePostUrl && sdk.openPage(config.exchangePostUrl)}
                >
                    {kind === 'buy'
                        ? t('exchange_modal_other_ways_to_buy')
                        : t('exchange_other_ways')}
                </OtherLink>
            </OtherBlock>
        </Block>
    );
};

const OtherBlock = styled.div`
    text-align: center;

    ${p =>
        p.theme.displayType === 'full-width' &&
        css`
            padding-bottom: 1rem;
        `}
`;

const OtherLink = styled(Label2)`
    cursor: pointer;
    padding: 7.5px 1rem 8.5px;
    background-color: ${props => props.theme.backgroundContent};
    transition: background-color 0.1s ease;
    border-radius: ${props => props.theme.cornerMedium};
    display: inline-block;

    &:hover {
        background-color: ${props => props.theme.backgroundHighlighted};
    }
`;

export const BuyNotification: FC<{
    buy: TonendpoinFiatCategory | undefined;
    open: boolean;
    handleClose: () => void;
}> = ({ buy, open, handleClose }) => {
    const Content = useCallback(() => {
        if (!open || !buy) return undefined;
        return <ActionNotification item={buy} kind="buy" handleClose={handleClose} />;
    }, [open, buy]);

    return (
        <Notification isOpen={open && buy != null} handleClose={handleClose} hideButton>
            {Content}
        </Notification>
    );
};

export const BuyAction: FC = () => {
    const { data: buy } = useTonendpointBuyMethods();

    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    const open = useMemo(() => {
        return new URLSearchParams(searchParams).get('buy') === 'open';
    }, [searchParams, location]);

    const toggle = useCallback(() => {
        if (!searchParams.has('buy')) {
            searchParams.append('buy', 'open');
        } else {
            searchParams.delete('buy');
        }
        setSearchParams(searchParams, { replace: true });
    }, [searchParams, setSearchParams]);

    return (
        <>
            <Action icon={<BuyIcon />} title={'wallet_buy'} action={toggle} />
            <BuyNotification buy={buy} open={open} handleClose={toggle} />
        </>
    );
};

export const SellAction: FC<{ sell: TonendpoinFiatCategory | undefined }> = ({ sell }) => {
    const [open, setOpen] = useState(false);

    const Content = useCallback(() => {
        if (!open || !sell) return undefined;
        return <ActionNotification item={sell} kind="sell" handleClose={() => setOpen(false)} />;
    }, [open, sell]);
    return (
        <>
            <Action icon={<SellIcon />} title={'wallet_sell'} action={() => setOpen(true)} />
            <Notification
                isOpen={open && sell != null}
                handleClose={() => setOpen(false)}
                hideButton
                title={sell?.title}
            >
                {Content}
            </Notification>
        </>
    );
};
