/* eslint-disable i18next/no-literal-string -- error-boundary fallback may render before locales load */
export function fallbackRenderOver(location: string) {
    return ({ error }: { error: Error }) => {
        return (
            <div role="alert">
                <p>{location}</p>
                <p>Something went wrong:</p>
                <pre style={{ color: 'red' }}>{error.message}</pre>
            </div>
        );
    };
}
