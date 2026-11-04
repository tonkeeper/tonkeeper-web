import { FC } from 'react';

import { Modal } from '../../../../primitives/Modal';
import { CryptoCatalogHeader } from './CryptoCatalogHeader';
import { CryptoCatalogView } from './CryptoCatalogView';

export const CryptoCatalogModal: FC<{ onClose: () => void }> = ({ onClose }) => (
    <Modal isOpen onClose={onClose} bare>
        <CryptoCatalogHeader onClose={onClose} />
        <CryptoCatalogView onSelectAsset={onClose} />
    </Modal>
);
