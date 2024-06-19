import { DetailedHTMLProps, FC, ImgHTMLAttributes, useState } from 'react';
import { styled } from 'styled-components';

const Fallback = styled.div`
    background-color: ${p => p.theme.backgroundContentTint};
`;

export const Image: FC<
    DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>
> = ({ className, children, ...props }) => {
    const [isError, setIsError] = useState(false);

    if (!isError) {
        return <img className={className} {...props} onError={() => setIsError(true)} />;
    }

    return children ? <>{children}</> : <Fallback className={className} />;
};
