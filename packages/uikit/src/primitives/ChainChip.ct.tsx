import { ChainChip } from './ChainChip';
import { screenshot } from '../../playwright/test';

screenshot('ChainChip BSC', () => <ChainChip label="BNB Smart Chain" />);
screenshot('ChainChip TRON', () => <ChainChip label="TRON" />);
screenshot('ChainChip ETHEREUM', () => <ChainChip label="Ethereum" />);
screenshot('ChainChip BASE', () => <ChainChip label="Base" />);
