import { Buffer as BufferPolyfill } from 'buffer';
declare var Buffer: typeof BufferPolyfill;
globalThis.Buffer = BufferPolyfill;

import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './app/i18n';

const root = createRoot(document.getElementById('root'));
root.render(<App />);
