import React, { FC } from 'react';
import { Route, Routes } from 'react-router-dom';
import { BrowserRoute } from '../../libs/routes';
import { CategoryPage } from '../../pages/browser/CategoryPage';
import { DesktopBrowserRecommendationsPage } from './DesktopBrowserRecommendationsPage';

const DesktopBrowser: FC = () => {
    return (
        <Routes>
            <Route path={BrowserRoute.category + '/:id'} element={<CategoryPage />} />
            <Route path="*" element={<DesktopBrowserRecommendationsPage />} />
        </Routes>
    );
};

export default DesktopBrowser;
