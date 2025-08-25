import React, { FC } from 'react';
import { AppRoute, BrowserRoute } from '../../libs/routes';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import { CategoryPage } from './CategoryPage';
import { BrowserRecommendationsPage } from './BrowserRecommendationsPage';
import { FLAGGED_FEATURE, useIsFeatureEnabled } from '../../state/tonendpoint';
import { Navigate } from '../../components/shared/Navigate';

const BrowserPage: FC = () => {
    const { path } = useRouteMatch();
    const dappsListEnabled = useIsFeatureEnabled(FLAGGED_FEATURE.DAPPS_LIST);

    if (!dappsListEnabled) {
        return <Navigate to={AppRoute.home} />;
    }

    return (
        <Switch>
            <Route path={path + `${BrowserRoute.category}/:id`} component={CategoryPage} />
            <Route path="*" component={BrowserRecommendationsPage} />
        </Switch>
    );
};

export default BrowserPage;
