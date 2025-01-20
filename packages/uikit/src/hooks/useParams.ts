import { useParams as useParamsRouter } from 'react-router-dom';

export const useParams = () => {
    const params = useParamsRouter();
    return Object.fromEntries(
        Object.entries(params).map(([k, v]) => [k, decodeURIComponent(v as string)])
    );
};
