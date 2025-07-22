import { atom } from '@tonkeeper/core/dist/entries/atom';
import { useLocation as useLocationRouter } from 'react-router-dom';
import { useAtomValue } from '../../libs/useAtom';

export const routerLocation$ = atom<ReturnType<typeof useLocationRouter> | null>(null);
export const useLocation = () => {
    const location = useAtomValue(routerLocation$);
    const locationRouter = useLocationRouter();

    return location || locationRouter;
};
