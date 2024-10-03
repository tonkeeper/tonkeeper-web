import { CookieJar } from 'tough-cookie';
import { CookieStore } from './cookieStorage';

export const store = new CookieStore();
export const cookieJar = new CookieJar(store);
