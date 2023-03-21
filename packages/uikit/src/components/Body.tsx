import { throttle } from '@tonkeeper/core/dist/utils/common';
import React, { PropsWithChildren, useLayoutEffect, useRef } from 'react';
import styled from 'styled-components';
import { useAppContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';

const BodyElement = styled.div`
  flex-grow: 1;
  padding: 0 1rem;
  -webkit-overflow-scrolling: touch;
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
    if (standalone) {
      return;
    }

    let timer: NodeJS.Timeout | undefined;

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

      clearTimeout(timer);
      if (!document.body.classList.contains('disable-hover')) {
        document.body.classList.add('disable-hover');
      }
      timer = setTimeout(function () {
        document.body.classList.remove('disable-hover');
      }, 500);
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

      let timer: NodeJS.Timeout | undefined;
      var lastY = 0;

      const handlerScroll = throttle(() => {
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
        clearTimeout(timer);
        if (!document.body.classList.contains('disable-hover')) {
          document.body.classList.add('disable-hover');
        }
        timer = setTimeout(function () {
          document.body.classList.remove('disable-hover');
        }, 500);
      }, 50);

      element.addEventListener('scroll', handlerScroll);
      sdk.uiEvents.on('loading', handlerScroll);

      handlerScroll();

      const handlerTouchStart = function (event: TouchEvent) {
        lastY = event.touches[0].clientY;
      };

      const handlerTouchMove = function (event: TouchEvent) {
        var top = event.touches[0].clientY;

        var scrollTop = element.scrollTop;

        let style = window.getComputedStyle(element);
        let outerHeight = ['height', 'padding-top', 'padding-bottom']
          .map((key) => parseInt(style.getPropertyValue(key), 10))
          .reduce((prev, cur) => prev + cur);

        var maxScrollTop = element.scrollHeight - outerHeight;
        var direction = lastY - top < 0 ? 'up' : 'down';

        if (
          event.cancelable &&
          ((scrollTop <= 0 && direction === 'up') ||
            (scrollTop >= maxScrollTop && direction === 'down'))
        )
          event.preventDefault();

        lastY = top;
      };

      //   element.addEventListener('touchstart', handlerTouchStart);
      //   element.addEventListener('touchmove', handlerTouchMove);

      return () => {
        setTop();
        setBottom();
        sdk.uiEvents.off('loading', handlerScroll);

        element.removeEventListener('scroll', handlerScroll);
        // element.removeEventListener('touchstart', handlerTouchStart);
        // element.removeEventListener('touchmove', handlerTouchMove);
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
