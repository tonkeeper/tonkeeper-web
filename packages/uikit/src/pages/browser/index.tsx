import React, { FC } from 'react';
import { BrowserRoute } from '../../libs/routes';
import { Route, Routes } from 'react-router-dom';
import { CategoryPage } from './CategoryPage';
import { BrowserRecommendationsPage } from './BrowserRecommendationsPage';

const BrowserPage: FC = () => {
    return (
        <Routes>
            <Route path={BrowserRoute.category + '/:id'} element={<CategoryPage />} />
            <Route path="*" element={<BrowserRecommendationsPage />} />
        </Routes>
    );
};

export default BrowserPage;
