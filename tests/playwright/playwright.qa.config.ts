import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { qaHome } from './qa/home';

dotenv.config({ path: path.resolve(qaHome(), '..', '.env') });

const outDir = path.join(qaHome(), 'out', process.env.QA_TICKET ?? 'adhoc', 'run');

export default defineConfig({
    testDir: './qa',
    outputDir: path.join(outDir, 'artifacts'),
    fullyParallel: false,
    workers: 1,
    retries: 0,
    timeout: 4 * 60 * 1000,
    reporter: [
        ['list'],
        ['json', { outputFile: path.join(outDir, 'results.json') }],
        ['html', { outputFolder: path.join(outDir, 'html'), open: 'never' }]
    ],
    use: {
        baseURL: process.env.QA_BASE_URL || 'http://localhost:5173',
        ...devices['Desktop Chrome']
    },
    projects: [
        {
            name: 'setup',
            testMatch: /wallets\.setup\.ts/,
            // The setup types seed phrases: nothing that records the screen or the input may run here.
            use: { video: 'off', trace: 'off', screenshot: 'off' }
        },
        {
            name: 'qa',
            testMatch: /specs\/.*\.spec\.ts/,
            dependencies: ['setup'],
            use: { video: 'on', trace: 'retain-on-failure', screenshot: 'on' }
        }
    ]
});
