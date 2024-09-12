import { Notification } from '../Notification';
import { useAtom } from '../../libs/atom';
import { useTranslation } from '../../hooks/translation';
import { AccountId } from '@tonkeeper/core/dist/entries/account';
import { createModalControl } from './createModalControl';
import { useAccountState } from '../../state/wallet';
import { MAMIndexesPageContent } from '../../pages/settings/MamIndexes';
import styled from 'styled-components';

const { hook, paramsControl } = createModalControl<{ accountId: AccountId }>();

export const useMAMIndexesSettingsNotification = hook;

const MAMIndexesPageContentStyled = styled(MAMIndexesPageContent)`
    margin: 0 -1rem;
`;

export const MAMIndexesSettingsNotification = () => {
    const { isOpen, onClose } = useMAMIndexesSettingsNotification();
    const { t } = useTranslation();
    const [params] = useAtom(paramsControl);
    const account = useAccountState(params?.accountId);
    if (!account || account.type !== 'mam') {
        return null;
    }

    return (
        <Notification
            title={t('settings_mam_indexes')}
            isOpen={isOpen}
            handleClose={() => onClose()}
        >
            {() => <MAMIndexesPageContentStyled afterWalletOpened={onClose} account={account} />}
        </Notification>
    );
};
