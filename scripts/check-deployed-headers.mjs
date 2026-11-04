#!/usr/bin/env node
// Fails when a deployed origin doesn't serve the headers the domain migration relies on.
// `_headers` is only honoured by Cloudflare Pages and a typo there fails silently, so this checks
// what the edge really sends. The wallet's opener policy has to allow popups, and the old origin
// must send none at all: either way the handoff popup keeps its opener.
//
// Usage: node scripts/check-deployed-headers.mjs <base-url> <web|migration>

const ATTEMPTS = 3;

const neverFramed = {
    'content-security-policy': value => /frame-ancestors\s+'none'/.test(value),
    'x-frame-options': value => value?.toUpperCase() === 'DENY'
};

const wallet = {
    ...neverFramed,
    'cross-origin-opener-policy': value => value === 'same-origin-allow-popups'
};

const handoffPopup = {
    ...neverFramed,
    'cross-origin-opener-policy': value => value === null
};

const EXPECTATIONS = {
    web: {
        '/': wallet,
        '/migrate': {
            ...wallet,
            'cache-control': value => /\bno-store\b/.test(value),
            'referrer-policy': value => value === 'no-referrer'
        }
    },
    migration: Object.fromEntries(
        ['/', '/handoff'].map(path => [
            path,
            {
                ...handoffPopup,
                'content-security-policy': value =>
                    /frame-ancestors\s+'none'/.test(value) &&
                    /default-src\s+'none'/.test(value) &&
                    /connect-src\s+'none'/.test(value),
                'referrer-policy': value => value === 'no-referrer'
            }
        ])
    )
};

const [base, app] = process.argv.slice(2);
const expectations = EXPECTATIONS[app];
if (!base || !expectations) {
    console.error('Usage: check-deployed-headers.mjs <base-url> <web|migration>');
    process.exit(2);
}
const origin = new URL(base).origin;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// A fresh Pages deployment can answer 5xx or drop connections for a few seconds.
async function fetchOk(url) {
    let lastError;
    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
        try {
            const response = await fetch(url, { redirect: 'manual' });
            if (response.ok) return response;
            lastError = new Error(`HTTP ${response.status}`);
        } catch (e) {
            lastError = e;
        }
        await sleep(attempt * 3000);
    }
    throw lastError;
}

let failed = false;
for (const [path, rules] of Object.entries(expectations)) {
    const url = new URL(path, origin);
    let response;
    try {
        response = await fetchOk(url);
    } catch (e) {
        console.log(`FAIL ${path} — request failed: ${e.message}`);
        failed = true;
        continue;
    }
    for (const [header, isValid] of Object.entries(rules)) {
        const value = response.headers.get(header);
        const ok = isValid(value);
        console.log(`${ok ? 'ok  ' : 'FAIL'} ${path} ${header}: ${value ?? '(absent)'}`);
        failed ||= !ok;
    }
}

process.exit(failed ? 1 : 0);
