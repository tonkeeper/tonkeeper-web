import { chromium, type Browser, type CDPSession, type Page } from '@playwright/test';
import { spawn, type ChildProcess } from 'child_process';
import fs from 'fs';
import net from 'net';
import path from 'path';
import { qaHome } from './home';

/**
 * Runs the packaged desktop app (QA_DESKTOP_APP, a `.app` bundle) instead of the web build.
 *
 * Release builds disable Node's inspector fuse, so Playwright's `_electron.launch` cannot attach.
 * Chromium's own remote debugging still works: the app is started with a debugging port and the
 * renderer is driven over CDP. Each QA wallet gets its own data folder, so a run never reads or
 * writes the data of a copy the user has installed.
 *
 * The macOS keychain is shared: imported QA wallets add `tonkeeper.com` items next to the user's.
 * Specs must never remove a wallet or log out, since "clear" deletes every item of that service.
 */
export const isDesktopTarget = () => Boolean(process.env.QA_DESKTOP_APP);

export const desktopDataDir = (id: string) => path.join(qaHome(), '.desktop', id);

const desktopExecutable = () => {
    const bundle = process.env.QA_DESKTOP_APP;
    if (!bundle) throw new Error('QA_DESKTOP_APP is not set.');
    const plist = fs.readFileSync(path.join(bundle, 'Contents', 'Info.plist'), 'utf8');
    const name = /<key>CFBundleExecutable<\/key>\s*<string>([^<]+)<\/string>/.exec(plist)?.[1];
    if (!name) throw new Error(`No CFBundleExecutable in ${bundle}.`);
    return path.join(bundle, 'Contents', 'MacOS', name);
};

const freePort = () =>
    new Promise<number>((resolve, reject) => {
        const server = net.createServer();
        server.listen(0, '127.0.0.1', () => {
            const { port } = server.address() as net.AddressInfo;
            server.close(() => resolve(port));
        });
        server.on('error', reject);
    });

const waitForDebugger = async (port: number, app: ChildProcess) => {
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
        if (app.exitCode !== null) {
            throw new Error(`The desktop app exited with code ${app.exitCode} before it opened.`);
        }
        const ready = await fetch(`http://127.0.0.1:${port}/json/version`)
            .then(r => r.ok)
            .catch(() => false);
        if (ready) return;
        await new Promise(r => setTimeout(r, 250));
    }
    throw new Error('The desktop app did not open its debugging port within 30 s.');
};

export interface DesktopApp {
    page: Page;
    browser: Browser;
    process: ChildProcess;
    close: () => Promise<void>;
}

/** Starts the app on `dataDir`; `args` go last, where the app reads a link it was opened with. */
export async function launchDesktop(dataDir: string, args: string[] = []): Promise<DesktopApp> {
    fs.mkdirSync(dataDir, { recursive: true });
    const port = await freePort();
    const app = spawn(
        desktopExecutable(),
        [`--remote-debugging-port=${port}`, `--user-data-dir=${dataDir}`, ...args],
        { stdio: 'ignore' }
    );
    await waitForDebugger(port, app);

    const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
    const context = browser.contexts()[0];
    const isMainWindow = (p: Page) => p.url().includes('main_window/index.html');
    const page =
        context.pages().find(isMainWindow) ??
        (await context.waitForEvent('page', { predicate: isMainWindow, timeout: 30_000 }));
    await page.waitForLoadState('domcontentloaded');

    const close = async () => {
        await browser.close().catch(() => undefined);
        if (app.exitCode !== null) return;
        const exited = new Promise(resolve => app.once('exit', resolve));
        app.kill('SIGTERM');
        const timedOut = await Promise.race([
            exited.then(() => false),
            new Promise(r => setTimeout(() => r(true), 10_000))
        ]);
        if (timedOut) app.kill('SIGKILL');
    };

    return { page, browser, process: app, close };
}

/** Desktop storage is the app's electron-store file, not localStorage. */
export function readDesktopStore(dataDir: string): Record<string, unknown> {
    const file = path.join(dataDir, 'config.json');
    if (!fs.existsSync(file)) return {};
    return JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown>;
}

const viewportSessions = new WeakMap<Page, CDPSession>();

/**
 * Lays the page out at `width`×`height`. Electron does not expose window bounds over CDP, so the
 * size is emulated; the session stays attached because detaching drops the override.
 */
export async function setDesktopViewport(page: Page, width: number, height: number) {
    let session = viewportSessions.get(page);
    if (!session) {
        session = await page.context().newCDPSession(page);
        viewportSessions.set(page, session);
    }
    await session.send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 0,
        mobile: false
    });
}
