import React, { FC } from 'react';
import styled from 'styled-components';
import { useOnImportAction } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { AppRoute, ImportRoute } from '../../libs/routes';
import { Button } from '../fields/Button';
import { TonkeeperIcon } from '../Icon';
import { Notification } from '../Notification';
import { Body1, H2 } from '../Text';

const Title = styled(H2)`
  user-select: none;
`;
const BodyText = styled(Body1)`
  color: ${(props) => props.theme.textSecondary};
  user-select: none;
`;
const TextBlock = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const NotificationIcon = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 0.75rem;
`;

export const ImportNotification: FC<{
  isOpen: boolean;
  setOpen: (value: boolean) => void;
}> = ({ isOpen, setOpen }) => {
  const { t } = useTranslation();
  const onImport = useOnImportAction();

  return (
    <Notification isOpen={isOpen} handleClose={() => setOpen(false)}>
      {(onClose) => (
        <div>
          <NotificationIcon>
            <TonkeeperIcon loop />
          </NotificationIcon>
          <TextBlock>
            <Title>{t('require_create_wallet_modal_title')}</Title>
            <BodyText>{t('require_create_wallet_modal_caption')}</BodyText>
          </TextBlock>
          <Button
            size="large"
            fullWidth
            primary
            bottom
            onClick={() => {
              onClose(() => onImport(AppRoute.import + ImportRoute.create));
            }}
          >
            {t('require_create_wallet_modal_create_new')}
          </Button>
          <Button
            size="large"
            fullWidth
            secondary
            onClick={() => {
              onClose(() => onImport(AppRoute.import + ImportRoute.import));
            }}
          >
            {t('require_create_wallet_modal_import')}
          </Button>
        </div>
      )}
    </Notification>
  );
};
