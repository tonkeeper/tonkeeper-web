import React, { DetailedHTMLProps, FC, ImgHTMLAttributes, useState } from 'react';
import { css, styled } from 'styled-components';

const Fallback = styled.div`
    background-color: ${p => p.theme.backgroundContentTint};
`;

const Img = styled.img<{ $noRadius?: boolean }>`
    ${p =>
        p.$noRadius
            ? css`
                  border-radius: 0 !important;
              `
            : ''}
`;

export const Image: FC<
    DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement> & {
        noRadius?: boolean;
    }
> = ({ className, children, noRadius, ...props }) => {
    const [isError, setIsError] = useState(false);

    if (!isError) {
        return (
            <Img
                className={className}
                $noRadius={noRadius}
                {...props}
                onError={() => setIsError(true)}
            />
        );
    }

    return children ? <>{children}</> : <Fallback className={className} />;
};
