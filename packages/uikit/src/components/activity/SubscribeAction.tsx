import { Action } from '@tonkeeper/core/dist/tonApi';
import { toShortAddress } from '@tonkeeper/core/dist/utils/common';
import React, { FC } from 'react';
import {
  ActivityIcon,
  SubscribeIcon,
  UnsubscribeIcon,
} from '../../components/activity/ActivityIcons';
import { useAppContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { useTonenpointStock } from '../../state/tonendpoint';
import { ListBlock } from '../List';
import { ActionData } from './ActivityNotification';
import { ColumnLayout, ErrorAction, ListItemGrid } from './CommonAction';
import {
  ActionBeneficiaryDetails,
  ActionDate,
  ActionDetailsBlock,
  ActionFeeDetails,
  ActionTransactionDetails,
  ErrorActivityNotification,
  Title,
} from './NotificationCommon';

export const UnSubscribeActionDetails: FC<ActionData> = ({
  action,
  timestamp,
  event,
}) => {
  const { t } = useTranslation();
  const { unSubscribe } = action;

  const { fiat } = useAppContext();
  const { data: stock } = useTonenpointStock();

  if (!unSubscribe) {
    return <ErrorActivityNotification event={event} />;
  }

  return (
    <ActionDetailsBlock event={event}>
      <div>
        <Title>{t('transaction_type_unsubscription')}</Title>
        <ActionDate kind="send" timestamp={timestamp} />
      </div>
      <ListBlock margin={false} fullWidth>
        <ActionBeneficiaryDetails beneficiary={unSubscribe.beneficiary} />
        <ActionTransactionDetails event={event} />
        <ActionFeeDetails fee={event.fee} stock={stock} fiat={fiat} />
      </ListBlock>
    </ActionDetailsBlock>
  );
};

export const SubscribeActionDetails: FC<ActionData> = ({
  action,
  timestamp,
  event,
}) => {
  const { t } = useTranslation();
  const { subscribe } = action;

  const { fiat } = useAppContext();
  const { data: stock } = useTonenpointStock();

  if (!subscribe) {
    return <ErrorActivityNotification event={event} />;
  }

  return (
    <ActionDetailsBlock event={event}>
      <div>
        <Title>{t('transaction_type_subscription')}</Title>
        <ActionDate kind="send" timestamp={timestamp} />
      </div>
      <ListBlock margin={false} fullWidth>
        <ActionBeneficiaryDetails beneficiary={subscribe.beneficiary} />
        <ActionTransactionDetails event={event} />
        <ActionFeeDetails fee={event.fee} stock={stock} fiat={fiat} />
      </ListBlock>
    </ActionDetailsBlock>
  );
};

export const UnSubscribeAction: FC<{ action: Action; date: string }> = ({
  action,
  date,
}) => {
  const { t } = useTranslation();
  const { unSubscribe } = action;

  if (!unSubscribe) {
    return <ErrorAction />;
  }
  return (
    <ListItemGrid>
      <ActivityIcon>
        <UnsubscribeIcon />
      </ActivityIcon>
      <ColumnLayout
        title={t('transaction_type_unsubscription')}
        entry="-"
        address={
          unSubscribe.beneficiary.name ??
          toShortAddress(unSubscribe.beneficiary.address)
        }
        date={date}
      />
    </ListItemGrid>
  );
};

export const SubscribeAction: FC<{ action: Action; date: string }> = ({
  action,
  date,
}) => {
  const { t } = useTranslation();
  const { subscribe } = action;

  if (!subscribe) {
    return <ErrorAction />;
  }

  return (
    <ListItemGrid>
      <ActivityIcon>
        <SubscribeIcon />
      </ActivityIcon>
      <ColumnLayout
        title={t('transaction_type_subscription')}
        entry="-"
        address={
          subscribe.beneficiary.name ??
          toShortAddress(subscribe.beneficiary.address)
        }
        date={date}
      />
    </ListItemGrid>
  );
};
