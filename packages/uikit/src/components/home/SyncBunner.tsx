import React from 'react';
import styled from 'styled-components';
import { useTranslation } from '../../hooks/translation';
import {
  useMutateSyncDateBanner,
  useServiceTimeIsSync,
  useSyncDateBanner,
} from '../../state/syncDate';
import { CloseIcon } from '../Icon';
import { Body2, Label1 } from '../Text';

const Block = styled.div`
  padding: 12px 32px 12px 16px;

  background-color: ${(props) => props.theme.backgroundContentTint};
  position: relative;
  border-radius: ${(props) => props.theme.cornerSmall};

  user-select: none;
`;

const Close = styled.div`
  position: absolute;
  top: 12px;
  right: 16px;
  cursor: pointer;
  transition: color 0.1s ease;

  &:hover {
    color: ${(props) => props.theme.textSecondary};
  }
`;

const Body = styled(Body2)`
  display: block;
  color: ${(props) => props.theme.textSecondary};
`;

export const DateSyncBanner = () => {
  const { data: isSync } = useServiceTimeIsSync();
  const { t } = useTranslation();

  const { data: open } = useSyncDateBanner();
  const { mutate } = useMutateSyncDateBanner();

  if (isSync !== false || open !== true) {
    return null;
  }

  return (
    <Block>
      <Close onClick={() => mutate(false)}>
        <CloseIcon />
      </Close>
      <Label1>{t('notify_incorrect_time_err_title')}</Label1>
      <Body>{t('notify_incorrect_time_err_caption')}</Body>
    </Block>
  );
};
