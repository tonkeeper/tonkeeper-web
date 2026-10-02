import { FC } from 'react';

import { Button } from './Button';
import { Modal, ModalFooter, ModalFooterPortal } from './Modal';
import type { ModalFooterProps, ModalProps } from './Modal';

const noop = () => {};

const ROWS = [
    'Address',
    'Jettons balance',
    'Received August',
    'Sent August',
    'Received July',
    'Sent July'
];

const DashboardRows = () => (
    <div className="overflow-hidden rounded-medium bg-backgroundContent">
        {ROWS.map((row, index) => (
            <div key={row}>
                {index > 0 && <div className="ml-4 h-[0.5px] bg-separatorCommon" />}
                <div className="flex h-14 items-center px-4 text-label1 text-textPrimary">
                    {row}
                </div>
            </div>
        ))}
    </div>
);

export const AlertModalStory: FC<Partial<ModalProps>> = props => (
    <Modal
        isOpen
        onClose={noop}
        heading="Disconnect Uniswap?"
        subheading="This will remove Uniswap’s access to your wallet. You can reconnect it anytime."
        {...props}
    >
        <ModalFooterPortal>
            <ModalFooter>
                <Button variant="destructive" size="large" fullWidth>
                    Disconnect
                </Button>
                <Button variant="secondary" size="large" fullWidth>
                    Cancel
                </Button>
            </ModalFooter>
        </ModalFooterPortal>
    </Modal>
);

export const ContentModalStory: FC<Partial<ModalProps>> = ({ children, ...props }) => (
    <Modal isOpen onClose={noop} variant="content" topBarTitle="Manage dashboard" {...props}>
        <DashboardRows />
        <ModalFooterPortal>
            <ModalFooter>
                <Button variant="primaryBlue" size="large" fullWidth>
                    Save
                </Button>
            </ModalFooter>
        </ModalFooterPortal>
        {children}
    </Modal>
);

export const NestedModalsStory: FC<{ nestedVariant?: ModalProps['variant'] }> = ({
    nestedVariant
}) => (
    <ContentModalStory>
        <AlertModalStory
            variant={nestedVariant}
            heading="Price impact is too high"
            subheading="Swap may be conducted at a rate that differs significantly from market prices."
        />
    </ContentModalStory>
);

export const ActionBarModalStory: FC<Partial<ModalFooterProps>> = props => (
    <Modal
        isOpen
        onClose={noop}
        variant="content"
        topBarTitle="Connect wallet"
        topBarDescription="app.uniswap.org"
        topBarTitleAlign="left"
    >
        <DashboardRows />
        <ModalFooterPortal>
            <ModalFooter
                layout="row"
                divider
                description="Be sure to check the service address before connecting the wallet."
                {...props}
            >
                <Button variant="secondary" size="large" fullWidth>
                    Cancel
                </Button>
                <Button variant="primaryBlue" size="large" fullWidth>
                    Connect
                </Button>
            </ModalFooter>
        </ModalFooterPortal>
    </Modal>
);
