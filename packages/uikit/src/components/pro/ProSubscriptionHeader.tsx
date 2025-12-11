import { FC } from 'react';
import { styled } from 'styled-components';

import { Body2, Label1 } from '../Text';
import { useTranslation } from '../../hooks/translation';

const ProImage = styled.img`
    width: 78px;
    height: 78px;
    margin-bottom: 20px;
`;

const Title = styled(Label1)`
    margin-bottom: 4px;
`;

const Subtitle = styled(Body2)`
    display: block;
    max-width: 576px;
    color: ${p => p.theme.textSecondary};
    text-align: center;
`;

interface IProps {
    titleKey?: string;
    imageSrc?: string;
    className?: string;
    subtitleKey?: string;
    titleKeyReplaces?: Record<string, string | number>;
    subtitleKeyReplaces?: Record<string, string | number>;
}

const ProSubscriptionHeaderContent: FC<IProps> = props => {
    const {
        className,
        titleKeyReplaces,
        subtitleKeyReplaces,
        titleKey = 'tonkeeper_pro_subscription',
        subtitleKey = 'pro_unlocks_premium_tools',
        imageSrc = 'https://tonkeeper.com/assets/icon.ico'
    } = props;
    const { t } = useTranslation();

    return (
        <div className={className}>
            <ProImage src={imageSrc} />
            <Title>{t(titleKey, titleKeyReplaces)}</Title>
            <Subtitle>{t(subtitleKey, subtitleKeyReplaces)}</Subtitle>
        </div>
    );
};

export const ProSubscriptionHeader = styled(ProSubscriptionHeaderContent)`
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 0.5rem;
`;
