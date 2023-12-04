import { AuthState } from '@tonkeeper/core/dist/entries/password';
import React, { FC } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ImportRoute } from '../../libs/routes';
import Create from './Create';
import Import from './Import';

const ImportRouter: FC<{ listOfAuth: AuthState['kind'][] }> = ({ listOfAuth }) => {
    return (
        <Routes>
            <Route path={ImportRoute.create} element={<Create listOfAuth={listOfAuth} />} />
            <Route path={ImportRoute.import} element={<Import listOfAuth={listOfAuth} />} />
        </Routes>
    );
};

export default ImportRouter;
