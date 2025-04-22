import styled from 'styled-components';
import { Label2 } from '@tonkeeper/uikit';
import { ChevronRightIcon } from '@tonkeeper/uikit/dist/components/Icon';
import { FC } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { DeepLink } from '../../libs/plugins';
import ReactPortal from '@tonkeeper/uikit/dist/components/ReactPortal';

const Wrapper = styled(motion.div)`
    position: fixed;
    z-index: 100;
    width: calc(100% - 32px);
    left: 16px;
    top: calc(env(safe-area-inset-top) + 8px);
    transform: translate(0);
    border-radius: ${p => p.theme.corner2xSmall};
    background: ${p => p.theme.buttonTertiaryBackground};
    padding: 18px 16px 18px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

export const tonkeeperMobileTonDeeplinkScheme = 'tonkeeper-mob';
export const tonkeeperMobileTonConnectDeeplinkScheme = 'tonkeeper-mob-tc';

const useIsTonkeeperMobileInstalled = () => {
    return useQuery(
        ['isTonkeeperMobileInstalled'],
        async () => {
            const canOpen = await DeepLink.canOpen({ url: tonkeeperMobileTonDeeplinkScheme });
            return canOpen.value;
        },
        {
            keepPreviousData: true
        }
    );
};

export const RedirectToTonkeeperMobile: FC<{
    isOpen: boolean;
    onClick: (confirmed?: boolean) => void;
}> = ({ isOpen, onClick }) => {
    const { t } = useTranslation();

    const { data: isTonkeeperMobileInstalled } = useIsTonkeeperMobileInstalled();

    return (
        <ReactPortal position="first" wrapperId="body">
            <AnimatePresence>
                {isOpen && isTonkeeperMobileInstalled && (
                    <Wrapper
                        onClick={() => onClick(true)}
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={0.7}
                        onDragEnd={(_, info) => {
                            if (info.offset.y < -50) {
                                onClick(false);
                            }
                        }}
                    >
                        <Label2>{t('pro_continue_in_tonkeeper_mobile')}</Label2>
                        <ChevronRightIcon />
                    </Wrapper>
                )}
            </AnimatePresence>
        </ReactPortal>
    );
};
