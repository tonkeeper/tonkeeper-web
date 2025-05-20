import { Buffer as BufferPolyfill } from 'buffer';
globalThis.Buffer = BufferPolyfill;

import log from 'electron-log/renderer';

log.info('UI Start-up');
Object.assign(console, log.functions);

import './telegram-widget';
import './react';
