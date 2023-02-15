import { Analytics, getAnalytics, logEvent } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import React, { useContext, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

export const useCreateAnalytics = () => {
  return useMemo(() => {
    if (
      !process.env.REACT_APP_FB_API_KEY ||
      !process.env.REACT_APP_FB_DOMAIN ||
      !process.env.REACT_APP_FB_MES_SEND_ID ||
      !process.env.REACT_APP_FB_APP_ID
    ) {
      return null;
    }
    const firebaseConfig = {
      apiKey: process.env.REACT_APP_FB_API_KEY,
      authDomain: `${process.env.REACT_APP_FB_DOMAIN}.firebaseapp.com`,
      projectId: process.env.REACT_APP_FB_DOMAIN,
      storageBucket: `${process.env.REACT_APP_FB_DOMAIN}.appspot.com`,
      messagingSenderId: process.env.REACT_APP_FB_MES_SEND_ID,
      appId: process.env.REACT_APP_FB_APP_ID,
    };

    const app = initializeApp(firebaseConfig);
    return getAnalytics(app);
  }, []);
};
export const AnalyticsContext = React.createContext<Analytics | null>(null);

export const useAnalytics = () => {
  return useContext(AnalyticsContext);
};

export const useAnalyticsScreenView = () => {
  const location = useLocation();
  const analytics = useAnalytics();
  useEffect(() => {
    if (analytics) {
      logEvent(analytics, 'screen_view');
    } else {
      console.log('screen_view');
    }
  }, [location.pathname]);
};

type AnalyticsEvent = 'screen_view' | 'session_start' | 'first_open';

export const sendAnalyticsEvent = (
  analytics: Analytics,
  eventKind: AnalyticsEvent
) => {
  logEvent(analytics, String(eventKind));
  console.log(analytics, eventKind);
};

export const useFBAnalyticsEvent = (eventKind: AnalyticsEvent) => {
  const analytics = useAnalytics();
  useEffect(() => {
    if (analytics) {
      sendAnalyticsEvent(analytics, eventKind);
    } else {
      console.log(eventKind);
    }
  }, []);
};
