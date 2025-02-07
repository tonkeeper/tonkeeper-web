import styled, { css } from 'styled-components';
import React, {
    createContext,
    FC,
    forwardRef,
    PropsWithChildren,
    ReactNode,
    useCallback,
    useContext,
    useId
} from 'react';
import { useAppSdk, useAppTargetEnv } from '../../hooks/appSdk';
import { useNativeBackButton } from '../BackButton';
import { ArrowLeftIcon } from '../Icon';
import { IconButton } from '../fields/IconButton';
import { useNavigate } from '../../hooks/router/useNavigate';
import {
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar
} from '@ionic/react';
import ReactPortal from '../ReactPortal';
import { Label2 } from '../Text';

const DesktopViewPageLayoutSimple = styled.div<{ borderBottom?: boolean }>`
    overflow: auto;
`;

const DesktopViewPageLayoutSimpleIonic = styled.div<{ borderBottom?: boolean }>`
    overflow: auto;
    height: 100%;
`;

const DesktopViewPageLayoutContext = createContext<string | undefined>(undefined);

export const DesktopViewPageLayout = forwardRef<
    HTMLDivElement,
    PropsWithChildren<{ className?: string }>
>(({ children, className }, ref) => {
    const platform = useAppTargetEnv();
    const id = useId();

    if (platform === 'mobile') {
        return (
            <DesktopViewPageLayoutContext.Provider value={id}>
                <IonPage id={id}>
                    <IonContent>
                        <DesktopViewPageLayoutSimpleIonic ref={ref} className={className}>
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
    padding: 1rem 1rem 1rem ${props => (props.withBackButton ? '0' : '1rem')};
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
            <ReactPortal wrapperId={portalId}>
                <IonHeader>
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

export const DesktopViewHeaderContent: FC<{ title: string; right?: ReactNode }> = ({
    title,
    right
}) => {
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
