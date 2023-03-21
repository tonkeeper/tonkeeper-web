import { throttle } from '@tonkeeper/core/dist/utils/common';
import { useEffect } from 'react';

export const useAppHeight = () => {
  useEffect(() => {
    const appHeight = throttle(() => {
      const doc = document.documentElement;
      doc.style.setProperty('--app-height', `${window.innerHeight}px`);
    }, 50);
    window.addEventListener('resize', appHeight);
    appHeight();

    return () => {
      window.removeEventListener('resize', appHeight);
    };
  }, []);
};

export const useAppWidth = (standalone: boolean) => {
  useEffect(() => {
    const appWidth = throttle(() => {
      if (standalone) {
        const doc = document.documentElement;
        doc.style.setProperty('--app-width', `${window.innerWidth}px`);
      } else {
        const doc = document.documentElement;
        const app = (
          document.getElementById('root') as HTMLDivElement
        ).childNodes.item(0) as HTMLDivElement;

        doc.style.setProperty('--app-width', `${app.clientWidth}px`);
      }
    }, 50);
    window.addEventListener('resize', appWidth);

    appWidth();

    return () => {
      window.removeEventListener('resize', appWidth);
    };
  }, [standalone]);
};
