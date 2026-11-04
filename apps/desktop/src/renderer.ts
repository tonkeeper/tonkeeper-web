import { Buffer as BufferPolyfill } from 'buffer';
import process from 'process';

globalThis.Buffer = BufferPolyfill;
globalThis.process = process;

import log from 'electron-log/renderer';

log.info('UI Start-up');
Object.assign(console, log.functions);

// Dropping a link or file on the window would otherwise navigate it away
// from the app; drop zones that accept files cancel these events first.
window.addEventListener('dragover', event => {
    if (event.defaultPrevented) return;
    event.preventDefault();
    if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'none';
    }
});
window.addEventListener('drop', event => {
    event.preventDefault();
});

import './wallet-core-wasm-path';
import './telegram-widget';
import './react';
