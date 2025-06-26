/* eslint-disable max-classes-per-file */

export class AnalyticsEventDappBrowserOpen {
    readonly name = 'dapp_browser_open';

    from!: 'wallet' | 'history' | 'deep-link' | 'story';

    type!: 'explore' | 'connected';

    location!: string;

    constructor(props: {
        /** Source from which the dapp browser was opened */
        from: 'wallet' | 'history' | 'deep-link' | 'story';
        /** Type of dapp browser session */
        type: 'explore' | 'connected';
        /** 2-letter string in ISO-3166 format */
        location: string;
    }) {
        Object.assign(this, props);
    }

    toJSON() {
        return {
            name: this.name,
            from: this.from,
            type: this.type,
            location: this.location
        };
    }

    toString() {
        return JSON.stringify(this.toJSON());
    }
}

export class AnalyticsEventDappPin {
    readonly name = 'dapp_pin';

    url!: string;

    location!: string;

    constructor(props: {
        /** URL domain only, without private information */
        url: string;
        /** 2-letter string in ISO-3166 format */
        location: string;
    }) {
        Object.assign(this, props);
    }

    toJSON() {
        return {
            name: this.name,
            url: this.url,
            location: this.location
        };
    }

    toString() {
        return JSON.stringify(this.toJSON());
    }
}

export class AnalyticsEventDappUnpin {
    readonly name = 'dapp_unpin';

    url!: string;

    location!: string;

    constructor(props: {
        /** URL domain only, without private information */
        url: string;
        /** 2-letter string in ISO-3166 format */
        location: string;
    }) {
        Object.assign(this, props);
    }

    toJSON() {
        return {
            name: this.name,
            url: this.url,
            location: this.location
        };
    }

    toString() {
        return JSON.stringify(this.toJSON());
    }
}

export class AnalyticsEventDappClick {
    readonly name = 'dapp_click';

    url!: string;

    location!: string;

    from!: 'banner' | 'browser' | 'browser_search' | 'browser_connected' | 'push' | 'sidebar';

    constructor(props: {
        /** URL domain only, without private information */
        url: string;
        /** 2-letter string in ISO-3166 format */
        location: string;
        /** Source from which the dapp was clicked */
        from: 'banner' | 'browser' | 'browser_search' | 'browser_connected' | 'push' | 'sidebar';
    }) {
        Object.assign(this, props);
    }

    toJSON() {
        return {
            name: this.name,
            url: this.url,
            location: this.location,
            from: this.from
        };
    }

    toString() {
        return JSON.stringify(this.toJSON());
    }
}

export class AnalyticsEventDappSharingCopy {
    readonly name = 'dapp_sharing_copy';

    url!: string;

    from!: 'Share' | 'Copy link';

    constructor(props: {
        /** URL domain only, without private information */
        url: string;
        /** Source of the sharing action */
        from: 'Share' | 'Copy link';
    }) {
        Object.assign(this, props);
    }

    toJSON() {
        return {
            name: this.name,
            url: this.url,
            from: this.from
        };
    }

    toString() {
        return JSON.stringify(this.toJSON());
    }
}
