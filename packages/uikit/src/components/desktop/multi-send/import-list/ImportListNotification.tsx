import { Notification } from '../../../Notification';
import { FC } from 'react';
import { styled } from 'styled-components';
import { MultiSendList, useMutateUserMultiSendList } from '../../../../state/multiSend';
import { ImportListFileInput } from './ImportListFileInput';
import { Body2 } from '../../../Text';
import { ImportListTable } from './ImportListTable';
import { useTranslation } from '../../../../hooks/translation';

export const ImportListNotification: FC<{
    isOpen: boolean;
    onClose: (newListId?: number) => void;
}> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    return (
        <Notification title={t('import_dot_csv')} isOpen={isOpen} handleClose={() => onClose()}>
            {() => <ImportListNotificationContent onClose={onClose} isOpen={isOpen} />}
        </Notification>
    );
};

const ImportContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const ImportListFileStyled = styled(ImportListFileInput)`
    margin-bottom: 1rem;
`;

const TableLabel = styled.div`
    margin: 1rem 0;
    text-align: center;
    color: ${p => p.theme.textSecondary};
`;

const ImportListNotificationContent: FC<{
    isOpen: boolean;
    onClose: (newListId?: number) => void;
}> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const { mutateAsync: addList, isLoading } = useMutateUserMultiSendList();
    const onImported = async (list: MultiSendList) => {
        if (isOpen) {
            await addList(list);
            onClose(list.id);
        }
    };

    return (
        <ImportContentWrapper>
            <ImportListFileStyled isLoading={isLoading} onImported={onImported} />
            <TableLabel>
                <Body2>{t('import_multisend_table_example')}</Body2>
            </TableLabel>
            <ImportListTable />
        </ImportContentWrapper>
    );
};
