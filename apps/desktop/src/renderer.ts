import { Buffer as BufferPolyfill } from 'buffer';
import process from 'process';

globalThis.Buffer = BufferPolyfill;
globalThis.process = process;

import log from 'electron-log/renderer';

log.info('UI Start-up');
Object.assign(console, log.functions);

import './telegram-widget';
import './react';
