import React, {
  FC,
  PropsWithChildren,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { CSSTransition } from 'react-transition-group';
import styled, { css } from 'styled-components';
import { useAppSdk } from '../hooks/appSdk';
import { Container } from '../styles/globalStyle';
import { BackButton } from './fields/BackButton';
import { CloseIcon } from './Icon';
import { Gap } from './Layout';
import ReactPortal from './ReactPortal';
import { H2, H3 } from './Text';

const NotificationContainer = styled(Container)<{ scrollbarWidth: number }>`
  background: transparent;
  padding-left: ${(props) => props.scrollbarWidth}px;
`;

const NotificationWrapper: FC<PropsWithChildren<{ entered: boolean }>> = ({
  children,
  entered,
}) => {
  const sdk = useAppSdk();

  const scrollbarWidth = useMemo(() => {
    return sdk.getScrollbarWidth();
  }, [sdk, entered]);

  return (
    <NotificationContainer scrollbarWidth={scrollbarWidth}>
      {children}
    </NotificationContainer>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: var(--app-height);
`;

export const ButtonContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: end;
`;

const Padding = styled.div`
  flex-shrink: 0;
  height: 2rem;
`;

const Overlay = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  height: 100%;
  top: 100%;
  transition: all 0.3s ease-in-out;
  overflow: hidden;
`;

const Splash = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease-in-out;
  overflow: hidden;
  z-index: 10;
  padding: 0;
  opacity: 0;
  pointer-events: none;

  &.enter-done {
    opacity: 1;
    pointer-events: auto;
  }
  &.enter-done ${Overlay} {
    top: 0;
    pointer-events: auto;
    overflow-y: scroll;
  }

  &.exit {
    opacity: 0;
  }
  &.exit ${Overlay} {
    top: 100%;
  }
`;

const Content = styled.div<{ standalone: boolean }>`
  width: 100%;
  background-color: ${(props) => props.theme.backgroundPage};
  border-top-right-radius: ${(props) => props.theme.cornerMedium};
  border-top-left-radius: ${(props) => props.theme.cornerMedium};
  padding: 1rem;
  flex-shrink: 0;
  box-sizing: border-box;

  ${(props) =>
    props.standalone &&
    css`
      padding-bottom: 2rem;
    `}
`;

const TitleRow = styled.div`
  display: flex;
  gap: 1;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  user-select: none;
`;

const RowTitle = styled(H3)`
  margin: 0;
  user-select: none;
`;

export const NotificationTitleRow: FC<
  PropsWithChildren<{ handleClose: () => void }>
> = ({ handleClose, children }) => {
  return (
    <TitleRow>
      <RowTitle>{children}</RowTitle>
      <NotificationCancelButton handleClose={handleClose} />
    </TitleRow>
  );
};

export const NotificationTitle = styled(H2)`
  padding-right: 2rem;
  box-sizing: border-box;
`;

export const NotificationBlock = styled.form`
  display: flex;
  gap: 1rem;
  flex-direction: column;
  align-items: center;
`;

export const FullHeightBlock = styled(NotificationBlock)`
  min-height: calc(100vh - 3rem);
  padding-bottom: calc(56px + 1rem);
  box-sizing: border-box;
`;

export const NotificationTitleBlock = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  gap: 1rem;
`;

export const NotificationCancelButton: FC<{ handleClose: () => void }> = ({
  handleClose,
}) => {
  return (
    <BackButton onClick={handleClose}>
      <CloseIcon />
    </BackButton>
  );
};

export const Notification: FC<{
  isOpen: boolean;
  handleClose: () => void;
  hideButton?: boolean;
  title?: string;
  children: (afterClose: (action?: () => void) => void) => React.ReactNode;
}> = React.memo(({ children, isOpen, hideButton, handleClose, title }) => {
  const [entered, setEntered] = useState(false);

  const sdk = useAppSdk();
  const nodeRef = useRef(null);
  useEffect(() => {
    const closeOnEscapeKey = (e: KeyboardEvent) =>
      e.key === 'Escape' ? handleClose() : null;
    document.body.addEventListener('keydown', closeOnEscapeKey);
    return () => {
      document.body.removeEventListener('keydown', closeOnEscapeKey);
    };
  }, [handleClose]);

  const Child = useMemo(() => {
    if (!isOpen) return undefined;
    return children((afterClose?: () => void) => {
      setTimeout(() => afterClose && afterClose(), 300);
      handleClose();
    });
  }, [isOpen, children, handleClose]);

  useEffect(() => {
    if (isOpen) {
      sdk.disableScroll();
    } else {
      sdk.enableScroll();
    }
    return () => {
      sdk.enableScroll();
    };
  }, [isOpen, sdk]);

  const standalone = useMemo(() => {
    return sdk.isIOs() && sdk.isStandalone();
  }, [sdk]);

  return (
    <ReactPortal wrapperId="react-portal-modal-container">
      <CSSTransition
        in={isOpen}
        timeout={{ enter: 0, exit: 300 }}
        unmountOnExit
        nodeRef={nodeRef}
        onEntered={() => setEntered(true)}
        onExited={() => setEntered(false)}
      >
        <Splash ref={nodeRef}>
          <Overlay>
            <NotificationWrapper entered={entered}>
              <Wrapper>
                <Padding onClick={handleClose} />
                <Gap onClick={handleClose} />
                <Content standalone={standalone}>
                  {title && (
                    <NotificationTitleRow handleClose={handleClose}>
                      {title}
                    </NotificationTitleRow>
                  )}
                  {!hideButton && (
                    <ButtonContainer>
                      <NotificationCancelButton handleClose={handleClose} />
                    </ButtonContainer>
                  )}
                  {Child}
                </Content>
              </Wrapper>
            </NotificationWrapper>
          </Overlay>
        </Splash>
      </CSSTransition>
    </ReactPortal>
  );
});
