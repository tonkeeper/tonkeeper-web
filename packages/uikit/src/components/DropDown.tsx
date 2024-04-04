import React, {
    forwardRef,
    PropsWithChildren,
    useCallback,
    useEffect,
    useRef,
    useState
} from 'react';
import styled, { css } from 'styled-components';
import { Transition, TransitionStatus } from 'react-transition-group';
import { mergeRefs } from '../libs/common';

const DropDownContainer = styled.div`
    position: relative;
    display: inline-block;
`;
const DropDownHeader = styled.div`
    cursor: pointer;
`;

const DropDownListContainer = styled.div<{ center?: boolean }>`
    position: absolute;
    width: 240px;

    ${props =>
        props.center
            ? css`
                  left: 50%;
                  margin-left: -120px;
                  top: calc(100% + 0.5rem);
              `
            : css`
                  top: -1.25rem;
                  right: -1rem;
              `}

    z-index: 1;
    background-color: ${props => props.theme.backgroundContentTint};
    border-radius: ${props => props.theme.cornerSmall};

    ${p =>
        p.theme.displayType === 'full-width'
            ? css`
                  max-height: 220px;
                  border-radius: ${props => props.theme.corner2xSmall};
              `
            : css`
                  max-height: 368px;
              `}

    overflow: auto;
    -webkit-overflow-scrolling: touch;

    box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.16);
`;

export const DropDownListPayload = styled.div`
    white-space: nowrap;
`;

const ListItem = styled.div`
    cursor: pointer;
    padding: 10px 20px;

    &:hover {
        background: ${props => props.theme.backgroundHighlighted};
    }
`;

function useOutsideAlerter(ref: React.RefObject<Node>, onClick: (e: MouseEvent) => void) {
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onClick(event);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [ref, onClick]);
}

const Container = forwardRef<
    HTMLDivElement,
    {
        onClose: () => void;
        children: React.ReactNode;
        center?: boolean;
        className?: string;
        hostRef?: React.RefObject<HTMLDivElement>;
    }
>(({ onClose, children, center, className, hostRef }, ref) => {
    const wrapperRef = useRef<HTMLDivElement>(null);

    const onClick = useCallback(
        (e: MouseEvent) => {
            if (!hostRef?.current || !hostRef.current.contains(e.target as Node)) {
                onClose();
            }
        },
        [onClose]
    );

    useOutsideAlerter(wrapperRef, onClick);
    return (
        <DropDownListContainer
            ref={mergeRefs(wrapperRef, ref)}
            center={center}
            className={className}
        >
            {children}
        </DropDownListContainer>
    );
});

export interface DropDownProps extends PropsWithChildren {
    payload: (onClose: () => void) => React.ReactNode;
    center?: boolean;
    disabled?: boolean;
    className?: string;
    containerClassName?: string;
}

const ContainerStyled = styled(Container)<{ status: TransitionStatus }>`
    transition: opacity 0.15s ease-in-out;
    opacity: ${p => (p.status === 'entering' || p.status === 'entered' ? 1 : 0)};
`;

export const DropDown = ({
    children,
    payload,
    center,
    disabled,
    className,
    containerClassName
}: DropDownProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggling = () => {
        if (!disabled) {
            setIsOpen(value => !value);
        }
    };

    const onOpen: React.MouseEventHandler<HTMLDivElement> = e => {
        e.stopPropagation();
        e.preventDefault();
        toggling();
    };

    const ref = useRef<HTMLDivElement>(null);
    const hostRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = ref.current;

        if (!element) return;

        const listener = (e: TouchEvent) => {
            e.stopPropagation();
            return false;
        };

        element.addEventListener('touchstart', listener);
        element.addEventListener('touchmove', listener);

        return () => {
            element.removeEventListener('touchstart', listener);
            element.removeEventListener('touchmove', listener);
        };
    }, [ref]);

    return (
        <DropDownContainer ref={ref} className={className}>
            <DropDownHeader ref={hostRef} onClick={onOpen}>
                {children}
            </DropDownHeader>
            <Transition in={isOpen} timeout={150} nodeRef={containerRef} unmountOnExit mountOnEnter>
                {status => (
                    <ContainerStyled
                        onClose={toggling}
                        center={center}
                        className={containerClassName}
                        hostRef={hostRef}
                        status={status}
                        ref={containerRef}
                    >
                        {payload(toggling)}
                    </ContainerStyled>
                )}
            </Transition>
        </DropDownContainer>
    );
};

export interface DropDownListProps<T> extends PropsWithChildren {
    options: T[];
    renderOption: (option: T) => React.ReactNode;
    onSelect: (option: T) => void;
    center?: boolean;
    disabled?: boolean;
}

// eslint-disable-next-line @typescript-eslint/comma-dangle
export const DropDownList = <T,>({
    children,
    options,
    renderOption,
    onSelect,
    center,
    disabled
}: DropDownListProps<T>) => {
    return (
        <DropDown
            disabled={disabled}
            center={center}
            payload={onClose => (
                <DropDownListPayload>
                    {options.map((option, index) => (
                        <ListItem
                            key={index}
                            onClick={() => {
                                onClose();
                                onSelect(option);
                            }}
                        >
                            {renderOption(option)}
                        </ListItem>
                    ))}
                </DropDownListPayload>
            )}
        >
            {children}
        </DropDown>
    );
};
