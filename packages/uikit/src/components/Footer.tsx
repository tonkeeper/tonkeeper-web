import { throttle } from '@tonkeeper/core/dist/utils/common';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { useAppSdk } from '../hooks/appSdk';
import { useTranslation } from '../hooks/translation';
import { AppRoute } from '../libs/routes';
import { useIsScrollTop } from './Header';
import { Label3 } from './Text';

const WalletIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="29"
      height="28"
      viewBox="0 0 29 28"
      fill="none"
    >
      <path
        opacity="0.32"
        d="M3.75 9.4C3.75 7.15979 3.75 6.03968 4.18597 5.18404C4.56947 4.43139 5.18139 3.81947 5.93404 3.43597C6.78968 3 7.90979 3 10.15 3H16.35C18.5902 3 19.7103 3 20.566 3.43597C21.3186 3.81947 21.9305 4.43139 22.314 5.18404C22.75 6.03968 22.75 7.15979 22.75 9.4V12H3.75V9.4Z"
        fill="currentColor"
      />
      <path
        opacity="0.32"
        d="M18.75 12.5H22.75V16.5H18.75V12.5Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.18597 8.18404C3.75 9.03969 3.75 10.1598 3.75 12.4V16.6C3.75 18.8402 3.75 19.9603 4.18597 20.816C4.56947 21.5686 5.18139 22.1805 5.93404 22.564C6.78969 23 7.90979 23 10.15 23H19.35C21.5902 23 22.7103 23 23.566 22.564C24.3186 22.1805 24.9305 21.5686 25.314 20.816C25.75 19.9603 25.75 18.8402 25.75 16.6V12.4C25.75 10.1598 25.75 9.03969 25.314 8.18404C24.9305 7.43139 24.3186 6.81947 23.566 6.43597C22.7103 6 21.5902 6 19.35 6H10.15C7.90979 6 6.78969 6 5.93404 6.43597C5.18139 6.81947 4.56947 7.43139 4.18597 8.18404ZM20.5 12.75C19.5335 12.75 18.75 13.5335 18.75 14.5C18.75 15.4665 19.5335 16.25 20.5 16.25C21.4665 16.25 22.25 15.4665 22.25 14.5C22.25 13.5335 21.4665 12.75 20.5 12.75Z"
        fill="currentColor"
      />
    </svg>
  );
};

const ActivityIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="29"
      height="28"
      viewBox="0 0 29 28"
      fill="none"
    >
      <path
        opacity="0.32"
        d="M11.7694 14.6521L10.8499 21.6403C10.596 23.5702 10.469 24.5352 10.6533 25.0115C11.0322 25.9906 12.1037 26.51 13.107 26.2011C13.5952 26.0508 14.2741 25.3535 15.6321 23.9589L22.4646 16.9417C23.8441 15.5249 24.5338 14.8165 24.7122 14.2471C25.0774 13.0808 24.5459 11.8214 23.4554 11.2695C22.9231 11 21.9344 11 19.957 11H15.9335C14.9419 11 14.4461 11 14.029 11.1236C13.1874 11.3728 12.4973 11.9781 12.1404 12.7799C11.9634 13.1774 11.8988 13.6689 11.7694 14.6521Z"
        fill="currentColor"
      />
      <path
        d="M16.7305 13.3479L17.6499 6.35974C17.9039 4.42981 18.0309 3.46485 17.8465 2.98851C17.4676 2.00944 16.3962 1.48997 15.3928 1.79887C14.9047 1.94915 14.2257 2.64649 12.8678 4.04114L6.03521 11.0583C4.65575 12.4751 3.96602 13.1835 3.7877 13.7529C3.42245 14.9192 3.95398 16.1786 5.04441 16.7305C5.57677 17 6.56547 17 8.54286 17H12.5663C13.558 17 14.0538 17 14.4709 16.8765C15.3124 16.6272 16.0026 16.0219 16.3595 15.2201C16.5364 14.8227 16.6011 14.3311 16.7305 13.3479Z"
        fill="currentColor"
      />
    </svg>
  );
};

const SettingsIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="29"
      height="28"
      viewBox="0 0 29 28"
      fill="none"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.9386 3.50061L16.5641 3.50061C17.9312 3.49781 18.6147 3.49641 19.2265 3.69463C19.7678 3.87001 20.266 4.15763 20.6885 4.5387C21.166 4.9694 21.5066 5.56208 22.1877 6.74744L24.5005 10.7532C25.1864 11.9357 25.5294 12.527 25.6636 13.1559C25.7824 13.7124 25.7824 14.2876 25.6636 14.8441C25.5294 15.473 25.1864 16.0642 24.5005 17.2467L22.1877 21.2526C21.5066 22.4379 21.166 23.0306 20.6885 23.4613C20.266 23.8424 19.7678 24.13 19.2265 24.3054C18.6147 24.5036 17.9312 24.5022 16.5641 24.4994H11.9386C10.5715 24.5022 9.88798 24.5036 9.2762 24.3054C8.73492 24.13 8.23674 23.8424 7.81422 23.4613C7.33667 23.0306 6.9961 22.4379 6.31497 21.2526L4.00226 17.2468C3.31628 16.0643 2.97329 15.473 2.83907 14.8441C2.72031 14.2876 2.72031 13.7124 2.83907 13.1559C2.97329 12.527 3.31628 11.9357 4.00226 10.7532L6.31497 6.74744C6.9961 5.56208 7.33667 4.96941 7.81422 4.53871C8.23674 4.15763 8.73492 3.87001 9.2762 3.69463C9.88798 3.49641 10.5715 3.49781 11.9386 3.50061ZM14.25 18C16.4591 18 18.25 16.2091 18.25 14C18.25 11.7909 16.4591 10 14.25 10C12.0409 10 10.25 11.7909 10.25 14C10.25 16.2091 12.0409 18 14.25 18Z"
        fill="currentColor"
      />
      <path
        opacity="0.32"
        d="M18.25 14C18.25 16.2091 16.4591 18 14.25 18C12.0409 18 10.25 16.2091 10.25 14C10.25 11.7909 12.0409 10 14.25 10C16.4591 10 18.25 11.7909 18.25 14Z"
        fill="currentColor"
      />
    </svg>
  );
};

const Button = styled.div<{ active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  gap: 0.25rem;
  width: 20%;

  color: ${(props) => props.theme.tabBarInactiveIcon};

  &:hover {
    color: ${(props) => props.theme.tabBarActiveIcon};
  }

  ${(props) =>
    props.active &&
    css`
      color: ${(props) => props.theme.tabBarActiveIcon};
    `}
`;

const Block = styled.div<{ bottom: boolean; standalone: boolean }>`
  flex-shrink: 0;
  display: flex;
  justify-content: space-around;
  position: sticky;
  bottom: 0;
  padding: 1rem;

  background-color: ${(props) => props.theme.backgroundPage};

  ${(props) =>
    !props.bottom &&
    css`
      &:after {
        content: '';
        display: block;
        width: 100%;
        height: 1px;
        background: ${(props) => props.theme.separatorCommon};
        position: absolute;
        bottom: 100%;
      }
    `}

  ${(props) =>
    props.standalone &&
    css`
      padding-bottom: 2rem;
    `}

  overflow-y: hidden;

  &:before {
    content: '';
    display: block;
    width: 100%;
    height: var(--app-height);
    background: ${(props) => props.theme.backgroundPage};
    position: absolute;
    top: 100%;
  }
`;

const useIsScrollBottom = () => {
  const [isBottom, setBottom] = useState(false);
  const location = useLocation();
  const sdk = useAppSdk();

  useEffect(() => {
    const handler = throttle(() => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 3
      ) {
        setBottom(true);
      } else {
        setBottom(false);
      }
    }, 50);

    window.addEventListener('scroll', handler);

    handler();

    sdk.uiEvents.on('loading', handler);

    return () => {
      window.removeEventListener('scroll', handler);
      sdk.uiEvents.off('loading', handler);
    };
  }, [location.pathname, sdk]);

  return isBottom;
};
export const Footer = () => {
  const sdk = useAppSdk();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const bottom = useIsScrollBottom();
  const top = useIsScrollTop();

  const active = useMemo<AppRoute>(() => {
    if (location.pathname.includes(AppRoute.activity)) {
      return AppRoute.activity;
    }
    if (location.pathname.includes(AppRoute.settings)) {
      return AppRoute.settings;
    }
    return AppRoute.home;
  }, [location.pathname]);

  const standalone = useMemo(() => {
    return sdk.isIOs() && sdk.isStandalone();
  }, [sdk]);

  const scrollTop = useCallback(() => {
    window.requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
  }, []);
  return (
    <Block bottom={bottom} standalone={standalone}>
      <Button
        active={active === AppRoute.home}
        onClick={() =>
          active === AppRoute.home && !top
            ? scrollTop()
            : navigate(AppRoute.home)
        }
      >
        <WalletIcon />
        <Label3>{t('wallet_title')}</Label3>
      </Button>
      <Button
        active={active === AppRoute.activity}
        onClick={() =>
          active === AppRoute.activity && !top
            ? scrollTop()
            : navigate(AppRoute.activity)
        }
      >
        <ActivityIcon />
        <Label3>{t('Activity')}</Label3>
      </Button>
      <Button
        active={active === AppRoute.settings}
        onClick={() =>
          active === AppRoute.settings && !top
            ? scrollTop()
            : navigate(AppRoute.settings)
        }
      >
        <SettingsIcon />
        <Label3>{t('settings_title')}</Label3>
      </Button>
    </Block>
  );
};
