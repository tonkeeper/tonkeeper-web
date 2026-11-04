export const AUTHORIZATION_REQUIRED = 'Authorization required';

const PASSWORD_ATTEMPTS_LOCKED = 'Too many password attempts, retry in';

export const passwordAttemptsLocked = (retryInMs: number) =>
    `${PASSWORD_ATTEMPTS_LOCKED} ${retryInMs} ms`;

export const passwordRetryDelay = (error: unknown): number | undefined => {
    const message = error instanceof Error ? error.message : String(error);
    const match = message.match(new RegExp(`${PASSWORD_ATTEMPTS_LOCKED} (\\d+) ms`));
    return match ? Number(match[1]) : undefined;
};
