import { useAsideActiveRoute } from '../../../hooks/desktop/useAsideActiveRoute';
import { AppRoute } from '../../../libs/routes';
import { ErrorBoundary } from 'react-error-boundary';
import { fallbackRenderOver } from '../../Error';
import { MobileProHeaderWallet } from './MobileProHeaderWallet';
import { MobileProHeaderAccount } from './MobileProHeaderAccount';
import { MobileProHeaderContainer } from './MobileProHeaderElements';

const MobileProHeaderContent = () => {
    const route = useAsideActiveRoute();

    if (!route) {
        return <MobileProHeaderWallet />;
    }

    if (route === AppRoute.accountSettings) {
        return <MobileProHeaderAccount />;
    }

    return <MobileProHeaderContainer />;
};

export const MobileProHeader = () => {
    return (
        <ErrorBoundary fallbackRender={fallbackRenderOver('Failed to display aside header')}>
            <MobileProHeaderContent />
        </ErrorBoundary>
    );
};
