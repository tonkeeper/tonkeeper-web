#!/usr/bin/env node
// Fails when a deployed /migrate redirects anywhere off its own origin. The handoff lands there
// and the page must never forward it: code has no such redirect, and this pins the hosting layer
// (_redirects, CDN rules, trailing-slash canonicalisation) to the same promise.
//
// Usage: node scripts/check-migrate-redirects.mjs <base-url>

const MAX_HOPS = 10;
const ATTEMPTS = 3;

const PROBES = ['/migrate', '/migrate/', '/migrate?probe=1', '/migrate/probe', '/Migrate'];

const base = process.argv[2];
if (!base) {
    console.error('Usage: check-migrate-redirects.mjs <base-url>');
    process.exit(2);
}
const origin = new URL(base).origin;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// A fresh Pages deployment can answer 5xx or drop connections for a few seconds.
async function fetchHop(url) {
    let lastError;
    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
        try {
            const response = await fetch(url, { redirect: 'manual' });
            if (response.status < 500) return response;
            lastError = new Error(`HTTP ${response.status}`);
        } catch (e) {
            lastError = e;
        }
        await sleep(attempt * 3000);
    }
    throw lastError;
}

// `Refresh: 0; url=…` redirects just like `Location`.
function redirectTarget(response, url) {
    const location = response.headers.get('location');
    if (location) return new URL(location, url);
    const refresh = response.headers.get('refresh');
    const match = refresh && /url\s*=\s*['"]?([^'"\s]+)/i.exec(refresh);
    return match ? new URL(match[1], url) : null;
}

async function probe(path) {
    let url = new URL(path, origin);
    const hops = [];
    for (let hop = 0; hop <= MAX_HOPS; hop++) {
        const response = await fetchHop(url);
        hops.push(`${response.status} ${url.href}`);
        const target = redirectTarget(response, url);
        if (!target) {
            if (!response.ok) return { ok: false, hops, reason: `ends in HTTP ${response.status}` };
            return { ok: true, hops };
        }
        if (target.origin !== origin) {
            hops.push(`→ ${target.href}`);
            return { ok: false, hops, reason: `redirects to foreign origin ${target.origin}` };
        }
        url = target;
    }
    return { ok: false, hops, reason: `more than ${MAX_HOPS} redirects` };
}

let failed = false;
for (const path of PROBES) {
    let result;
    try {
        result = await probe(path);
    } catch (e) {
        result = { ok: false, hops: [], reason: `request failed: ${e.message}` };
    }
    console.log(`${result.ok ? 'ok  ' : 'FAIL'} ${path}${result.ok ? '' : ` — ${result.reason}`}`);
    for (const hop of result.hops) console.log(`       ${hop}`);
    failed ||= !result.ok;
}

process.exit(failed ? 1 : 0);
