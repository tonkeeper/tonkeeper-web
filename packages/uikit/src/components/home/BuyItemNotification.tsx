import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sha512_sync } from '@ton/crypto';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { TonContract } from '@tonkeeper/core/dist/entries/wallet';
import {
    TonendpoinFiatButton,
    TonendpoinFiatItem,
    TonendpointConfig
} from '@tonkeeper/core/dist/tonkeeperApi/tonendpoint';
import { formatAddress } from '@tonkeeper/core/dist/utils/common';
import React, { FC, useState } from 'react';
import styled, { css } from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import { useBuyAnalytics } from '../../hooks/amplitude';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useStorage } from '../../hooks/storage';
import { useTranslation } from '../../hooks/translation';
import { ChevronRightIcon } from '../Icon';
import { ListItem, ListItemPayload } from '../List';
import { Notification } from '../Notification';
import { Body1, H3, Label1 } from '../Text';
import { Button } from '../fields/Button';
import { Checkbox } from '../fields/Checkbox';
import { useCreateMercuryoProUrl } from '../../state/tonendpoint';
import { hexToRGBA } from '../../libs/css';
import { useActiveWallet } from '../../state/wallet';

const Logo = styled.img<{ large?: boolean }>`
    pointer-events: none;

    ${props =>
        props.large
            ? css`
                  width: 72px;
                  height: 72px;
                  margin-bottom: 20px;
                  border-radius: ${p => p.theme.cornerSmall};
              `
            : css`
                  width: 44px;
                  height: 44px;
                  border-radius: ${p => p.theme.cornerExtraSmall};
              `}
`;

const Description = styled.div`
    display: flex;
    gap: 1rem;
    align-items: center;
`;

const Text = styled.div`
    display: flex;
    flex-direction: column;

    user-select: none;
`;

const Body = styled(Body1)`
    color: ${props => props.theme.textSecondary};
`;

const Icon = styled.div`
    display: flex;
    color: ${props => props.theme.iconTertiary};
`;

const ItemPayload = styled(ListItemPayload)`
    transition: color 0.1s ease;

    &:hover ${Icon} {
        color: ${props => props.theme.iconPrimary};
    }
`;

const NotificationBlock = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const Center = styled.div`
    text-align: center;
`;

const CheckboxBlock = styled.span`
    margin: 28px 0 0;
    display: flex;
`;

export const DisclaimerBlock = styled.div`
    margin: 2rem 0;
    padding: 18px 18px;
    box-sizing: border-box;
    display: flex;
    gap: 0.5rem;
    flex-direction: column;
    width: 100%;

    background: ${props => props.theme.backgroundContent};
    border-radius: ${props => props.theme.cornerSmall};
`;

const DisclaimerText = styled(Body1)`
    display: block;
`;

const DisclaimerLink = styled(Body1)`
    cursor: pointer;
    color: ${props => props.theme.textSecondary};
    margin-right: 0.75rem;
    transition: color 0.1s ease;

    &:hover {
        color: ${props => props.theme.textPrimary};
    }
`;

const Disclaimer: FC<{
    buttons: TonendpoinFiatButton[];
}> = ({ buttons }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();

    return (
        <DisclaimerBlock>
            <DisclaimerText>{t('exchange_method_open_warning')}</DisclaimerText>
            {buttons && buttons.length > 0 && (
                <div>
                    {buttons.map((button, index) => (
                        <DisclaimerLink key={index} onClick={() => sdk.openPage(button.url)}>
                            {button.title}
                        </DisclaimerLink>
                    ))}
                </div>
            )}
        </DisclaimerBlock>
    );
};

const useHideDisclaimerMutation = (title: string, kind: 'buy' | 'sell') => {
    const storage = useStorage();
    const client = useQueryClient();
    return useMutation<void, Error, boolean>(async hide => {
        await storage.set<boolean>(`${kind}_${title}`, hide);
        await client.invalidateQueries([title, kind]);
    });
};

const useShowDisclaimer = (title: string, kind: 'buy' | 'sell') => {
    const storage = useStorage();
    return useQuery([title, kind], async () => {
        const hided = await storage.get<boolean>(`${kind}_${title}`);
        return hided === null ? false : hided;
    });
};

const replacePlaceholders = (
    url: string,
    config: TonendpointConfig,
    wallet: TonContract,
    fiat: FiatCurrencies,
    kind: 'buy' | 'sell'
) => {
    const [CUR_FROM, CUR_TO] = kind === 'buy' ? [fiat, 'TON'] : ['TON', fiat];
    const address = formatAddress(wallet.rawAddress);
    url = url
        .replace('{ADDRESS}', address)
        .replace('{CUR_FROM}', CUR_FROM)
        .replace('{CUR_TO}', CUR_TO);

    if (url.includes('TX_ID')) {
        const txId = 'mercuryo_' + uuidv4();
        url = url.replace(/\{TX_ID\}/g, txId);
        url = url.replace(/\=TON\&/gi, '=TONCOIN&');
        url += `&signature=${sha512_sync(`${address}${config.mercuryoSecret ?? ''}`).toString(
            'hex'
        )}`;
    }

    return url;
};

const Label1Styled = styled(Label1)`
    display: flex;
    align-items: center;
    gap: 6px;
`;

const H3Styled = styled(H3)`
    display: flex;
    align-items: center;
    gap: 6px;
`;

const Badge = styled.div`
    color: ${p => p.theme.accentBlue};
    background-color: ${p => hexToRGBA(p.theme.accentBlue, 0.26)};
    border-radius: 3px;
    padding: 2px 4px;
    font-size: 8.5px;
    font-style: normal;
    font-weight: 510;
    line-height: 12px;
`;

export const BuyItemNotification: FC<{
    item: TonendpoinFiatItem;
    kind: 'buy' | 'sell';
}> = ({ item, kind }) => {
    const track = useBuyAnalytics();
    const sdk = useAppSdk();
    const wallet = useActiveWallet();
    const { config, fiat } = useAppContext();
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);

    const { data: hided } = useShowDisclaimer(item.title, kind);
    const { mutate } = useHideDisclaimerMutation(item.title, kind);
    const { mutateAsync: createMercuryoProUrl } = useCreateMercuryoProUrl();

    const onForceOpen = async () => {
        track(item.action_button.url);

        let urlToOpen = item.action_button.url;
        if (item.id === 'mercuryo_pro') {
            urlToOpen = await createMercuryoProUrl(item.action_button.url);
        }
        sdk.openPage(replacePlaceholders(urlToOpen, config, wallet, fiat, kind));
        setOpen(false);
    };
    const onOpen: React.MouseEventHandler<HTMLDivElement> = () => {
        if (hided) {
            onForceOpen();
        } else {
            setOpen(true);
        }
    };

    return (
        <>
            <ListItem key={item.title} onClick={onOpen}>
                <ItemPayload>
                    <Description>
                        <Logo src={item.icon_url} />
                        <Text>
                            <Label1Styled>
                                {item.title}
                                {item.badge && <Badge>{item.badge}</Badge>}
                            </Label1Styled>
                            <Body>{item.description}</Body>
                        </Text>
                    </Description>
                    <Icon>
                        <ChevronRightIcon />
                    </Icon>
                </ItemPayload>
            </ListItem>
            <Notification isOpen={open} handleClose={() => setOpen(false)}>
                {() => (
                    <NotificationBlock>
                        <Logo large src={item.icon_url} />
                        <H3Styled>
                            {item.title}
                            {item.badge && <Badge>{item.badge}</Badge>}
                        </H3Styled>
                        <Center>
                            <Body>{item.description}</Body>
                        </Center>
                        <Disclaimer buttons={item.info_buttons} />
                        <Button size="large" fullWidth primary onClick={onForceOpen}>
                            {item.action_button.title}
                        </Button>
                        <CheckboxBlock>
                            <Checkbox checked={!!hided} onChange={mutate}>
                                {t('exchange_method_dont_show_again')}
                            </Checkbox>
                        </CheckboxBlock>
                    </NotificationBlock>
                )}
            </Notification>
        </>
    );
};
