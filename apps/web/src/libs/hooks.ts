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
    if (standalone) {
      const doc = document.documentElement;
      doc.style.setProperty('--app-width', `${window.innerWidth}px`);
      return;
    }

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
  }, [standalone]);
};

export const useDisableFocusOnScroll = () => {
  return useEffect(() => {
    const body = document.body;
    if (!window.addEventListener || !body.classList) return;

    let timer: NodeJS.Timeout | undefined;

    const handler = function () {
      clearTimeout(timer);
      if (!body.classList.contains('disable-hover')) {
        body.classList.add('disable-hover');
      }
      timer = setTimeout(function () {
        body.classList.remove('disable-hover');
      }, 500);
    };

    window.addEventListener('scroll', handler, false);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handler);
    };
  }, []);
};
