import { InnerBody } from '../../components/Body';
import { TokensHeader } from '../../components/Header';
import { JettonList } from '../../components/home/Jettons';
import { useAssets } from '../../state/home';

export const Tokens = () => {
    const [assets] = useAssets();
    return (
        <>
            <TokensHeader />
            <InnerBody>{assets && <JettonList assets={assets} />}</InnerBody>
        </>
    );
};
