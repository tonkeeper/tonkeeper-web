import React, { Component } from 'react';
import { Location, useLocation } from 'react-router-dom';

type ScrollProps = {
    location: Location;
};

function withRouter(Comp: React.ComponentClass<ScrollProps>) {
    function ComponentWithRouterProp() {
        const location = useLocation();
        return <Comp location={location} />;
    }
    return ComponentWithRouterProp;
}

const getScrollPage = (): number => {
    const body = document.getElementById('body');
    if (body) {
        return body.scrollTop;
    }
    let docScrollTop = 0;
    if (document.documentElement && document.documentElement !== null) {
        docScrollTop = document.documentElement.scrollTop;
    }
    return window.pageYOffset || docScrollTop;
};

const scrollTo = (scrollnumber = 0): number => {
    return window.requestAnimationFrame(() => {
        const body = document.getElementById('body');
        if (body) {
            body.scrollTo(0, scrollnumber);
        } else {
            window.scrollTo(0, scrollnumber);
        }
    });
};

class ScrollMemory extends Component<ScrollProps> {
    url: Map<string, number>;

    constructor(props: ScrollProps) {
        super(props);
        this.url = new Map();
    }

    shouldComponentUpdate(nextProps: ScrollProps): boolean {
        const { location } = this.props;

        const actual = location;
        const next = nextProps.location;

        const locationChanged = next.pathname !== actual.pathname;

        if (locationChanged) {
            const scroll = getScrollPage();
            this.url.set(actual.pathname, scroll);

            const nextScroll = this.url.get(next.pathname);
            scrollTo(nextScroll ?? 0);
        }
        return false;
    }

    render() {
        return null;
    }
}

export default withRouter(ScrollMemory);
