import { JettonVerificationType } from '@tonkeeper/core/dist/tonApiV2';
import React, { FC } from 'react';
import styled, { css } from 'styled-components';
import { useTranslation } from '../../hooks/translation';
import { TokenRate } from '../../state/rates';
import { Body2, Label1, Label4 } from '../Text';

export const ListItemPayload = styled.div`
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1rem 1rem 0;
    box-sizing: border-box;
    gap: 1rem;
    width: 100%;
`;

export const TokenLogo = styled.img`
    width: 44px;
    height: 44px;
    border-radius: ${props => props.theme.cornerFull};

    pointer-events: none;
`;

const Description = styled.div`
    flex-grow: 1;

    display: flex;
    flex-direction: column;

    white-space: nowrap;
`;

const FirstLine = styled.div`
    display: grid;
    grid-template-columns: auto 1fr 0fr;
    gap: 0.25rem;
    width: 100%;
`;

const CoinName = styled(Label1)`
    text-overflow: ellipsis;
    overflow: hidden;

    display: flex;
    align-items: center;
`;

const CoinLabel = styled(Label4)`
    display: inline-block;
    margin-left: 8px;
    padding: 3px 4px;
    border-radius: ${props => props.theme.corner3xSmall};
    background: ${props => props.theme.backgroundContentTint};
    color: ${props => props.theme.textSecondary};
`;

const SecondLine = styled.div`
    display: flex;
    justify-content: space-between;
`;

const Secondary = styled(Body2)`
    color: ${props => props.theme.textSecondary};
`;

const Symbol = styled(Label1)`
    color: ${props => props.theme.textSecondary};
`;

const Unverified = styled.span`
    color: ${props => props.theme.accentOrange};
`;

export const TokenLayout: FC<{
    name: string;
    symbol?: string;
    balance: string;
    secondary: React.ReactNode;
    fiatAmount?: string;
    label?: string;
    rate: TokenRate | undefined;
    verification?: JettonVerificationType;
}> = ({ name, symbol, balance, secondary, fiatAmount, label, rate, verification }) => {
    const { t } = useTranslation();

    return (
        <Description>
            <FirstLine>
                <CoinName>
                    {symbol ?? name}
                    {label ? <CoinLabel>{label}</CoinLabel> : null}
                </CoinName>
                <Symbol></Symbol>
                <Label1>{balance}</Label1>
            </FirstLine>
            <SecondLine>
                <Secondary>
                    {verification === 'none' ? (
                        <Unverified>{t('approval_unverified_token')}</Unverified>
                    ) : (
                        <>
                            {secondary} <Delta data={rate} />
                        </>
                    )}
                </Secondary>
                <Secondary>{fiatAmount}</Secondary>
            </SecondLine>
        </Description>
    );
};

const DeltaColor = styled.span<{ positive: boolean }>`
  margin-left: 0.5rem;
  opacity: 0.64;

  ${props =>
      props.positive
          ? css`
                color: ${props.theme.accentGreen};
            `
          : css`
                color: ${props.theme.accentRed};
            `}}
`;

const Delta: FC<{ data: TokenRate | undefined }> = ({ data }) => {
    if (!data || !data.diff24h || data.diff24h == '0.00%') return null;
    const positive = data.diff24h.startsWith('+');
    return <DeltaColor positive={positive}>{data.diff24h}</DeltaColor>;
};
