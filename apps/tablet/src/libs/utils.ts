export function getWindow() {
  if (typeof window !== 'undefined') {
    return window;
  }

  return undefined;
}
