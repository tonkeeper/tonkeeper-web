import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './app/i18n';
import {
    getTgAuthResult,
    sendTgAuthResultToOpener
} from '@tonkeeper/core/dist/service/telegramOauth';

try {
    const tgAuthResult = getTgAuthResult();
    if (tgAuthResult) {
        sendTgAuthResultToOpener(tgAuthResult);
    }
} catch (e) {
    console.error(e);
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);
