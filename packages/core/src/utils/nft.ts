export const isTMEDomain = (domain: string) => domain.endsWith('.t.me');
export const isTONDNSDomain = (domain: string) => /[a-z0-9\-]+\.ton/.test(domain);
