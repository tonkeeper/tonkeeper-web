import ReactPortal from '../ReactPortal';
import { ComponentProps, FC } from 'react';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { useTheme } from 'styled-components';

export const Tooltip: FC<ComponentProps<typeof ReactTooltip>> = props => {
    const theme = useTheme();

    const styles = {
        backgroundColor: theme.backgroundContentTint,
        borderRadius: theme.displayType === 'full-width' ? theme.corner2xSmall : theme.cornerSmall,
        padding: '8px 12px'
    };

    return (
        <ReactPortal wrapperId={props.id}>
            <ReactTooltip opacity={1.0} style={styles} {...props} />
        </ReactPortal>
    );
};
