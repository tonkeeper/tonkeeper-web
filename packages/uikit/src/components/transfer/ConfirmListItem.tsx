import { Address } from '@ton/core';
import { BLOCKCHAIN_NAME, CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { RecipientData, isTonRecipientData } from '@tonkeeper/core/dist/entries/send';
import { toShortValue } from '@tonkeeper/core/dist/utils/common';
import { FC } from 'react';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { ColumnText } from '../Layout';
import { ListItem, ListItemPayload } from '../List';
import { Label1 } from '../Text';
import { getRecipientAddress } from './amountView/AmountViewUI';
import { Label } from './common';
import { useActiveTonNetwork } from '../../state/wallet';

export const cropName = (name: string) => {
    return name.length > 19 ? toShortValue(name, 8) : name;
};

const RecipientItem: FC<{ name: string; label: string }> = ({ name, label }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();

    return (
        <ListItem onClick={() => sdk.copyToClipboard(name)}>
            <ListItemPayload>
                <Label>{t('txActions_signRaw_recipient')}</Label>
                <Label1>{cropName(label)}</Label1>
            </ListItemPayload>
        </ListItem>
    );
};

const RecipientItemAddress: FC<{ address: string }> = ({ address }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();

    return (
        <ListItem onClick={() => sdk.copyToClipboard(address, t('address_copied'))}>
            <ListItemPayload>
                <Label>{t('transaction_recipient_address')}</Label>
                <Label1>{toShortValue(address)}</Label1>
            </ListItemPayload>
        </ListItem>
    );
};

export const RecipientListItem: FC<{ recipient: RecipientData }> = ({ recipient }) => {
    const { address } = recipient;
    const network = useActiveTonNetwork();
    const addrValue = getRecipientAddress(recipient, network);

    if ('isFavorite' in address && address.isFavorite) {
        if (address.blockchain === BLOCKCHAIN_NAME.TRON) {
            return (
                <>
                    <RecipientItem name={address.address} label={address.name} />
                    <RecipientItemAddress address={addrValue} />
                </>
            );
        } else {
            return (
                <>
                    <RecipientItem
                        name={Address.parse(address.address).toString()}
                        label={address.name}
                    />
                    <RecipientItemAddress address={addrValue} />
                </>
            );
        }
    }
    if ('dnsName' in recipient.address && typeof recipient.address.dnsName === 'string') {
        return (
            <>
                <RecipientItem name={recipient.address.dnsName} label={recipient.address.dnsName} />
                <RecipientItemAddress address={addrValue} />
            </>
        );
    }

    if (isTonRecipientData(recipient) && recipient.toAccount.name) {
        const name = recipient.toAccount.name;
        return (
            <>
                <RecipientItem name={name} label={name} />
                <RecipientItemAddress address={addrValue} />
            </>
        );
    }

    return <RecipientItem name={addrValue} label={toShortValue(addrValue)} />;
};

export const AmountListItem: FC<{
    coinAmount: string;
    fiatAmount?: string;
}> = ({ coinAmount, fiatAmount }) => {
    const { t } = useTranslation();

    return (
        <ListItem hover={false}>
            <ListItemPayload>
                <Label>{t('txActions_amount')}</Label>
                {fiatAmount ? (
                    <ColumnText right text={coinAmount} secondary={<>≈&thinsp;{fiatAmount}</>} />
                ) : (
                    <Label1>{coinAmount}</Label1>
                )}
            </ListItemPayload>
        </ListItem>
    );
};

export const FeeListItem: FC<{ feeAmount: string; fiatFeeAmount?: string }> = ({
    feeAmount,
    fiatFeeAmount
}) => {
    const { t } = useTranslation();
    return (
        <ListItem hover={false}>
            <ListItemPayload>
                <Label>{t('txActions_fee')}</Label>
                {fiatFeeAmount ? (
                    <ColumnText
                        right
                        text={
                            <>
                                {feeAmount} {CryptoCurrency.TON}
                            </>
                        }
                        secondary={<>≈&thinsp;{fiatFeeAmount}</>}
                    />
                ) : (
                    <Label1>
                        {feeAmount} {CryptoCurrency.TON}
                    </Label1>
                )}
            </ListItemPayload>
        </ListItem>
    );
};
