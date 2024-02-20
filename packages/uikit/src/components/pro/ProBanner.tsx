import { FC } from 'react';
import styled from 'styled-components';
import { Body2, Label2 } from '../Text';
import { Button } from '../fields/Button';

const ProBannerStyled = styled.div`
    background: ${p => p.theme.backgroundContent};
    border-radius: ${p => p.theme.cornerSmall};
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    padding: 1rem 14px;
    gap: 1rem;
`;

const TextContainerStyled = styled.div`
    display: flex;
    flex-direction: column;
    min-width: 300px;
`;
const ButtonsContainerStyled = styled.div`
    display: flex;
    gap: 8px;
`;

export const ProBanner: FC<{ className?: string }> = ({ className }) => {
    return (
        <ProBannerStyled className={className}>
            <TextContainerStyled>
                <Label2>Get more with Tonkeeper Pro</Label2>
                <Body2>Access advanced features and tools to boost your work.</Body2>
            </TextContainerStyled>
            <ButtonsContainerStyled>
                <Button size="small" corner="2xSmall">
                    Try Pro for Free
                </Button>
                <Button size="small" corner="2xSmall" primary>
                    Buy Pro
                </Button>
            </ButtonsContainerStyled>
        </ProBannerStyled>
    );
};
