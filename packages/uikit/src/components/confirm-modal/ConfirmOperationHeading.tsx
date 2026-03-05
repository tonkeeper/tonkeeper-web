import { FC, ReactNode } from 'react';
import styled from 'styled-components';
import { Body1, Num2 } from '../Text';
import { Image } from '../shared/Image';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 1rem;
`;

const IconsRow = styled.div`
    display: flex;
    align-items: center;
`;

const TokenIcon = styled(Image)`
    width: 56px;
    height: 56px;
`;

const OverlappingTokenIcon = styled(TokenIcon)`
    margin-left: -8px;
    filter: drop-shadow(-3px 0 0 ${p => p.theme.backgroundPage})
        drop-shadow(0 3px 0 ${p => p.theme.backgroundPage})
        drop-shadow(0 -3px 0 ${p => p.theme.backgroundPage});
`;

const ActionLabel = styled(Body1)`
    color: ${p => p.theme.textSecondary};
    margin-top: 12px;
`;

const MainAmount = styled(Num2)<{ $color?: string }>`
    text-align: center;
    color: ${p => p.$color ?? p.theme.textPrimary};
`;

const Subtitle = styled(Body1)`
    color: ${p => p.theme.textSecondary};
`;

export const ConfirmOperationHeading: FC<{
    icons: Array<{ src: string }>;
    actionLabel: string;
    mainAmount: ReactNode;
    mainAmountColor?: string;
    subtitle: ReactNode;
}> = ({ icons, actionLabel, mainAmount, mainAmountColor, subtitle }) => {
    return (
        <Container>
            <IconsRow>
                {icons.map((icon, i) =>
                    i === 0 ? (
                        <TokenIcon key={i} src={icon.src} />
                    ) : (
                        <OverlappingTokenIcon key={i} src={icon.src} />
                    )
                )}
            </IconsRow>
            <ActionLabel>{actionLabel}</ActionLabel>
            <MainAmount $color={mainAmountColor}>{mainAmount}</MainAmount>
            <Subtitle>{subtitle}</Subtitle>
        </Container>
    );
};
