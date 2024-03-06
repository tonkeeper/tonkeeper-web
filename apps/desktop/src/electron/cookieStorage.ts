import { Cookie, Store, pathMatch, permuteDomain } from 'tough-cookie';
import { mainStorage } from './storageService';

export class CookieStore extends Store {
    idx: Record<string, Record<string, Record<string, Cookie>>> = {};
    key = 'cookie';

    constructor() {
        super();
        this.synchronous = false;
        this.restore();
    }

    save = async () => {
        await mainStorage.set(this.key, this.idx);
    };

    restore = async () => {
        const result = await mainStorage.get<
            Record<string, Record<string, Record<string, Cookie>>>
        >(this.key);

        if (!result) return;

        Object.keys(result).forEach(domain => {
            Object.keys(result[domain]).forEach(path => {
                Object.keys(result[domain][path]).forEach(name => {
                    result[domain][path][name] = Cookie.fromJSON(result[domain][path][name]);
                });
            });
        });

        if (result) {
            this.idx = result;
        }
    };

    findCookie = (
        domain: string,
        path: string,
        key: string,
        cb: (err: Error | null, cookie: Cookie | null) => void
    ) => {
        if (!this.idx[domain]) {
            return cb(null, undefined);
        }
        if (!this.idx[domain][path]) {
            return cb(null, undefined);
        }
        return cb(null, this.idx[domain][path][key] || null);
    };

    findCookies = (
        domain: string,
        path: string,
        allowSpecialUseDomain: boolean,
        cb: (err: Error | null, cookie: Cookie[]) => void
    ) => {
        const results: Cookie[] = [];
        if (typeof allowSpecialUseDomain === 'function') {
            cb = allowSpecialUseDomain;
            allowSpecialUseDomain = true;
        }
        if (!domain) {
            return cb(null, []);
        }

        let pathMatcher: Function;
        if (!path) {
            // null means "all paths"
            pathMatcher = function matchAll(domainIndex: Record<string, any>) {
                for (const curPath in domainIndex) {
                    const pathIndex = domainIndex[curPath];
                    for (const key in pathIndex) {
                        results.push(pathIndex[key]);
                    }
                }
            };
        } else {
            pathMatcher = function matchRFC(domainIndex: Record<string, any>) {
                //NOTE: we should use path-match algorithm from S5.1.4 here
                //(see : https://github.com/ChromiumWebApps/chromium/blob/b3d3b4da8bb94c1b2e061600df106d590fda3620/net/cookies/canonical_cookie.cc#L299)
                Object.keys(domainIndex).forEach(cookiePath => {
                    if (pathMatch(path, cookiePath)) {
                        const pathIndex = domainIndex[cookiePath];
                        for (const key in pathIndex) {
                            results.push(pathIndex[key]);
                        }
                    }
                });
            };
        }

        const domains = permuteDomain(domain, allowSpecialUseDomain) || [domain];
        const idx = this.idx;
        domains.forEach(curDomain => {
            const domainIndex = idx[curDomain];
            if (!domainIndex) {
                return;
            }
            pathMatcher(domainIndex);
        });

        cb(null, results);
    };

    putCookie = async (cookie: Cookie, cb: (err: Error | null) => void) => {
        if (!this.idx[cookie.domain]) {
            this.idx[cookie.domain] = Object.create(null);
        }
        if (!this.idx[cookie.domain][cookie.path]) {
            this.idx[cookie.domain][cookie.path] = Object.create(null);
        }
        this.idx[cookie.domain][cookie.path][cookie.key] = cookie;

        await this.save();

        cb(null);
    };

    updateCookie = async (
        oldCookie: Cookie,
        newCookie: Cookie,
        cb: (err: Error | null) => void
    ) => {
        await this.putCookie(newCookie, cb);
    };

    removeCookie = async (
        domain: string,
        path: string,
        key: string,
        cb: (err: Error | null) => void
    ) => {
        if (this.idx[domain] && this.idx[domain][path] && this.idx[domain][path][key]) {
            delete this.idx[domain][path][key];
        }

        await this.save();

        cb(null);
    };

    removeCookies = async (domain: string, path: string, cb: (err: Error | null) => void) => {
        if (this.idx[domain]) {
            if (path) {
                delete this.idx[domain][path];
            } else {
                delete this.idx[domain];
            }
        }

        await this.save();

        return cb(null);
    };

    getAllCookies = (cb: (err: Error | null, cookie: Cookie[]) => void) => {
        const cookies: Cookie[] = [];
        const idx = this.idx;

        const domains = Object.keys(idx);
        domains.forEach(domain => {
            const paths = Object.keys(idx[domain]);
            paths.forEach(path => {
                const keys = Object.keys(idx[domain][path]);
                keys.forEach(key => {
                    if (key !== null) {
                        cookies.push(idx[domain][path][key]);
                    }
                });
            });
        });

        // Sort by creationIndex so deserializing retains the creation order.
        // When implementing your own store, this SHOULD retain the order too
        cookies.sort((a, b) => {
            return (a.creationIndex || 0) - (b.creationIndex || 0);
        });

        cb(null, cookies);
    };
}
