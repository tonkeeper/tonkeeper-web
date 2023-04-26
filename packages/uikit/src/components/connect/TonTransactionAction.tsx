import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { Action } from '@tonkeeper/core/dist/tonApiV1';
import React, { FC } from 'react';
import styled from 'styled-components';
import { useFormatCoinValue } from '../../hooks/balance';
import { useTranslation } from '../../hooks/translation';
import { TransferComment } from '../activity/ActivityActionDetails';
import {
  ActionBeneficiaryDetails,
  ActionDeployerDetails,
  ActionRecipientDetails,
} from '../activity/NotificationCommon';
import { ListBlock, ListItem, ListItemPayload } from '../List';
import { H3, Label1 } from '../Text';
import { Label } from '../transfer/common';

const actionLabel = (action: Action) => {
  switch (action.type) {
    case 'TonTransfer':
      return 'txActions_signRaw_types_tonTransfer';
    case 'JettonTransfer':
      return 'txActions_signRaw_types_jettonTransfer';
    case 'ContractDeploy':
      return 'txActions_signRaw_types_contractDeploy';
    case 'NftItemTransfer':
      return 'txActions_signRaw_types_nftItemTransfer';
    case 'Subscribe':
      return 'txActions_signRaw_types_subscribe';
    case 'UnSubscribe':
      return 'txActions_signRaw_types_unSubscribe';
    default:
      return 'txActions_signRaw_types_unknownTransaction';
  }
};

const Block = styled.div`
  width: 100%;
`;

const ErrorDetails = () => {
  const { t } = useTranslation();
  return (
    <ListItem hover={false}>
      <ListItemPayload>
        <Label>{t('txActions_signRaw_types_unknownTransaction')}</Label>
      </ListItemPayload>
    </ListItem>
  );
};

export const TonTransactionAction: FC<{ action: Action }> = ({ action }) => {
  const { t } = useTranslation();
  const format = useFormatCoinValue();

  return (
    <Block>
      <H3>{t(actionLabel(action))}</H3>
      <ListBlock margin={false} fullWidth>
        {(() => {
          switch (action.type) {
            case 'TonTransfer': {
              const { tonTransfer } = action;
              if (!tonTransfer) {
                return <ErrorDetails />;
              }
              return (
                <>
                  <ListItem hover={false}>
                    <ListItemPayload>
                      <Label>{t('confirm_sending_amount')}</Label>
                      <Label1>
                        {format(tonTransfer.amount)} {CryptoCurrency.TON}
                      </Label1>
                    </ListItemPayload>
                  </ListItem>
                  <ActionRecipientDetails recipient={tonTransfer.recipient} />
                  <TransferComment comment={tonTransfer.comment} />
                </>
              );
            }

            case 'JettonTransfer': {
              const { jettonTransfer } = action;
              if (!jettonTransfer) {
                return <ErrorDetails />;
              }

              return (
                <>
                  {jettonTransfer.recipient && (
                    <ActionRecipientDetails
                      recipient={jettonTransfer.recipient}
                    />
                  )}
                  <TransferComment comment={jettonTransfer.comment} />
                </>
              );
            }
            case 'ContractDeploy': {
              const { contractDeploy } = action;
              if (!contractDeploy) {
                return <ErrorDetails />;
              }

              return (
                <ActionDeployerDetails deployer={contractDeploy.deployer} />
              );
            }
            case 'NftItemTransfer': {
              const { nftItemTransfer } = action;
              if (!nftItemTransfer) {
                return <ErrorDetails />;
              }

              return (
                <>
                  {nftItemTransfer.recipient && (
                    <ActionRecipientDetails
                      recipient={nftItemTransfer.recipient}
                    />
                  )}
                  <TransferComment comment={nftItemTransfer.comment} />
                </>
              );
            }
            case 'Subscribe': {
              const { subscribe } = action;
              if (!subscribe) {
                return <ErrorDetails />;
              }

              return (
                <ActionBeneficiaryDetails beneficiary={subscribe.beneficiary} />
              );
            }
            case 'UnSubscribe': {
              const { unSubscribe } = action;
              if (!unSubscribe) {
                return <ErrorDetails />;
              }
              return (
                <ActionBeneficiaryDetails
                  beneficiary={unSubscribe.beneficiary}
                />
              );
            }
            default: {
              return <ErrorDetails />;
            }
          }
        })()}
      </ListBlock>
    </Block>
  );
};
