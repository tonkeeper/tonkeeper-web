import {
    Address,
    beginCell,
    Cell,
    contractAddress,
    Dictionary,
    storeMessageRelaxed,
    toNano
} from '@ton/core';
import { getTonkeeperQueryId } from '../../utils';
import { Multisig } from '../../../../tonApiV2';
import { APIConfig } from '../../../../entries/apis';
import { Action, MultisigConfig, NewOrder, TransferRequest, UpdateRequest } from './types';
import { arrayToCell, getOrderSeqno, MultisigOp, MultisigParams } from './multisig-utils';

export class MultisigEncoder {
    public static readonly deployMultisigValue = toNano(0.1);

    public static readonly signOrderAmount = toNano(0.05);

    public static readonly createOrderAmount = toNano(0.05);

    constructor(private readonly api: APIConfig, private readonly hostWalletAddress: string) {}

    public encodeCreateMultisig = async (multisigConfig: MultisigConfig) => {
        const stateInit = this.multisigStateInit(multisigConfig);
        const address = this.multisigAddress(multisigConfig);

        return {
            to: Address.parse(address.toRawString()),
            bounce: false,
            value: MultisigEncoder.deployMultisigValue,
            init: stateInit
        };
    };

    public multisigAddress(multisigConfig: MultisigConfig) {
        return contractAddress(
            Address.parse(this.hostWalletAddress).workChain,
            this.multisigStateInit(multisigConfig)
        );
    }

    public encodeSignOrder(multisig: Pick<Multisig, 'signers'>, orderAddress: string) {
        const addrIdx = multisig.signers.indexOf(this.hostWalletAddress);
        if (addrIdx === -1) {
            throw new Error('Sender is not a signer');
        }

        const queryId = getTonkeeperQueryId();
        const body = beginCell()
            .storeUint(MultisigOp.order.approve, MultisigParams.bitsize.op)
            .storeUint(queryId, MultisigParams.bitsize.queryId)
            .storeUint(addrIdx, MultisigParams.bitsize.signerIndex)
            .endCell();

        return {
            to: Address.parse(orderAddress),
            bounce: true,
            value: MultisigEncoder.signOrderAmount,
            body
        };
    }

    public async encodeNewOrder({
        multisig,
        order
    }: {
        multisig: Pick<Multisig, 'address' | 'signers' | 'proposers'>;
        order: NewOrder;
    }) {
        let isSigner = false;
        let addrIdx = multisig.signers.indexOf(this.hostWalletAddress);
        if (addrIdx !== -1) {
            isSigner = true;
        } else {
            addrIdx = multisig.proposers.indexOf(this.hostWalletAddress);
            if (addrIdx === -1) {
                throw new Error('Sender is not a signer or proposer');
            }
        }

        const newOrderSeqno = await this.getOrderSeqno(multisig.address);

        const queryId = getTonkeeperQueryId();

        const body = this.createNewOrderMessageBody(
            order.actions,
            order.validUntilSeconds,
            isSigner,
            addrIdx,
            newOrderSeqno,
            queryId
        );

        return {
            to: Address.parse(multisig.address),
            bounce: true,
            value: MultisigEncoder.createOrderAmount,
            body
        };
    }

    private createNewOrderMessageBody(
        actions: Action[],
        expirationDate: number,
        isSigner: boolean,
        addrIdx: number,
        order_id: bigint,
        query_id: number | bigint = 0
    ) {
        if (actions.length === 0) {
            throw new Error("Order list can't be empty!");
        }

        const msgBody = beginCell()
            .storeUint(MultisigOp.multisig.new_order, MultisigParams.bitsize.op)
            .storeUint(query_id, MultisigParams.bitsize.queryId)
            .storeUint(order_id, MultisigParams.bitsize.orderSeqno)
            .storeBit(isSigner)
            .storeUint(addrIdx, MultisigParams.bitsize.signerIndex)
            .storeUint(expirationDate, MultisigParams.bitsize.time);

        const order_cell = this.packOrderBody(actions);
        return msgBody.storeRef(order_cell).endCell();
    }

    private packOrderBody(actions: Array<Action>) {
        const order_dict = Dictionary.empty(Dictionary.Keys.Uint(8), Dictionary.Values.Cell());
        if (actions.length > 255) {
            throw new Error('For action chains above 255, use packLarge method');
        } else {
            // pack transfers to the order_body cell
            for (let i = 0; i < actions.length; i++) {
                const action = actions[i];
                const actionCell =
                    action.type === 'transfer'
                        ? this.packTransferRequest(action)
                        : this.packUpdateRequest(action);
                order_dict.set(i, actionCell);
            }
            return beginCell().storeDictDirect(order_dict).endCell();
        }
    }

    private packTransferRequest(transfer: TransferRequest) {
        const message = beginCell().store(storeMessageRelaxed(transfer.message)).endCell();
        return beginCell()
            .storeUint(MultisigOp.actions.send_message, MultisigParams.bitsize.op)
            .storeUint(transfer.sendMode, 8)
            .storeRef(message)
            .endCell();
    }

    private packUpdateRequest(update: UpdateRequest) {
        return beginCell()
            .storeUint(MultisigOp.actions.update_multisig_params, MultisigParams.bitsize.op)
            .storeUint(update.threshold, MultisigParams.bitsize.signerIndex)
            .storeRef(beginCell().storeDictDirect(arrayToCell(update.signers)))
            .storeDict(arrayToCell(update.proposers))
            .endCell();
    }

    private getOrderSeqno = async (multisigAddress: string) => {
        return getOrderSeqno(this.api, multisigAddress);
    };

    private multisigStateInit(multisigConfig: MultisigConfig) {
        /**
         * https://raw.githubusercontent.com/ton-blockchain/multisig-contract-v2/2cb4b84faf5a6340c2d452695f35779c997ae0f0/build/Multisig.compiled.json
         */
        return {
            data: this.multisigConfigToCell(multisigConfig),
            code: Cell.fromBase64(
                Buffer.from(
                    'b5ee9c7241021201000495000114ff00f4a413f4bcf2c80b010201620802020120060302016605040159b0c9fe0a00405c00b21633c5804072fff26208b232c07d003d0032c0325c007e401d3232c084b281f2fff274201100f1b0cafb513434ffc04074c1c0407534c1c0407d01348000407448dfdc2385d4449e3d1f1be94c886654c0aebcb819c0a900b7806cc4b99b08548c2ebcb81b085fdc2385d4449e3d1f1be94c886654c0aebcb819c0a900b7806cc4b99b084c08b0803cb81b8930803cb81b5490eefcb81b40648cdfe440f880e00143bf74ff6a26869ff8080e9838080ea69838080fa0269000080e8881aaf8280fc11d0c0700c2f80703830cf94130038308f94130f8075006a18127f801a070f83681120670f836a0812bec70f836a0811d9870f836a022a60622a081053926a027a070f83823a481029827a070f838a003a60658a08106e05005a05005a0430370f83759a001a002cad033d0d3030171b0925f03e0fa403022d749c000925f03e002d31f0120c000925f04e001d33f01ed44d0d3ff0101d3070101d4d3070101f404d2000101d1288210f718510fbae30f054443c8500601cbff500401cb0712cc0101cb07f4000101ca00c9ed540d09029a363826821075097f5dba8eba068210a32c59bfba8ea9f82818c705f2e06503d4d1103410364650f8007f8e8d2178f47c6fa5209132e30d01b3e65b10355034923436e2505413e30d40155033040b0a02e23604d3ff0101d32f0101d3070101d3ff0101d4d1f8285005017002c858cf160101cbffc98822c8cb01f400f400cb00c97001f90074c8cb0212ca07cbffc9d01bc705f2e06526f9001aba5193be19b0f2e06607f823bef2e06f44145056f8007f8e8d2178f47c6fa5209132e30d01b3e65b110b01fa02d74cd0d31f01208210f1381e5bba8e6a82101d0cfbd3ba8e5e6c44d3070101d4217f708e17511278f47c6fa53221995302baf2e06702a402de01b312e66c2120c200f2e06e23c200f2e06d5330bbf2e06d01f404217f708e17511278f47c6fa53221995302baf2e06702a402de01b312e66c2130d155239130e2e30d0c001030d307d402fb00d1019e3806d3ff0128b38e122084ffba923024965305baf2e3f0e205a405de01d2000101d3070101d32f0101d4d1239126912ae2523078f40e6fa1f2e3ef1ec705f2e3ef20f823bef2e06f20f823a1546d700e01d4f80703830cf94130038308f94130f8075006a18127f801a070f83681120670f836a0812bec70f836a0811d9870f836a022a60622a081053926a027a070f83823a481029827a070f838a003a60658a08106e05005a05005a0430370f83759a001a01cbef2e064f82850030f02b8017002c858cf160101cbffc98822c8cb01f400f400cb00c97021f90074c8cb0212ca07cbffc9d0c882109c73fba2580a02cb1fcb3f2601cb075250cc500b01cb2f1bcc2a01ca000a951901cb07089130e2102470408980188050db3c111000928e45c85801cb055005cf165003fa0254712323ed44ed45ed479f5bc85003cf17c913775003cb6bcccced67ed65ed64747fed11987601cb6bcc01cf17ed41edf101f2ffc901fb00db060842026305a8061c856c2ccf05dcb0df5815c71475870567cab5f049e340bcf59251f3ada4ac42',
                    'hex'
                ).toString('base64')
            )
        };
    }

    private multisigConfigToCell(config: MultisigConfig): Cell {
        return beginCell()
            .storeUint(0, MultisigParams.bitsize.orderSeqno)
            .storeUint(config.threshold, MultisigParams.bitsize.signerIndex)
            .storeRef(beginCell().storeDictDirect(arrayToCell(config.signers)))
            .storeUint(config.signers.length, MultisigParams.bitsize.signerIndex)
            .storeDict(arrayToCell(config.proposers))
            .storeBit(config.allowArbitrarySeqno)
            .endCell();
    }
}
