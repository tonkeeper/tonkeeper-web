// eslint-disable-next-line max-classes-per-file
import { AppendFileOptions, Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { App } from '@capacitor/app';
import { hideSensitiveData } from '@tonkeeper/core/dist/utils/common';

const originalConsoleError = console.error.bind(console);

class LogBuffer {
    private buffer: string[] = [];

    private readonly flushInterval: number = 3 * 60 * 1000; // 3 minutes

    private flushTimer: NodeJS.Timeout | null = null;

    private readonly maxFileSize: number = 0.2 * 1024 * 1024; // 0.2 mb

    private readonly directory = Directory.Library;

    private readonly logsEncoding = Encoding.UTF8;

    constructor(private readonly logsPath: string) {
        this.startFlushTimer();
        this.setupAppStateListener();
    }

    public write(message: string): void {
        this.buffer.unshift(message);
    }

    public async clear(): Promise<void> {
        try {
            this.stopFlushTimer();
            this.buffer = [];
            await Filesystem.writeFile({
                path: this.logsPath,
                data: '',
                directory: this.directory,
                encoding: this.logsEncoding
            });
            this.startFlushTimer();
        } catch (e) {
            originalConsoleError(e);
            this.stopFlushTimer();
            this.startFlushTimer();
        }
    }

    public async read() {
        try {
            const file = await Filesystem.readFile({
                path: this.logsPath,
                directory: this.directory,
                encoding: this.logsEncoding
            });
            return typeof file.data === 'string' ? file.data : await file.data.text();
        } catch (e) {
            originalConsoleError(e);
            return '';
        }
    }

    public async getUri() {
        try {
            const uriResult = await Filesystem.getUri({
                path: this.logsPath,
                directory: this.directory
            });
            return uriResult.uri;
        } catch (e) {
            originalConsoleError(e);
            return null;
        }
    }

    async flush(): Promise<void> {
        if (this.buffer.length === 0) return;

        const logData = this.buffer.join('\n') + '\n';

        try {
            const writeOptions: AppendFileOptions = {
                path: this.logsPath,
                data: logData,
                directory: this.directory,
                encoding: this.logsEncoding
            };

            const fileSize = await this.getFileSize();

            if (!fileSize) {
                await Filesystem.writeFile({ ...writeOptions, recursive: true });
            } else if (fileSize > this.maxFileSize) {
                const savedLogs = await this.read();
                const savedPrevLogs = savedLogs.slice(0, 3000);
                await Filesystem.writeFile({
                    ...writeOptions,
                    recursive: true,
                    data: logData + savedPrevLogs
                });
            } else {
                const savedLogs = await this.read();
                await Filesystem.writeFile({
                    ...writeOptions,
                    recursive: true,
                    data: logData + savedLogs
                });
            }
            this.buffer = [];
        } catch (error) {
            originalConsoleError('LogBuffer: Write logs to file error:', error);
        }
    }

    private async getFileSize(): Promise<number> {
        let fileSize = 0;
        try {
            const stat = await Filesystem.stat({
                path: this.logsPath,
                directory: this.directory
            });
            fileSize = stat.size;
        } catch (error) {
            /*  */
        }

        return fileSize;
    }

    private startFlushTimer(): void {
        this.flushTimer = setInterval(() => {
            this.flush();
        }, this.flushInterval);
    }

    private stopFlushTimer(): void {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
    }

    private setupAppStateListener(): void {
        App.addListener('appStateChange', state => {
            if (!state.isActive) {
                this.destroy();
            }
        });
    }

    public destroy(): void {
        this.stopFlushTimer();
        this.flush();
    }
}

export class CapacitorFileLogger {
    private buffer: LogBuffer;

    private isConsoleOverridden = false;

    constructor(logsPath = 'logs.txt') {
        this.buffer = new LogBuffer(logsPath);
        this.overrideConsole();
    }

    public overrideConsole(): void {
        if (!this.isConsoleOverridden) {
            const methods = ['log', 'error', 'warn', 'info', 'debug'] as const;
            methods.forEach(method => {
                const original = console[method]?.bind(console);
                console[method] = (...args: unknown[]) => {
                    this.write(method.toUpperCase(), args);
                    original(...args);
                };
            });
            this.isConsoleOverridden = true;
        }
    }

    private write(level: string, args: unknown[]): void {
        try {
            const message = args
                .map(item => {
                    if (item === null || item === undefined) {
                        return String(item);
                    }
                    if (typeof item === 'object') {
                        try {
                            return JSON.stringify(item);
                        } catch {
                            return String(item);
                        }
                    }
                    return String(item);
                })
                .join(' ');

            const processedMessage = hideSensitiveData(message);

            const logEntry = `${new Date().toISOString()} [${level}]: ${processedMessage}`;
            this.buffer.write(logEntry);
        } catch (e) {
            originalConsoleError('FileLogger: Write logs to file error:', e);
        }
    }

    public read(): Promise<string> {
        return this.buffer.read();
    }

    public clear() {
        return this.buffer.clear();
    }
}

export const capacitorFileLogger = new CapacitorFileLogger();
