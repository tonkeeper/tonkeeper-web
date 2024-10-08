export function getUserOS() {
    if (navigator.userAgent.includes('Win')) {
        return 'windows';
    }
    if (navigator.userAgent.includes('Mac')) {
        return 'mac';
    }
    if (navigator.userAgent.includes('Linux')) {
        return 'linux';
    }
    if (navigator.userAgent.includes('Android')) {
        return 'android';
    }
    if (
        navigator.userAgent.includes('iPhone') ||
        navigator.userAgent.includes('iPad') ||
        navigator.userAgent.includes('iPod')
    ) {
        return 'ios';
    }

    return undefined;
}

function getClosestScrollableParent(element: HTMLElement) {
    let parent = element.parentElement;
    while (parent) {
        const overflowY = window.getComputedStyle(parent).overflowY;
        const isScrollable = overflowY !== 'visible' && overflowY !== 'hidden';

        if (isScrollable && parent.scrollHeight > parent.clientHeight) {
            return parent;
        }
        parent = parent.parentElement;
    }
    return document.documentElement; // Fallback to the document's root element
}

export function scrollToContainersBottom(element: HTMLElement) {
    const scrollableParent = getClosestScrollableParent(element);
    scrollableParent.scrollTop = scrollableParent.scrollHeight;
}

export function sendBroadcastMessage(channel: string, request: string) {
    try {
        if (typeof BroadcastChannel === 'undefined') {
            return;
        }
        const bc = new BroadcastChannel(channel);

        bc.postMessage(request);
    } catch (e) {
        console.error(e);
    }
}

let broadcastListeners: ((message: string) => void)[] = [];
const addBroadcastListener = (listener: (message: string) => void) => {
    broadcastListeners.push(listener);

    return () => {
        broadcastListeners = broadcastListeners.filter(l => l !== listener);
    };
};

const channels: Record<string, BroadcastChannel> = {};

export function listenBroadcastMessages(channel: string, onMessage: (message: string) => void) {
    try {
        if (typeof BroadcastChannel === 'undefined') {
            return;
        }
        let bc = channels[channel];
        if (!bc) {
            bc = new BroadcastChannel(channel);
            channels[channel] = bc;
            bc.onmessage = event => {
                broadcastListeners.forEach(l => l(event.data));
            };
        }

        return addBroadcastListener(onMessage);
    } catch (e) {
        console.error(e);
    }
}
