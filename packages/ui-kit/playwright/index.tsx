import { beforeMount } from '@playwright/experimental-ct-react/hooks';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import '../src/styles/styles.css';

/**
 * Component-test "mode", forwarded from each test via
 * `mount(..., { hooksConfig: { mode } })`. It picks the kit layout here; the
 * matching viewport is set test-side (see playwright/test.tsx).
 */
export type TestMode = 'desktop' | 'mobile';

export type HooksConfig = {
    mode?: TestMode;
};

beforeMount<HooksConfig>(async ({ App, hooksConfig }) => {
    const mode = hooksConfig?.mode ?? 'desktop';
    return (
        <ThemeProvider theme="blue" layout={mode}>
            <App />
        </ThemeProvider>
    );
});
