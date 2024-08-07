import { Route, Routes } from 'react-router-dom';
import { ImportRoute } from '../../libs/routes';
import Create from './Create';
import Import from './Import';
import { PairKeystone } from './Keystone';
import { PairLedger } from './Ledger';
import ReadOnly from './ReadOnly';
import { PairSigner } from './Signer';

const ImportRouter = () => {
    return (
        <Routes>
            <Route path={ImportRoute.create} element={<Create />} />
            <Route path={ImportRoute.import} element={<Import />} />
            <Route path={ImportRoute.signer} element={<PairSigner />} />
            <Route path={ImportRoute.keystone} element={<PairKeystone />} />
            <Route path={ImportRoute.ledger} element={<PairLedger />} />
            <Route path={ImportRoute.readOnly} element={<ReadOnly />} />
        </Routes>
    );
};

export default ImportRouter;
