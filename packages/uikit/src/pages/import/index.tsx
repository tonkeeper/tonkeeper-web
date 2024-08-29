import { Route, Routes } from 'react-router-dom';
import { ImportRoute } from '../../libs/routes';
import Create from './Create';
import Import from './Import';
import { PairKeystone } from './Keystone';
import { PairLedger } from './Ledger';
import ReadOnly from './ReadOnly';
import { PairSigner } from './Signer';
import CreateMAM from './CreateMAM';

const ImportRouter = () => {
    return (
        <Routes>
            <Route path={ImportRoute.create} element={<Create />} />
            <Route path={ImportRoute.import} element={<Import />} />
            <Route path={ImportRoute.signer} element={<PairSigner />} />
            <Route path={ImportRoute.keystone} element={<PairKeystone />} />
            <Route path={ImportRoute.ledger} element={<PairLedger />} />
            <Route path={ImportRoute.readOnly} element={<ReadOnly />} />
            <Route path={ImportRoute.mam} element={<CreateMAM />} />
        </Routes>
    );
};

export default ImportRouter;
