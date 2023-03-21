import { JettonInfo } from '@tonkeeper/core/dist/tonApiV1';
import { formatTransferUrl } from '@tonkeeper/core/dist/utils/common';
import React, { FC, useCallback, useState } from 'react';
import QRCode from 'react-qr-code';
import styled from 'styled-components';
import { useWalletContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { ToncoinIcon } from '../Icon';
import { Notification, NotificationBlock } from '../Notification';
import { Body1, H2, Label1, Label2 } from '../Text';
import { Action } from './Actions';
import { ReceiveIcon } from './HomeIcons';

const Block = styled.div`
  padding: 1rem;
  width: 100%;
  box-sizing: border-box;
  border-radius: ${(props) => props.theme.cornerSmall};
  background: ${(props) => props.theme.backgroundContent};

  max-width: 80%;
  overflow: hidden;
`;

const CopyBlock = styled(Block)`
  padding: 0;
`;

const TextBlock = styled.div`
  padding: 1rem;
  box-sizing: border-box;
`;
const CopyButton = styled(Label2)`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;

  cursor: pointer;
  padding: 0.875rem 1rem 0.875rem;
  box-sizing: border-box;

  border-top: 1px solid ${(props) => props.theme.separatorCommon};
  text-align: center;
  transition: background-color 0.1s ease;

  &:hover {
    background-color: ${(props) => props.theme.backgroundContentTint};
    border-top: 1px solid ${(props) => props.theme.backgroundContentTint};
  }
`;

const Background = styled.div`
  padding: 1.625rem;
  width: 100%;
  box-sizing: border-box;
  border-radius: 8px;
  background: ${(props) => props.theme.textPrimary};

  svg {
    width: 100%;
    height: 100%;
  }
`;

const TitleText = styled(Label1)`
  margin-bottom: 1rem;
  display: inline-block;
`;

const Text = styled(Label1)`
  margin-bottom: 2px;
  display: inline-block;
`;

const AddressText = styled(Body1)`
  display: inline-block;
  color: ${(props) => props.theme.textSecondary};
  word-break: break-all;
`;

const Title = styled(H2)`
  text-align: center;
  max-width: 80%;
`;

const CopyIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="17"
      height="16"
      viewBox="0 0 17 16"
      fill="none"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.863 11.988C13.8314 11.9619 14.4518 11.8795 14.964 11.6185C15.6225 11.283 16.158 10.7475 16.4935 10.089C16.875 9.34028 16.875 8.36018 16.875 6.4V5.6C16.875 3.63982 16.875 2.65972 16.4935 1.91103C16.158 1.25247 15.6225 0.717034 14.964 0.381477C14.2153 0 13.2352 0 11.275 0H10.475C8.51481 0 7.53472 0 6.78603 0.381477C6.12746 0.717034 5.59203 1.25247 5.25647 1.91103C4.99552 2.42319 4.91307 3.04363 4.88703 4.01203C3.91863 4.03808 3.29819 4.12052 2.78603 4.38148C2.12746 4.71703 1.59203 5.25247 1.25647 5.91103C0.874993 6.65972 0.874992 7.63982 0.874992 9.6V10.4C0.874992 12.3602 0.874993 13.3403 1.25647 14.089C1.59203 14.7475 2.12746 15.283 2.78603 15.6185C3.53472 16 4.51481 16 6.47499 16H7.27499C9.23518 16 10.2153 16 10.964 15.6185C11.6225 15.283 12.158 14.7475 12.4935 14.089C12.7545 13.5768 12.8369 12.9564 12.863 11.988ZM11.275 1.5H10.475C9.47015 1.5 8.80673 1.50117 8.29835 1.5427C7.80748 1.58281 7.59466 1.65295 7.46701 1.71799C7.09069 1.90973 6.78473 2.21569 6.59298 2.59202C6.52795 2.71966 6.4578 2.93248 6.4177 3.42335C6.40364 3.59541 6.39421 3.78521 6.38788 4C6.4167 4 6.44574 4 6.47499 4H7.27499C9.23518 4 10.2153 4 10.964 4.38148C11.6225 4.71703 12.158 5.25247 12.4935 5.91103C12.875 6.65972 12.875 7.63982 12.875 9.6V10.4C12.875 10.4293 12.875 10.4583 12.875 10.4871C13.0898 10.4808 13.2796 10.4714 13.4516 10.4573C13.9425 10.4172 14.1553 10.3471 14.283 10.282C14.6593 10.0903 14.9653 9.78431 15.157 9.40798C15.222 9.28034 15.2922 9.06752 15.3323 8.57665C15.3738 8.06826 15.375 7.40484 15.375 6.4V5.6C15.375 4.59516 15.3738 3.93174 15.3323 3.42335C15.2922 2.93248 15.222 2.71966 15.157 2.59202C14.9653 2.21569 14.6593 1.90973 14.283 1.71799C14.1553 1.65295 13.9425 1.58281 13.4516 1.5427C12.9433 1.50117 12.2798 1.5 11.275 1.5ZM6.47499 5.5H7.27499C8.27984 5.5 8.94326 5.50117 9.45164 5.5427C9.94251 5.58281 10.1553 5.65295 10.283 5.71799C10.6593 5.90973 10.9653 6.21569 11.157 6.59202C11.222 6.71966 11.2922 6.93248 11.3323 7.42335C11.3738 7.93174 11.375 8.59516 11.375 9.6V10.4C11.375 11.4048 11.3738 12.0683 11.3323 12.5766C11.2922 13.0675 11.222 13.2803 11.157 13.408C10.9653 13.7843 10.6593 14.0903 10.283 14.282C10.1553 14.3471 9.94251 14.4172 9.45164 14.4573C8.94326 14.4988 8.27984 14.5 7.27499 14.5H6.47499C5.47015 14.5 4.80673 14.4988 4.29835 14.4573C3.80748 14.4172 3.59465 14.3471 3.46701 14.282C3.09069 14.0903 2.78473 13.7843 2.59298 13.408C2.52794 13.2803 2.4578 13.0675 2.4177 12.5766C2.37616 12.0683 2.37499 11.4048 2.37499 10.4V9.6C2.37499 8.59516 2.37616 7.93174 2.4177 7.42335C2.4578 6.93248 2.52794 6.71966 2.59298 6.59202C2.78473 6.21569 3.09069 5.90973 3.46701 5.71799C3.59465 5.65295 3.80748 5.58281 4.29835 5.5427C4.80673 5.50117 5.47015 5.5 6.47499 5.5Z"
        fill="currentColor"
      />
    </svg>
  );
};

const Logo = styled.img`
  width: 72px;
  height: 72px;
  border-radius: ${(props) => props.theme.cornerFull};

  pointer-events: none;
`;

const ReceiveContent: FC<{ info?: JettonInfo }> = ({ info }) => {
  const { t } = useTranslation();
  const sdk = useAppSdk();
  const wallet = useWalletContext();

  return (
    <NotificationBlock>
      {info?.metadata.image ? (
        <Logo src={info?.metadata.image} />
      ) : (
        <ToncoinIcon width="72" height="72" />
      )}
      <Title>
        {info
          ? t('receive_title').replace('%{currency}', info.metadata.symbol)
          : t('receive_ton_and_jettons')}
      </Title>
      <Block>
        <TitleText>{t('receive_qr_title')}</TitleText>
        <Background>
          <QRCode
            size={400}
            value={formatTransferUrl({
              address: wallet.active.friendlyAddress,
              jetton: info?.metadata.address,
            })}
            strokeLinecap="round"
            strokeLinejoin="miter"
          />
        </Background>
      </Block>
      <CopyBlock>
        <TextBlock>
          <Text>{t('receive_address_title')}</Text>
          <AddressText
            onClick={() =>
              sdk.copyToClipboard(
                wallet.active.friendlyAddress,
                t('address_copied')
              )
            }
          >
            {wallet.active.friendlyAddress}
          </AddressText>
        </TextBlock>
        <CopyButton
          onClick={() =>
            sdk.copyToClipboard(
              wallet.active.friendlyAddress,
              t('address_copied')
            )
          }
        >
          <CopyIcon />
          <span>{t('Copy_address')}</span>
        </CopyButton>
      </CopyBlock>
    </NotificationBlock>
  );
};

export const ReceiveNotification: FC<{
  open: boolean;
  handleClose: () => void;
  info?: JettonInfo;
}> = ({ open, handleClose, info }) => {
  const Content = useCallback(() => {
    if (!open) return undefined;
    return <ReceiveContent info={info} />;
  }, [open, info]);

  return (
    <Notification isOpen={open} handleClose={handleClose}>
      {Content}
    </Notification>
  );
};

export const ReceiveAction: FC<{ info?: JettonInfo }> = ({ info }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Action
        icon={<ReceiveIcon />}
        title={t('wallet_receive')}
        action={() => setOpen(true)}
      />
      <ReceiveNotification
        open={open}
        handleClose={() => setOpen(false)}
        info={info}
      />
    </>
  );
};
