import { useSearchParams } from 'react-router-dom';

const SignerPublishPage = () => {
    let [searchParams] = useSearchParams();

    return <>Publish: {searchParams.get('boc')}</>;
};

export default SignerPublishPage;
