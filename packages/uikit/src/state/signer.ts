export const isSignerLink = (link: string) => {
    return link.startsWith('tonkeeper://signer') || link.startsWith('tonkeeper-pro://signer');
};
