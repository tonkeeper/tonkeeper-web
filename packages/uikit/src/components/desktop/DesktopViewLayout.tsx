import styled, { createGlobalStyle, css } from 'styled-components';
import React, {
    Children,
    cloneElement,
    ComponentProps,
    createContext,
    FC,
    forwardRef,
    isValidElement,
    PropsWithChildren,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState
} from 'react';
import { useAppSdk, useAppTargetEnv } from '../../hooks/appSdk';
import { useNativeBackButton } from '../BackButton';
import { ArrowLeftIcon, EllipsisIcon } from '../Icon';
import { IconButton } from '../fields/IconButton';
import { useNavigate } from '../../hooks/router/useNavigate';
import {
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar
} from '@ionic/react';
import ReactPortal from '../ReactPortal';
import { Body2Class, Label2 } from '../Text';
import { SelectDropDown } from '../fields/Select';
import { DropDownContent, DropDownItem, DropDownItemsDivider } from '../DropDown';

const DesktopViewPageLayoutSimple = styled.div<{ borderBottom?: boolean }>`
    overflow: auto;
`;

const DesktopViewPageLayoutSimpleIonic = styled.div<{ $mobileContentPaddingTop?: boolean }>`
    height: 100%;

    ${p =>
        p.$mobileContentPaddingTop &&
        css`
            padding-top: 1rem;
            box-sizing: border-box;
        `}

    &::after {
        position: relative;
        display: block;
        content: '';
        height: calc(64px + 8px + env(safe-area-inset-bottom));
        background: transparent;
    }
`;

const DesktopViewPageLayoutContext = createContext<string | undefined>(undefined);

export const DesktopViewPageLayout = forwardRef<
    HTMLDivElement,
    PropsWithChildren<{ className?: string; mobileContentPaddingTop?: boolean; id?: string }>
>(({ children, className, mobileContentPaddingTop, id: propsId }, ref) => {
    const platform = useAppTargetEnv();
    const hookId = useId();
    const id = propsId ?? hookId;

    const contentRef = useRef<HTMLIonContentElement>(null);

    useLayoutEffect(() => {
        if (contentRef.current) {
            contentRef.current.getScrollElement().then(scrollElem => {
                if (ref) {
                    if (typeof ref === 'function') {
                        ref(scrollElem as HTMLDivElement);
                    } else if (typeof ref === 'object') {
                        ref.current = scrollElem as HTMLDivElement;
                    }
                }
            });
        }
    }, [ref]);

    if (platform === 'mobile') {
        return (
            <DesktopViewPageLayoutContext.Provider value={id}>
                <IonPage id={id}>
                    <IonContent ref={contentRef} fullscreen={true}>
                        <DesktopViewPageLayoutSimpleIonic
                            className={className}
                            $mobileContentPaddingTop={mobileContentPaddingTop}
                        >
                            {children}
                        </DesktopViewPageLayoutSimpleIonic>
                    </IonContent>
                </IonPage>
            </DesktopViewPageLayoutContext.Provider>
        );
    } else
        return (
            <DesktopViewPageLayoutSimple ref={ref} className={className}>
                {children}
            </DesktopViewPageLayoutSimple>
        );
});

export const DesktopViewHeaderStyled = styled.div<{
    withBackButton?: boolean;
    borderBottom?: boolean;
}>`
    padding: 1rem 0 1rem ${props => (props.withBackButton ? '0' : '1rem')};
    height: 20px;
    display: flex;
    align-items: center;
    box-sizing: content-box;
    position: sticky;
    top: 0;
    left: 0;
    z-index: 10;
    background-color: ${p => p.theme.backgroundPage};

    border-bottom: 1px solid transparent;
    transition: border-bottom-color 0.15s ease-in-out;

    * {
        user-select: none;
    }

    ${props =>
        props.borderBottom &&
        css`
            border-bottom-color: ${props.theme.separatorCommon};
        `};
`;

const IconButtonStyled = styled(IconButton)`
    transition: opacity 0.15s ease-in-out;

    &:hover {
        opacity: 0.64;
    }
`;

export const DesktopViewDivider = styled.div`
    height: 1px;
    background-color: ${p => p.theme.separatorCommon};
`;

export const DesktopBackButton: FC<{
    className?: string;
    icon?: ReactNode;
    onBack?: () => void;
}> = ({ className, icon, onBack }) => {
    const sdk = useAppSdk();
    const navigate = useNavigate();
    const back = useCallback(() => (onBack ? onBack() : navigate(-1)), [navigate, onBack]);
    useNativeBackButton(sdk, back);

    if (sdk.nativeBackButton) {
        return <></>;
    } else {
        return (
            <IconButtonStyled onClick={back} className={className} transparent>
                {icon || <ArrowLeftIcon />}
            </IconButtonStyled>
        );
    }
};

const BackButtonStyled = styled(DesktopBackButton)`
    padding: 0 1rem;
    height: 2rem;
`;

export const DesktopViewHeader: FC<
    PropsWithChildren<{
        backButton?: boolean | ReactNode;
        className?: string;
        borderBottom?: boolean;
        mobileTranslucent?: boolean;
    }>
> = ({ children, backButton, borderBottom, className, mobileTranslucent = true }) => {
    const portalId = useContext(DesktopViewPageLayoutContext);

    if (portalId !== undefined) {
        return (
            <ReactPortal wrapperId={portalId} position="first">
                <IonHeader translucent={mobileTranslucent} className={className}>
                    <IonToolbar>
                        {backButton !== false && (
                            <IonButtons slot="start">
                                <IonBackButton />
                            </IonButtons>
                        )}
                        {children}
                    </IonToolbar>
                </IonHeader>
            </ReactPortal>
        );
    }

    return (
        <DesktopViewHeaderStyled
            withBackButton={!!backButton}
            className={className}
            borderBottom={borderBottom}
        >
            {backButton && typeof backButton === 'boolean' ? <BackButtonStyled /> : backButton}
            {children}
        </DesktopViewHeaderStyled>
    );
};

const MobileTitleWrapper = styled.div`
    margin: 0 auto;
    width: fit-content;
`;

export const DesktopViewHeaderContent: FC<{ title: ReactNode; right?: ReactNode }> & {
    Right: typeof DesktopViewHeaderContentRight;
    RightItem: typeof DesktopViewHeaderContentRightItem;
} = ({ title, right }) => {
    const env = useAppTargetEnv();

    if (env !== 'mobile') {
        return (
            <>
                {typeof title === 'string' ? <Label2>{title}</Label2> : title}
                {right}
            </>
        );
    }

    return (
        <>
            <IonTitle>
                {typeof title === 'string' ? (
                    title
                ) : (
                    <MobileTitleWrapper>{title}</MobileTitleWrapper>
                )}
            </IonTitle>
            <IonButtons slot="end">{right}</IonButtons>
        </>
    );
};

const DesktopViewHeaderContentRight: FC<{ children: ReactNode; className?: string }> = ({
    children,
    className
}) => {
    const env = useAppTargetEnv();

    if (env === 'mobile') {
        return (
            <DesktopViewHeaderContentRightMobile className={className}>
                {children}
            </DesktopViewHeaderContentRightMobile>
        );
    }

    return (
        <DesktopViewHeaderContentRightDesktop className={className}>
            {children}
        </DesktopViewHeaderContentRightDesktop>
    );
};

const DesktopViewHeaderContentRightDesktop = styled.div`
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 12px;
`;

const defaultDDTop = 44;
const ddTopShift = 31;

const DesktopViewHeaderContentRightMobile: FC<PropsWithChildren<{ className?: string }>> = ({
    children,
    className
}) => {
    const iconRef = useRef<SVGSVGElement>(null);
    const [top, setTop] = useState(defaultDDTop);

    useEffect(() => {
        setTimeout(() => {
            if (iconRef.current) {
                const rect = iconRef.current.getBoundingClientRect();
                if (rect.top !== defaultDDTop - ddTopShift) {
                    setTop(rect.top + ddTopShift);
                }
            }
        }, 400);
    }, []);

    return (
        <IonButtons slot="primary" className={className}>
            <DDGlobalStyle />
            <SelectDropDown
                containerClassName="dd-select-container-header"
                top={top + 'px'}
                right="8px"
                portal
                payload={close => (
                    <DropDownContent>
                        {Children.toArray(children).map(elem => (
                            <>
                                {isValidElement<
                                    ComponentProps<typeof DesktopViewHeaderContentRightItem>
                                >(elem)
                                    ? cloneElement(elem, { _closeDropDown: close })
                                    : elem}
                                <DropDownItemsDivider />
                            </>
                        ))}
                    </DropDownContent>
                )}
            >
                <IonButton>
                    <EllipsisIcon ref={iconRef} />
                </IonButton>
            </SelectDropDown>
        </IonButtons>
    );
};

const DDGlobalStyle = createGlobalStyle`
    .dd-select-container-header {
        overflow: visible;
    }
`;

const DropDownItemStyled = styled(DropDownItem)`
    ${Body2Class};

    gap: 6px;

    &:empty {
        display: none;

        & + ${DropDownItemsDivider} {
            display: none;
        }
    }
`;

const DesktopViewHeaderContentRightItem: FC<
    PropsWithChildren<{
        className?: string;
        closeDropDownOnClick?: boolean;
        onClick?: () => void;
        asDesktopButton?: boolean;
        _closeDropDown?: () => void;
    }>
> = ({ children, className, closeDropDownOnClick, _closeDropDown, onClick, asDesktopButton }) => {
    const env = useAppTargetEnv();

    if (env === 'mobile') {
        return (
            <DropDownItemStyled
                isSelected={false}
                className={className}
                onClick={() => {
                    onClick?.();
                    if (closeDropDownOnClick) {
                        _closeDropDown?.();
                    }
                }}
            >
                {children}
            </DropDownItemStyled>
        );
    }

    return (
        <DesktopRightItem $asButton={asDesktopButton} className={className} onClick={onClick}>
            {children}
        </DesktopRightItem>
    );
};

const DesktopRightItem = styled.div<{ $asButton?: boolean }>`
    ${Body2Class};

    display: flex;
    align-items: center;
    gap: 6px;
    color: ${p => p.theme.textSecondary};

    ${p =>
        p.$asButton &&
        css`
            padding: 8px;
            cursor: pointer;
            color: ${p.theme.textAccent};

            &:last-child {
                padding-right: 16px;
            }
        `}
`;

DesktopViewHeaderContent.Right = DesktopViewHeaderContentRight;
DesktopViewHeaderContent.RightItem = DesktopViewHeaderContentRightItem;
