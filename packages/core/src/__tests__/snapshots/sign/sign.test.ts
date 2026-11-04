/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { Network } from '../../../entries/network';
import { getLedgerAccountPathByIndex } from '../../../service/ledger/utils';

import { SNAPSHOT_NETWORKS, SNAPSHOT_WALLET_VERSIONS, walletVersionName } from './fixtures';
import { buildSnapshot, ComboSnapshot, comboIdFor, FIXTURE_KINDS, FixtureKind } from './harness';

const HERE = dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_DIR = HERE;
const UPDATE = process.env.UPDATE_SNAPSHOTS === '1';

const readSnapshot = (comboId: string): ComboSnapshot | null => {
    const path = join(SNAPSHOT_DIR, `${comboId}.json`);
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, 'utf8')) as ComboSnapshot;
};

const writeSnapshot = (snapshot: ComboSnapshot) => {
    if (!existsSync(SNAPSHOT_DIR)) {
        mkdirSync(SNAPSHOT_DIR, { recursive: true });
    }
    const path = join(SNAPSHOT_DIR, `${snapshot.comboId}.json`);
    writeFileSync(path, JSON.stringify(snapshot, null, 4) + '\n', 'utf8');
};

describe('signer snapshot harness — getSigner() regression', () => {
    for (const kind of FIXTURE_KINDS) {
        for (const version of SNAPSHOT_WALLET_VERSIONS) {
            for (const network of SNAPSHOT_NETWORKS) {
                const comboId = comboIdFor(kind, version, network);
                const networkLabel = network === Network.MAINNET ? 'MAINNET' : 'TESTNET';

                it(`${kind} × ${walletVersionName(
                    version
                )} × ${networkLabel} produces a stable signed BOC`, async () => {
                    const fresh = await buildSnapshot(kind, version, network);
                    expect(fresh.comboId).toBe(comboId);

                    if (UPDATE) {
                        writeSnapshot(fresh);
                        return;
                    }

                    const saved = readSnapshot(comboId);
                    if (!saved) {
                        throw new Error(
                            `Snapshot missing for combo ${comboId}. Re-run with UPDATE_SNAPSHOTS=1 to bootstrap.`
                        );
                    }

                    expect(fresh.publicKeyHex).toBe(saved.publicKeyHex);
                    expect(fresh.address).toBe(saved.address);
                    expect(fresh.transferBocBase64).toBe(saved.transferBocBase64);
                });
            }
        }
    }

    it('snapshot directory has no orphan files', () => {
        if (UPDATE) return; // generator runs add new files; orphan check is post-generation
        const expected = new Set<string>();
        for (const kind of FIXTURE_KINDS) {
            for (const version of SNAPSHOT_WALLET_VERSIONS) {
                for (const network of SNAPSHOT_NETWORKS) {
                    expected.add(`${comboIdFor(kind, version, network)}.json`);
                }
            }
        }
        const found = readdirSync(SNAPSHOT_DIR)
            .filter(f => f.endsWith('.json'))
            // ledger-call-shapes lives alongside in its own file
            .filter(f => f !== 'ledger-call-shapes.json');

        const unexpected = found.filter(f => !expected.has(f));
        expect(
            unexpected,
            `Orphan snapshot files in ${SNAPSHOT_DIR}: ${unexpected.join(', ')}`
        ).toEqual([]);
    });
});

/**
 * Hardware-signer call shape.
 *
 * Ledger and Keystone can't be reproduced without hardware. What we
 * *can* lock down is the upstream transformation: the BIP32 derivation
 * path Ledger receives for a given account index, and the keystone
 * message body shape. This snapshot proves those mappings stay stable.
 */
describe('hardware-signer call shapes', () => {
    const LEDGER_INDICES = [0, 1, 5, 42];
    const LEDGER_SHAPE_FILE = join(SNAPSHOT_DIR, 'ledger-call-shapes.json');

    it('ledger path derivation is stable for canonical indices', () => {
        const shapes: Record<string, number[]> = {};
        for (const idx of LEDGER_INDICES) {
            shapes[`index_${idx}`] = getLedgerAccountPathByIndex(idx);
        }

        if (UPDATE) {
            writeFileSync(LEDGER_SHAPE_FILE, JSON.stringify(shapes, null, 2) + '\n', 'utf8');
            return;
        }

        if (!existsSync(LEDGER_SHAPE_FILE)) {
            throw new Error(
                'Ledger call-shape snapshot missing. Re-run with UPDATE_SNAPSHOTS=1 to bootstrap.'
            );
        }
        const saved = JSON.parse(readFileSync(LEDGER_SHAPE_FILE, 'utf8')) as Record<
            string,
            number[]
        >;
        expect(shapes).toEqual(saved);
    });

    // Keystone's input is exactly the canonical transfer BOC computed in the
    // main snapshot above (one entry per supported (kind=mnemonic-ton, version,
    // network)). No additional snapshot needed — the per-combo files already
    // pin the BOC bytes that Keystone would receive.
});

// Compile-time guard that the fixture kinds we declared are accepted by the
// harness. Keeps imports honest if someone adds a new account.type later.
const _allKinds: ReadonlyArray<FixtureKind> = FIXTURE_KINDS;
void _allKinds;

/**
 * Equivalence claim: a multichain account (BIP39 seed, default path) and a
 * legacy `mnemonic-bip39` account derived from the same seed must produce
 * the same TON keypair, address, and signed transfer BOC at every wallet
 * version × network. If a future change diverges the two paths, this
 * block flips red before any byte-rewrite of the multichain fixtures.
 */
describe('multichain TON ≡ mnemonic-bip39 (same seed, byte-identical BOC)', () => {
    for (const version of SNAPSHOT_WALLET_VERSIONS) {
        for (const network of SNAPSHOT_NETWORKS) {
            const networkLabel = network === Network.MAINNET ? 'MAINNET' : 'TESTNET';
            it(`${walletVersionName(
                version
            )} × ${networkLabel} — multichain-ton matches mnemonic-bip39`, () => {
                const mc = readSnapshot(comboIdFor('multichain-ton', version, network));
                const bip = readSnapshot(comboIdFor('mnemonic-bip39', version, network));
                if (!mc || !bip) {
                    throw new Error(
                        'Both snapshots must exist — bootstrap with UPDATE_SNAPSHOTS=1.'
                    );
                }
                expect(mc.publicKeyHex).toBe(bip.publicKeyHex);
                expect(mc.address).toBe(bip.address);
                expect(mc.transferBocBase64).toBe(bip.transferBocBase64);
            });
        }
    }
});
