import { Notification } from '../../../Notification';
import { ChangeEvent, FC } from 'react';
import { styled } from 'styled-components';
import {
    ListImportError,
    useMutateUserMultiSendList,
    useParseCsvListMutation
} from '../../../../state/multiSend';

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
    const { mutateAsync, isLoading, error } = useParseCsvListMutation();
    const { mutateAsync: addList } = useMutateUserMultiSendList();
    const onSelect = async (e: ChangeEvent<HTMLInputElement>) => {
        try {
            const result = await mutateAsync(e.target.files![0]);
            if (isOpen) {
                await addList(result);
                onClose(result.id);
            }
        } catch (err) {
            console.log(err);
        }
    };

    const importError = error
        ? error instanceof ListImportError
            ? error
            : new ListImportError('Unknown error', 'unknown')
        : undefined;

    return (
        <ImportContentWrapper>
            <input type="file" onChange={onSelect} />
            {importError?.type}
            {importError?.position.line}:{importError?.position.column}
        </ImportContentWrapper>
    );
};
