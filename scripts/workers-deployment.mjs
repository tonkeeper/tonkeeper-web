import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const configs = {
    web: 'apps/web/wrangler.jsonc',
    twa: 'apps/twa/wrangler.jsonc',
    showcase: 'apps/ui-showcase/wrangler.jsonc'
};

export function deploymentCommand(app, ref, pullRequestNumber = '') {
    const config = configs[app];
    if (!Object.hasOwn(configs, app)) throw new Error('Unknown Worker app');
    if (!ref?.trim()) throw new Error('A deployment ref is required');
    if (pullRequestNumber && !/^[1-9][0-9]*$/.test(pullRequestNumber)) {
        throw new Error('Invalid pull request number');
    }
    if (app === 'web' && ref === 'main' && !pullRequestNumber) {
        return `deploy --config ${config}`;
    }
    let name = pullRequestNumber ? `pr-${pullRequestNumber}` : ref;
    if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(name)) {
        const hash = createHash('sha256').update(name).digest('hex').slice(0, 10);
        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9-]+/g, '-')
            .replace(/^-+|-+$/g, '');
        name = `${slug.slice(0, 48) || 'branch'}-${hash}`;
    }
    return `preview --config ${config} --name ${name}`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    console.log(
        `command=${deploymentCommand(
            process.env.WORKER_APP,
            process.env.DEPLOYMENT_REF,
            process.env.PR_NUMBER
        )}`
    );
}
