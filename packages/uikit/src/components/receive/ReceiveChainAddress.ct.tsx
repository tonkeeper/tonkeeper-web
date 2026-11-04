import { ReceiveChainAddress } from './ReceiveChainAddress';
import { RECEIVE_CHAINS } from './receiveChains';
import { screenshotEachMode } from '../../../playwright/test';

const tonChain = RECEIVE_CHAINS.find(c => c.id === 'ton')!;
const ethChain = RECEIVE_CHAINS.find(c => c.id === 'eth')!;
const btcChain = RECEIVE_CHAINS.find(c => c.id === 'btc')!;

screenshotEachMode('ReceiveChainAddress TON', () => (
    <ReceiveChainAddress
        chain={tonChain}
        address="UQBHyu-oZVDHRYQ1-rKlGqpHy5yAqanPBirEQNMNOmfHLtaT"
    />
));

screenshotEachMode('ReceiveChainAddress Ethereum', () => (
    <ReceiveChainAddress chain={ethChain} address="0x9858EfFD232B4033E47d90003D41EC34EcaEda94" />
));

screenshotEachMode('ReceiveChainAddress Bitcoin', () => (
    <ReceiveChainAddress
        chain={btcChain}
        address="bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt0806fyu"
    />
));
