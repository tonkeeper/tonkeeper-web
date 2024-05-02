export function getLedgerAccountPathByIndex(
    index: number,
    options?: {
        isTestnet?: boolean;
        workchain?: number;
    }
) {
    const network = options?.isTestnet ? 1 : 0;
    const chain = options?.workchain === -1 ? 255 : 0;
    return [44, 607, network, chain, index, 0];
}
