import { useEffect } from 'react';

import { BlockchainApi } from '@tonkeeper/core/dist/tonApiV2';
import { IMetaEncryptionData } from '@tonkeeper/core/dist/entries/wallet';
import { decryptMeta } from '@tonkeeper/core/dist/service/meta/metadataService';
import { Address, beginCell, Cell, external, storeMessage, storeStateInit } from '@ton/core';
import { TwoFAEncoder } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/two-fa-encoder';

import { useActiveAccountQuery, useActiveApi, useMetaEncryptionData } from '../state/wallet';
import { useGetAccountSigner } from '../state/mnemonic';
import { useAppContext } from './appContext';
import { useAppSdk } from './appSdk';

export const useDebuggingTools = () => {
    const api = useActiveApi();
    const { data: metaEncryptionMap, isLoading } = useMetaEncryptionData();
    const getSigner = useGetAccountSigner();
    const { data: activeAccount } = useActiveAccountQuery();
    const sdk = useAppSdk();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const activityKey =
                'I UNDERSTAND THAT BY DOING THIS I MAY LOSE ALL MY FUNDS/Я ПОНИМАЮ, ЧТО ПОДЕЛАЯ ТАК, Я МОГУ ПОТЕРЯТЬ ВСЕ СВОИ СРЕДСТВА';
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            window.kdt = {
                checkKey() {
                    return this.key && this.key === activityKey;
                },
                async disableTwoFA() {
                    if (!this.checkKey()) {
                        console.error('ERR: method is not supported');
                        return;
                    }

                    const wallet = activeAccount!.activeTonWallet;

                    const twoFAEncoder = new TwoFAEncoder(api, wallet.rawAddress);
                    const stateInit = beginCell()
                        .store(storeStateInit(twoFAEncoder.pluginStateInit))
                        .endCell();
                    const payload = beginCell().storeRef(stateInit).storeCoins(1);

                    const dataToSign = beginCell()
                        .storeUint(0x23d9c15c, 32)
                        .storeUint(await twoFAEncoder.getPluginSeqno(), 32)
                        .storeUint(Math.round(Date.now() / 1000) + 600, 64)
                        .storeBuilder(payload)
                        .endCell();

                    const signer = await getSigner(activeAccount!.id);

                    if (signer.type !== 'cell') {
                        throw new Error('Wrong signer type');
                    }

                    const signature = await signer(dataToSign);

                    const body = beginCell()
                        .storeSlice(dataToSign.beginParse())
                        .storeBuffer(signature)
                        .endCell();

                    const ext = beginCell()
                        .storeWritable(
                            storeMessage(
                                external({
                                    to: twoFAEncoder.pluginAddress,
                                    body
                                })
                            )
                        )
                        .endCell();

                    await new BlockchainApi(api.tonApiV2).sendBlockchainMessage({
                        sendBlockchainMessageRequest: { boc: ext.toBoc().toString('base64') }
                    });

                    console.log('Disable two FA with seed sent');
                },
                async resetTronMamMigration() {
                    if (!this.checkKey()) {
                        console.error('ERR: method is not supported');
                        return;
                    }

                    await sdk.storage.delete('TRON_MAM_ACCOUNTS_HAS_BEEN_MIGRATED_KEY');
                    console.log('TRON_MAM_ACCOUNTS_HAS_BEEN_MIGRATED_KEY reset');
                },
                async decodeMeta(encryptedMeta: string) {
                    if (!this.checkKey()) {
                        console.error('ERR: method is not supported');
                        return;
                    }

                    try {
                        const wallet = activeAccount!.activeTonWallet;
                        const keyPair = metaEncryptionMap?.[wallet.rawAddress]?.keyPair;

                        if (!keyPair) {
                            console.error('ERR: no keyPair created!');
                            return;
                        }

                        const cells = Cell.fromBoc(Buffer.from(encryptedMeta, 'hex'));
                        const metaCell = cells[0];

                        const data = await decryptMeta(
                            metaCell,
                            Address.parse(wallet.rawAddress),
                            Buffer.from(keyPair.secretKey)
                        );

                        console.log('Decrypted Meta:\n', JSON.stringify(JSON.parse(data), null, 2));
                    } catch (e) {
                        console.error('ERR: ', e);
                    }
                },
                async getEncryptionMap() {
                    if (!this.checkKey()) {
                        console.error('ERR: method is not supported');
                        return;
                    }

                    if (!metaEncryptionMap) {
                        console.error('ERR: no metaEncryptionMap found');
                        return;
                    }

                    function transformWalletsStatus(obj: Record<string, IMetaEncryptionData>) {
                        const result: Record<string, string> = {};

                        for (const [rawAddress, value] of Object.entries(obj)) {
                            const friendly = Address.parse(rawAddress).toString({
                                bounceable: false
                            });

                            const hasKey = !!value.keyPair;
                            const hasCert = !!value.certificate;

                            result[friendly] = hasKey && hasCert ? 'Success' : 'Failed';
                        }

                        return result;
                    }

                    console.log(
                        'Meta Encryption Map:\n',
                        JSON.stringify(transformWalletsStatus(metaEncryptionMap), null, 2)
                    );
                }
            };
        }
    }, [api, activeAccount, getSigner, metaEncryptionMap, isLoading]);
};

export const useSwapWidgetDebuggingTools = () => {
    const { tonendpoint } = useAppContext();
    const env = tonendpoint.params.platform;

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const activityKey =
                'I UNDERSTAND THAT BY DOING THIS I MAY LOSE ALL MY FUNDS/Я ПОНИМАЮ, ЧТО ПОДЕЛАЯ ТАК, Я МОГУ ПОТЕРЯТЬ ВСЕ СВОИ СРЕДСТВА';
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            window.kdt = {
                checkKey() {
                    return this.key && this.key === activityKey;
                },
                async enableTonkeeperInjectionContext() {
                    if (!this.checkKey()) {
                        console.error('ERR: method is not supported');
                        return;
                    }

                    window.localStorage.setItem('tonkeeper::test-injection-context', 'true');
                }
            };
        }
    }, [env]);
};
