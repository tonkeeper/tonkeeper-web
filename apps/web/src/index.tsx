import './reload-on-stale-chunk';
import ReactDOM from 'react-dom/client';
import '@tonkeeper/uikit/dist/styles/tailwind.css';
import './wallet-core-wasm-path';
import { App } from './App';
import './i18n';

import './telegram-widget';
import { AppTgOauthRedirect, isInTgAuthInjectionContext } from './AppTgOauthRedirect';
import {
    getTgAuthResult,
    sendTgAuthResultToOpener
} from '@tonkeeper/core/dist/service/telegramOauth';
import { noteCheckAnswerNone } from './migration/analytics';
import { settleCheckAnswer } from './migration/handoffRequest';
import { keepForwardedTgAuthResult } from './telegramAuthReturn';

const resumePath = settleCheckAnswer(window.location);

if (resumePath) {
    history.replaceState(null, '', resumePath);
    noteCheckAnswerNone();
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

let EntryPoint = <App />;

try {
    const tgAuthResult = getTgAuthResult();

    if (tgAuthResult) {
        if (isInTgAuthInjectionContext()) {
            EntryPoint = <AppTgOauthRedirect tgAuthResult={tgAuthResult} />;
        } else if (keepForwardedTgAuthResult(tgAuthResult)) {
            history.replaceState(null, '', window.location.pathname);
        } else if (!sendTgAuthResultToOpener(tgAuthResult)) {
            history.replaceState(null, '', window.location.pathname + window.location.search);
        }
    }
} catch (e) {
    console.error(e);
}

root.render(EntryPoint);
