export type ScaledUIMultiplier = { numerator: string; denominator: string };

export const scaledUIMultiplierOne: ScaledUIMultiplier = { numerator: '1', denominator: '1' };

export function parseJettonScaledUIMultiplier(
    scaledUi: { numerator: string; denominator: string } | undefined
): ScaledUIMultiplier {
    if (!scaledUi) {
        return scaledUIMultiplierOne;
    }

    return scaledUi;
}

export function toScaledUIWeiAmount(
    weiAmount: string,
    scaledUi: { numerator: string; denominator: string } | undefined
): string {
    if (!scaledUi) {
        return weiAmount;
    }

    return (
        (BigInt(weiAmount) * BigInt(scaledUi.numerator)) /
        BigInt(scaledUi.denominator)
    ).toString();
}
