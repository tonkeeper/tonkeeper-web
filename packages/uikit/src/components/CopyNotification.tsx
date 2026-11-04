import React, { FC, useEffect, useRef, useState } from 'react';
import { CSSTransition } from 'react-transition-group';
import { useTheme } from 'styled-components';
import { cn } from '../libs/css';
import { useAppSdk } from '../hooks/appSdk';
import { useTranslation } from '../hooks/translation';
import ReactPortal from './ReactPortal';
import { Toast } from './Toast';

export const CopyNotification: FC<{ hideSimpleCopyNotifications?: boolean }> = React.memo(
    ({ hideSimpleCopyNotifications }) => {
        const { t } = useTranslation();
        const [isOpen, setOpen] = useState<boolean>(false);
        const [text, setText] = useState<string>(t('copied'));
        const sdk = useAppSdk();
        const { proDisplayType } = useTheme();

        useEffect(() => {
            let timer: NodeJS.Timeout | null = null;
            const handler = (options: {
                method: 'copy';
                id?: number | undefined;
                params: string;
            }) => {
                if (timer) {
                    clearTimeout(timer);
                }

                if (hideSimpleCopyNotifications && !options.params) {
                    return;
                    // hide 'Copy' notification
                }

                setText(options.params ?? t('copied'));
                setOpen(true);
                timer = setTimeout(
                    () => {
                        setOpen(false);
                    },
                    options.params && options.params !== t('copied') ? 5000 : 2000
                );
            };
            sdk.uiEvents.on('copy', handler);
            return () => {
                sdk.uiEvents.off('copy', handler);
            };
        }, [hideSimpleCopyNotifications, sdk.uiEvents, t]);

        const nodeRef = useRef(null);
        const restingOffset = proDisplayType === 'mobile' ? 'translate-y-0' : '-translate-y-[30px]';

        return (
            <ReactPortal wrapperId="react-copy-modal">
                <CSSTransition
                    in={isOpen}
                    timeout={{ enter: 0, exit: 300 }}
                    unmountOnExit
                    nodeRef={nodeRef}
                >
                    <div
                        ref={nodeRef}
                        onClick={() => {
                            sdk.copyToClipboard(text);
                            setOpen(false);
                        }}
                        className={cn(
                            'fixed left-1/2 top-[env(safe-area-inset-top)] z-[200] -translate-x-1/2 scale-[0.8] transition-all duration-100 ease-in-out',
                            restingOffset,
                            '[&.enter-done]:translate-y-4 [&.enter-done]:scale-100 [&.enter-done]:opacity-100',
                            '[&.exit]:scale-[0.8] [&.exit]:opacity-0',
                            proDisplayType === 'mobile'
                                ? '[&.exit]:translate-y-0'
                                : '[&.exit]:-translate-y-[30px]'
                        )}
                    >
                        <Toast text={text} size="medium" className="cursor-pointer" />
                    </div>
                </CSSTransition>
            </ReactPortal>
        );
    }
);
CopyNotification.displayName = 'CopyNotification';
