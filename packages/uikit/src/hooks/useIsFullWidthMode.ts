import { useTheme } from 'styled-components';

export function useIsFullWidthMode() {
    const { displayType } = useTheme();
    return displayType === 'full-width';
}
