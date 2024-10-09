import { Cell } from '@ton/core';
import { sign } from '@ton/crypto';

export const estimationSigner = async (message: Cell): Promise<Buffer> => {
    return sign(message.hash(), Buffer.alloc(64));
};
estimationSigner.type = 'cell' as const;
