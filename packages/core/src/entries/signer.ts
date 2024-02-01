import { Cell } from '@ton/core';

export type Signer = (message: Cell) => Promise<Cell>;
