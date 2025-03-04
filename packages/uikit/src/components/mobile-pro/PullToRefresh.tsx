import { createGesture, Gesture, IonSpinner } from '@ionic/react';
import { ForTargetEnv } from '../shared/TargetEnv';
import { FC, PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { anyOfKeysParts } from '../../libs/queryKey';
import { useNotifyErrorHandle } from '../../hooks/useNotification';
import styled from 'styled-components';
import { createPortal } from 'react-dom';
import { AnimateHeightChange } from '../shared/AnimateHeightChange';
import { useAppSdk } from '../../hooks/appSdk';

const MIN_REFRESHING_TIME = 1000;

type Invalidator =
    | {
          handleRefresh: () => Promise<void>;
      }
    | { invalidate: string | string[] };
export const PullToRefresh: FC<
    Invalidator & {
        paddingBottom?: string;
    }
> = props => {
    const client = useQueryClient();
    const notification = useNotifyErrorHandle();

    const handleRefresh = 'handleRefresh' in props ? props.handleRefresh : undefined;
    const invalidate = 'invalidate' in props ? props.invalidate : undefined;

    const sdk = useAppSdk();

    const onRefresh = useCallback(async () => {
        const start = Date.now();
        sdk.hapticNotification('impact_medium');

        try {
            if (handleRefresh) {
                await handleRefresh();
            } else {
                await client.invalidateQueries(
                    anyOfKeysParts(...(Array.isArray(invalidate) ? invalidate : [invalidate]))
                );
            }
        } catch (e) {
            console.error(e);
            await notification('Failed to refresh');
        }

        const elapsed = Date.now() - start;
        const remainingTime = Math.max(0, MIN_REFRESHING_TIME - elapsed);

        return new Promise<void>(resolve => {
            setTimeout(() => {
                resolve();
            }, remainingTime);
        });
    }, [handleRefresh, invalidate, client, notification]);

    return (
        <ForTargetEnv env="mobile">
            <Refresher onRefresh={onRefresh} paddingBottom={props.paddingBottom} />
        </ForTargetEnv>
    );
};

const pullToActivate = 150;

const RefresherContent = styled.div<{ $paddingBottom?: string }>`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding-top: 16px;
    ${p => p.$paddingBottom && `padding-bottom: ${p.$paddingBottom};`}
`;

const Refresher: FC<{ onRefresh: () => Promise<void>; paddingBottom?: string }> = ({
    onRefresh,
    paddingBottom
}) => {
    const [status, setStatus] = useState<'idle' | 'pulling' | 'refreshing' | 'done'>('idle');
    const contentRef = useRef<HTMLDivElement>(null);
    const isOverscroll = useRef(false);
    const [isEnded, setIsEnded] = useState(false);

    const statusRef = useRef('idle');
    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    useEffect(() => {
        const container = contentRef.current?.closest('ion-content');

        if (!container) {
            return;
        }

        let gesture: Gesture | undefined;

        container.getScrollElement().then(el => {
            el.addEventListener('touchmove', e => {
                isOverscroll.current = el.scrollTop <= 0 && e.touches[0].clientY > startY;
            });

            let startY = 0;
            let currentY = 0;

            gesture = createGesture({
                el,
                threshold: 0,
                gestureName: 'pull-refresh-1',
                onStart: ev => {
                    setStatus('pulling');
                    startY = ev.startY;
                    setIsEnded(false);
                    return true;
                },
                onMove: ev => {
                    if (statusRef.current === 'refreshing' || statusRef.current === 'done') return;

                    currentY = ev.currentY;
                    const deltaY = currentY - startY;

                    if (deltaY <= 0 || !isOverscroll.current) {
                        return;
                    }

                    if (deltaY > pullToActivate) {
                        setStatus('refreshing');
                        onRefresh().finally(() => setStatus('done'));
                    }
                },
                onEnd: () => {
                    setIsEnded(true);
                }
            });

            gesture.enable();
        });

        return () => {
            gesture?.destroy();
        };
    }, [onRefresh]);

    useEffect(() => {
        if (isEnded && status === 'done') {
            setStatus('idle');
        }
    }, [isEnded, status]);

    const contentEl = contentRef.current?.closest('ion-content');

    return (
        <div ref={contentRef}>
            {(isOverscroll || status !== 'idle') && (
                <RefresherPortal content={contentEl}>
                    <AnimateHeightChange>
                        {status === 'refreshing' && (
                            <RefresherContent $paddingBottom={paddingBottom}>
                                <IonSpinner name="lines-small" />
                            </RefresherContent>
                        )}
                    </AnimateHeightChange>
                </RefresherPortal>
            )}
        </div>
    );
};

const RefresherPortal: FC<
    PropsWithChildren<{ content: HTMLIonContentElement | null | undefined }>
> = ({ children, content }) => {
    const portalElement = useRef(document.createElement('div'));

    useEffect(() => {
        if (content && content.parentElement) {
            portalElement.current.style.zIndex = '1';
            content.parentElement.insertBefore(portalElement.current, content);
        }
        return () => {
            portalElement.current.remove();
        };
    }, [content]);

    if (!content) return null;

    return createPortal(children, portalElement.current);
};
