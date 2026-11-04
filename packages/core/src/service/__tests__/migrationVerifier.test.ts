/* eslint-disable import/no-extraneous-dependencies */
import { Address, beginCell, Cell, internal, storeMessageRelaxed } from '@ton/core';
import { describe, expect, it, vi } from 'vitest';

import { WalletVersion } from '../../entries/wallet';
import { Configuration, JettonBalance, MessageConsequences, NftItem } from '../../tonApiV2';
import { MigrationTransaction } from '../migration/migrationApi';
import {
    loadMigrationVerificationContext,
    MigrationVerificationContext,
    MigrationVerificationError,
    verifyMigrationBatch,
    verifyMigrationTransaction
} from '../migration/migrationVerifier';

const SOURCE = '0:' + 'c'.repeat(64);
const DESTINATION = '0:' + 'd'.repeat(64);
const ATTACKER = '0:' + 'e'.repeat(64);
const JETTON_WALLET = '0:' + '1'.repeat(64);
const JETTON_MASTER = '0:' + '2'.repeat(64);
const NFT_ITEM = '0:' + '5'.repeat(64);
const BATTERY_EXCESS = '0:' + '9'.repeat(64);

const V5_SIGNED_EXTERNAL_OP = 0x7369676e;
const V5_SIGNED_INTERNAL_OP = 0x73696e74;

function jettonBalance(wallet: string, master: string): JettonBalance {
    return {
        balance: '1000',
        walletAddress: { address: wallet, isScam: false, isWallet: false },
        jetton: { address: master, symbol: 'JET', decimals: 9, image: '', name: 'Jetton' }
    } as unknown as JettonBalance;
}

function nftItem(address: string, owner: string): NftItem {
    return {
        address,
        owner: { address: owner, isScam: false, isWallet: true },
        metadata: { name: 'Item' }
    } as unknown as NftItem;
}

function makeContext(
    partial: Partial<MigrationVerificationContext> = {}
): MigrationVerificationContext {
    return {
        source: Address.parse(SOURCE),
        destination: Address.parse(DESTINATION),
        jettonWallets: new Map([[JETTON_WALLET, jettonBalance(JETTON_WALLET, JETTON_MASTER)]]),
        nfts: new Map([[NFT_ITEM, nftItem(NFT_ITEM, SOURCE)]]),
        ...partial
    };
}

function relaxedCell(to: string, body?: Cell, value = 50_000_000n): Cell {
    return beginCell()
        .store(storeMessageRelaxed(internal({ to, value, bounce: true, body })))
        .endCell();
}

function boc(cell: Cell): string {
    return cell.toBoc().toString('base64');
}

function jettonTransferBody(recipient: string, excess: string | null, amount = 1000n): Cell {
    return beginCell()
        .storeUint(0x0f8a7ea5, 32)
        .storeUint(0, 64)
        .storeCoins(amount)
        .storeAddress(Address.parse(recipient))
        .storeAddress(excess ? Address.parse(excess) : null)
        .storeBit(0)
        .storeCoins(1n)
        .storeBit(0)
        .endCell();
}

function nftTransferBody(newOwner: string, excess: string | null): Cell {
    return beginCell()
        .storeUint(0x5fcc3d14, 32)
        .storeUint(0, 64)
        .storeAddress(Address.parse(newOwner))
        .storeAddress(excess ? Address.parse(excess) : null)
        .storeBit(0)
        .storeCoins(1n)
        .storeBit(0)
        .endCell();
}

function v4Header(order = 0) {
    return beginCell()
        .storeUint(698983191, 32)
        .storeUint(1755000000, 32)
        .storeUint(7, 32)
        .storeUint(order, 8);
}

function v5Header(opcode = V5_SIGNED_EXTERNAL_OP) {
    return beginCell()
        .storeUint(opcode, 32)
        .storeInt(-239, 32)
        .storeUint(1755000000, 32)
        .storeUint(7, 32);
}

function makeTransaction(partial: Partial<MigrationTransaction>): MigrationTransaction {
    return {
        seqno: 7,
        boc: boc(v4Header().endCell()),
        messages: [],
        emulation: {} as MessageConsequences,
        gasSpent: '0',
        sponsored: false,
        ...partial
    };
}

function v4WithMessages(...messages: Cell[]): MigrationTransaction {
    return makeTransaction({
        messages: messages.map(message => ({ boc: boc(message), mode: 3 }))
    });
}

describe('verifyMigrationTransaction', () => {
    it('accepts a plain transfer to the destination', () => {
        const verified = verifyMigrationTransaction(
            v4WithMessages(relaxedCell(DESTINATION, undefined, 123n)),
            WalletVersion.V4R2,
            makeContext()
        );

        expect(verified.transfers).toHaveLength(1);
        const [transfer] = verified.transfers;
        expect(transfer.type).toBe('ton');
        expect(transfer.recipient.toRawString()).toBe(DESTINATION);
        expect(transfer.type === 'ton' && transfer.amount).toBe(123n);
    });

    it('rejects a plain transfer to any other address', () => {
        expect(() =>
            verifyMigrationTransaction(
                v4WithMessages(relaxedCell(ATTACKER)),
                WalletVersion.V4R2,
                makeContext()
            )
        ).toThrow(MigrationVerificationError);
    });

    it('accepts a jetton transfer through an owned jetton wallet to the destination', () => {
        const verified = verifyMigrationTransaction(
            v4WithMessages(relaxedCell(JETTON_WALLET, jettonTransferBody(DESTINATION, SOURCE))),
            WalletVersion.V4R2,
            makeContext()
        );

        const [transfer] = verified.transfers;
        expect(transfer.type).toBe('jetton');
        expect(transfer.recipient.toRawString()).toBe(DESTINATION);
        expect(transfer.type === 'jetton' && transfer.amount).toBe(1000n);
    });

    it('rejects a jetton transfer to another recipient', () => {
        expect(() =>
            verifyMigrationTransaction(
                v4WithMessages(relaxedCell(JETTON_WALLET, jettonTransferBody(ATTACKER, SOURCE))),
                WalletVersion.V4R2,
                makeContext()
            )
        ).toThrow(MigrationVerificationError);
    });

    it('rejects a jetton transfer sent through a wallet the source does not own', () => {
        expect(() =>
            verifyMigrationTransaction(
                v4WithMessages(relaxedCell(ATTACKER, jettonTransferBody(DESTINATION, SOURCE))),
                WalletVersion.V4R2,
                makeContext()
            )
        ).toThrow(MigrationVerificationError);
    });

    it('rejects a jetton transfer whose excess goes elsewhere', () => {
        expect(() =>
            verifyMigrationTransaction(
                v4WithMessages(
                    relaxedCell(JETTON_WALLET, jettonTransferBody(DESTINATION, ATTACKER))
                ),
                WalletVersion.V4R2,
                makeContext()
            )
        ).toThrow(MigrationVerificationError);
    });

    it('accepts an owned NFT transferred to the destination', () => {
        const verified = verifyMigrationTransaction(
            v4WithMessages(relaxedCell(NFT_ITEM, nftTransferBody(DESTINATION, DESTINATION))),
            WalletVersion.V4R2,
            makeContext()
        );

        expect(verified.transfers.map(t => t.type)).toEqual(['nft']);
    });

    it('rejects an NFT transferred to another owner', () => {
        expect(() =>
            verifyMigrationTransaction(
                v4WithMessages(relaxedCell(NFT_ITEM, nftTransferBody(ATTACKER, SOURCE))),
                WalletVersion.V4R2,
                makeContext()
            )
        ).toThrow(MigrationVerificationError);
    });

    it('rejects an NFT transfer of an item the source does not own', () => {
        expect(() =>
            verifyMigrationTransaction(
                v4WithMessages(relaxedCell(ATTACKER, nftTransferBody(DESTINATION, SOURCE))),
                WalletVersion.V4R2,
                makeContext()
            )
        ).toThrow(MigrationVerificationError);
    });

    it('rejects any other payload to a non-destination address', () => {
        const body = beginCell().storeUint(0x12345678, 32).endCell();
        expect(() =>
            verifyMigrationTransaction(
                v4WithMessages(relaxedCell(JETTON_WALLET, body)),
                WalletVersion.V4R2,
                makeContext()
            )
        ).toThrow(MigrationVerificationError);
    });

    describe('battery-sponsored transactions', () => {
        const batteryExcess = Address.parse(BATTERY_EXCESS);

        function v5Transaction(sponsored: boolean, opcode: number, ...messages: Cell[]) {
            return makeTransaction({
                sponsored,
                boc: boc(v5Header(opcode).endCell()),
                messages: messages.map(message => ({ boc: boc(message), mode: 3 }))
            });
        }

        it('accepts excess returned to the Battery account', () => {
            const verified = verifyMigrationTransaction(
                v5Transaction(
                    true,
                    V5_SIGNED_INTERNAL_OP,
                    relaxedCell(JETTON_WALLET, jettonTransferBody(DESTINATION, BATTERY_EXCESS)),
                    relaxedCell(NFT_ITEM, nftTransferBody(DESTINATION, BATTERY_EXCESS))
                ),
                WalletVersion.V5R1,
                makeContext({ batteryExcess })
            );
            expect(verified.transfers.map(t => t.type)).toEqual(['jetton', 'nft']);
        });

        it('rejects excess to the Battery account on a self-paid transaction', () => {
            expect(() =>
                verifyMigrationTransaction(
                    v5Transaction(
                        false,
                        V5_SIGNED_EXTERNAL_OP,
                        relaxedCell(JETTON_WALLET, jettonTransferBody(DESTINATION, BATTERY_EXCESS))
                    ),
                    WalletVersion.V5R1,
                    makeContext({ batteryExcess })
                )
            ).toThrow(MigrationVerificationError);
        });

        it('still rejects a sponsored transfer to another recipient', () => {
            expect(() =>
                verifyMigrationTransaction(
                    v5Transaction(
                        true,
                        V5_SIGNED_INTERNAL_OP,
                        relaxedCell(JETTON_WALLET, jettonTransferBody(ATTACKER, BATTERY_EXCESS))
                    ),
                    WalletVersion.V5R1,
                    makeContext({ batteryExcess })
                )
            ).toThrow(MigrationVerificationError);
        });

        it('rejects a signed-internal opcode on a self-paid transaction', () => {
            expect(() =>
                verifyMigrationTransaction(
                    v5Transaction(false, V5_SIGNED_INTERNAL_OP, relaxedCell(DESTINATION)),
                    WalletVersion.V5R1,
                    makeContext()
                )
            ).toThrow(MigrationVerificationError);
        });
    });

    describe('prepared body without messages', () => {
        it('rejects a v4 transaction even when the body pays the destination', () => {
            const body = v4Header().storeUint(3, 8).storeRef(relaxedCell(DESTINATION)).endCell();
            expect(() =>
                verifyMigrationTransaction(
                    makeTransaction({ boc: boc(body) }),
                    WalletVersion.V4R2,
                    makeContext()
                )
            ).toThrow(MigrationVerificationError);
        });

        it('rejects a v5r1 body carrying extended actions', () => {
            const addExtension = beginCell()
                .storeUint(0x02, 8)
                .storeAddress(Address.parse(ATTACKER))
                .endCell();
            const body = v5Header().storeMaybeRef(null).storeBit(1).storeRef(addExtension);
            expect(() =>
                verifyMigrationTransaction(
                    makeTransaction({ boc: boc(body.endCell()) }),
                    WalletVersion.V5R1,
                    makeContext()
                )
            ).toThrow(MigrationVerificationError);
        });
    });

    it('rejects a v4 body with a non-send operation', () => {
        expect(() =>
            verifyMigrationTransaction(
                makeTransaction({
                    boc: boc(v4Header(2).endCell()),
                    messages: [{ boc: boc(relaxedCell(DESTINATION)), mode: 3 }]
                }),
                WalletVersion.V4R2,
                makeContext()
            )
        ).toThrow(MigrationVerificationError);
    });

    it('rejects a v5 opcode other than the signed-request ones', () => {
        expect(() =>
            verifyMigrationTransaction(
                makeTransaction({
                    sponsored: true,
                    boc: boc(v5Header(0x6578746e).endCell()),
                    messages: [{ boc: boc(relaxedCell(DESTINATION)), mode: 3 }]
                }),
                WalletVersion.V5R1,
                makeContext()
            )
        ).toThrow(MigrationVerificationError);
    });
});

describe('verifyMigrationBatch', () => {
    it('rejects the whole batch when any transaction fails', () => {
        expect(() =>
            verifyMigrationBatch(
                [v4WithMessages(relaxedCell(DESTINATION)), v4WithMessages(relaxedCell(ATTACKER))],
                WalletVersion.V4R2,
                makeContext()
            )
        ).toThrow(MigrationVerificationError);
    });
});

describe('loadMigrationVerificationContext', () => {
    it('keeps only the jetton wallets and NFT items the source owns', async () => {
        const otherNft = '0:' + '7'.repeat(64);
        const urls: string[] = [];
        const fetchImpl = vi.fn(async (url: string) => {
            urls.push(url);
            let body: unknown = {};
            if (url.includes('/jettons')) {
                body = {
                    balances: [
                        {
                            balance: '1000',
                            wallet_address: {
                                address: JETTON_WALLET,
                                is_scam: false,
                                is_wallet: false
                            },
                            jetton: {
                                address: JETTON_MASTER,
                                name: 'Jetton',
                                symbol: 'JET',
                                decimals: 9,
                                image: '',
                                verification: 'whitelist',
                                score: 0
                            }
                        }
                    ]
                };
            } else if (url.includes('/nfts/_bulk')) {
                body = {
                    nft_items: [
                        {
                            address: NFT_ITEM,
                            index: 0,
                            owner: { address: SOURCE, is_scam: false, is_wallet: true },
                            verified: true,
                            metadata: {},
                            approved_by: [],
                            trust: 'none'
                        },
                        {
                            address: otherNft,
                            index: 1,
                            owner: { address: ATTACKER, is_scam: false, is_wallet: true },
                            verified: true,
                            metadata: {},
                            approved_by: [],
                            trust: 'none'
                        }
                    ]
                };
            }
            return {
                ok: true,
                status: 200,
                json: async () => body,
                text: async () => JSON.stringify(body)
            } as Response;
        }) as unknown as typeof fetch;

        const context = await loadMigrationVerificationContext({
            api: {
                tonApiV2: new Configuration({
                    basePath: 'https://tonapi.test',
                    fetchApi: fetchImpl
                })
            },
            source: SOURCE,
            destination: DESTINATION,
            version: WalletVersion.V4R2,
            transactions: [
                v4WithMessages(
                    relaxedCell(NFT_ITEM, nftTransferBody(DESTINATION, SOURCE)),
                    relaxedCell(otherNft, nftTransferBody(DESTINATION, SOURCE))
                )
            ]
        });

        expect([...context.jettonWallets.keys()]).toEqual([JETTON_WALLET]);
        expect([...context.nfts.keys()]).toEqual([NFT_ITEM]);
        expect(
            urls.some(url => url.includes(`/accounts/${encodeURIComponent(SOURCE)}/jettons`))
        ).toBe(true);
    });
});
