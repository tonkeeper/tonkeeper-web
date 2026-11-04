import SendActionNotification from '@tonkeeper/uikit/dist/components/transfer/SendNotifications';
import { MultichainPromo } from '@tonkeeper/uikit/dist/components/modals/MultichainPromoModal';
import ReceiveNotification from '@tonkeeper/uikit/dist/components/home/ReceiveNotification';
import NftNotification from '@tonkeeper/uikit/dist/components/nft/NftNotification';
import SendNftNotification from '@tonkeeper/uikit/dist/components/transfer/nft/SendNftNotification';
import {
    AddFavoriteNotification,
    EditFavoriteNotification
} from '@tonkeeper/uikit/dist/components/transfer/FavoriteNotification';
import { DeepLinkSubscription } from '../components/DeepLink';
import PairSignerNotification from '@tonkeeper/uikit/dist/components/PairSignerNotification';
import ConnectLedgerNotification from '@tonkeeper/uikit/dist/components/ConnectLedgerNotification';
import PairKeystoneNotification from '@tonkeeper/uikit/dist/components/PairKeystoneNotification';
import { useRecommendations } from '@tonkeeper/uikit/dist/hooks/browser/useRecommendations';
import { useCanPromptTouchId } from '@tonkeeper/uikit/dist/state/password';
import { TonConnectSubscription } from '../components/TonConnectSubscription';
import { MultichainConnectSubscription } from '@tonkeeper/uikit/dist/pages/home/multichain/connect/MultichainConnectSubscription';
import { MultichainBackgroundElements as MultichainSendListener } from '@tonkeeper/uikit/dist/pages/home/multichain/MultichainBackgroundElements';

/** The listeners both account kinds need, in the order they've always mounted. */
const SharedBackgroundElements = () => {
    return (
        <>
            <ReceiveNotification />
            <TonConnectSubscription />
            <NftNotification />
            <SendNftNotification />
            <AddFavoriteNotification />
            <EditFavoriteNotification />
            <DeepLinkSubscription />
            <MultichainConnectSubscription />
            <PairSignerNotification />
            <ConnectLedgerNotification />
            <PairKeystoneNotification />
        </>
    );
};

export const BackgroundElements = () => {
    return (
        <>
            <SendActionNotification />
            <SharedBackgroundElements />
            <MultichainPromo />
        </>
    );
};

/**
 * Same set, with the multichain send flow answering transfer intents in
 * place of the legacy TON-only send notification.
 */
export const MultichainBackgroundElements = () => {
    return (
        <>
            <MultichainSendListener />
            <SharedBackgroundElements />
        </>
    );
};

export const usePrefetch = () => {
    useRecommendations();
    useCanPromptTouchId();
};
