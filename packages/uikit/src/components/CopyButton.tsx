import { FC, useState } from 'react';
import { CopyIcon, DoneIcon } from './Icon';
import { IconButton } from './fields/IconButton';
import { useAppSdk } from '../hooks/appSdk';
import styled from 'styled-components';

const IconButtonStyled = styled(IconButton)`
    padding: 0;
    color: ${p => p.theme.iconTertiary};
`;

const DoneIconStyled = styled(DoneIcon)`
    color: ${p => p.theme.accentGreen};
`;

export const CopyButton: FC<{
    content: string;
    copyClassName?: string;
    doneClassName?: string;
    timeout?: number;
}> = ({ content, timeout }) => {
    const [copied, setIsCopied] = useState(false);
    const sdk = useAppSdk();

    const onCopy = () => {
        sdk.copyToClipboard(content);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), timeout ?? 2000);
    };

    if (copied) {
        return <DoneIconStyled />;
    }

    return (
        <IconButtonStyled transparent onClick={onCopy}>
            <CopyIcon />
        </IconButtonStyled>
    );
};
