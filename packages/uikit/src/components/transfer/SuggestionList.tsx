import { useQuery } from '@tanstack/react-query';
import {
  FavoriteSuggestion,
  LatestSuggestion,
  Suggestion
} from '@tonkeeper/core/dist/entries/suggestion';
import { getSuggestionsList } from '@tonkeeper/core/dist/service/suggestionService';
import { toShortAddress } from '@tonkeeper/core/dist/utils/common';
import React, { FC, useState } from 'react';
import styled from 'styled-components';
import { useAppContext, useWalletContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { QueryKey } from '../../libs/queryKey';
import { DropDown } from '../DropDown';
import { EllipsisIcon, StarIcon } from '../Icon';
import { ColumnText } from '../Layout';
import { ListBlock, ListItem, ListItemPayload } from '../List';
import { SkeletonList } from '../Skeleton';
import { Label1 } from '../Text';
import { AddFavoriteNotification } from './FavoriteNotification';

const useLatestSuggestion = () => {
  const sdk = useAppSdk();
  const { tonApi } = useAppContext();
  const wallet = useWalletContext();

  return useQuery(
    [wallet.active.rawAddress, QueryKey.activity, 'suggestions'],
    () => getSuggestionsList(sdk, tonApi, wallet)
  );
};

const Icon = styled.span`
  display: flex;
  color: ${(props) => props.theme.iconSecondary};
`;

const IconBlue = styled.span`
  display: inline-flex;
  color: ${(props) => props.theme.accentBlue};
`;

const getLatestDate = (language: string, timestamp: number) => {
  return new Intl.DateTimeFormat(language, {
    day: 'numeric',
    month: 'long',
  }).format(new Date(timestamp * 1000));
};

const FavoriteItem: FC<{
  item: FavoriteSuggestion;
  onSelect: (item: Suggestion) => void;
  onDelete: (item: FavoriteSuggestion) => void;
  onEdit: (item: FavoriteSuggestion) => void;
}> = ({ item, onSelect, onDelete, onEdit }) => {
  const { t } = useTranslation();

  return (
    <ListItem key={item.address} onClick={() => onSelect(item)}>
      <ListItemPayload>
        <ColumnText
          text={
            <>
              {item.name}{' '}
              <IconBlue>
                <StarIcon />
              </IconBlue>
            </>
          }
          secondary={toShortAddress(item.address)}
        />
        <DropDown
          payload={(onClose) => (
            <ListBlock margin={false} dropDown>
              <ListItem
                dropDown
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(item);
                  onClose();
                }}
              >
                <ListItemPayload>
                  <Label1>{t('add_edit_favorite_edit_title')}</Label1>
                </ListItemPayload>
              </ListItem>
              <ListItem
                dropDown
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item);
                  onClose();
                }}
              >
                <ListItemPayload>
                  <Label1>{t('add_edit_favorite_delete')}</Label1>
                </ListItemPayload>
              </ListItem>
            </ListBlock>
          )}
        >
          <Icon>
            <EllipsisIcon />
          </Icon>
        </DropDown>
      </ListItemPayload>
    </ListItem>
  );
};
const LatestItem: FC<{
  item: LatestSuggestion;
  onSelect: (item: Suggestion) => void;
  onAddFavorite: (item: LatestSuggestion) => void;
  onHideLatest: (item: LatestSuggestion) => void;
}> = ({ item, onSelect, onAddFavorite, onHideLatest }) => {
  const { t, i18n } = useTranslation();

  return (
    <ListItem key={item.address} onClick={() => onSelect(item)}>
      <ListItemPayload>
        <ColumnText
          text={toShortAddress(item.address)}
          secondary={getLatestDate(i18n.language, item.timestamp)}
        />
        <DropDown
          payload={(onClose) => (
            <ListBlock margin={false} dropDown>
              <ListItem
                dropDown
                onClick={(e) => {
                  e.stopPropagation();
                  onAddFavorite(item);
                  onClose();
                }}
              >
                <ListItemPayload>
                  <Label1>
                    {t('send_screen_steps_address_suggest_actions_add')}
                  </Label1>
                </ListItemPayload>
              </ListItem>
              <ListItem
                dropDown
                onClick={(e) => {
                  e.stopPropagation();
                  onHideLatest(item);
                  onClose();
                }}
              >
                <ListItemPayload>
                  <Label1>
                    {t('send_screen_steps_address_suggest_actions_hide')}
                  </Label1>
                </ListItemPayload>
              </ListItem>
            </ListBlock>
          )}
        >
          <Icon>
            <EllipsisIcon />
          </Icon>
        </DropDown>
      </ListItemPayload>
    </ListItem>
  );
};

export const SuggestionList: FC<{
  onSelect: (item: Suggestion) => void;
}> = ({ onSelect }) => {
  const { data, isFetching } = useLatestSuggestion();
  const [addFavorite, setAdd] = useState<LatestSuggestion | undefined>(
    undefined
  );
  const [hideLatest, setHide] = useState<LatestSuggestion | undefined>(
    undefined
  );
  const [deleteFavorite, setDelete] = useState<FavoriteSuggestion | undefined>(
    undefined
  );
  const [editFavorite, setEdit] = useState<FavoriteSuggestion | undefined>(
    undefined
  );
  if (isFetching || !data) {
    return <SkeletonList size={6} margin={false} fullWidth />;
  }

  return (
    <>
      <ListBlock margin={false} fullWidth>
        {data.map((item) => {
          if (item.isFavorite) {
            return (
              <FavoriteItem
                key={item.address}
                item={item}
                onSelect={onSelect}
                onDelete={setDelete}
                onEdit={setEdit}
              />
            );
          }
          return (
            <LatestItem
              key={item.address}
              item={item}
              onSelect={onSelect}
              onAddFavorite={setAdd}
              onHideLatest={setHide}
            />
          );
        })}
      </ListBlock>
      <AddFavoriteNotification
        latest={addFavorite}
        onClose={() => setAdd(undefined)}
      />
    </>
  );
};
