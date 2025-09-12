import ReactDOM from 'react-dom/client';
import { App } from './App';
import './i18n';

import './telegram-widget';
import { AppTgOauthRedirect, isInTgAuthInjectionContext } from "./AppTgOauthRedirect";
import { getTgAuthResult } from "@tonkeeper/core/dist/service/telegramOauth";

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

let EntryPoint = <App />;

try {
  const tgAuthResult = getTgAuthResult();

  if (tgAuthResult) {
    if (isInTgAuthInjectionContext()) {
      EntryPoint = <AppTgOauthRedirect tgAuthResult={tgAuthResult} />;
    } else {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }
} catch (e) {
  console.error(e);
}

root.render(EntryPoint);
