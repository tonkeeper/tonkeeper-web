import React, {
    forwardRef,
    PropsWithChildren,
    useContext,
    useLayoutEffect,
    useRef,
    useState
} from 'react';
import styled, { createGlobalStyle, css } from 'styled-components';
import { AppSelectionContext, useAppContext } from '../hooks/appContext';
import { mergeRefs } from '../libs/common';

export const ListBlock = styled.div<{
    margin?: boolean;
    dropDown?: boolean;
    fullWidth?: boolean;
    noUserSelect?: boolean;
}>`
    display: flex;
    flex-direction: column;

    ${props =>
        props.dropDown
            ? css`
                  background: ${p => p.theme.backgroundContentTint};
              `
            : css`
                  background: ${p => p.theme.backgroundContent};
              `}

    padding: 0;

    ${props =>
        props.margin !== false
            ? css`
                  margin: 0 0 2rem;
              `
            : undefined}

    ${props =>
        props.fullWidth
            ? css`
                  width: 100%;
              `
            : undefined}

      ${props =>
        props.noUserSelect
            ? css`
                  user-select: none;
              `
            : undefined}

  border-radius: ${props =>
        props.theme.displayType === 'full-width'
            ? props.theme.corner2xSmall
            : props.theme.cornerSmall};

    > div:first-child {
        border-top-right-radius: ${props =>
            props.theme.displayType === 'full-width'
                ? props.theme.corner2xSmall
                : props.theme.cornerSmall};
        border-top-left-radius: ${props =>
            props.theme.displayType === 'full-width'
                ? props.theme.corner2xSmall
                : props.theme.cornerSmall};
    }
    > div:last-child {
        border-bottom-right-radius: ${props =>
            props.theme.displayType === 'full-width'
                ? props.theme.corner2xSmall
                : props.theme.cornerSmall};
        border-bottom-left-radius: ${props =>
            props.theme.displayType === 'full-width'
                ? props.theme.corner2xSmall
                : props.theme.cornerSmall};
    }
`;

export const ListItemPayload = styled.div`
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1rem 1rem 0;
    box-sizing: border-box;
    gap: 10px;

    width: 100%;
`;

export const ListItemElement = styled.div<{
    hover?: boolean;
    dropDown?: boolean;
    ios?: boolean;
    isHover?: boolean;
}>`
    position: relative;
    display: flex;
    padding: 0 0 0 1rem;
    transition: background-color 0.1s ease;

    ${props =>
        props.dropDown
            ? css`
                  background-color: ${p => p.theme.backgroundContentTint};
              `
            : css`
                  background-color: ${p => p.theme.backgroundContent};
              `}

    ${props => {
        const background = props.dropDown
            ? props.theme.backgroundHighlighted
            : props.theme.backgroundContentTint;

        if (props.ios) {
            return props.hover !== false && props.isHover
                ? css`
                      background-color: ${background};

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
                          background-color: ${background};

                          > div {
                              border-top-color: ${props.theme.backgroundHighlighted} !important;
                          }
                      }
                  `
                : undefined;
        }
    }}

  & + & > div {
        border-top: 1px solid ${props => props.theme.separatorCommon};
        padding-top: 15px;
    }
`;

export const GlobalListStyle = createGlobalStyle`
  body:not(.disable-hover) ${ListItemElement}:hover,
  body:not(.disable-hover) ${ListItemElement}:active {
    
  }
`;
export const ListItem = forwardRef<
    HTMLDivElement,
    PropsWithChildren<
        { hover?: boolean; dropDown?: boolean } & Omit<
            React.HTMLProps<HTMLDivElement>,
            'size' | 'children' | 'as' | 'ref'
        >
    >
>(({ children, hover, dropDown, ...props }, externalRef) => {
    const selection = useContext(AppSelectionContext);
    const { ios } = useAppContext();
    const [isHover, setHover] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (selection && ref.current && ref.current.contains(selection as Node)) {
            setHover(true);
        } else {
            setHover(false);
        }
    }, [ref.current, selection, setHover]);

    return (
        <ListItemElement
            hover={hover}
            isHover={isHover}
            ref={mergeRefs(ref, externalRef)}
            dropDown={dropDown}
            ios={ios}
            {...props}
        >
            {children}
        </ListItemElement>
    );
});
