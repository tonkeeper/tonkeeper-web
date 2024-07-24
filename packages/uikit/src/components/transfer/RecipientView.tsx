import { useMutation, useQuery } from '@tanstack/react-query';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { BaseRecipient, DnsRecipient, RecipientData } from '@tonkeeper/core/dist/entries/send';
import { Suggestion } from '@tonkeeper/core/dist/entries/suggestion';
import { Account, AccountsApi, DNSApi } from '@tonkeeper/core/dist/tonApiV2';
import {
    debounce,
    formatAddress,
    seeIfValidTonAddress,
    seeIfValidTronAddress
} from '@tonkeeper/core/dist/utils/common';
import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { openIosKeyboard } from '../../hooks/ios';
import { useTranslation } from '../../hooks/translation';
import { useIsFullWidthMode } from '../../hooks/useIsFullWidthMode';
import { scrollToTop } from '../../libs/common';
import { QueryKey } from '../../libs/queryKey';
import { useIsActiveWalletLedger } from '../../state/ledger';
import { Gap } from '../Layout';
import {
    FullHeightBlock,
    NotificationFooter,
    NotificationFooterPortal,
    NotificationHeader,
    NotificationHeaderPortal
} from '../Notification';
import { Body2 } from '../Text';
import { TextArea } from '../fields/Input';
import { InputWithScanner } from '../fields/InputWithScanner';
import { ShowAddress, useShowAddress } from './ShowAddress';
import { SuggestionList } from './SuggestionList';
import { useActiveTonNetwork } from '../../state/wallet';

const Warning = styled(Body2)`
    user-select: none;
    display: block;
    width: 100%;
    margin-top: -4px;
    color: ${props => props.theme.accentOrange};
`;

export const useGetToAccount = () => {
    const { api } = useAppContext();
    return useMutation<Account, Error, BaseRecipient | DnsRecipient>(recipient => {
        const accountId = 'dns' in recipient ? recipient.dns.address : recipient.address;
        return new AccountsApi(api.tonApiV2).getAccount({ accountId });
    });
};

const useToAccount = (isValid: boolean, recipient: BaseRecipient | DnsRecipient) => {
    const { api } = useAppContext();
    const accountId = 'dns' in recipient ? recipient.dns.address : recipient.address;
    return useQuery<Account, Error>(
        [QueryKey.account, accountId],
        () => new AccountsApi(api.tonApiV2).getAccount({ accountId }),
        { enabled: isValid }
    );
};

export const seeIfInvalidDns = (value: string) => {
    return (
        value.length < 8 ||
        value.length === 48 ||
        value.length === 52 ||
        seeIfValidTonAddress(value) ||
        seeIfValidTronAddress(value)
    );
};

const useDnsWallet = (value: string) => {
    const { api } = useAppContext();

    const [name, setName] = useState('');

    const update = useMemo(() => {
        return debounce<[string]>(v => setName(v), 400);
    }, [setName]);

    update(value);

    return useQuery(
        [QueryKey.dns, value, name],
        async () => {
            if (value !== name) {
                return null;
            }
            let dns = name.trim();
            if (seeIfInvalidDns(dns)) {
                return null;
            }
            dns = dns.toString().toLowerCase();
            const result = await new DNSApi(api.tonApiV2).dnsResolve({ domainName: dns });
            if (!result.wallet) {
                return null;
            }
            return result.wallet;
        },
        {
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
    data?: RecipientData;
    setRecipient: (options: RecipientData) => void;
    keyboard?: 'decimal';
    onScan: (value: string) => void;
    isExternalLoading?: boolean;
    acceptBlockchains?: BLOCKCHAIN_NAME[];
    MainButton: (props: { isLoading: boolean; onClick: () => void }) => JSX.Element;
    HeaderBlock: () => JSX.Element;
    fitContent?: boolean;
    isAnimationProcess?: boolean;
}> = ({
    data,
    setRecipient,
    keyboard,
    onScan,
    isExternalLoading,
    acceptBlockchains,
    HeaderBlock,
    MainButton,
    fitContent,
    isAnimationProcess
}) => {
    const sdk = useAppSdk();
    const [submitted, setSubmit] = useState(false);
    const network = useActiveTonNetwork();
    const { t } = useTranslation();
    const { standalone, ios } = useAppContext();
    const ref = useRef<HTMLTextAreaElement | null>(null);
    const isFullWidth = useIsFullWidthMode();
    const shouldHideHeaderAndFooter = isFullWidth && isAnimationProcess;

    const [comment, setComment] = useState(data && 'comment' in data ? data.comment : '');
    const [recipient, setAddress] = useState<BaseRecipient | DnsRecipient>(
        data?.address ?? defaultRecipient
    );

    const { data: dnsWallet, isFetching: isDnsFetching } = useDnsWallet(recipient.address);

    useEffect(() => {
        const timer = setTimeout(() => scrollToTop(), 300);
        return () => {
            clearTimeout(timer);
        };
    }, []);

    useEffect(() => {
        if (dnsWallet) {
            setAddress(r => ({
                address: r.address,
                dns: dnsWallet,
                dnsName: r.address.toLowerCase()
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

    const isFetching = isAccountFetching || isExternalLoading;

    const isLedger = useIsActiveWalletLedger();

    const isMemoValid = useMemo(() => {
        if (isLedger) {
            // only ascii symbols are supported by ledger
            return /^[ -~]*$/gm.test(comment);
        }

        if (!toAccount) return true;
        if (toAccount.memoRequired) {
            return comment.length > 0;
        }
        return true;
    }, [toAccount, comment, isLedger]);

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
                return formatAddress(recipient.address, network);
            }
        }

        if ('dnsName' in recipient && typeof recipient.dnsName === 'string') {
            return recipient.dnsName;
        }

        return recipient.address;
    }, [recipient, network]);

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
        } else {
            sdk.hapticNotification('error');
        }
    };

    const onSubmit: React.FormEventHandler<HTMLFormElement> = e => {
        e.stopPropagation();
        e.preventDefault();
        handleSubmit();
    };

    const onSelect = async (item: Suggestion) => {
        if (item.blockchain === BLOCKCHAIN_NAME.TON) {
            item.address = formatAddress(item.address, network);
        }
        setAddress(item);
        ref.current?.focus();
        // if (ios && keyboard) openIosKeyboard(keyboard);

        // if (seeIfValidTronAddress(item.address)) {
        //     setRecipient({
        //         address: { ...item, blockchain: BLOCKCHAIN_NAME.TRON },
        //         done: false
        //     });
        // } else {
        //     const to = await getAccountAsync(item);
        //     if (to.memoRequired) return;
        //     setRecipient({
        //         address: { ...item, blockchain: BLOCKCHAIN_NAME.TON },
        //         toAccount: to,
        //         comment,
        //         done: false
        //     });
        // }
    };

    return (
        <FullHeightBlock
            onSubmit={onSubmit}
            standalone={standalone}
            fitContent={fitContent}
            noPadding
        >
            {!shouldHideHeaderAndFooter && (
                <NotificationHeaderPortal>
                    <NotificationHeader>
                        <HeaderBlock />
                    </NotificationHeader>
                </NotificationHeaderPortal>
            )}
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

            {!shouldHideHeaderAndFooter && (
                <NotificationFooterPortal>
                    <NotificationFooter>
                        <MainButton
                            isLoading={isFetching || isDnsFetching}
                            onClick={handleSubmit}
                        />
                    </NotificationFooter>
                </NotificationFooterPortal>
            )}
        </FullHeightBlock>
    );
};
