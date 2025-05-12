import styled from 'styled-components';
import { duration, timingFunction } from '../transfer/common';

export const rightToLeft = 'right-to-left';
export const leftToTight = 'left-to-right';

export const SlideAnimation = styled.div`
    position: relative;

    .${rightToLeft}-exit, .${leftToTight}-exit {
        position: absolute;
        inset: 0;
        transform: translateX(0);
        opacity: 1;
    }

    .${rightToLeft}-enter {
        transform: translateX(100%);
        opacity: 0;
    }
    .${rightToLeft}-enter-active {
        transform: translateX(0);
        opacity: 1;
        transition: transform ${duration}ms ${timingFunction},
            opacity ${duration / 2}ms ${timingFunction};
    }

    .${rightToLeft}-exit-active {
        transform: translateX(-100%);
        opacity: 0;
        transition: transform ${duration}ms ${timingFunction},
            opacity ${duration / 2}ms ${timingFunction};
    }

    .${leftToTight}-enter {
        transform: translateX(-100%);
        opacity: 0;
    }
    .${leftToTight}-enter-active {
        transform: translateX(0);
        opacity: 1;
        transition: transform ${duration}ms ${timingFunction},
            opacity ${duration / 2}ms ${timingFunction};
    }

    .${leftToTight}-exit-active {
        transform: translateX(100%);
        opacity: 0;
        transition: transform ${duration}ms ${timingFunction},
            opacity ${duration / 2}ms ${timingFunction};
    }
`;
