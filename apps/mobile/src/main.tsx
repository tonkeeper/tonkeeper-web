import { createRoot } from 'react-dom/client';
import '@tonkeeper/uikit/dist/styles/tailwind.css';
import { App } from './app/App';
import './app/i18n';

import './telegram-widget';

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
