import { css, styled } from 'styled-components';
import { FC, PropsWithChildren, useEffect, useRef, useState } from 'react';

const AccordionContent = styled.div<{ $transitionMS: number }>`
    transform: translateY(-100%);
    visibility: hidden;
    transition: transform ${p => p.$transitionMS}ms ease-in-out,
        visibility ${p => p.$transitionMS}ms ease-in-out;
`;

const AccordionAnimation = styled.div<{
    $isOpened: boolean;
    $animationCompleted: boolean;
    $transitionMS: number;
}>`
    display: grid;
    grid-template-rows: ${p => (p.$isOpened ? '1fr' : '0fr')};
    overflow: ${p => (p.$animationCompleted && p.$isOpened ? 'visible' : 'hidden')};
    transition: grid-template-rows ${p => p.$transitionMS}ms ease-in-out;

    ${AccordionContent} {
        ${p =>
            p.$isOpened &&
            css`
                transform: translateY(0);
                visibility: visible;
            `}
    }
`;

const AccordionBody = styled.div`
    min-height: 0;
    min-width: 0;
`;

export const Accordion: FC<PropsWithChildren<{ isOpened: boolean; transitionMS?: number }>> = ({
    children,
    isOpened,
    transitionMS = 200
}) => {
    const [isAnimationCompleted, setIsAnimationCompleted] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        clearTimeout(timeoutRef.current);
        if (isOpened) {
            setIsAnimationCompleted(false);
        } else {
            timeoutRef.current = setTimeout(() => setIsAnimationCompleted(true), 200);
        }
    }, [isOpened]);

    return (
        <AccordionAnimation
            $animationCompleted={isAnimationCompleted}
            $isOpened={isOpened}
            $transitionMS={transitionMS}
        >
            <AccordionBody>
                <AccordionContent $transitionMS={transitionMS}>{children}</AccordionContent>
            </AccordionBody>
        </AccordionAnimation>
    );
};
