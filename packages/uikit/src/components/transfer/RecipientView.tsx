import { useMutation, useQuery } from '@tanstack/react-query';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { BaseRecipient, DnsRecipient, RecipientData } from '@tonkeeper/core/dist/entries/send';
import { Suggestion } from '@tonkeeper/core/dist/entries/suggestion';
import { AccountApi, AccountRepr, DNSApi } from '@tonkeeper/core/dist/tonApiV1';
import {
    debounce,
    seeIfValidTonAddress,
    seeIfValidTronAddress
} from '@tonkeeper/core/dist/utils/common';
import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { Address } from 'ton-core';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { openIosKeyboard } from '../../hooks/ios';
import { useTranslation } from '../../hooks/translation';
import { QueryKey } from '../../libs/queryKey';
import { Gap } from '../Layout';
import { FullHeightBlock, NotificationCancelButton, NotificationTitleBlock } from '../Notification';
import { Body2, H3 } from '../Text';
import { ButtonMock } from '../fields/BackButton';
import { Button } from '../fields/Button';
import { TextArea } from '../fields/Input';
import { InputWithScanner } from '../fields/InputWithScanner';
import { ShowAddress, useShowAddress } from './ShowAddress';
import { SuggestionList } from './SuggestionList';
import { ButtonBlock } from './common';

const Warning = styled(Body2)`
    user-select: none;
    display: block;
    width: 100%;
    margin-top: -4px;
    color: ${props => props.theme.accentOrange};
`;

export const useGetToAccount = () => {
    const { api } = useAppContext();
    return useMutation<AccountRepr, Error, BaseRecipient | DnsRecipient>(recipient => {
        const account = 'dns' in recipient ? recipient.dns.address : recipient.address;
        return new AccountApi(api.tonApi).getAccountInfo({ account });
    });
};

const useToAccount = (isValid: boolean, recipient: BaseRecipient | DnsRecipient) => {
    const { api } = useAppContext();
    const account = 'dns' in recipient ? recipient.dns.address : recipient.address;
    return useQuery<AccountRepr, Error>(
        [QueryKey.account, account],
        () => new AccountApi(api.tonApi).getAccountInfo({ account }),
        { enabled: isValid }
    );
};

const useDnsWallet = (value: string) => {
    const { api } = useAppContext();

    const [name, setName] = useState('');

    const update = useMemo(() => {
        return debounce<[string]>(v => {
            if (v === '' || v.length < 4 || seeIfValidTonAddress(v) || seeIfValidTronAddress(v)) {
                setName('');
            } else {
                setName(v.trim().toLowerCase());
            }
        }, 400);
    }, [setName]);

    update(value);

    return useQuery(
        [QueryKey.dns, value, name],
        async () => {
            const result = await new DNSApi(api.tonApi).dnsResolve({ name });
            if (!result.wallet) {
                return null;
            }
            return result.wallet;
        },
        {
            enabled: name.length >= 4,
            retry: 0,
            keepPreviousData: false
        }
    );
};

const seeIfValidTonRecipient = (recipient: BaseRecipient | DnsRecipient) => {
    return 'dns' in recipient || seeIfValidTonAddress(recipient.address);
};

const defaultRecipient = { address: '' };

export const RecipientView: FC<{
    title: string;
    data?: RecipientData;
    onClose: () => void;
    setRecipient: (options: RecipientData) => void;
    keyboard?: 'decimal';
    onScan: (value: string) => void;
    isExternalLoading?: boolean;
    acceptBlockchains?: BLOCKCHAIN_NAME[];
}> = ({
    title,
    data,
    onClose,
    setRecipient,
    keyboard,
    onScan,
    isExternalLoading,
    acceptBlockchains
}) => {
    const sdk = useAppSdk();
    const [submitted, setSubmit] = useState(false);
    const { t } = useTranslation();
    const { standalone, ios } = useAppContext();
    const ref = useRef<HTMLTextAreaElement | null>(null);

    const { mutateAsync: getAccountAsync, isLoading: isAccountLoading } = useGetToAccount();

    const [comment, setComment] = useState(data && 'comment' in data ? data.comment : '');
    const [recipient, setAddress] = useState<BaseRecipient | DnsRecipient>(
        data?.address ?? defaultRecipient
    );

    const { data: dnsWallet, isFetching: isDnsFetching } = useDnsWallet(recipient.address);

    useEffect(() => {
        if (dnsWallet) {
            setAddress(r => ({
                address: r.address,
                dns: dnsWallet
            }));
        }
        if (dnsWallet == null) {
            setAddress(r => {
                if ('dns' in r) {
                    return { address: r.address };
                }
                return r;
            });
        }
    }, [setAddress, dnsWallet]);

    const isValidForBlockchain = useMemo(() => {
        if (acceptBlockchains && acceptBlockchains.length === 1) {
            return acceptBlockchains[0];
        }

        let validForBlockchain;
        if (seeIfValidTonRecipient(recipient)) {
            validForBlockchain = BLOCKCHAIN_NAME.TON;
        } else if (seeIfValidTronAddress(recipient.address)) {
            validForBlockchain = BLOCKCHAIN_NAME.TRON;
        }

        if (
            !acceptBlockchains ||
            (validForBlockchain && acceptBlockchains.includes(validForBlockchain))
        ) {
            return validForBlockchain;
        }

        return null;
    }, [recipient]);

    const isValidAddress = useMemo(() => {
        if (acceptBlockchains && acceptBlockchains.length === 1) {
            return acceptBlockchains[0] === BLOCKCHAIN_NAME.TON
                ? seeIfValidTonRecipient(recipient)
                : seeIfValidTronAddress(recipient.address);
        } else {
            return true;
        }
    }, [acceptBlockchains, recipient]);

    const { data: toAccount, isFetching: isAccountFetching } = useToAccount(
        isValidForBlockchain === BLOCKCHAIN_NAME.TON && seeIfValidTonRecipient(recipient),
        recipient
    );

    const isFetching = isAccountFetching || isAccountLoading || isExternalLoading;

    const isMemoValid = useMemo(() => {
        if (!toAccount) return true;
        if (toAccount.memoRequired) {
            return comment.length > 0;
        }
        return true;
    }, [toAccount, comment]);

    useEffect(() => {
        if (sdk.isIOs()) {
            return;
        }
        if (ref.current) {
            ref.current.focus();
        }
    }, [ref.current]);

    const formatted = useMemo(() => {
        if ('isFavorite' in recipient) {
            if (recipient.blockchain === BLOCKCHAIN_NAME.TRON) {
                return recipient.address;
            } else {
                return Address.parse(recipient.address).toString();
            }
        }
        return recipient.address;
    }, [recipient]);

    const showAddress = useShowAddress(ref, formatted, toAccount);

    const handleSubmit = () => {
        setSubmit(true);
        let isValid;
        switch (isValidForBlockchain) {
            case BLOCKCHAIN_NAME.TON:
                isValid = isMemoValid && toAccount;
                break;
            case BLOCKCHAIN_NAME.TRON:
                isValid = seeIfValidTronAddress(recipient.address);
        }
        if (isValid) {
            if (ios && keyboard) openIosKeyboard(keyboard);
            if (isValidForBlockchain === BLOCKCHAIN_NAME.TON) {
                setRecipient({
                    address: { ...recipient, blockchain: BLOCKCHAIN_NAME.TON },
                    toAccount: toAccount!,
                    comment,
                    done: true
                });
            } else {
                setRecipient({
                    address: { ...recipient, blockchain: BLOCKCHAIN_NAME.TRON },
                    done: true
                });
            }
        }
    };
    const onSubmit: React.FormEventHandler<HTMLFormElement> = e => {
        e.stopPropagation();
        e.preventDefault();
        handleSubmit();
    };

    const onSelect = async (item: Suggestion) => {
        setAddress(item);
        if (ios && keyboard) openIosKeyboard(keyboard);

        if (seeIfValidTronAddress(item.address)) {
            setRecipient({
                address: { ...item, blockchain: BLOCKCHAIN_NAME.TRON },
                done: true
            });
        } else {
            const to = await getAccountAsync(item);
            if (to.memoRequired) return;
            setRecipient({
                address: { ...item, blockchain: BLOCKCHAIN_NAME.TON },
                toAccount: to,
                comment,
                done: true
            });
        }
    };

    return (
        <FullHeightBlock onSubmit={onSubmit} standalone={standalone}>
            <NotificationTitleBlock>
                <ButtonMock />
                <H3>{title}</H3>
                <NotificationCancelButton handleClose={onClose} />
            </NotificationTitleBlock>
            <ShowAddress value={showAddress}>
                <InputWithScanner
                    onSubmit={handleSubmit}
                    ref={ref}
                    value={formatted}
                    onScan={onScan}
                    onChange={address => setAddress({ address })}
                    label={t('transaction_recipient_address')}
                    isValid={!submitted || (!!isValidForBlockchain && isValidAddress)}
                    disabled={isExternalLoading}
                />
            </ShowAddress>

            {isValidForBlockchain !== BLOCKCHAIN_NAME.TRON && (
                <TextArea
                    onSubmit={handleSubmit}
                    value={comment}
                    onChange={setComment}
                    label={t('txActions_signRaw_comment')}
                    isValid={!submitted || isMemoValid}
                    disabled={isExternalLoading}
                />
            )}
            {toAccount && toAccount.memoRequired && (
                <Warning>{t('send_screen_steps_comfirm_comment_required_text')}</Warning>
            )}

            <SuggestionList
                onSelect={onSelect}
                disabled={isExternalLoading}
                acceptBlockchains={acceptBlockchains}
            />

            <Gap />

            <ButtonBlock>
                <Button
                    fullWidth
                    size="large"
                    primary
                    type="submit"
                    loading={isFetching || isDnsFetching}
                >
                    {t('continue')}
                </Button>
            </ButtonBlock>
        </FullHeightBlock>
    );
};
