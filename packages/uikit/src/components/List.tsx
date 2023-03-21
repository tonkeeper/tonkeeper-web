import { throttle } from '@tonkeeper/core/dist/utils/common';
import React, {
  FC,
  PropsWithChildren,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import styled, { createGlobalStyle, css } from 'styled-components';
import { useAppContext } from '../hooks/appContext';

export const ListBlock = styled.div<{
  margin?: boolean;
  dropDown?: boolean;
  fullWidth?: boolean;
  noUserSelect?: boolean;
}>`
  display: flex;
  flex-direction: column;

  ${(props) =>
    props.dropDown
      ? css`
          background: ${(props) => props.theme.backgroundContentTint};
        `
      : css`
          background: ${(props) => props.theme.backgroundContent};
        `}

  padding: 0;

  ${(props) =>
    props.margin !== false
      ? css`
          margin: 0 0 2rem;
        `
      : undefined}

  ${(props) =>
    props.fullWidth
      ? css`
          width: 100%;
        `
      : undefined}

      ${(props) =>
    props.noUserSelect
      ? css`
          user-select: none;
        `
      : undefined}

  border-radius: ${(props) => props.theme.cornerSmall};

  > div:first-child {
    border-top-right-radius: ${(props) => props.theme.cornerSmall};
    border-top-left-radius: ${(props) => props.theme.cornerSmall};
  }
  > div:last-child {
    border-bottom-right-radius: ${(props) => props.theme.cornerSmall};
    border-bottom-left-radius: ${(props) => props.theme.cornerSmall};
  }
`;

export const ListItemPayload = styled.div`
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1rem 1rem 0;
  box-sizing: border-box;

  width: 100%;
`;

export const ListItemElement = styled.div<{
  hover?: boolean;
  dropDown?: boolean;
  ios: boolean;
  isHover?: boolean;
}>`
  display: flex;
  padding: 0 0 0 1rem;

  ${(props) =>
    props.dropDown
      ? css`
          background: ${(props) => props.theme.backgroundContentTint};
        `
      : css`
          background: ${(props) => props.theme.backgroundContent};
        `}

  ${(props) => {
    const background = props.dropDown
      ? props.theme.backgroundHighlighted
      : props.theme.backgroundContentTint;

    if (props.ios) {
      return props.hover !== false && props.isHover
        ? css`
            background: ${background};

            > div {
              border-top-color: ${props.theme.backgroundHighlighted} !important;
            }
          `
        : undefined;
    } else {
      return props.hover !== false
        ? css`
            cursor: pointer;
            &:hover {
              background: ${background};

              > div {
                border-top-color: ${props.theme
                  .backgroundHighlighted} !important;
              }
            }
          `
        : undefined;
    }
  }}

  & + & > div {
    border-top: 1px solid ${(props) => props.theme.separatorCommon};
    padding-top: 15px;
  }
`;

export const GlobalListStyle = createGlobalStyle`
  body:not(.disable-hover) ${ListItemElement}:hover,
  body:not(.disable-hover) ${ListItemElement}:active {
    
  }
`;
export const ListItem: FC<
  PropsWithChildren<
    { hover?: boolean; dropDown?: boolean } & Omit<
      React.HTMLProps<HTMLDivElement>,
      'size' | 'children' | 'as' | 'ref'
    >
  >
> = ({ children, hover, dropDown, ...props }) => {
  const { ios, standalone } = useAppContext();
  const [isHover, setHover] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!ios) return;
    if (!element) return;

    let timer: NodeJS.Timeout | undefined = undefined;

    const handlerTouchUp = () => {
      clearTimeout(timer);
      setHover(false);
      element.removeEventListener('touchmove', handlerTouchMove);
      window.removeEventListener('touchend', handlerTouchUp);
    };

    const handlerTouchStart = (ev: TouchEvent) => {
      if (ev.touches.length > 1) return;
      timer = setTimeout(() => {
        setHover(true);
      }, 100);
      element.addEventListener('touchmove', handlerTouchMove);
      window.addEventListener('touchend', handlerTouchUp);
    };

    const handlerTouchMove = throttle(() => {
      if (document.body.classList.contains('scroll')) {
        handlerTouchUp();
      }
    }, 50);

    element.addEventListener('touchstart', handlerTouchStart);

    return () => {
      clearTimeout(timer);
      element.removeEventListener('touchstart', handlerTouchStart);
      element.removeEventListener('touchmove', handlerTouchMove);
      window.removeEventListener('touchend', handlerTouchUp);
    };
  }, [ref.current]);
  return (
    <ListItemElement
      hover={hover}
      isHover={isHover}
      ref={ref}
      dropDown={dropDown}
      ios={ios}
      {...props}
    >
      {children}
    </ListItemElement>
  );
};
