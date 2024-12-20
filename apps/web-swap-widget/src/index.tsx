import ReactDOM from 'react-dom/client';
import { App } from './App';
import './i18n';
import { WidgetAppSdk } from './libs/appSdk';

const rootElement = document.getElementById('root') as HTMLElement;
rootElement.setAttribute('data-app-version', WidgetAppSdk.version);

const root = ReactDOM.createRoot(rootElement);

root.render(<App />);
