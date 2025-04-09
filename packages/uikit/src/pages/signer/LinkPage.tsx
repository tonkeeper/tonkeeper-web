import { useEffect } from 'react';
import { Loading } from '../../components/Loading';
import { useSearchParams } from '../../hooks/router/useSearchParams';
import { useAddSignerWallet } from '../../state/wallet';

const SignerLinkPage = () => {
    const [searchParams] = useSearchParams();
    const { mutate } = useAddSignerWallet();

    useEffect(() => {
        const publicKey = searchParams.get('pk');
        const name = searchParams.get('name');
        mutate({ publicKey, name, source: 'deeplink' });
    }, [searchParams]);

    return <Loading />;
};

export default SignerLinkPage;
