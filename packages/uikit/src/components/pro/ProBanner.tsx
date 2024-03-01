import { FC } from 'react';
import styled from 'styled-components';
import { Body2, Label2 } from '../Text';
import { Button } from '../fields/Button';
import { useActivateTrialMutation, useProState } from '../../state/pro';
import { useDateTimeFormat } from '../../hooks/useDateTimeFormat';
import { ProNotification } from './ProNotification';
import { useDisclosure } from '../../hooks/useDisclosure';

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
    const formatDate = useDateTimeFormat();
    const { mutate } = useActivateTrialMutation();
    const { data } = useProState();
    const { isOpen, onOpen, onClose } = useDisclosure();

    if (!data) {
        return null;
    }

    const {
        subscription: { is_trial, used_trial, valid, next_charge }
    } = data;

    if (valid) {
        return null;
    }

    return (
        <ProBannerStyled className={className}>
            <TextContainerStyled>
                <Label2>Get more with Tonkeeper Pro</Label2>
                <Body2>Access advanced features and tools to boost your work.</Body2>
            </TextContainerStyled>
            <ButtonsContainerStyled>
                {is_trial ? (
                    <Label2>
                        {next_charge &&
                            formatDate(next_charge, {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                inputUnit: 'seconds'
                            })}
                    </Label2>
                ) : (
                    !used_trial && (
                        <Button size="small" corner="2xSmall" onClick={() => mutate()}>
                            Try Pro for Free
                        </Button>
                    )
                )}

                <Button size="small" corner="2xSmall" primary onClick={onOpen}>
                    Buy Pro
                </Button>
            </ButtonsContainerStyled>
            <ProNotification isOpen={isOpen} onClose={onClose} />
        </ProBannerStyled>
    );
};
