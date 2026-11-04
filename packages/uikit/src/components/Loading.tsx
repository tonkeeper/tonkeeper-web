import React from 'react';
import LottieReact from 'lottie-react';
import animationData from './lottie/KeeperLogo.json';
import { StartScreenView } from '../pages/import/StartScreenView';

/**
 * Boot splash, also the hand-over from the shell's own native splash. Renders
 * the start screen's column with the content hidden, so the animated mark
 * plays at exactly the size and position the start screen draws its static
 * logo — when loading ends the mark stays in place and the rest of the screen
 * appears around it. The wrapper mirrors `AppLayout`'s `bare` branch for the
 * same reason.
 *
 * The Lottie canvas has padding around the mark (it spans 41.46px of the 56px
 * canvas, slightly above the middle), while `IcLogo` bleeds to the edges of
 * its box — so the player is oversized and offset inside the 108px logo slot
 * to render the mark at the static logo's exact bounds. The offsets are
 * measured against the rendered SVGs, not derived from the files.
 */
export const Loading = React.forwardRef<HTMLDivElement>(({}, ref) => {
    return (
        <div
            ref={ref}
            className="box-border flex min-h-[var(--app-height,100vh)] w-full flex-col items-center justify-center bg-backgroundPage"
        >
            <StartScreenView
                contentHidden
                logo={
                    <LottieReact
                        animationData={animationData}
                        loop
                        autoplay
                        className="absolute left-[-18.94px] top-[-18.51px] size-[145.88px] [&_path]:fill-current"
                    />
                }
            />
        </div>
    );
});
