import { useCallback, useState } from 'react';

export function useDisclosure(value = false) {
    const [isOpen, setIsOpen] = useState(value);
    const onClose = useCallback(() => setIsOpen(false), []);
    const onOpen = useCallback(() => setIsOpen(true), []);
    const onToggle = useCallback(() => setIsOpen(v => !v), []);

    return { isOpen, onClose, onOpen, onToggle };
}
