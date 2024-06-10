import { Notification } from '../../../Notification';
import { FC } from 'react';
import { styled } from 'styled-components';
import { MultiSendList, useMutateUserMultiSendList } from '../../../../state/multiSend';
import { ImportListFileInput } from './ImportListFileInput';

export const ImportListNotification: FC<{
    isOpen: boolean;
    onClose: (newListId?: number) => void;
}> = ({ isOpen, onClose }) => {
    return (
        <Notification title="Import CSV" isOpen={isOpen} handleClose={() => onClose()}>
            {() => <ImportListNotificationContent onClose={onClose} isOpen={isOpen} />}
        </Notification>
    );
};

const ImportContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const ImportListNotificationContent: FC<{
    isOpen: boolean;
    onClose: (newListId?: number) => void;
}> = ({ isOpen, onClose }) => {
    const { mutateAsync: addList, isLoading } = useMutateUserMultiSendList();
    const onImported = async (list: MultiSendList) => {
        if (isOpen) {
            await addList(list);
            onClose(list.id);
        }
    };

    return (
        <ImportContentWrapper>
            <ImportListFileInput isLoading={isLoading} onImported={onImported} />
        </ImportContentWrapper>
    );
};
