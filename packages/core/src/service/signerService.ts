export const parseSignerSignature = (payload: string): Buffer => {
    console.log('signer', payload);
    if (payload.startsWith('tonkeeper://publish?boc=')) {
        const base64Signature = decodeURIComponent(
            payload.substring('tonkeeper://publish?boc='.length)
        );
        return Buffer.from(base64Signature, 'base64');
    } else {
        throw new Error(`Unexpected Result: ${payload}`);
    }
};
