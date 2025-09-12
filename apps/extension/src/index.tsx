import ReactDOM from 'react-dom/client';
import { App } from './App';
import browser from 'webextension-polyfill';

(async () => {
    const params = new URLSearchParams(location.search);
    const source = params.get('source');

    let isInCustomPopup = true;

    // opened by click on extension icon
    if (source === 'default_popup') {
        isInCustomPopup = false;

        try {
            const { willOpenCustomPopup } = await browser.runtime.sendMessage({
                type: 'DECIDE_MODE'
            });

            // close popup that is automatically opened by browser to allow SW to open new popup in separate window
            if (willOpenCustomPopup) {
                window.close();
                return;
            }
        } catch (e) {
            console.error('DECIDE_MODE failed, stay in popup', e);
        }
    }

    const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
    root.render(<App isInCustomPopup={isInCustomPopup} />);
})();
