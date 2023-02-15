import React, { FC } from 'react';
import styled from 'styled-components';
import { useTranslation } from '../../hooks/translation';
import { BackButton } from '../fields/BackButton';
import { Button } from '../fields/Button';
import { ChevronLeftIcon } from '../Icon';
import { Gap } from '../Layout';
import {
  FullHeightBlock,
  NotificationCancelButton,
  NotificationTitleBlock,
} from '../Notification';
import { H3 } from '../Text';
import { AmountData } from './AmountView';
import { RecipientData } from './RecipientView';

const ButtonBlock = styled.div`
  position: sticky;
  bottom: 1rem;
  width: 100%;
`;

export const ConfirmView: FC<{
  recipient: RecipientData;
  amount: AmountData;
  onBack: () => void;
  onClose: () => void;
}> = ({ onBack, onClose }) => {
  const { t } = useTranslation();

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.stopPropagation();
  };

  const isValid = false;

  return (
    <FullHeightBlock onSubmit={onSubmit}>
      <NotificationTitleBlock>
        <BackButton onClick={onBack}>
          <ChevronLeftIcon />
        </BackButton>
        <H3> </H3>
        <NotificationCancelButton handleClose={onClose} />
      </NotificationTitleBlock>

      <Gap />

      <ButtonBlock>
        <Button
          fullWidth
          size="large"
          primary
          type="submit"
          disabled={!isValid}
        >
          {t('confirm_sending_submit')}
        </Button>
      </ButtonBlock>
    </FullHeightBlock>
  );
};
