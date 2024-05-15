import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Address, BitString, SendMode, beginCell, internal, toNano } from '@ton/core';
import { APIConfig } from '@tonkeeper/core/dist/entries/apis';
import { CellSigner, Signer } from '@tonkeeper/core/dist/entries/signer';
import { WalletState } from '@tonkeeper/core/dist/entries/wallet';
import {
    checkWalletBalanceOrDie,
    externalMessage,
    getServerTime,
    getTTL,
    getTonkeeperQueryId,
    getWalletBalance,
    getWalletSeqNo,
    signEstimateMessage
} from '@tonkeeper/core/dist/service/transfer/common';
import { walletContractFromState } from '@tonkeeper/core/dist/service/wallet/contractService';
import { AccountsApi, BlockchainApi, EmulationApi, NftItem } from '@tonkeeper/core/dist/tonApiV2';
import { TonendpointConfig } from '@tonkeeper/core/dist/tonkeeperApi/tonendpoint';
import { unShiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import { delay } from '@tonkeeper/core/dist/utils/common';
import { FC, useEffect, useRef, useState } from 'react';
import { styled } from 'styled-components';
import { NotCoinIcon, SpinnerIcon } from '../../components/Icon';
import { SkeletonList } from '../../components/Skeleton';
import { Body1, Body2, Label2 } from '../../components/Text';
import { ImportNotification } from '../../components/create/ImportNotification';
import {
    DesktopViewHeader,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { Button } from '../../components/fields/Button';
import { useAppContext, useWalletContext } from '../../hooks/appContext';
import { useAppSdk, useToast } from '../../hooks/appSdk';
import { useDateTimeFormat } from '../../hooks/useDateTimeFormat';
import { getSigner } from '../../state/mnemonic';
import { useCheckTouchId } from '../../state/password';

const useVouchers = () => {
    const wallet = useWalletContext();
    const { api } = useAppContext();

    const limit = 1000;

    const getItems = async (offset: number) => {
        const items = await new AccountsApi(api.tonApiV2).getAccountNftItems({
            accountId: wallet.active.rawAddress,
            collection: 'EQDmkj65Ab_m0aZaW8IpKw4kYqIgITw_HRstYEkVQ6NIYCyW',
            limit: limit,
            offset: offset
        });

        return items.nftItems;
    };

    return useQuery(['notcoin', 'length', wallet.active.rawAddress], async () => {
        const result: NftItem[] = [];
        let page: NftItem[] = [];
        let offset = 0;
        do {
            console.log('loading', offset);
            page = await getItems(offset);
            offset += page.length;
            result.push(...page);
        } while (page.length === limit);
        return result;
    });
};

export const confirmWalletSeqNo = async (
    activeWallet: string,
    api: APIConfig,
    currentSeqNo: number
) => {
    let walletSeqNo: number = currentSeqNo - 1;
    do {
        await delay(4000);

        try {
            walletSeqNo = await getWalletSeqNo(api, activeWallet);
            console.log('wait seqno', currentSeqNo, walletSeqNo);
        } catch (e) {
            console.error(e);
        }
    } while (walletSeqNo <= currentSeqNo);
};

const getNotcoinBurnAddress = (nftAddress: string, config: TonendpointConfig) => {
    const nftAddressBits = new BitString(Address.parse(nftAddress).hash, 0, 4);

    const burnAddresses = config.notcoin_burn_addresses ?? [];
    const burnAddressesBits = burnAddresses.map(
        (address: string) => new BitString(Address.parse(address).hash, 0, 4)
    );

    const index = burnAddressesBits.findIndex(item => nftAddressBits.equals(item));

    return Address.parse(burnAddresses[index]);
};

const checkBurnDate = async (api: APIConfig, config: TonendpointConfig) => {
    const burnTimestamp = config.notcoin_burn_date
        ? config.notcoin_burn_date
        : Date.now() / 1000 + 300;
    const nowTimestamp = await getServerTime(api);

    if (burnTimestamp > nowTimestamp) {
        return [false, burnTimestamp] as const;
    }

    return [true, burnTimestamp] as const;
};

const createNftMultiTransfer = async (
    timestamp: number,
    seqno: number,
    walletState: WalletState,
    chunk: NftItem[],
    config: TonendpointConfig,
    signer: CellSigner
) => {
    const contract = walletContractFromState(walletState);

    const transfer = await contract.createTransferAndSignRequestAsync({
        seqno,
        signer,
        timeout: getTTL(timestamp),
        sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
        messages: chunk.map(nft => {
            return internal({
                to: Address.parse(nft.address),
                bounce: true,
                value: toNano('0.07'),
                body: beginCell()
                    .storeUint(0x5fcc3d14, 32) // transfer op
                    .storeUint(getTonkeeperQueryId(), 64)
                    .storeAddress(getNotcoinBurnAddress(nft.address, config))
                    .storeAddress(Address.parse(walletState.active.rawAddress))
                    .storeBit(false)
                    .storeCoins(toNano('0.05'))
                    .storeBit(false)
                    .storeUint(0x5fec6642, 32)
                    .storeUint(nft.index, 64)
                    .endCell()
            });
        })
    });

    return externalMessage(contract, seqno, transfer).toBoc();
};

const sendNftMultiTransfer = async (
    api: APIConfig,
    walletState: WalletState,
    chunk: NftItem[],
    config: TonendpointConfig,
    signer: CellSigner
) => {
    const timestamp = await getServerTime(api);

    const [wallet, seqno] = await getWalletBalance(api, walletState);

    checkWalletBalanceOrDie(unShiftedDecimals(0.07).multipliedBy(chunk.length), wallet);

    const estimationCell = await createNftMultiTransfer(
        timestamp,
        seqno,
        walletState,
        chunk,
        config,
        signEstimateMessage
    );

    const res = await new EmulationApi(api.tonApiV2).emulateMessageToAccountEvent({
        ignoreSignatureCheck: true,
        accountId: wallet.address,
        decodeMessageRequest: { boc: estimationCell.toString('base64') }
    });

    if (res.actions.some(action => action.status !== 'ok')) {
        throw new Error('NFT transfer estimation failed');
    }

    const cell = await createNftMultiTransfer(timestamp, seqno, walletState, chunk, config, signer);

    await new BlockchainApi(api.tonApiV2).sendBlockchainMessage({
        sendBlockchainMessageRequest: { boc: cell.toString('base64') }
    });
    return true;
};

const useBurnMutation = (config: TonendpointConfig) => {
    const wallet = useWalletContext();
    const { api } = useAppContext();

    return useMutation<boolean, Error, { signer: Signer | null; chunk: NftItem[] }>(
        async ({ signer, chunk }) => {
            if (signer === null) {
                throw new Error('Unable to sign transaction.');
            }

            const seqno = await getWalletSeqNo(api, wallet.active.rawAddress);

            console.log('send', chunk);

            await sendNftMultiTransfer(api, wallet, chunk, config, signer as CellSigner);

            await confirmWalletSeqNo(wallet.active.rawAddress, api, seqno);

            return true;
        }
    );
};

const NotFound = styled.div`
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 1rem;
`;

const NotFoundBlock = () => {
    const [isOpenImport, setIsOpenImport] = useState(false);
    return (
        <NotFound>
            <NotCoinIcon size="128" />

            <Body1>Wallet don't have NOT Vouchers</Body1>

            <Body2>Please cancel any existing auctions for your vouchers</Body2>

            <Button primary onClick={() => setIsOpenImport(true)}>
                Import another wallet
            </Button>
            <ImportNotification isOpen={isOpenImport} setOpen={setIsOpenImport} />
        </NotFound>
    );
};

const Wrapper = styled.div`
    padding: 1rem;
`;

const Center = styled(Body1)`
    display: flex;
    align-items: center;
    gap: 1rem;
`;

const TgLink = styled.a`
    color: ${p => p.theme.accentBlue};
    cursor: pointer;
    text-decoration: underline;
`;

const BodyCenter = styled(Body2)`
    text-align: center;
    max-width: 435px;
`;

const BurnBlock: FC<{ data: NftItem[] | undefined }> = ({ data }) => {
    const { api, config } = useAppContext();

    const [burning, setBurning] = useState(false);
    const [ok, setIsOk] = useState(false);
    const [left, setLeft] = useState(0);

    const mutation = useBurnMutation(config);
    const toast = useToast();

    const { mutateAsync: checkTouchId } = useCheckTouchId();
    const wallet = useWalletContext();

    const process = useRef(true);
    const sdk = useAppSdk();
    const client = useQueryClient();
    const formatDate = useDateTimeFormat();

    useEffect(() => {
        return () => {
            process.current = false;
            client.invalidateQueries(['notcoin']);
        };
    }, []);

    const onBurn = async () => {
        const [allow, time] = await checkBurnDate(api, config);
        if (!allow) {
            toast(
                `Burning NOT Vouchers will be available soon! ${formatDate(new Date(time * 1000), {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    inputUnit: 'seconds'
                })}`
            );
            return;
        }

        setLeft(data?.length ?? 0);
        setBurning(true);

        if (!data) return;
        const signer: Signer | null = await getSigner(sdk, wallet.publicKey, checkTouchId).catch(
            () => null
        );

        const chunkSize = 4;
        for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            try {
                if (process.current) {
                    await mutation.mutateAsync({ signer, chunk });
                    setLeft(l => l - chunkSize);
                }
            } catch (e) {
                toast(e instanceof Error ? e.message : 'Unexpected error.');
            }
        }
        setIsOk(true);
    };

    if (!data) {
        return <SkeletonList size={3} fullWidth />;
    }

    if (ok) {
        return (
            <NotFound>
                <NotCoinIcon size="128" />
                <Center>Finish</Center>
                <BodyCenter>
                    You burned all NOT Vouchers. Notcoin will deposit to your wallet address{' '}
                    <TgLink
                        onClick={e => {
                            e.stopPropagation();
                            sdk.openPage(`https://tonviewer.com/${wallet.active.friendlyAddress}`);
                        }}
                    >
                        Check Tonviewer!
                    </TgLink>
                </BodyCenter>
            </NotFound>
        );
    }
    if (burning) {
        return (
            <NotFound>
                <NotCoinIcon size="128" />
                <Center>
                    <SpinnerIcon />
                    Burning, {left} vouchers left
                </Center>
                <BodyCenter>Please wait and don't close this page</BodyCenter>
                <BodyCenter>
                    Wallet should have enough TON for transfer NFTs - 0.07 TON per voucher.
                </BodyCenter>
            </NotFound>
        );
    }

    if (data.length === 0) {
        return <NotFoundBlock />;
    }

    return (
        <NotFound>
            <NotCoinIcon size="128" />
            <Body1>The wallet contains {data.length} vouchers</Body1>
            <BodyCenter>
                The process will take approximately{' '}
                {Math.round((Math.ceil(data.length / 4) * 30) / 60)} min
            </BodyCenter>
            <BodyCenter>
                Please ensure that the wallet has sufficient TON to transfer NFTs - 0.07 TON per
                voucher. The wallet will initiate multiple transactions to transfer the NFT vouchers
                to a Burning Smart Contracts. More Details{' '}
                <TgLink
                    onClick={e => {
                        e.stopPropagation();
                        sdk.openPage('https://t.me/notcoin_bot');
                    }}
                >
                    Notcoin Bot
                </TgLink>
                .
            </BodyCenter>
            <Button primary onClick={onBurn}>
                Burn NOT Vouchers
            </Button>
        </NotFound>
    );
};

export const NotcoinPage = () => {
    const { data } = useVouchers();
    return (
        <DesktopViewPageLayout>
            <DesktopViewHeader borderBottom>
                <Label2>Burn NOT Vouchers</Label2>
            </DesktopViewHeader>
            <Wrapper>
                <BurnBlock data={data} />
            </Wrapper>
        </DesktopViewPageLayout>
    );
};
