import { Address, beginCell, Cell, toNano } from '@ton/core';
import { getTonkeeperQueryId } from '../utils';
import BigNumber from 'bignumber.js';

export class NFTEncoder {
    public static readonly nftTransferForwardAmount = BigInt(1);

    public static readonly nftTransferBase = toNano('0.05');

    public static readonly nftLinkAmount = toNano('0.02');

    public static readonly nftRenewAmount = toNano('0.02');

    constructor(private readonly walletAddress: string) {}

    public encodeNftTransfer = ({
        nftTransferAmountWei,
        nftAddress,
        recipientAddress,
        forwardPayload,
        responseAddress
    }: {
        recipientAddress: string;
        nftAddress: string;
        nftTransferAmountWei?: BigNumber;
        forwardPayload?: Cell | null;
        responseAddress?: string;
    }) => {
        const body = this.nftTransferBody({
            queryId: getTonkeeperQueryId(),
            newOwnerAddress: Address.parse(recipientAddress),
            responseAddress: Address.parse(responseAddress ?? this.walletAddress),
            forwardAmount: NFTEncoder.nftTransferForwardAmount,
            forwardPayload
        });

        return {
            to: Address.parse(nftAddress),
            value:
                nftTransferAmountWei !== undefined
                    ? BigInt(nftTransferAmountWei.toFixed(0))
                    : NFTEncoder.nftTransferBase,
            body,
            bounce: true
        };
    };

    public encodeNftLink = ({
        nftAddress,
        linkToAddress
    }: {
        linkToAddress: string;
        nftAddress: string;
    }) => {
        const body = this.nftLinkBody({
            queryId: getTonkeeperQueryId(),
            linkToAddress
        });

        return {
            to: Address.parse(nftAddress),
            value: NFTEncoder.nftLinkAmount,
            body,
            bounce: true
        };
    };

    public encodeNftRenew = ({ nftAddress }: { nftAddress: string }) => {
        const body = this.nftRenewBody({
            queryId: getTonkeeperQueryId()
        });

        return {
            to: Address.parse(nftAddress),
            value: NFTEncoder.nftRenewAmount,
            body,
            bounce: true
        };
    };

    private nftTransferBody = (params: {
        queryId: bigint;
        newOwnerAddress: Address;
        responseAddress: Address;
        forwardAmount: bigint;
        forwardPayload?: Cell | null;
    }) => {
        return beginCell()
            .storeUint(0x5fcc3d14, 32) // transfer op
            .storeUint(params.queryId, 64)
            .storeAddress(params.newOwnerAddress)
            .storeAddress(params.responseAddress)
            .storeBit(false) // null custom_payload
            .storeCoins(params.forwardAmount)
            .storeMaybeRef(params.forwardPayload) // storeMaybeRef put 1 bit before cell (forward_payload in cell) or 0 for null (forward_payload in slice)
            .endCell();
    };

    private nftRenewBody = (params: { queryId: bigint }) => {
        return beginCell()
            .storeUint(0x4eb1f0f9, 32) // op::change_dns_record,
            .storeUint(params.queryId, 64)
            .storeUint(0, 256)
            .endCell();
    };

    private addressToDNSAddressFormat = (address: string) =>
        beginCell().storeUint(0x9fd3, 16).storeAddress(Address.parse(address)).storeUint(0, 8);

    private nftLinkBody = (params: { queryId: bigint; linkToAddress: string }) => {
        let cell = beginCell()
            .storeUint(0x4eb1f0f9, 32) // op::change_dns_record,
            .storeUint(params?.queryId, 64)
            .storeUint(
                BigInt('0xe8d44050873dba865aa7c170ab4cce64d90839a34dcfd6cf71d14e0205443b1b'),
                256
            ); // DNS_CATEGORY_WALLET

        if (params.linkToAddress) {
            cell = cell.storeRef(this.addressToDNSAddressFormat(params.linkToAddress));
        }

        return cell.endCell();
    };
}
