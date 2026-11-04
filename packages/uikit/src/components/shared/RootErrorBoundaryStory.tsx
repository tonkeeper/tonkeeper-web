import { FC } from 'react';

import { RootErrorBoundary } from './RootErrorBoundary';

const Throws: FC = () => {
    throw new Error('render failure');
};

export const RootErrorBoundaryStory: FC<{ fail: boolean }> = ({ fail }) => (
    <div className="h-[600px] w-[390px]">
        <RootErrorBoundary>{fail ? <Throws /> : <div>App content</div>}</RootErrorBoundary>
    </div>
);
