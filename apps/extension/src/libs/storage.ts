import { IStorage } from '@tonkeeper/core/dist/Storage';
import browser from 'webextension-polyfill';
import { checkForError } from './utils';

export class ExtensionStorage implements IStorage {
  get = async <R>(key: string) => {
    return browser.storage.local.get(key).then<R | null>((result) => {
      const err = checkForError();
      if (err) {
        throw err;
      }
      return result[key] ?? null;
    });
  };

  set = async <R>(key: string, payload: R) => {
    await browser.storage.local.set({ [key]: payload });
    const err = checkForError();
    if (err) {
      throw err;
    }
    return payload;
  };

  setBatch = async <V extends Record<string, unknown>>(values: V) => {
    await browser.storage.local.set(values);
    const err = checkForError();
    if (err) {
      throw err;
    }
    return values;
  };

  delete = async <R>(key: string) => {
    const payload = await this.get<R>(key);
    if (payload != null) {
      await browser.storage.local.set({ [key]: null });
      const err = checkForError();
      if (err) {
        throw err;
      }
    }
    return payload;
  };

  clear = async () => {
    await browser.storage.local.clear();
    const err = checkForError();
    if (err) {
      throw err;
    }
  };
}
