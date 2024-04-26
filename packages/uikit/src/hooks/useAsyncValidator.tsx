import {
    createContext,
    FC,
    PropsWithChildren,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState
} from 'react';
import { ErrorOption, Path, useForm } from 'react-hook-form';

export type AsyncValidationState = 'idle' | 'validating' | 'succeed';
const AsyncValidatorContext = createContext<null | {
    fieldValidationState: Record<string, AsyncValidationState>;
    setFieldValidationState: (fieldName: string, state: AsyncValidationState) => void;
}>(null);

export const AsyncValidatorsStateProvider: FC<PropsWithChildren> = ({ children }) => {
    const [fieldValidationState, _setFieldValidationState] = useState<
        Record<string, AsyncValidationState>
    >({});

    const setFieldValidationState = useCallback(
        (fieldName: string, state: AsyncValidationState) => {
            _setFieldValidationState(s => ({ ...s, [fieldName]: state }));
        },
        []
    );

    return (
        <AsyncValidatorContext.Provider value={{ fieldValidationState, setFieldValidationState }}>
            {children}
        </AsyncValidatorContext.Provider>
    );
};

export const useAsyncValidationState = () => {
    const context = useContext(AsyncValidatorContext);

    const formState = useMemo(() => {
        if (!context?.fieldValidationState) {
            return 'idle';
        }

        if (Object.values(context.fieldValidationState).some(s => s === 'validating')) {
            return 'validating';
        }

        return 'idle';
    }, [context?.fieldValidationState]);

    return { formState, fieldValidationState: context?.fieldValidationState || {} };
};

export function useAsyncValidator<
    N extends string,
    T extends string | number = string,
    R = unknown
>(
    methods: Pick<
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        ReturnType<typeof useForm<any>>,
        'clearErrors' | 'setError'
    >,
    fieldValue: T,
    fieldName: Path<{ [key in N]: T }>,
    validator: (val: T) => Promise<ErrorOption | undefined | null | { success: true; result: R }>,
    debounceTime?: number
): [AsyncValidationState, R | undefined] {
    const context = useContext(AsyncValidatorContext);
    const finalDebounceTime = debounceTime === undefined ? 500 : debounceTime;
    const [validationState, setValidationState] = useState<'idle' | 'validating' | 'succeed'>(
        'idle'
    );
    const [validationProduct, setValidationProduct] = useState<R | undefined>(undefined);

    const { clearErrors, setError } = methods;

    useEffect(() => {
        let shouldCancel = false;
        setValidationState('idle');
        context?.setFieldValidationState(fieldName, 'idle');
        setValidationProduct(undefined);
        const validate = async (): Promise<void> => {
            if (fieldValue) {
                clearErrors(fieldName);

                await new Promise(r => setTimeout(r, finalDebounceTime));
                if (shouldCancel) {
                    return;
                }
                setValidationState('validating');
                context?.setFieldValidationState(fieldName, 'validating');
                const validationResult = await validator(fieldValue);
                if (!shouldCancel) {
                    if (!validationResult) {
                        setValidationState('succeed');
                        context?.setFieldValidationState(fieldName, 'succeed');
                        return;
                    }

                    if (
                        validationResult &&
                        'success' in validationResult &&
                        validationResult.success
                    ) {
                        setValidationProduct(validationResult.result);
                        setValidationState('succeed');
                        context?.setFieldValidationState(fieldName, 'succeed');
                    } else {
                        setError(fieldName, validationResult as ErrorOption);
                        setValidationState('idle');
                        context?.setFieldValidationState(fieldName, 'idle');
                    }
                }
            }
        };

        validate();

        return () => {
            shouldCancel = true;
        };
    }, [fieldValue, clearErrors, setError, validator, context?.setFieldValidationState]);

    return [validationState, validationProduct];
}
