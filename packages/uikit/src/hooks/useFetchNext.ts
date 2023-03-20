import { throttle } from '@tonkeeper/core/dist/utils/common';
import { useEffect } from 'react';

export const useFetchNext = (
  hasNextPage: boolean | undefined,
  isFetchingNextPage: boolean,
  fetchNextPage: () => void,
  standalone: boolean,
  ref?: React.RefObject<HTMLDivElement>
) => {
  useEffect(() => {
    if (!hasNextPage) return;

    const element = standalone ? ref?.current : window;

    if (!element) return;

    const handler = throttle(() => {
      if (isFetchingNextPage) return;
      if (document.documentElement.className == 'is-locked') return;

      if (element === window) {
        if (
          window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 500
        ) {
          fetchNextPage();
        }
      } else {
        const item = element as HTMLDivElement;
        if (item.scrollTop >= item.scrollHeight - window.innerHeight - 500) {
          fetchNextPage();
        }
      }
    }, 50);

    element.addEventListener('scroll', handler);

    handler();

    return () => {
      element.removeEventListener('scroll', handler);
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, standalone, ref]);
};

export const useAppScroll = (
  standalone: boolean,
  ref?: React.RefObject<HTMLDivElement>
) => {
  useEffect(() => {
    const element = standalone ? ref?.current : window;
    if (!element) return;

    const handler = throttle(() => {
      if (element === window) {
        if (window.scrollY > 10) {
          if (!document.body.classList.contains('top')) {
            document.body.classList.add('top');
          }
        } else {
          if (document.body.classList.contains('top')) {
            document.body.classList.remove('top');
          }
        }
      } else {
        const item = element as HTMLDivElement;
        if (item.scrollTop < 10) {
          if (!document.body.classList.contains('top')) {
            document.body.classList.add('top');
          }
        } else {
          if (document.body.classList.contains('top')) {
            document.body.classList.remove('top');
          }
        }
      }
    }, 50);

    element.addEventListener('scroll', handler);

    handler();

    return () => {
      element.removeEventListener('scroll', handler);
    };
  }, [standalone, ref]);
};
