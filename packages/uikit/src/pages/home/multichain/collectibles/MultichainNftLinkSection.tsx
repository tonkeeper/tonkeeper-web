import { FC, FormEvent, useEffect, useState } from 'react';
import { Address } from '@ton/core';

import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { NFTDNS } from '@tonkeeper/core/dist/entries/nft';
import { isStandardTonWallet } from '@tonkeeper/core/dist/entries/wallet';
import { getWalletsAddresses } from '@tonkeeper/core/dist/service/walletService';
import { areEqAddresses, formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { isTMEDomain } from '@tonkeeper/core/dist/utils/nft';

import { Button, Input, Link } from '../../../../primitives';
import { Modal, ModalFooter, ModalFooterPortal } from '../../../../primitives/Modal';
import { MultichainDetailCell } from '../MultichainDetailCell';
import { useAppContext } from '../../../../hooks/appContext';
import { formatFiatCurrency } from '../../../../hooks/balance';
import { useTranslation } from '../../../../hooks/translation';
import { useNavigate } from '../../../../hooks/router/useNavigate';
import { MultichainRoute } from '../../../../libs/routes';
import { useNotifyErrorHandle, useToast } from '../../../../hooks/useNotification';
import { useQueryChangeWait } from '../../../../hooks/useQueryChangeWait';
import { useAreNftActionsDisabled } from '../../../../hooks/blockchain/nft/useAreNftActionsDisabled';
import { useEstimateNftLink } from '../../../../hooks/blockchain/nft/useEstimateNftLink';
import { useLinkNft } from '../../../../hooks/blockchain/nft/useLinkNft';
import { useAssetAmountFiatEquivalent } from '../../../../state/asset';
import { useNftDNSLinkData } from '../../../../state/nft';
import { useActiveAccount, useActiveTonNetwork, useActiveWallet } from '../../../../state/wallet';
import {
    NftActionConfirmSheet,
    NftActionFeeCell,
    NftActionWalletCell
} from './MultichainNftActionConfirm';
import { nftPreviewImage } from './nft-utils';

// Must match `NFTEncoder.nftLinkAmount` — the value actually attached to
// the link message.
const LINK_ASSET_AMOUNT = AssetAmount.fromRelativeAmount({ asset: TON_ASSET, amount: 0.02 });

const LinkAmountCell: FC = () => {
    const { t } = useTranslation();
    const { fiat } = useAppContext();
    const { data: amountFiatBN } = useAssetAmountFiatEquivalent(LINK_ASSET_AMOUNT);
    return (
        <MultichainDetailCell
            label={t('send_amount')}
            value={LINK_ASSET_AMOUNT.stringAssetRelativeAmount}
            sub={amountFiatBN ? formatFiatCurrency(fiat, amountFiatBN) : undefined}
        />
    );
};

/**
 * Address entry for linking the domain somewhere other than the active
 * wallet. Validation happens on submit only — a half-typed address must not
 * flash red while the user is still pasting or typing.
 */
const LinkAddressSheet: FC<{
    isOpen: boolean;
    domain: string;
    loading: boolean;
    onClose: () => void;
    onSave: (rawAddress: string) => void;
}> = ({ isOpen, domain, loading, onClose, onSave }) => {
    const { t } = useTranslation();
    const [value, setValue] = useState('');
    const [invalid, setInvalid] = useState(false);

    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            onSave(Address.parse(value.trim()).toRawString());
        } catch {
            setInvalid(true);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            afterClose={() => {
                setValue('');
                setInvalid(false);
            }}
            heading={t('wallet_address')}
            subheading={t('add_dns_address').replace('%1%', domain)}
        >
            <form id="dns-link-address-form" onSubmit={onSubmit}>
                <Input
                    id="dns-link-address"
                    label={t('wallet_address')}
                    value={value}
                    autoFocus
                    clearButton
                    disabled={loading}
                    isValid={!invalid}
                    helpText={invalid ? t('send_address_error') : undefined}
                    onChange={v => {
                        setInvalid(false);
                        setValue(v);
                    }}
                />
            </form>
            <ModalFooterPortal>
                <ModalFooter>
                    <Button
                        form="dns-link-address-form"
                        type="submit"
                        variant="primaryBlue"
                        size="large"
                        fullWidth
                        loading={loading}
                        disabled={value.trim() === ''}
                    >
                        {t('save')}
                    </Button>
                </ModalFooter>
            </ModalFooterPortal>
        </Modal>
    );
};

const LinkUnlinked: FC<{
    nft: NFTDNS;
    isLoading: boolean;
    onConfirmed: () => void;
}> = ({ nft, isLoading, onConfirmed }) => {
    const { t } = useTranslation();
    const notifyError = useNotifyErrorHandle();
    const account = useActiveAccount();
    const wallet = useActiveWallet();
    const network = useActiveTonNetwork();
    const isDisabled = useAreNftActionsDisabled(nft);

    const [linkToAddress, setLinkToAddress] = useState(wallet.rawAddress);
    const [view, setView] = useState<'confirm' | 'address' | undefined>();

    const estimation = useEstimateNftLink({ nftAddress: nft.address, linkToAddress });
    const mutation = useLinkNft({ nftAddress: nft.address, linkToAddress });

    const onOpen = () => {
        if (estimation.error) {
            notifyError(estimation.error as Error);
            return;
        }
        setView('confirm');
    };

    const onCloseConfirm = (confirmed?: boolean) => {
        setView(undefined);
        if (confirmed) {
            onConfirmed();
        } else {
            setLinkToAddress(wallet.rawAddress);
        }
    };

    const isCurrentAddress = areEqAddresses(linkToAddress, wallet.rawAddress);
    const buttonLabel = isTMEDomain(nft.dns)
        ? t('nft_link_username_button')
        : t('nft_link_domain_button');

    return (
        <>
            <Button
                variant="secondary"
                size="large"
                fullWidth
                disabled={isDisabled}
                loading={estimation.isFetching || isLoading}
                onClick={onOpen}
            >
                {buttonLabel}
            </Button>
            <NftActionConfirmSheet
                isOpen={view !== undefined}
                onClose={onCloseConfirm}
                title={buttonLabel}
                image={nftPreviewImage(nft)}
                imageAlt={nft.dns}
                estimation={estimation}
                mutation={mutation}
                rows={
                    <>
                        <NftActionWalletCell emoji={account.emoji} name={account.name} />
                        <MultichainDetailCell
                            label={
                                isCurrentAddress ? t('dns_current_address') : t('wallet_address')
                            }
                            value={toShortValue(formatAddress(linkToAddress, network))}
                            sub={
                                <Link
                                    onClick={() => setView('address')}
                                    className="text-body2 text-textAccent"
                                >
                                    {t('replace')}
                                </Link>
                            }
                        />
                        <LinkAmountCell />
                        <NftActionFeeCell estimation={estimation} />
                    </>
                }
            />
            <LinkAddressSheet
                isOpen={view === 'address'}
                domain={nft.dns}
                loading={estimation.isFetching}
                onClose={() => setView('confirm')}
                onSave={address => {
                    setLinkToAddress(address);
                    setView('confirm');
                }}
            />
        </>
    );
};

const LinkLinked: FC<{
    nft: NFTDNS;
    linkedAddress: string;
    isLoading: boolean;
    onConfirmed: () => void;
}> = ({ nft, linkedAddress, isLoading, onConfirmed }) => {
    const { t } = useTranslation();
    const notifyError = useNotifyErrorHandle();
    const account = useActiveAccount();
    const wallet = useActiveWallet();
    const network = useActiveTonNetwork();
    const isDisabled = useAreNftActionsDisabled(nft);
    const [isOpen, setIsOpen] = useState(false);

    // An empty target address clears the domain's wallet record.
    const estimation = useEstimateNftLink({ nftAddress: nft.address, linkToAddress: '' });
    const mutation = useLinkNft({ nftAddress: nft.address, linkToAddress: '' });

    const onOpen = () => {
        if (estimation.error) {
            notifyError(estimation.error as Error);
            return;
        }
        setIsOpen(true);
    };

    const isLinkedWithAnotherWallet = Object.values(
        isStandardTonWallet(wallet) ? getWalletsAddresses(wallet.publicKey, network) : {}
    ).every(({ address }) => !areEqAddresses(address.toRawString(), linkedAddress));

    return (
        <div className="flex flex-col items-center gap-3">
            <Button
                variant="secondary"
                size="large"
                fullWidth
                disabled={isDisabled}
                loading={estimation.isFetching || isLoading}
                onClick={onOpen}
            >
                {t('nft_unlink_domain_button', {
                    address: toShortValue(formatAddress(linkedAddress, network))
                })}
            </Button>
            {isLinkedWithAnotherWallet && !isLoading && (
                <span className="text-center text-body2 text-accentOrange">
                    {isTMEDomain(nft.dns)
                        ? t('tme_linked_with_another_address_warn')
                        : t('dns_linked_with_another_address_warn')}
                </span>
            )}
            <NftActionConfirmSheet
                isOpen={isOpen}
                onClose={confirmed => {
                    setIsOpen(false);
                    if (confirmed) onConfirmed();
                }}
                title={t('confirm_unlink')}
                image={nftPreviewImage(nft)}
                imageAlt={nft.dns}
                estimation={estimation}
                mutation={mutation}
                rows={
                    <>
                        <NftActionWalletCell emoji={account.emoji} name={account.name} />
                        <MultichainDetailCell label={t('send_confirm_recipient')} value={nft.dns} />
                        <LinkAmountCell />
                        <NftActionFeeCell estimation={estimation} />
                    </>
                }
            />
        </div>
    );
};

/**
 * Link / unlink a `.ton` domain or `.t.me` name to a wallet address, for the
 * multichain NFT details sheet. Reads the current DNS record through tonapi;
 * a confirmed change leaves for History, where the transaction shows up
 * pending, while the record is polled until the chain reflects it.
 */
export const MultichainNftLinkSection: FC<{ nft: NFTDNS }> = ({ nft }) => {
    const { t } = useTranslation();
    const toast = useToast();
    const navigate = useNavigate();
    const query = useNftDNSLinkData(nft);
    const { data, isLoading } = query;
    const linkedAddress = data?.wallet?.address ?? '';

    const {
        refetch: waitLinkUpdate,
        isLoading: isWaitingForUpdate,
        isCompleted
    } = useQueryChangeWait(
        query,
        (current, prev) => !!prev?.wallet?.address !== !!current?.wallet?.address
    );

    useEffect(() => {
        if (isCompleted) {
            toast(linkedAddress ? t('dns_address_linked') : t('dns_address_unlinked'));
        }
    }, [isCompleted, linkedAddress, toast, t]);

    const onConfirmed = () => {
        waitLinkUpdate();
        navigate(MultichainRoute.history);
    };

    if (!linkedAddress) {
        return (
            <LinkUnlinked
                nft={nft}
                isLoading={isLoading || isWaitingForUpdate}
                onConfirmed={onConfirmed}
            />
        );
    }

    return (
        <LinkLinked
            nft={nft}
            linkedAddress={linkedAddress}
            isLoading={isWaitingForUpdate}
            onConfirmed={onConfirmed}
        />
    );
};
