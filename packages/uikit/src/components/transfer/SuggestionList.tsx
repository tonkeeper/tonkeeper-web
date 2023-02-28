import { useQuery } from '@tanstack/react-query';
import {
  LatestSuggestion,
  Suggestion,
} from '@tonkeeper/core/dist/entries/suggestion';
import { getSuggestionsList } from '@tonkeeper/core/dist/service/suggestionService';
import { delay, toShortAddress } from '@tonkeeper/core/dist/utils/common';
import React, { FC } from 'react';
import styled from 'styled-components';
import { useAppContext, useWalletContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { QueryKey } from '../../libs/queryKey';
import { EllipsisIcon } from '../Icon';
import { ColumnText } from '../Layout';
import { ListBlock, ListItem, ListItemPayload } from '../List';
import { SkeletonList } from '../Skeleton';

const useLatestSuggestion = () => {
  const { tonApi } = useAppContext();
  const wallet = useWalletContext();

  return useQuery(
    [wallet.active.rawAddress, QueryKey.activity, 'suggestions'],
    async () => {
      await delay(100);
      return await getSuggestionsList(tonApi, wallet);
    }
  );
};

const Icon = styled.span`
  display: flex;
  color: ${(props) => props.theme.iconSecondary};
`;

const getLatestDate = (language: string, timestamp: number) => {
  return new Intl.DateTimeFormat(language, { dateStyle: 'short' }).format(
    new Date(timestamp * 1000)
  );
};

const LatestItem: FC<{
  item: LatestSuggestion;
  onSelect: (item: Suggestion) => void;
}> = ({ item, onSelect }) => {
  const { i18n } = useTranslation();

  return (
    <ListItem key={item.address} onClick={() => onSelect(item)}>
      <ListItemPayload>
        <ColumnText
          text={toShortAddress(item.address)}
          secondary={getLatestDate(i18n.language, item.timestamp)}
        />
        <Icon>
          <EllipsisIcon />
        </Icon>
      </ListItemPayload>
    </ListItem>
  );
};

export const SuggestionList: FC<{
  onSelect: (item: Suggestion) => void;
}> = ({ onSelect }) => {
  const { data, isFetching } = useLatestSuggestion();

  if (isFetching || !data) {
    return <SkeletonList size={6} margin={false} fullWidth />;
  }

  return (
    <ListBlock margin={false} fullWidth>
      {data.map((item) => {
        if (item.isFavorite) return null;
        return (
          <LatestItem key={item.address} item={item} onSelect={onSelect} />
        );
      })}
    </ListBlock>
  );
};
