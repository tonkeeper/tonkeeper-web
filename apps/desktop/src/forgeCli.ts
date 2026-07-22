export function getRequestedArchitecture(argv: readonly string[]): string | undefined {
    for (let index = 0; index < argv.length; index += 1) {
        const argument = argv[index];

        if (argument.startsWith('--arch=')) {
            return argument.slice('--arch='.length) || undefined;
        }

        if (argument === '--arch' || argument === '-a') {
            return argv[index + 1];
        }
    }

    return undefined;
}
