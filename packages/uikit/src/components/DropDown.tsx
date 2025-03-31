import React, {
    ComponentProps,
    FC,
    forwardRef,
    Fragment,
    PropsWithChildren,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react';
import styled, { css } from 'styled-components';
import { Transition, TransitionStatus } from 'react-transition-group';
import { mergeRefs } from '../libs/common';
import { BorderSmallResponsive } from './shared/Styles';
import { DoneIcon } from './Icon';
import ReactPortal from './ReactPortal';

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
    trigger?: 'click' | 'hover';
    portal?: boolean;
}

const ContainerStyled = styled(Container)<{ status: TransitionStatus }>`
    transition: opacity 0.15s ease-in-out;
    opacity: ${p => (p.status === 'entering' || p.status === 'entered' ? 1 : 0)};
`;

let pointerEventsBlockings: number[] = [];
const blockPointerEvents = () => {
    const id = Date.now();
    pointerEventsBlockings.push(id);
    document.getElementById('root')?.classList.add('pointer-events-none');
    return id;
};
const unblockPointerEvents = (id: number) => {
    pointerEventsBlockings = pointerEventsBlockings.filter(i => i !== id);
    if (pointerEventsBlockings.length === 0) {
        document.getElementById('root')?.classList.remove('pointer-events-none');
    }
};

export const DropDown = ({
    children,
    payload,
    center,
    disabled,
    className,
    containerClassName,
    trigger = 'click',
    portal
}: DropDownProps) => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (isOpen && portal) {
            const id = blockPointerEvents();
            return () => unblockPointerEvents(id);
        }
    }, [isOpen, portal]);

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

    const onClickHost = (e: React.MouseEvent<HTMLDivElement>) => {
        if (trigger === 'click') {
            onOpen(e);
        }
    };

    const onMouseHoverHost = (e: React.MouseEvent<HTMLDivElement>) => {
        if (trigger === 'hover') {
            onOpen(e);
        }
    };

    const Wrapper = useMemo(() => (portal ? ReactPortal : Fragment), [portal]);

    return (
        <DropDownContainer ref={ref} className={className}>
            <DropDownHeader
                ref={hostRef}
                onClick={onClickHost}
                onMouseOver={onMouseHoverHost}
                onMouseOut={onMouseHoverHost}
            >
                {children}
            </DropDownHeader>
            <Wrapper>
                <Transition
                    in={isOpen}
                    timeout={150}
                    nodeRef={containerRef}
                    unmountOnExit
                    mountOnEnter
                >
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
            </Wrapper>
        </DropDownContainer>
    );
};

export const DropDownItemsDivider = styled.div`
    height: 1px;
    background: ${p => p.theme.separatorCommon};
`;

export const DropDownContent = styled.div`
    background: ${p => p.theme.backgroundContentTint};
    ${BorderSmallResponsive};

    ${DropDownItemsDivider}:last-child {
        display: none;
    }
`;

const DropDownListItemStyled = styled.div`
    padding: 10px 12px;
    cursor: pointer;
    display: flex;
    align-items: center;

    transition: background 0.1s ease-in-out;

    ${p =>
        p.theme.proDisplayType !== 'mobile' &&
        css`
    &:hover {
        background: ${props => props.theme.backgroundHighlighted};
    `}
`;

const DoneIconStyled = styled(DoneIcon)`
    flex-shrink: 0;
    margin-left: auto;
    color: ${p => p.theme.accentBlue};
`;

export const DropDownItem: FC<
    PropsWithChildren<{ isSelected: boolean } & ComponentProps<'div'>>
> = ({ isSelected, children, ...rest }) => {
    return (
        <DropDownListItemStyled {...rest}>
            {children}
            {isSelected && <DoneIconStyled />}
        </DropDownListItemStyled>
    );
};
