import { FC, MouseEventHandler, useEffect } from 'react';
import {
    preloadCreateStandardWallet,
    preloadImportExistingWallet,
    useAddWalletFlow
} from '../../components/modals/AddWalletFlow';
import { useAppSdk } from '../../hooks/appSdk';
import { useLegalLinks } from '../../state/legal';
import IcLogo from '../../icons/components/IcLogo';
import { StartScreenBackground } from './StartScreenBackground';
import { StartScreenView } from './StartScreenView';

/**
 * Onboarding start screen. The brand mark over a glow, the app name, and the
 * two ways in — create or import — above the Terms of Use.
 *
 * Pure content — sizing, centering, viewport-bound height, and the "strip the
 * app chrome" decision all belong to `AppLayout` (passed `bare`) at the shell
 * level.
 */
const StartScreen: FC = () => {
    const { onOpen: openAddWallet } = useAddWalletFlow();
    const sdk = useAppSdk();
    const { termsLink } = useLegalLinks();

    useEffect(() => {
        preloadCreateStandardWallet();
        preloadImportExistingWallet();
    }, []);

    const onCreate = () => {
        sdk.requestExtensionPermission().then(() =>
            openAddWallet({ walletType: 'create-standard' })
        );
    };

    const onImport = () => {
        sdk.requestExtensionPermission().then(() => openAddWallet({ pickerMode: 'import' }));
    };

    // Route the click through the platform SDK (Electron / extension / web all
    // need a different open path) but keep the `<a href>` semantic so screen
    // readers, right-click / cmd-click, and the keyboard "Enter" all behave
    // like a normal link.
    const onTerms: MouseEventHandler<HTMLAnchorElement> = e => {
        if (!termsLink) return;
        e.preventDefault();
        sdk.openPage(termsLink);
    };

    return (
        <>
            <StartScreenBackground />
            <StartScreenView
                logo={<IcLogo className="size-full" />}
                onCreate={onCreate}
                onImport={onImport}
                termsHref={termsLink ?? undefined}
                onTermsClick={onTerms}
            />
        </>
    );
};

export default StartScreen;
