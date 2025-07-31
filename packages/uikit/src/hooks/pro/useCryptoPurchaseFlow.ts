import { IDisplayPlan } from '@tonkeeper/core/dist/entries/pro';

import { selectedTargetAuth, useCreateInvoiceMutation } from '../../state/pro';
import { useAtom } from '../../libs/useAtom';

export const useCryptoPurchaseFlow = () => {
    const [targetAuth] = useAtom(selectedTargetAuth);

    const { mutateAsync: createInvoice, isLoading: isInvoiceLoading } = useCreateInvoiceMutation();

    const startPurchasing = async (selectedPlan: IDisplayPlan, promoCode?: string) => {
        if (!targetAuth) return;

        await createInvoice({
            selectedPlan,
            promoCode
        });
    };

    return {
        startPurchasing,
        isLoading: isInvoiceLoading
    };
};
