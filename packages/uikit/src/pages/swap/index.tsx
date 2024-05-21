import { styled } from 'styled-components';
import { SwapMainForm } from '../../components/swap/SwapMainForm';
import { RefreshIcon, SlidersIcon } from '../../components/Icon';
import { IconButton } from '../../components/fields/IconButton';
import { Label2 } from '../../components/Text';
import { DesktopViewHeader } from '../../components/desktop/DesktopViewLayout';

/*const SwapPage = () => {
    // const from = 'TON';
    const from = Address.parse('EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs'); // USDT
    // const to = Address.parse('EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs'); // USDT
   // const to = Address.parse('EQDv-yr41_CZ2urg2gfegVfa44PDPjIK9F-MilEDKDUIhlwZ'); // ANON
    const to = 'TON';
    const value = 10000;
    const { mutate, fetchedSwaps } = useCalculateSwap();
    const { data: encoded, mutate: encode } = useExecuteSwap();

    const [modalParams, setModalParams] = useState<TonConnectTransactionPayload | null>(null);

    useEffect(() => {
        if (encoded) {
            setModalParams({
                valid_until: (Date.now() + 10 * 60 * 1000) / 1000,
                messages: [
                    {
                        address: Address.parse(encoded.to).toString({ bounceable: true }),
                        amount: encoded.value,
                        payload: encoded.body
                    }
                ]
            });
        }
    }, [encoded]);

    useEffect(() => {
        mutate({ fromAddress: from, toAddress: to, amountWei: value.toString() });
    }, []);

    const onClose = () => {
        setModalParams(null);
    };

    return (
        <>
            <Button
                onClick={() =>
                    mutate({ fromAddress: from, toAddress: to, amountWei: value.toString() })
                }
            >
                Recalculate
            </Button>
            <br />
            <br />
            <br />
            <div>
                {swapProviders.map(p => {
                    const swap = fetchedSwaps.find(item => item.provider === p);
                    return (
                        <Fragment key={p}>
                            {!!swap &&
                                (swap.trade ? (
                                    <div>
                                        Swap {swap.trade.from.toStringAssetRelativeAmount(5)} to{' '}
                                        {swap.trade.to.toStringAssetRelativeAmount(5)}
                                    </div>
                                ) : (
                                    <div>Trading is not available</div>
                                ))}
                            <Button
                                onClick={() =>
                                    encode(fetchedSwaps.find(item => item.provider === p)!)
                                }
                                loading={!fetchedSwaps.some(item => item.provider === p)}
                            >
                                Swap {p}
                            </Button>
                            <br />
                        </Fragment>
                    );
                })}
            </div>
            <TonTransactionNotification handleClose={onClose} params={modalParams} />
        </>
    );
};

export default SwapPage;*/

const SwapPageWrapper = styled.div`
    overflow-y: auto;
`;

const HeaderButtons = styled.div`
    margin-left: auto;
    display: flex;

    > * {
        color: ${p => p.theme.iconSecondary};
        padding: 10px;
    }
`;

const ContentWrapper = styled.div`
    padding: 0 1rem;
`;

const SwapPage = () => {
    return (
        <SwapPageWrapper>
            <DesktopViewHeader backButton={false}>
                <Label2>Swap</Label2>
                <HeaderButtons>
                    <IconButton transparent>
                        <RefreshIcon />
                    </IconButton>
                    <IconButton transparent>
                        <SlidersIcon />
                    </IconButton>
                </HeaderButtons>
            </DesktopViewHeader>
            <ContentWrapper>
                <SwapMainForm />
            </ContentWrapper>
        </SwapPageWrapper>
    );
};

export default SwapPage;
