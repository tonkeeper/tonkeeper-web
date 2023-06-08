import { throttle } from '@tonkeeper/core/dist/utils/common';
import { useEffect } from 'react';

export const useAppWidth = () => {
  useEffect(() => {
    const appWidth = throttle(() => {
      const doc = document.documentElement;
      const app = (
        document.getElementById('root') as HTMLDivElement
      ).childNodes.item(0) as HTMLDivElement;

      doc.style.setProperty('--app-width', `${app.clientWidth}px`);
    }, 50);
    window.addEventListener('resize', appWidth);

    appWidth();

    return () => {
      window.removeEventListener('resize', appWidth);
    };
  }, []);
};
