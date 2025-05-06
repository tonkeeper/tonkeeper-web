import { AppendFileOptions, Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { App } from '@capacitor/app';

const originalConsoleError = console.error.bind(console);

class LogBuffer {
    private buffer: string[] = [];

    private readonly flushInterval: number = /*3 * 60 **/ 1000; // 3 minutes

    private flushTimer: NodeJS.Timeout | null = null;

    private readonly maxFileSize: number = 0.5 * 1024 * 1024; // 0.5 mb

    constructor(private readonly logsPath: string) {
        this.startFlushTimer();
        this.setupAppStateListener();
    }

    public write(message: string): void {
        this.buffer.push(message);
    }

    async flush(): Promise<void> {
        if (this.buffer.length === 0) return;

        const logData = this.buffer.join('\n') + '\n';

        try {
            const writeOptions: AppendFileOptions = {
                path: this.logsPath,
                data: logData,
                directory: Directory.Documents,
                encoding: Encoding.UTF8
            };

            const fileSize = await this.getFileSize();

            if (!fileSize || fileSize > this.maxFileSize) {
                await Filesystem.writeFile({ ...writeOptions, recursive: true });
            } else {
                await Filesystem.appendFile(writeOptions);
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
                directory: Directory.Documents
            });
            fileSize = stat.size;
        } catch (error) {}

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

    constructor(logsPath: string) {
        this.buffer = new LogBuffer(logsPath);
    }

    public overrideConsole(): void {
        const methods = ['log', 'error', 'warn', 'info', 'debug'] as const;
        methods.forEach(method => {
            const original = console[method]?.bind(console);
            console[method] = (...args: any[]) => {
                this.write(method.toUpperCase(), args);
                original(...args);
            };
        });
    }

    private hideSensitiveData(message: string): string {
        const mnemonicRegexes = [
            // 24 words, separated by spaces, tabs or newlines
            {
                regex: /(^|\W)((?:\w+\s+){23}\w+)((?:\s*\n.*)?|$)/g,
                hasSuffix: true,
                priority: 1
            },
            // 12 words, separated by spaces, tabs or newlines
            {
                regex: /(^|\W)((?:\w+\s+){11}\w+)((?:\s*\n.*)?|$)/g,
                hasSuffix: false,
                priority: 2
            },
            // 24 words, separated by commas
            {
                regex: /(^|\W)((?:\w+,\s*){23}\w+)(,.*)?/g,
                hasSuffix: true,
                priority: 1
            },
            // 12 words, separated by commas
            {
                regex: /(^|\W)((?:\w+,\s*){11}\w+)(,.*)?/g,
                hasSuffix: false,
                priority: 2
            }
        ];
        mnemonicRegexes.sort((a, b) => a.priority - b.priority);

        let result = message;
        mnemonicRegexes.forEach(({ regex, hasSuffix }) => {
            result = result.replace(regex, (_match, prefix, __mnemonic, suffix) => {
                return prefix + '##SensitiveData##' + (hasSuffix ? suffix || '' : '');
            });
        });

        return result;
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

            const processedMessage = this.hideSensitiveData(message);

            const logEntry = `${new Date().toISOString()} [${level}]: ${processedMessage}`;
            this.buffer.write(logEntry);
        } catch (e) {
            originalConsoleError('FileLogger: Write logs to file error:', e);
        }
    }
}
