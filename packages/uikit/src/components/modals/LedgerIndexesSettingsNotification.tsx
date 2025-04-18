import { Notification } from '../Notification';
import { useAtom } from '../../libs/useAtom';
import { useTranslation } from '../../hooks/translation';
import { AccountId } from '@tonkeeper/core/dist/entries/account';
import { createModalControl } from './createModalControl';
import { LedgerIndexesPageContent } from '../../pages/settings/LedgerIndexes';
import { useAccountState } from '../../state/wallet';
import styled from 'styled-components';

const { hook, paramsControl } = createModalControl<{ accountId: AccountId }>();

export const useLedgerIndexesSettingsNotification = hook;

const LedgerIndexesPageContentStyled = styled(LedgerIndexesPageContent)`
    margin: 0 -1rem;
`;

export const LedgerIndexesSettingsNotification = () => {
    const { isOpen, onClose } = useLedgerIndexesSettingsNotification();
    const { t } = useTranslation();
    const [params] = useAtom(paramsControl);
    const account = useAccountState(params?.accountId);
    if (!account || account.type !== 'ledger') {
        return null;
    }

    return (
        <Notification
            title={t('settings_ledger_indexes')}
            isOpen={isOpen}
            handleClose={() => onClose()}
        >
            {() => <LedgerIndexesPageContentStyled afterWalletOpened={onClose} account={account} />}
        </Notification>
    );
};
