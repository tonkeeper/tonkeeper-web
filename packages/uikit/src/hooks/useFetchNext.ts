import { throttle } from '@tonkeeper/core/dist/utils/common';
import { useEffect } from 'react';

export const useFetchNext = (
  hasNextPage: boolean | undefined,
  isFetchingNextPage: boolean,
  fetchNextPage: () => void
) => {
  useEffect(() => {
    if (!hasNextPage) return () => {};

    const handler = throttle(() => {
      if (isFetchingNextPage) return;
      if (document.documentElement.className == 'is-locked') return;
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 500
      ) {
        fetchNextPage();
      }
    }, 50);

    window.addEventListener('scroll', handler);

    handler();

    return () => {
      window.removeEventListener('scroll', handler);
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
};
