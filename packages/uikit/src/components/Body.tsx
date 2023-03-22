import { debounce, throttle } from '@tonkeeper/core/dist/utils/common';
import React, {
  PropsWithChildren,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import styled from 'styled-components';
import { AppSelectionContext, useAppContext } from '../hooks/appContext';
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
  const { standalone, ios } = useAppContext();
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

      if (ios) return;
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

export const useAppSelection = (
  elementRef: React.MutableRefObject<HTMLDivElement | null>
) => {
  const [selection, setSelection] = useState<EventTarget | null>(null);

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let timer: NodeJS.Timeout | undefined = undefined;
    let scrollTimer: NodeJS.Timeout | undefined = undefined;

    const handlerTouchUp = () => {
      clearTimeout(timer);
      setSelection(null);
    };

    const handlerTouchStart = (ev: TouchEvent) => {
      if (ev.touches.length > 1) return;
      timer = setTimeout(() => {
        setSelection(ev.target);
      }, 100);
    };

    const handlerTouchMove = throttle(() => {
      handlerTouchUp();
    }, 50);

    window.addEventListener('touchstart', handlerTouchStart);
    window.addEventListener('touchmove', handlerTouchMove);
    window.addEventListener('touchend', handlerTouchUp);
    window.addEventListener('touchcancel', handlerTouchUp);

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(timer);
      window.removeEventListener('touchstart', handlerTouchStart);
      window.removeEventListener('touchmove', handlerTouchMove);
      window.removeEventListener('touchend', handlerTouchUp);
      window.removeEventListener('touchcancel', handlerTouchUp);
    };
  }, [elementRef]);

  return selection;
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
      let lastY = 0;
      let maxScrollTop = 0;

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
        if (!document.body.classList.contains('scroll')) {
          document.body.classList.add('scroll');
        }
        timer = setTimeout(function () {
          document.body.classList.remove('scroll');
        }, 300);
      }, 50);

      const handlerTouchEnd = debounce(() => {
        const scroll = Math.max(
          1,
          Math.min(
            element.scrollTop,
            element.scrollHeight - element.clientHeight - 1
          )
        );
        element.scrollTo({ top: scroll, behavior: 'smooth' });
      }, 600);

      window.addEventListener('touchend', handlerTouchEnd);
      window.addEventListener('touchcancel', handlerTouchEnd);
      element.addEventListener('scroll', handlerScroll);
      sdk.uiEvents.on('loading', handlerScroll);

      handlerScroll();

      let refocus = false;

      const handlerTouchStart = function (event: TouchEvent) {
        lastY = event.touches[0].clientY;
        let style = window.getComputedStyle(element);
        let outerHeight = ['height', 'padding-top', 'padding-bottom']
          .map((key) => parseInt(style.getPropertyValue(key), 10))
          .reduce((prev, cur) => prev + cur);

        maxScrollTop = element.scrollHeight - outerHeight;
      };

      const handlerTouchMove = function (event: TouchEvent) {
        var top = event.touches[0].clientY;

        var scrollTop = element.scrollTop;
        var direction = lastY - top < 0 ? 'up' : 'down';
        if (
          event.cancelable &&
          ((scrollTop <= 0 && direction === 'up') ||
            (scrollTop >= maxScrollTop && direction === 'down'))
        ) {
          //refocus = true;
          // event.preventDefault();
        }

        lastY = top;
      };

      // const handlerTouchEnd = debounce(() => {
      //   if (refocus) {
      //     element.focus();
      //   }
      // }, 300);

      element.addEventListener('touchstart', handlerTouchStart);
      element.addEventListener('touchmove', handlerTouchMove);
      // window.addEventListener('touchend', handlerTouchEnd);
      // window.addEventListener('touchcancel', handlerTouchEnd);

      return () => {
        setTop();
        setBottom();
        clearTimeout(timer);
        sdk.uiEvents.off('loading', handlerScroll);

        element.removeEventListener('scroll', handlerScroll);
        window.removeEventListener('touchend', handlerTouchEnd);
        window.removeEventListener('touchcancel', handlerTouchEnd);
      };
    }, [elementRef]);

    useLayoutEffect(() => {
      const element = elementRef.current;
      if (elementRef.current) {
        elementRef.current.scrollTop = 1;
      }
    }, [elementRef.current]);

    const selection = useAppSelection(elementRef);
    const id = standalone ? 'body' : undefined;

    return (
      <BodyElement ref={elementRef} id={id}>
        <AppSelectionContext.Provider value={selection}>
          {children}
        </AppSelectionContext.Provider>
      </BodyElement>
    );
  }
);
