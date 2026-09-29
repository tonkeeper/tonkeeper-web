import { FC, ReactNode, useState } from 'react';
import { Button, Modal, ModalFooter, ModalFooterPortal, ModalProps } from '@tonkeeper/ui-kit';
import { Cell, Cells, Group, Page } from '../kit';

const ROWS = ['Address', 'Jettons balance', 'Received August', 'Sent August', 'Received July'];

const Rows = () => (
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

const Footer: FC<{ children: ReactNode }> = ({ children }) => (
    <ModalFooterPortal>
        <ModalFooter>{children}</ModalFooter>
    </ModalFooterPortal>
);

type Demo =
    | 'alert'
    | 'alertNoClose'
    | 'content'
    | 'contentBack'
    | 'leftTitle'
    | 'topBarDescription'
    | 'footerRow'
    | 'footerDivider'
    | 'footerDescription'
    | 'nested'
    | 'nestedTall'
    | 'bare'
    | 'mobileHalf'
    | 'mobileFull';

const AlertBody: FC<{ onClose: () => void }> = ({ onClose }) => (
    <Footer>
        <Button variant="destructive" size="large" fullWidth onClick={onClose}>
            Disconnect
        </Button>
        <Button variant="secondary" size="large" fullWidth onClick={onClose}>
            Cancel
        </Button>
    </Footer>
);

const alertProps: Pick<ModalProps, 'heading' | 'subheading'> = {
    heading: 'Disconnect Uniswap?',
    subheading: 'This will remove Uniswap’s access to your wallet. You can reconnect it anytime.'
};

export const ModalStory = () => {
    const [open, setOpen] = useState<Demo | null>(null);
    const close = () => setOpen(null);
    const launcher = (demo: Demo, label: string) => (
        <Cell label={label}>
            <Button variant="secondary" size="small" onClick={() => setOpen(demo)}>
                Open
            </Button>
        </Cell>
    );
    const isContentOpen =
        open === 'content' || open === 'contentBack' || open === 'nested' || open === 'nestedTall';

    return (
        <Page
            title="Modal"
            description="Desktop: a centered 520px card — `alert` sizes to its content, `content` is fixed at 624px (or the viewport). A modal opened on top of another pins to its bottom edge. Mobile: a bottom sheet."
            importLine="import { Modal, ModalFooter, ModalFooterPortal } from '@tonkeeper/ui-kit'"
        >
            <Group title="Geometry">
                <Cells>
                    {launcher('alert', 'variant=alert')}
                    {launcher('content', 'variant=content')}
                    {launcher('nested', 'nested (shorter than parent)')}
                    {launcher('nestedTall', 'nested (taller than parent)')}
                    {launcher('bare', 'bare')}
                </Cells>
            </Group>
            <Group title="Header">
                <Cells>
                    {launcher('contentBack', 'onBack + topBarTitle')}
                    {launcher('alertNoClose', 'hideCloseButton')}
                    {launcher('leftTitle', "topBarTitleAlign='left' + topBarDescription")}
                    {launcher('topBarDescription', 'topBarDescription')}
                </Cells>
            </Group>
            <Group title="Action bar" note="ModalFooter">
                <Cells>
                    {launcher('footerRow', "layout='row'")}
                    {launcher('footerDivider', 'divider')}
                    {launcher('footerDescription', 'description')}
                </Cells>
            </Group>
            <Group
                title="Mobile height"
                note="mobileHeight — applies to the mobile bottom sheet; ignored on desktop"
            >
                <Cells>
                    {launcher('alert', "mobileHeight='auto'")}
                    {launcher('mobileHalf', "mobileHeight='half'")}
                    {launcher('mobileFull', "mobileHeight='full'")}
                </Cells>
            </Group>

            <Modal isOpen={open === 'alert'} onClose={close} {...alertProps}>
                <AlertBody onClose={close} />
            </Modal>
            <Modal isOpen={open === 'alertNoClose'} onClose={close} hideCloseButton {...alertProps}>
                <AlertBody onClose={close} />
            </Modal>
            <Modal
                isOpen={isContentOpen}
                onClose={close}
                variant="content"
                topBarTitle="Manage dashboard"
                onBack={open === 'contentBack' ? close : undefined}
            >
                <Rows />
                <Footer>
                    <Button variant="primaryBlue" size="large" fullWidth onClick={close}>
                        Save
                    </Button>
                </Footer>
                <Modal
                    isOpen={open === 'nested'}
                    onClose={() => setOpen('content')}
                    heading="Price impact is too high"
                    subheading="Swap may be conducted at a rate that differs significantly from market prices."
                >
                    <Footer>
                        <Button
                            variant="destructive"
                            size="large"
                            fullWidth
                            onClick={() => setOpen('content')}
                        >
                            Swap at the changed price
                        </Button>
                        <Button
                            variant="secondary"
                            size="large"
                            fullWidth
                            onClick={() => setOpen('content')}
                        >
                            Back to swap
                        </Button>
                    </Footer>
                </Modal>
                <Modal
                    isOpen={open === 'nestedTall'}
                    onClose={() => setOpen('content')}
                    variant="content"
                    topBarTitle="Select column"
                >
                    <Rows />
                    <div className="h-4" />
                    <Rows />
                </Modal>
            </Modal>
            <Modal
                isOpen={open === 'leftTitle' || open === 'topBarDescription'}
                onClose={close}
                variant="content"
                topBarTitle="Connect wallet"
                topBarDescription="app.uniswap.org"
                topBarTitleAlign={open === 'leftTitle' ? 'left' : 'center'}
            >
                <Rows />
            </Modal>
            <Modal
                isOpen={
                    open === 'footerRow' || open === 'footerDivider' || open === 'footerDescription'
                }
                onClose={close}
                variant="content"
                topBarTitle="Connect wallet"
            >
                <Rows />
                <ModalFooterPortal>
                    <ModalFooter
                        layout={open === 'footerRow' ? 'row' : 'column'}
                        divider={open === 'footerDivider'}
                        description={
                            open === 'footerDescription'
                                ? 'Be sure to check the service address before connecting the wallet.'
                                : undefined
                        }
                    >
                        {open === 'footerRow' && (
                            <Button variant="secondary" size="large" fullWidth onClick={close}>
                                Cancel
                            </Button>
                        )}
                        <Button variant="primaryBlue" size="large" fullWidth onClick={close}>
                            Connect
                        </Button>
                        {open !== 'footerRow' && (
                            <Button variant="secondary" size="large" fullWidth onClick={close}>
                                Cancel
                            </Button>
                        )}
                    </ModalFooter>
                </ModalFooterPortal>
            </Modal>
            <Modal isOpen={open === 'bare'} onClose={close} bare>
                <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
                    <span className="text-h2 text-textPrimary">Bare modal</span>
                    <span className="text-center text-body1 text-textSecondary">
                        No header or footer — the screen owns its whole layout.
                    </span>
                    <Button variant="secondary" onClick={close}>
                        Close
                    </Button>
                </div>
            </Modal>
            <Modal
                isOpen={open === 'mobileHalf' || open === 'mobileFull'}
                onClose={close}
                mobileHeight={open === 'mobileFull' ? 'full' : 'half'}
                topBarTitle="Manage dashboard"
                variant="content"
            >
                <Rows />
            </Modal>
        </Page>
    );
};
