// @ts-nocheck

import { useEffect } from 'react';
import { useAppSdk } from '../../hooks/appSdk';

export const useKeyboardHeight = () => {
  const sdk = useAppSdk();

  useEffect(() => {
    const message = (value: string) =>
      sdk.uiEvents.emit('copy', { method: 'copy', params: value });

    let innerHeight = window.innerHeight;

    function resizeHandler(this: VisualViewport) {
      const doc = document.documentElement;
      doc.style.setProperty('--app-height', `${this.height}px`);
      doc.style.overflow = 'hidden';
      doc.style.height = `${this.height}px`;
      document.body.style.overflow = 'hidden';
      document.body.style.height = `${this.height}px`;
      document.getElementById('root')!.style.overflow = 'hidden';
      document.getElementById('root')!.style.height = `${this.height}px`;
      message(`${this.height}px`);
    }

    const viewport = window.visualViewport;
    if (viewport) {
      setTimeout(() => resizeHandler.call(viewport), 300);
      viewport.addEventListener('resize', resizeHandler);
    }

    return () => {
      const doc = document.documentElement;
      doc.style.setProperty('--app-height', `${innerHeight}px`);
      message(`${innerHeight}px`);

      delete doc.style.overflow;
      delete doc.style.height;
      delete document.body.style.overflow;
      delete document.body.style.height;
      delete document.getElementById('root')!.style.overflow;
      delete document.getElementById('root')!.style.height;
    };
  }, []);
};
