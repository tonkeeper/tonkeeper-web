/* eslint-disable max-classes-per-file */

export class AnalyticsEventTcRequest {
    readonly name = 'tc_request';

    dapp_url!: string;

    constructor(props: { dapp_url: string }) {
        Object.assign(this, props);
    }

    toJSON() {
        return {
            name: this.name,
            dapp_url: this.dapp_url
        };
    }

    toString() {
        return JSON.stringify(this.toJSON());
    }
}

export class AnalyticsEventTcConnect {
    readonly name = 'tc_connect';

    dapp_url!: string;

    allow_notifications!: boolean;

    constructor(props: { dapp_url: string; allow_notifications: boolean }) {
        Object.assign(this, props);
    }

    toJSON() {
        return {
            name: this.name,
            dapp_url: this.dapp_url,
            allow_notifications: this.allow_notifications
        };
    }

    toString() {
        return JSON.stringify(this.toJSON());
    }
}

export class AnalyticsEventTcViewConfirm {
    readonly name = 'tc_view_confirm';

    dapp_url!: string;

    address_type!: 'raw' | 'bounce' | 'non-bounce';

    constructor(props: { dapp_url: string; address_type: 'raw' | 'bounce' | 'non-bounce' }) {
        Object.assign(this, props);
    }

    toJSON() {
        return {
            name: this.name,
            dapp_url: this.dapp_url,
            address_type: this.address_type
        };
    }

    toString() {
        return JSON.stringify(this.toJSON());
    }
}

export class AnalyticsEventTcSendSuccess {
    readonly name = 'tc_send_success';

    dapp_url!: string;

    address_type!: 'raw' | 'bounce' | 'non-bounce';

    network_fee_paid!: 'ton' | 'gasless' | 'battery';

    constructor(props: {
        dapp_url: string;
        address_type: 'raw' | 'bounce' | 'non-bounce';
        network_fee_paid: 'ton' | 'gasless' | 'battery';
    }) {
        Object.assign(this, props);
    }

    toJSON() {
        return {
            name: this.name,
            dapp_url: this.dapp_url,
            address_type: this.address_type,
            network_fee_paid: this.network_fee_paid
        };
    }

    toString() {
        return JSON.stringify(this.toJSON());
    }
}
