/*https://github.com/ton-blockchain/multisig-contract-v2*/
import { Address, beginCell, Cell, contractAddress, toNano } from '@ton/core';
import { TonWalletStandard } from '../../entries/wallet';
import { Signer } from '../../entries/signer';
import {
    createTransferMessage,
    getWalletSeqnoAndCheckBalance,
    getServerTime,
    signEstimateMessage
} from '../transfer/common';
import { APIConfig } from '../../entries/apis';
import BigNumber from 'bignumber.js';
import { AccountsApi, BlockchainApi, EmulationApi } from '../../tonApiV2';
import { AssetAmount } from '../../entries/crypto/asset/asset-amount';
import { TON_ASSET } from '../../entries/crypto/asset/constants';
import { arrayToCell, MultisigParams } from './utils';

const deployMultisigValue = toNano(0.1);
export const deployMultisigAssetAmount = new AssetAmount({
    weiAmount: new BigNumber(deployMultisigValue.toString()),
    asset: TON_ASSET
});

export const deployMultisig = async (options: {
    api: APIConfig;
    walletState: TonWalletStandard;
    feeWei: BigNumber;
    signer: Signer;
    multisigConfig: MultisigConfig;
}) => {
    const { cell, address } = await createMultisig(options);

    await new BlockchainApi(options.api.tonApiV2).sendBlockchainMessage({
        sendBlockchainMessageRequest: { boc: cell.toString('base64') }
    });

    return { address };
};

export const estimateDeployMultisig = async (options: {
    api: APIConfig;
    walletState: TonWalletStandard;
    multisigConfig: MultisigConfig;
}) => {
    const { cell, address } = await createMultisig({ ...options, signer: signEstimateMessage });

    const event = await new EmulationApi(options.api.tonApiV2).emulateMessageToWallet({
        emulateMessageToWalletRequest: { boc: cell.toString('base64') }
    });

    return {
        fee: new AssetAmount({ weiAmount: new BigNumber(event.event.extra), asset: TON_ASSET }),
        address
    };
};

export const checkIfMultisigExists = async (options: {
    api: APIConfig;
    walletState: TonWalletStandard;
    multisigConfig: MultisigConfig;
}) => {
    const { address } = await createMultisig({ ...options, signer: signEstimateMessage });

    const account = await new AccountsApi(options.api.tonApiV2).getAccount({
        accountId: address.toRawString()
    });

    return !(account.status === 'nonexist' || account.status === 'uninit');
};

const createMultisig = async (options: {
    api: APIConfig;
    walletState: TonWalletStandard;
    feeWei?: BigNumber;
    signer: Signer;
    multisigConfig: MultisigConfig;
}) => {
    const timestamp = await getServerTime(options.api);

    const seqno = (
        await getWalletSeqnoAndCheckBalance({
            ...options,
            fee: options.feeWei !== undefined ? { event: { extra: options.feeWei } } : undefined,
            amount: new BigNumber(deployMultisigValue.toString())
        })
    ).seqno;

    /**
     * https://raw.githubusercontent.com/ton-blockchain/multisig-contract-v2/2cb4b84faf5a6340c2d452695f35779c997ae0f0/build/Multisig.compiled.json
     */
    const stateInit = {
        data: multisigConfigToCell(options.multisigConfig),
        code: Cell.fromBase64(
            Buffer.from(
                'b5ee9c7241021201000495000114ff00f4a413f4bcf2c80b010201620802020120060302016605040159b0c9fe0a00405c00b21633c5804072fff26208b232c07d003d0032c0325c007e401d3232c084b281f2fff274201100f1b0cafb513434ffc04074c1c0407534c1c0407d01348000407448dfdc2385d4449e3d1f1be94c886654c0aebcb819c0a900b7806cc4b99b08548c2ebcb81b085fdc2385d4449e3d1f1be94c886654c0aebcb819c0a900b7806cc4b99b084c08b0803cb81b8930803cb81b5490eefcb81b40648cdfe440f880e00143bf74ff6a26869ff8080e9838080ea69838080fa0269000080e8881aaf8280fc11d0c0700c2f80703830cf94130038308f94130f8075006a18127f801a070f83681120670f836a0812bec70f836a0811d9870f836a022a60622a081053926a027a070f83823a481029827a070f838a003a60658a08106e05005a05005a0430370f83759a001a002cad033d0d3030171b0925f03e0fa403022d749c000925f03e002d31f0120c000925f04e001d33f01ed44d0d3ff0101d3070101d4d3070101f404d2000101d1288210f718510fbae30f054443c8500601cbff500401cb0712cc0101cb07f4000101ca00c9ed540d09029a363826821075097f5dba8eba068210a32c59bfba8ea9f82818c705f2e06503d4d1103410364650f8007f8e8d2178f47c6fa5209132e30d01b3e65b10355034923436e2505413e30d40155033040b0a02e23604d3ff0101d32f0101d3070101d3ff0101d4d1f8285005017002c858cf160101cbffc98822c8cb01f400f400cb00c97001f90074c8cb0212ca07cbffc9d01bc705f2e06526f9001aba5193be19b0f2e06607f823bef2e06f44145056f8007f8e8d2178f47c6fa5209132e30d01b3e65b110b01fa02d74cd0d31f01208210f1381e5bba8e6a82101d0cfbd3ba8e5e6c44d3070101d4217f708e17511278f47c6fa53221995302baf2e06702a402de01b312e66c2120c200f2e06e23c200f2e06d5330bbf2e06d01f404217f708e17511278f47c6fa53221995302baf2e06702a402de01b312e66c2130d155239130e2e30d0c001030d307d402fb00d1019e3806d3ff0128b38e122084ffba923024965305baf2e3f0e205a405de01d2000101d3070101d32f0101d4d1239126912ae2523078f40e6fa1f2e3ef1ec705f2e3ef20f823bef2e06f20f823a1546d700e01d4f80703830cf94130038308f94130f8075006a18127f801a070f83681120670f836a0812bec70f836a0811d9870f836a022a60622a081053926a027a070f83823a481029827a070f838a003a60658a08106e05005a05005a0430370f83759a001a01cbef2e064f82850030f02b8017002c858cf160101cbffc98822c8cb01f400f400cb00c97021f90074c8cb0212ca07cbffc9d0c882109c73fba2580a02cb1fcb3f2601cb075250cc500b01cb2f1bcc2a01ca000a951901cb07089130e2102470408980188050db3c111000928e45c85801cb055005cf165003fa0254712323ed44ed45ed479f5bc85003cf17c913775003cb6bcccced67ed65ed64747fed11987601cb6bcc01cf17ed41edf101f2ffc901fb00db060842026305a8061c856c2ccf05dcb0df5815c71475870567cab5f049e340bcf59251f3ada4ac42',
                'hex'
            ).toString('base64')
        )
    };

    const address = contractAddress(
        Address.parse(options.walletState.rawAddress).workChain,
        stateInit
    );

    const cell = await createTransferMessage(
        {
            timestamp,
            seqno,
            state: options.walletState,
            signer: options.signer
        },
        {
            to: address.toRawString(),
            value: deployMultisigValue,
            init: stateInit
        }
    );

    return {
        cell,
        address
    };
};

export type MultisigConfig = {
    threshold: number;
    signers: Address[];
    proposers: Address[];
    allowArbitrarySeqno: boolean;
};

function multisigConfigToCell(config: MultisigConfig): Cell {
    return beginCell()
        .storeUint(0, MultisigParams.bitsize.orderSeqno)
        .storeUint(config.threshold, MultisigParams.bitsize.signerIndex)
        .storeRef(beginCell().storeDictDirect(arrayToCell(config.signers)))
        .storeUint(config.signers.length, MultisigParams.bitsize.signerIndex)
        .storeDict(arrayToCell(config.proposers))
        .storeBit(config.allowArbitrarySeqno)
        .endCell();
}
