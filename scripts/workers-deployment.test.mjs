import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deploymentCommand } from './workers-deployment.mjs';

test('only the web main ref deploys to production', () => {
    assert.equal(deploymentCommand('web', 'main'), 'deploy --config apps/web/wrangler.jsonc');
    for (const ref of ['staging', 'dev', 'rc']) {
        assert.equal(
            deploymentCommand('web', ref),
            `preview --config apps/web/wrangler.jsonc --name ${ref}`
        );
    }
    assert.match(deploymentCommand('twa', 'main'), /^preview /);
    assert.match(deploymentCommand('showcase', 'main'), /^preview /);
});

test('a pull request named main cannot overwrite production', () => {
    assert.equal(
        deploymentCommand('web', 'main', '123'),
        'preview --config apps/web/wrangler.jsonc --name pr-123'
    );
    assert.equal(
        deploymentCommand('twa', 'twa-feature', '123'),
        'preview --config apps/twa/wrangler.jsonc --name pr-123'
    );
});

test('branch names are bounded and cannot enter the shell command', () => {
    const refs = [
        'feature/wallet',
        'feature-wallet',
        'A'.repeat(200),
        '$(touch /tmp/unsafe)',
        '---'
    ];
    const commands = refs.map(ref => deploymentCommand('web', ref));
    for (const command of commands) {
        const name = command.split(' --name ')[1];
        assert.match(name, /^[a-z0-9][a-z0-9-]{0,62}$/);
    }
    assert.notEqual(commands[0], commands[1]);
    assert.equal(commands[0], deploymentCommand('web', refs[0]));
});

test('invalid app, ref and pull request inputs fail before deployment', () => {
    assert.throws(() => deploymentCommand('__proto__', 'main'));
    assert.throws(() => deploymentCommand('web', ''));
    assert.throws(() => deploymentCommand('web', 'main', '0; deploy'));
});
