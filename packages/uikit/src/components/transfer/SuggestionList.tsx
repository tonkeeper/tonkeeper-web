import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FavoriteSuggestion,
  LatestSuggestion,
  Suggestion,
} from '@tonkeeper/core/dist/entries/suggestion';
import {
  deleteFavoriteSuggestion,
  getSuggestionsList,
  hideSuggestions,
} from '@tonkeeper/core/dist/service/suggestionService';
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
import {
  AddFavoriteNotification,
  EditFavoriteNotification,
} from './FavoriteNotification';

const useLatestSuggestion = () => {
  const sdk = useAppSdk();
  const { tonApi } = useAppContext();
  const wallet = useWalletContext();

  return useQuery(
    [wallet.active.rawAddress, QueryKey.activity, 'suggestions'],
    () => getSuggestionsList(sdk, tonApi, wallet),
    { keepPreviousData: true }
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

const FavoriteText = styled.div`
  user-select: none;
`;

const getLatestDate = (language: string, timestamp: number) => {
  return new Intl.DateTimeFormat(language, {
    day: 'numeric',
    month: 'long',
  }).format(new Date(timestamp * 1000));
};

const useDeleteFavorite = (item: FavoriteSuggestion) => {
  const sdk = useAppSdk();
  const wallet = useWalletContext();
  const queryClient = useQueryClient();

  return useMutation(async () => {
    await deleteFavoriteSuggestion(sdk.storage, wallet.publicKey, item.address);
    await queryClient.invalidateQueries([
      wallet.active.rawAddress,
      QueryKey.activity,
      'suggestions',
    ]);
  });
};

const FavoriteItem: FC<{
  item: FavoriteSuggestion;
  onSelect: (item: Suggestion) => void;
  onEdit: (item: FavoriteSuggestion) => void;
}> = ({ item, onSelect, onEdit }) => {
  const sdk = useAppSdk();

  const { mutateAsync } = useDeleteFavorite(item);
  const { t } = useTranslation();

  return (
    <ListItem key={item.address} onClick={() => onSelect(item)}>
      <ListItemPayload>
        <ColumnText
          noWrap
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
                  sdk
                    .confirm(
                      t('send_screen_steps_address_delete_alert_text').replace(
                        '%{name}',
                        item.name
                      )
                    )
                    .then((value) => {
                      if (value) {
                        return mutateAsync();
                      }
                    })
                    .finally(() => {
                      onClose();
                    });
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

const useHideSuggestion = (item: LatestSuggestion) => {
  const sdk = useAppSdk();
  const wallet = useWalletContext();
  const queryClient = useQueryClient();

  return useMutation(async () => {
    await hideSuggestions(sdk.storage, wallet.publicKey, item.address);
    await queryClient.invalidateQueries([
      wallet.active.rawAddress,
      QueryKey.activity,
      'suggestions',
    ]);
  });
};

const LatestItem: FC<{
  item: LatestSuggestion;
  onSelect: (item: Suggestion) => void;
  onAddFavorite: (item: LatestSuggestion) => void;
}> = ({ item, onSelect, onAddFavorite }) => {
  const { mutateAsync } = useHideSuggestion(item);
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
                  mutateAsync().finally(() => onClose());
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
  disabled?: boolean;
}> = ({ onSelect, disabled }) => {
  const { data } = useLatestSuggestion();
  const [addFavorite, setAdd] =
    useState<LatestSuggestion | undefined>(undefined);
  const [editFavorite, setEdit] =
    useState<FavoriteSuggestion | undefined>(undefined);

  if (!data) {
    return <SkeletonList size={4} margin={false} fullWidth />;
  }

  return (
    <>
      <ListBlock margin={false} fullWidth noUserSelect>
        {data.map((item) => {
          if (item.isFavorite) {
            return (
              <FavoriteItem
                key={item.address}
                item={item}
                onSelect={(value) => !disabled && onSelect(value)}
                onEdit={(value) => !disabled && setEdit(value)}
              />
            );
          }
          return (
            <LatestItem
              key={item.address}
              item={item}
              onSelect={(value) => !disabled && onSelect(value)}
              onAddFavorite={(value) => !disabled && setAdd(value)}
            />
          );
        })}
      </ListBlock>
      <AddFavoriteNotification
        latest={addFavorite}
        onClose={() => setAdd(undefined)}
      />
      <EditFavoriteNotification
        favorite={editFavorite}
        onClose={() => setEdit(undefined)}
      />
    </>
  );
};
