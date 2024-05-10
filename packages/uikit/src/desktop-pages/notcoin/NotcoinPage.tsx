import { useMutation, useQuery } from '@tanstack/react-query';
import { APIConfig } from '@tonkeeper/core/dist/entries/apis';
import { CellSigner, Signer } from '@tonkeeper/core/dist/entries/signer';
import { getWalletSeqNo } from '@tonkeeper/core/dist/service/transfer/common';
import { sendNftMultiTransfer } from '@tonkeeper/core/dist/service/transfer/multiSendService';
import { AccountsApi, NftItem } from '@tonkeeper/core/dist/tonApiV2';
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

    return useQuery(['notcoin', 'length'], async () => {
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

const useBurnMutation = () => {
    const wallet = useWalletContext();
    const { api } = useAppContext();

    return useMutation<boolean, Error, { signer: Signer | null; chunk: NftItem[] }>(
        async ({ signer, chunk }) => {
            if (signer === null) {
                throw new Error('Unable to sign transaction.');
            }

            const seqno = await getWalletSeqNo(api, wallet.active.rawAddress);

            const transferMessages = chunk.map(item => ({
                nft: item.address,
                to: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c'
            }));
            console.log('send', transferMessages);

            await sendNftMultiTransfer(
                api,
                wallet,
                transferMessages,
                unShiftedDecimals(0.04),
                signer as CellSigner
            );

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
    const [burning, setBurning] = useState(false);
    const [ok, setIsOk] = useState(false);
    const [left, setLeft] = useState(0);

    const mutation = useBurnMutation();
    const toast = useToast();

    const { mutateAsync: checkTouchId } = useCheckTouchId();
    const wallet = useWalletContext();

    const process = useRef(true);
    const sdk = useAppSdk();

    useEffect(() => {
        return () => {
            process.current = false;
        };
    }, []);
    const onBurn = async () => {
        setLeft(data?.length ?? 0);
        setBurning(true);

        if (!data) return;
        const signer: Signer | null = await getSigner(sdk, wallet.publicKey, checkTouchId).catch(
            () => null
        );

        const chunkSize = 1;
        for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, i + chunkSize);
            try {
                if (process.current) {
                    await mutation.mutateAsync({ signer, chunk });
                }
                setLeft(l => l - chunkSize);
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
                    Please open{' '}
                    <TgLink
                        onClick={e => {
                            e.stopPropagation();
                            sdk.openPage('https://t.me/notcoin_bot');
                        }}
                    >
                        Notcoin Bot
                    </TgLink>{' '}
                    to index burning and get Notcoins!
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
                    Wallet should have enough TON for transfer NFTs. On finish please open{' '}
                    <TgLink
                        onClick={e => {
                            e.stopPropagation();
                            sdk.openPage('https://t.me/notcoin_bot');
                        }}
                    >
                        Notcoin Bot
                    </TgLink>{' '}
                    to index burning.
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
                Please ensure that the wallet has sufficient TON to transfer NFTs. The wallet will
                initiate multiple transactions to transfer the NFT vouchers to a Null Address.
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
