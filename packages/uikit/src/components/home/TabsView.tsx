import {
  AccountRepr,
  JettonsBalances,
  NftItemsRepr,
} from '@tonkeeper/core/dist/tonApi';
import { TonendpointStock } from '@tonkeeper/core/dist/tonkeeperApi/stock';
import React, { FC, useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { useTranslation } from '../../hooks/translation';
import { NftsList } from '../nft/Nfts';
import { Label1 } from '../Text';
import { JettonList } from './Jettons';

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
  margin -0.5rem;
  box-sizing: border-box;

  ${(props) =>
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
  border-radius: ${(props) => props.theme.cornerExtraExtraSmall};
  background: ${(props) => props.theme.accentBlue};
`;

enum HomeTabs {
  Tokens = 0,
  Collectibles = 1,
}

const Tabs: FC<{ tab: HomeTabs; onTab: (value: HomeTabs) => void }> = ({
  tab,
  onTab,
}) => {
  const { t } = useTranslation();
  const blockRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (blockRef.current && lineRef.current) {
      const active = blockRef.current.childNodes[tab] as HTMLElement;

      const width = 40;

      lineRef.current.style.width = width + 'px';
      lineRef.current.style.transition = 'all 0.3s ease-in-out';
      lineRef.current.style.left =
        active.offsetLeft + (active.clientWidth - width) / 2 + 'px';
    }
  }, [blockRef, lineRef, tab]);
  return (
    <TabsBlock ref={blockRef}>
      <TabsButton
        active={tab === HomeTabs.Tokens}
        onClick={() => onTab(HomeTabs.Tokens)}
      >
        <Label1>{t('jettons_list_title')}</Label1>
      </TabsButton>
      <TabsButton
        active={tab === HomeTabs.Collectibles}
        onClick={() => onTab(HomeTabs.Collectibles)}
      >
        <Label1>{t('Collectibles')}</Label1>
      </TabsButton>
      <Line ref={lineRef} />
    </TabsBlock>
  );
};
export const TabsView: FC<{
  stock: TonendpointStock;
  jettons: JettonsBalances;
  info: AccountRepr;
  nfts: NftItemsRepr;
}> = ({ stock, jettons, info, nfts }) => {
  const [tab, setTab] = useState<HomeTabs>(HomeTabs.Tokens);

  return (
    <>
      <Tabs tab={tab} onTab={setTab} />
      {tab === HomeTabs.Tokens && (
        <JettonList info={info} jettons={jettons} stock={stock} />
      )}
      {tab === HomeTabs.Collectibles && <NftsList nfts={nfts} />}
    </>
  );
};
