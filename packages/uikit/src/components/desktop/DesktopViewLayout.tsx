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
    useId,
    useLayoutEffect,
    useRef
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
    IonPopover,
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
        height: 82px;
        background: transparent;
    }
`;

const DesktopViewPageLayoutContext = createContext<string | undefined>(undefined);

export const DesktopViewPageLayout = forwardRef<
    HTMLDivElement,
    PropsWithChildren<{ className?: string; mobileContentPaddingTop?: boolean }>
>(({ children, className, mobileContentPaddingTop }, ref) => {
    const platform = useAppTargetEnv();
    const id = useId();

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
    }, []);

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

export const DesktopViewHeader: FC<{
    children: ReactNode;
    backButton?: boolean | ReactNode;
    className?: string;
    borderBottom?: boolean;
}> = ({ children, backButton, borderBottom, className }) => {
    const portalId = useContext(DesktopViewPageLayoutContext);

    if (portalId !== undefined) {
        return (
            <ReactPortal wrapperId={portalId} position="first">
                <IonHeader translucent={true}>
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonBackButton />
                        </IonButtons>
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

export const DesktopViewHeaderContent: FC<{ title: string; right?: ReactNode }> & {
    Right: typeof DesktopViewHeaderContentRight;
    RightItem: typeof DesktopViewHeaderContentRightItem;
} = ({ title, right }) => {
    const env = useAppTargetEnv();

    if (env !== 'mobile') {
        return (
            <>
                <Label2>{title}</Label2>
                {right}
            </>
        );
    }

    return (
        <>
            <IonTitle>{title}</IonTitle>
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

const DesktopViewHeaderContentRightMobile: FC<PropsWithChildren<{ className?: string }>> = ({
    children,
    className
}) => {
    const triggerId = useId();
    return (
        <IonButtons slot="primary" className={className}>
            <IonButton>
                <DDGlobalStyle />
                <SelectDropDown
                    containerClassName="dd-select-container-header"
                    top="44px"
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
                    <EllipsisIcon />
                </SelectDropDown>
            </IonButton>
            <IonPopover trigger={triggerId} side="top" alignment="center">
                <IonContent class="ion-padding">Hello World!</IonContent>
            </IonPopover>
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
