import { FC, useCallback } from 'react';
import { toShortValue } from '@tonkeeper/core/dist/utils/common';
import { useAppSdk } from '../../hooks/appSdk';
import { tReplace, useTranslation } from '../../hooks/translation';
import IcCopy16 from '../../icons/components/IcCopy16';
import { Button } from '../../primitives';
import { ReceiveChain } from './receiveChains';
import { ReceiveQrCode } from './ReceiveQrCode';

interface ReceiveChainAddressProps {
    chain: ReceiveChain;
    address: string;
}

export const ReceiveChainAddress: FC<ReceiveChainAddressProps> = ({ chain, address }) => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const warningTemplate = t('receive_chain_warning');
    const warningText =
        warningTemplate === 'receive_chain_warning'
            ? `Send only ${chain.nativeSymbol} and tokens in ${chain.displayName} network to this address, or you might lose your funds.`
            : tReplace(warningTemplate, {
                  coin: chain.nativeSymbol,
                  network: chain.displayName
              });

    const copiedMessage = t('receive_address_copied', {
        chain: chain.displayName,
        address: toShortValue(address)
    });

    const handleCopy = useCallback(() => {
        sdk.copyToClipboard(address, copiedMessage);
    }, [sdk, address, copiedMessage]);

    return (
        <div className="flex flex-col items-center gap-4 pb-2">
            <p className="px-4 text-center text-body1 text-textSecondary">{warningText}</p>

            <div className="relative flex flex-col items-center gap-3 rounded-large bg-constantWhite p-6">
                <ReceiveQrCode
                    value={address}
                    size={248}
                    cutoutSize={80}
                    icon={
                        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full [&>svg]:h-14 [&>svg]:w-14">
                            {chain.icon}
                        </div>
                    }
                />
                <p className="max-w-[240px] break-all text-center font-mono text-body1 leading-[22px] text-constantBlack">
                    {address}
                </p>
            </div>

            <div className="flex justify-center pt-2">
                <Button
                    variant="secondary"
                    size="medium"
                    onClick={handleCopy}
                    leftIcon={<IcCopy16 width={16} height={16} />}
                    className="rounded-full"
                >
                    {t('Copy')}
                </Button>
            </div>
        </div>
    );
};
