import { execSync } from 'child_process';
import path from 'path';

/**
 * The QA home is `tests/playwright/qa` of the main checkout, also when the specs run from a git
 * worktree: secrets, saved wallet profiles, plans and the monthly spend log exist once per machine.
 */
export function qaHome(): string {
    const commonDir = execSync('git rev-parse --git-common-dir', { cwd: __dirname })
        .toString()
        .trim();
    const mainRoot = path.resolve(__dirname, commonDir, '..');
    return path.join(mainRoot, 'tests', 'playwright', 'qa');
}
