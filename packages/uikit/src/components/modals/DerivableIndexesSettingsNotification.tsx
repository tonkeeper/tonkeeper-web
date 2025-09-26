import { Notification } from '../Notification';
import { useAtom } from '../../libs/useAtom';
import { useTranslation } from '../../hooks/translation';
import { AccountId, isAccountDerivable } from '@tonkeeper/core/dist/entries/account';
import { createModalControl } from './createModalControl';
import { useAccountState } from '../../state/wallet';
import { DerivableIndexesPageContent } from '../../pages/settings/DerivableIndexes';
import styled from 'styled-components';

const { hook, paramsControl } = createModalControl<{ accountId: AccountId }>();

export const useDerivableIndexesSettingsNotification = hook;

const DerivableIndexesPageContentStyled = styled(DerivableIndexesPageContent)`
    margin: 0 -1rem;
`;

export const DerivableIndexesSettingsNotification = () => {
    const { isOpen, onClose } = useDerivableIndexesSettingsNotification();
    const { t } = useTranslation();
    const [params] = useAtom(paramsControl);
    const account = useAccountState(params?.accountId);
    if (!account || !isAccountDerivable(account)) {
        return null;
    }

    return (
        <Notification
            title={t('settings_mam_indexes')}
            isOpen={isOpen}
            handleClose={() => onClose()}
        >
            {() => (
                <DerivableIndexesPageContentStyled afterWalletOpened={onClose} account={account} />
            )}
        </Notification>
    );
};
