import { ConfirmOptions } from '@tonkeeper/core/dist/AppSdk';
import { FC, useCallback } from 'react';
import styled from 'styled-components';
import { createModalControl } from './createModalControl';
import { useTranslation } from '../../hooks/translation';
import { useAtom } from '../../libs/useAtom';
import { Label1 } from '../Text';
import { ButtonResponsiveSize } from '../fields/Button';
import { Notification } from '../Notification';

const {
    controller,
    paramsControl,
    hook: useCustomConfirm
} = createModalControl<{
    options: ConfirmOptions;
    onClose: (confirmResult: boolean) => void;
}>();

const customConfirmController = controller;

export const customConfirm = (options: ConfirmOptions) =>
    new Promise<boolean>(resolve => customConfirmController.open({ options, onClose: resolve }));

export const CustomConfirmNotificationControlled = () => {
    const { isOpen, onClose } = useCustomConfirm();
    const { t } = useTranslation();
    const [params] = useAtom(paramsControl);

    const Content = useCallback(() => {
        if (!params?.options || !params?.onClose) {
            return null;
        }

        return (
            <ConfirmNotificationContent
                options={params.options}
                onClose={val => {
                    params.onClose(val);
                    onClose();
                }}
            />
        );
    }, [onClose, params?.options, params?.options]);

    return (
        <Notification
            isOpen={isOpen}
            handleClose={onClose}
            title={params?.options.title ?? t('confirm_action')}
        >
            {Content}
        </Notification>
    );
};

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    text-align: center;
    align-items: center;
    gap: 12px;

    > ${Label1} {
        margin-bottom: 8px;
        text-wrap: balance;
    }
`;

const ConfirmNotificationContent: FC<{
    options: ConfirmOptions;
    onClose: (result: boolean) => void;
}> = ({ options, onClose }) => {
    const { t } = useTranslation();

    const okButtonProps =
        options.defaultButton === 'ok'
            ? {
                  primary: true,
                  autoFocus: true
              }
            : { secondary: true };

    const cancelButtonProps =
        options.defaultButton === 'cancel'
            ? {
                  primary: true,
                  autoFocus: true
              }
            : { secondary: true };

    return (
        <Wrapper>
            <Label1>{options.message}</Label1>
            <ButtonResponsiveSize {...okButtonProps} fullWidth onClick={() => onClose(true)}>
                {options.okButtonTitle ?? t('ok')}
            </ButtonResponsiveSize>
            <ButtonResponsiveSize {...cancelButtonProps} fullWidth onClick={() => onClose(false)}>
                {options.cancelButtonTitle ?? t('cancel')}
            </ButtonResponsiveSize>
        </Wrapper>
    );
};
