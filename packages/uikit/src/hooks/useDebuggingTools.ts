import { TwoFAEncoder } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/two-fa-encoder';
import { useActiveAccountQuery, useActiveApi } from '../state/wallet';
import { beginCell, external, storeMessage, storeStateInit } from '@ton/core';
import { useGetAccountSigner } from '../state/mnemonic';
import { BlockchainApi } from '@tonkeeper/core/dist/tonApiV2';

export const useDebuggingTools = () => {
    const api = useActiveApi();
    const getSigner = useGetAccountSigner();
    const { data: activeAccount } = useActiveAccountQuery();

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
                    .storeBuffer(signature)
                    .storeSlice(dataToSign.beginParse())
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
            }
        };
    }
};
