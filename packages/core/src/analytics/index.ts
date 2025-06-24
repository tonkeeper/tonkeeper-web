import {
    AnalyticsEventDappBrowserOpen,
    AnalyticsEventDappPin,
    AnalyticsEventDappUnpin,
    AnalyticsEventDappClick,
    AnalyticsEventDappSharingCopy
} from './dapp-browser.schema';

import {
    AnalyticsEventTcRequest,
    AnalyticsEventTcConnect,
    AnalyticsEventTcViewConfirm,
    AnalyticsEventTcSendSuccess,
    AnalyticsEventTcSignDataSuccess
} from './ton-connect.schema';

export {
    AnalyticsEventDappBrowserOpen,
    AnalyticsEventDappPin,
    AnalyticsEventDappUnpin,
    AnalyticsEventDappClick,
    AnalyticsEventDappSharingCopy,
    AnalyticsEventTcRequest,
    AnalyticsEventTcConnect,
    AnalyticsEventTcViewConfirm,
    AnalyticsEventTcSendSuccess,
    AnalyticsEventTcSignDataSuccess
};

export type AnalyticsEvent =
    | AnalyticsEventDappBrowserOpen
    | AnalyticsEventDappPin
    | AnalyticsEventDappUnpin
    | AnalyticsEventDappClick
    | AnalyticsEventDappSharingCopy
    | AnalyticsEventTcRequest
    | AnalyticsEventTcConnect
    | AnalyticsEventTcViewConfirm
    | AnalyticsEventTcSendSuccess
    | AnalyticsEventTcSignDataSuccess;
