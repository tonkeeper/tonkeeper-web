import { throttle } from '@tonkeeper/core/dist/utils/common';
import React, { PropsWithChildren, useLayoutEffect, useRef } from 'react';
import styled from 'styled-components';
import { useAppContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';

const BodyElement = styled.div`
  flex-grow: 1;
  padding: 0 1rem;
`;

const setTop = () => {
  if (!document.body.classList.contains('top')) {
    document.body.classList.add('top');
  }
};
const removeTop = () => {
  if (document.body.classList.contains('top')) {
    document.body.classList.remove('top');
  }
};

const setBottom = () => {
  if (!document.body.classList.contains('bottom')) {
    document.body.classList.add('bottom');
  }
};
const removeBottom = () => {
  if (document.body.classList.contains('bottom')) {
    document.body.classList.remove('bottom');
  }
};

export const useWindowsScroll = () => {
  const sdk = useAppSdk();
  const { standalone } = useAppContext();
  useLayoutEffect(() => {
    if (standalone) return;

    const handler = throttle(() => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 10
      ) {
        setBottom();
      } else {
        removeBottom();
      }
      if (window.scrollY > 10) {
        removeTop();
      } else {
        setTop();
      }
    }, 50);

    window.addEventListener('scroll', handler);
    sdk.uiEvents.on('loading', handler);

    handler();

    return () => {
      setTop();
      setBottom();
      window.removeEventListener('scroll', handler);
      sdk.uiEvents.off('loading', handler);
    };
  }, [standalone]);
};

export const InnerBody = React.forwardRef<HTMLDivElement, PropsWithChildren>(
  ({ children }, ref) => {
    const sdk = useAppSdk();
    const { standalone } = useAppContext();

    const innerRef = useRef<HTMLDivElement>(null);

    const elementRef = (
      ref == null ? innerRef : ref
    ) as React.MutableRefObject<HTMLDivElement | null>;

    useLayoutEffect(() => {
      const element = elementRef.current;
      if (!element) return;
      if (!standalone) return;

      const handler = throttle(() => {
        if (element.scrollTop < 10) {
          setTop();
        } else {
          removeTop();
        }
        if (
          element.scrollTop + element.clientHeight <
          element.scrollHeight - 10
        ) {
          removeBottom();
        } else {
          setBottom();
        }
      }, 50);

      element.addEventListener('scroll', handler);
      sdk.uiEvents.on('loading', handler);

      handler();

      return () => {
        setTop();
        setBottom();
        element.removeEventListener('scroll', handler);
        sdk.uiEvents.off('loading', handler);
      };
    }, [elementRef]);

    const id = standalone ? 'body' : undefined;
    return (
      <BodyElement ref={elementRef} id={id}>
        {children}
      </BodyElement>
    );
  }
);
