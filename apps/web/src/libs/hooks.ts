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
