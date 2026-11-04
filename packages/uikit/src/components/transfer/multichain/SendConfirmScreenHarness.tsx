import { FC } from 'react';

import { Button } from '../../../primitives';

/** Stable stand-in for the confirm screen's action slot in component tests. */
export const ConfirmButtonStub: FC<{ disabled?: boolean }> = ({ disabled }) => (
    <Button variant="primaryBlue" size="large" fullWidth disabled={disabled}>
        Confirm
    </Button>
);
