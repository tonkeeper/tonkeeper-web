import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LatestSuggestion } from '@tonkeeper/core/dist/entries/suggestion';
import {
  getFavoriteSuggestions,
  setFavoriteSuggestion,
} from '@tonkeeper/core/dist/service/suggestionService';
import { toShortAddress } from '@tonkeeper/core/dist/utils/common';
import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useWalletContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { QueryKey } from '../../libs/queryKey';
import { Button } from '../fields/Button';
import { Input } from '../fields/Input';
import { ListBlock, ListItem, ListItemPayload } from '../List';
import { Notification } from '../Notification';
import { Label1 } from '../Text';
import { Label } from './common';

const Block = styled.form`
  display: flex;
  flex-direction: column;
  box-sizing: border-box;

  justify-content: center;
  gap: 1rem;
  width: 100%;
`;

const useAddFavorite = (latest: LatestSuggestion) => {
  const sdk = useAppSdk();
  const wallet = useWalletContext();
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>(async (name) => {
    if (name.length < 2) {
      throw new Error('Name is to short');
    }
    const items = await getFavoriteSuggestions(sdk.storage, wallet.publicKey);
    if (items.some((item) => item.name === name)) {
      throw new Error('Name is already taken');
    }
    items.push({ isFavorite: true, address: latest.address, name });
    await setFavoriteSuggestion(sdk.storage, wallet.publicKey, items);
    await queryClient.invalidateQueries([
      wallet.active.rawAddress,
      QueryKey.activity,
      'suggestions',
    ]);
  });
};

const AddFavoriteContent: FC<{
  latest: LatestSuggestion;
  onClose: () => void;
}> = ({ latest, onClose }) => {
  const { t } = useTranslation();
  const sdk = useAppSdk();
  const { mutateAsync, reset, isLoading, isError } = useAddFavorite(latest);
  const ref = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
    }
  }, [ref.current]);

  const [name, setName] = useState('');

  const onName = (value: string) => {
    reset();
    setName(value);
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    await mutateAsync(name);
    onClose();
  };

  return (
    <Block onSubmit={handleSubmit}>
      <Input
        ref={ref}
        value={name}
        onChange={onName}
        label={t('add_edit_favorite_name_placeholder')}
        isValid={!isError}
        disabled={isLoading}
      />
      <ListBlock margin={false}>
        <ListItem
          onClick={(e) => {
            e.stopPropagation();
            sdk.copyToClipboard(latest.address, t('address_copied'));
          }}
        >
          <ListItemPayload>
            <Label>{t('add_edit_favorite_address_label')}</Label>
            <Label1>{toShortAddress(latest.address)}</Label1>
          </ListItemPayload>
        </ListItem>
      </ListBlock>
      <Button
        size="large"
        primary
        fullWidth
        marginTop
        type="submit"
        disabled={isLoading}
        loading={isLoading}
      >
        {t('add_edit_favorite_save')}
      </Button>
    </Block>
  );
};

export const AddFavoriteNotification: FC<{
  latest?: LatestSuggestion;
  onClose: () => void;
}> = ({ latest, onClose }) => {
  const { t } = useTranslation();

  const Content = useCallback(() => {
    if (!latest) return undefined;
    return <AddFavoriteContent onClose={onClose} latest={latest} />;
  }, [latest, onClose]);

  return (
    <Notification
      isOpen={latest != null}
      handleClose={onClose}
      hideButton
      title={t('add_edit_favorite_add_title')}
    >
      {Content}
    </Notification>
  );
};
