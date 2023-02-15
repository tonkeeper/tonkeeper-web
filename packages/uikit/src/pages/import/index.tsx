import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { ImportRoute } from '../../libs/routes';
import { Create } from './Create';
import { Import } from './Import';
import { FinalView } from './Password';

const ImportRouter = () => {
  return (
    <Routes>
      <Route path={ImportRoute.create} element={<Create />} />
      <Route path={ImportRoute.import} element={<Import />} />
      {/* Just for test: TODO: remove */}
      <Route path="/final" element={<FinalView />} />
    </Routes>
  );
};

export default ImportRouter;
