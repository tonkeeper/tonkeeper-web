import { NFT } from '@tonkeeper/core/dist/entries/nft';
import React, { FC, useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { useTranslation } from '../../hooks/translation';
import { Label1 } from '../Text';
import { NftsList } from '../nft/Nfts';
import { AssetData, JettonList } from './Jettons';

const TabsBlock = styled.div`
    display: flex;
    padding-top: 1rem;
    margin-bottom: 1.5rem;
    position: relative;
    justify-content: center;
    gap: 2.25rem;

    user-select: none;
`;

const TabsButton = styled.div<{ active?: boolean }>`
    cursor: pointer;

    padding: 0.5rem;
    margin: -0.5rem;
    box-sizing: border-box;

    ${props =>
        props.active
            ? css`
                  color: ${props.theme.textPrimary};
              `
            : css`
                  color: ${props.theme.textSecondary};
              `}
`;

const Line = styled.div`
    position: absolute;
    height: 3px;
    width: 0px;
    bottom: -0.5rem;
    border-radius: ${props => props.theme.cornerExtraExtraSmall};
    background: ${props => props.theme.accentBlue};
`;

enum HomeTabs {
    TOKENS = 0,
    COLLECTIBLES = 1
}

const Tabs: FC<{ tab: HomeTabs; onTab: (value: HomeTabs) => void }> = ({ tab, onTab }) => {
    const { t } = useTranslation();
    const blockRef = useRef<HTMLDivElement>(null);
    const lineRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (blockRef.current && lineRef.current) {
            const active = blockRef.current.childNodes[tab] as HTMLElement;

            const width = 40;

            lineRef.current.style.width = width + 'px';

            lineRef.current.style.left =
                active.offsetLeft + (active.clientWidth - width) / 2 + 'px';

            window.requestAnimationFrame(() => {
                if (lineRef.current) {
                    lineRef.current.style.transition = 'all 0.3s ease-in-out';
                }
            });
        }
    }, [blockRef, lineRef, tab]);
    return (
        <TabsBlock ref={blockRef}>
            <TabsButton active={tab === HomeTabs.TOKENS} onClick={() => onTab(HomeTabs.TOKENS)}>
                <Label1>{t('jettons_list_title')}</Label1>
            </TabsButton>
            <TabsButton
                active={tab === HomeTabs.COLLECTIBLES}
                onClick={() => onTab(HomeTabs.COLLECTIBLES)}
            >
                <Label1>{t('Collectibles')}</Label1>
            </TabsButton>
            <Line ref={lineRef} />
        </TabsBlock>
    );
};
export const TabsView: FC<{
    assets: AssetData;
    nfts: NFT[];
}> = ({ assets, nfts }) => {
    const [tab, setTab] = useState<HomeTabs>(HomeTabs.TOKENS);

    return (
        <>
            <Tabs tab={tab} onTab={setTab} />
            {tab === HomeTabs.TOKENS && <JettonList assets={assets} />}
            {tab === HomeTabs.COLLECTIBLES && <NftsList nfts={nfts} />}
        </>
    );
};
