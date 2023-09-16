import {
    TonendpoinFiatCategory,
    TonendpoinFiatItem
} from '@tonkeeper/core/dist/tonkeeperApi/tonendpoint';
import React, { FC, useCallback, useState } from 'react';
import styled from 'styled-components';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { useTonendpointBuyMethods } from '../../state/tonendpoint';
import { ListBlock } from '../List';
import { Notification } from '../Notification';
import { Label2 } from '../Text';
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

const ActionNotification: FC<{
    item: TonendpoinFiatCategory;
    kind: 'buy' | 'sell';
    handleClose: () => void;
}> = ({ item, kind }) => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    return (
        <div>
            <BuyList items={item.items} kind={kind} />
            <OtherBlock>
                <OtherLink onClick={() => sdk.openPage(t('Other_ways_to_buy_TON_link'))}>
                    {kind === 'buy' ? t('Other_ways_to_buy_TON') : t('Other_ways_to_sell_TON')}
                </OtherLink>
            </OtherBlock>
        </div>
    );
};
const OtherBlock = styled.div`
    text-align: center;
    margin: 1rem 0 0;
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
        <Notification
            isOpen={open && buy != null}
            handleClose={handleClose}
            hideButton
            title={buy?.title}
        >
            {Content}
        </Notification>
    );
};

export const BuyAction: FC = () => {
    const [open, setOpen] = useState(false);
    const { data: buy } = useTonendpointBuyMethods();

    return (
        <>
            <Action icon={<BuyIcon />} title={'wallet_buy'} action={() => setOpen(true)} />
            <BuyNotification buy={buy} open={open} handleClose={() => setOpen(false)} />
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
