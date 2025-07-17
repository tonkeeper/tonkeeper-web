import { FC } from 'react';
import { styled } from 'styled-components';

import { Body2, Label1 } from '../Text';
import { useTranslation } from '../../hooks/translation';

const Subtitle = styled(Body2)`
    display: block;
    max-width: 576px;
    text-wrap: pretty;
    color: ${p => p.theme.textSecondary};
`;

interface IProps {
    titleKey?: string;
    className?: string;
    subtitleKey?: string;
}

const ProSubscriptionLightHeaderContent: FC<IProps> = props => {
    const {
        className,
        titleKey = 'tonkeeper_pro_subscription',
        subtitleKey = 'pro_unlocks_premium_tools'
    } = props;
    const { t } = useTranslation();

    return (
        <div className={className}>
            <Label1>{t(titleKey)}</Label1>
            <Subtitle>{t(subtitleKey)}</Subtitle>
        </div>
    );
};

export const ProSubscriptionLightHeader = styled(ProSubscriptionLightHeaderContent)`
    display: flex;
    flex-direction: column;
    margin-bottom: 0.5rem;
`;
