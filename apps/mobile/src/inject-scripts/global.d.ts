export declare global {
    interface Window {
        webkit?: {
            messageHandlers?: {
                browserMessages?: {
                    postMessage: (
                        message:
                            | {
                                  type: 'url-changed';
                              }
                            | {
                                  type: 'bridge-message';
                                  queryId: string;
                                  payload: string;
                              }
                    ) => void;
                };
            };
        };
    }
}
