import path from 'path';

/**
 * Prints screenshot attachments (expected / actual / diff) of failed tests as
 * terminal links that resolve to the right file.
 *
 * Two problems with the built-in output: (1) it prints attachment paths relative
 * to the run's cwd (`packages/uikit`), but a terminal opened at the repo root
 * resolves those against the root — clicking then opens/creates the wrong file;
 * (2) absolute paths are long and wrap across rows, which breaks click detection.
 *
 * This reporter sidesteps both. Each line is an OSC 8 hyperlink whose target is
 * the absolute `file://` URL (immune to wrapping — the URL lives in the escape
 * sequence, not the visible text), and whose visible label is the path relative
 * to the repo root. So if the terminal honors OSC 8, the click uses the absolute
 * URL; if it doesn't, the visible label is a repo-root-relative path that the
 * terminal resolves correctly against its (repo-root) cwd. Either way the click
 * lands on the real image.
 */

interface ResultAttachment {
    name: string;
    path?: string;
    contentType: string;
}

interface TestResultLike {
    status: string;
    attachments: ResultAttachment[];
}

interface TestCaseLike {
    title: string;
}

const OSC8 = '\u001b]8;;';
const BEL = '\u0007';

// This file lives at <repo>/packages/uikit/playwright, so the repo root is three
// levels up. Deriving it from __dirname keeps the label correct regardless of the
// cwd the suite happens to run from.
const repoRoot = path.resolve(__dirname, '..', '..', '..');

function hyperlink(absolutePath: string): string {
    const url = `file://${absolutePath}`;
    const label = path.relative(repoRoot, absolutePath);
    return `${OSC8}${url}${BEL}${label}${OSC8}${BEL}`;
}

export default class TerminalImageLinksReporter {
    onTestEnd(test: TestCaseLike, result: TestResultLike): void {
        if (result.status === 'passed' || result.status === 'skipped') {
            return;
        }

        const images = result.attachments.filter(
            attachment => attachment.path && attachment.contentType.startsWith('image/')
        );
        if (images.length === 0) {
            return;
        }

        const links = images
            .map(attachment => `      ${hyperlink(path.resolve(attachment.path!))}`)
            .join('\n');
        process.stdout.write(`\n    open image (click) — ${test.title}:\n${links}\n`);
    }
}
