import { useEffect, useState } from 'react';
import { ErrorOption, Path, useForm } from 'react-hook-form';

export type AsyncValidationState = 'idle' | 'validating' | 'succeed';

export function useAsyncValidator<
    N extends string,
    T extends string | number = string,
    R = unknown
>(
    methods: Pick<
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        ReturnType<typeof useForm<any>>,
        'clearErrors' | 'setError' | 'formState' | 'getFieldState' | 'watch'
    >,
    fieldName: Path<{ [key in N]: T }>,
    validator: (val: T) => Promise<ErrorOption | undefined | null | { success: true; result: R }>,
    debounceTime?: number
): [AsyncValidationState, R | undefined] {
    const finalDebounceTime = debounceTime === undefined ? 500 : debounceTime;
    const [validationState, setValidationState] = useState<'idle' | 'validating' | 'succeed'>(
        'idle'
    );
    const [validationProduct, setValidationProduct] = useState<R | undefined>(undefined);

    const { clearErrors, setError, formState, getFieldState, watch } = methods;
    const { error } = getFieldState(fieldName, formState);
    const value = watch(fieldName) as T;

    useEffect(() => {
        let shouldCancel = false;
        setValidationState('idle');
        setValidationProduct(undefined);
        const validate = async (): Promise<void> => {
            if (!error && value) {
                clearErrors(fieldName);

                await new Promise(r => setTimeout(r, finalDebounceTime));
                if (shouldCancel) {
                    return;
                }
                setValidationState('validating');
                const validationResult = await validator(value);
                if (!shouldCancel) {
                    if (!validationResult) {
                        setValidationState('succeed');
                        return;
                    }

                    if (
                        validationResult &&
                        'success' in validationResult &&
                        validationResult.success
                    ) {
                        setValidationProduct(validationResult.result);
                        setValidationState('succeed');
                    } else {
                        setError(fieldName, validationResult as ErrorOption);
                        setValidationState('idle');
                    }
                }
            }
        };

        validate();

        return () => {
            shouldCancel = true;
        };
    }, [error, value, clearErrors, setError, validator]);

    return [validationState, validationProduct];
}
