import { FC, useEffect } from 'react';

import { TON_ASSET, TRON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';

import { AssetBlockchainBadge } from '../account/AccountBadge';
import { ListBlockDesktopAdaptive, ListItem, ListItemPayload } from '../List';
import { ModalFooter, ModalFooterPortal } from '../../primitives/Modal';
import { ColumnText } from '../Layout';
import { Image } from '../shared/Image';
import {
    useIsTronEnabledForActiveWallet,
    useIsTronEnabledGlobally,
    useToggleIsTronEnabledForActiveWallet
} from '../../state/tron/tron';
import { Button } from '../../primitives/Button';
import { Checkbox } from '../../primitives/Checkbox';
import { handleSubmit } from '../../libs/form';
import { useTranslation } from '../../hooks/translation';

/**
 * Legacy-flow "Select networks" step — picks which chains a freshly
 * created TON-only account should activate. Currently only TRON is
 * gateable (TON is always on). Reached only when `multichainEnabled`
 * is `false`; the multichain branch skips this step because
 * `AccountMultichain` ships with the full default chain set.
 *
 * If TRON is globally disabled (config / Pro state), the screen
 * auto-continues — there's nothing for the user to pick.
 */
export const SelectWalletNetworks: FC<{ onContinue: (result: { tron: boolean }) => void }> = ({
    onContinue
}) => {
    const { t } = useTranslation();
    const { mutate: toggleTron } = useToggleIsTronEnabledForActiveWallet();
    const isTronEnabled = useIsTronEnabledForActiveWallet();
    const isTronEnabledGlobally = useIsTronEnabledGlobally();

    useEffect(() => {
        if (!isTronEnabledGlobally) {
            onContinue({ tron: false });
        }
    }, [isTronEnabledGlobally, onContinue]);

    if (!isTronEnabledGlobally) {
        return null;
    }

    const onSubmit = () => onContinue({ tron: isTronEnabled });

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="mx-auto flex w-full max-w-[524px] flex-col items-center"
        >
            <div className="flex flex-col items-center gap-1 px-8 pb-6 text-center">
                <h2 className="text-h2 text-textPrimary">{t('select_networks_modal_title')}</h2>
                <p className="max-w-[268px] text-balance text-body2 text-textSecondary">
                    {t('select_networks_modal_subtitle')}
                </p>
            </div>

            <ListBlockDesktopAdaptive className="mb-4 w-full">
                <ListItem hover={false}>
                    <ListItemPayload>
                        <Image src={TON_ASSET.image} className="h-10 w-10 rounded-full" />
                        <ColumnText
                            text={t('select_networks_modal_ton_title')}
                            secondary={t('select_networks_modal_ton_description')}
                        />
                        <Checkbox checked disabled className="ml-auto" />
                    </ListItemPayload>
                </ListItem>
                <ListItem hover={false}>
                    <ListItemPayload>
                        <Image src={TRON_USDT_ASSET.image} className="h-10 w-10" noRadius />
                        <ColumnText
                            text={
                                <span className="inline-flex items-center gap-1.5">
                                    USD₮
                                    <AssetBlockchainBadge>TRC20</AssetBlockchainBadge>
                                </span>
                            }
                            secondary={t('select_networks_modal_tron_description')}
                        />
                        <Checkbox
                            checked={isTronEnabled}
                            onChange={() => toggleTron()}
                            className="ml-auto"
                        />
                    </ListItemPayload>
                </ListItem>
            </ListBlockDesktopAdaptive>

            <ModalFooterPortal>
                <ModalFooter>
                    <Button
                        size="large"
                        variant="primaryBlue"
                        fullWidth
                        type="submit"
                        onClick={onSubmit}
                        autoFocus
                    >
                        {t('continue')}
                    </Button>
                </ModalFooter>
            </ModalFooterPortal>
        </form>
    );
};
