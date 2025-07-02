import { FC } from 'react';
import { styled } from 'styled-components';

import { Badge } from '../shared';
import { Body3, Label2 } from '../Text';
import { useTranslation } from '../../hooks/translation';
import { ListBlock, ListItem, ListItemPayload } from '../List';
import { CoinsIcon, ListIcon, SlidersIcon, TelegramIcon } from '../Icon';
import { useProFeaturesNotification } from '../modals/ProFeaturesNotificationControlled';

interface IHeaderOptions {
    removeHeader?: boolean;
    leftElement?: JSX.Element | null;
    rightElement?: JSX.Element | null;
}

interface IProps {
    className?: string;
    features?: IProFeature[];
    headerOptions?: IHeaderOptions;
}

const ProFeaturesListContent: FC<IProps> = props => {
    const { className, headerOptions, features = PRO_FEATURES } = props;
    const { removeHeader, ...restHeaderProps } = headerOptions ?? {};

    const { t } = useTranslation();

    return (
        <div className={className}>
            {!removeHeader && <HeaderStyled {...restHeaderProps} />}
            <ListBlock fullWidth>
                {features.map(({ titleKey, descriptionKey, iconComponent, badgeComponent }) => (
                    <ListItem hover={false} key={titleKey}>
                        <ListItemPayloadStyled>
                            <div>
                                <LocalBadgedTitleStyled
                                    titleKey={t(titleKey)}
                                    badgeComponent={badgeComponent}
                                />
                                <Text>{t(descriptionKey)}</Text>
                            </div>
                            <FeatureIconContainer>{iconComponent}</FeatureIconContainer>
                        </ListItemPayloadStyled>
                    </ListItem>
                ))}
            </ListBlock>
        </div>
    );
};

interface IHeaderProps extends Omit<IHeaderOptions, 'removeHeader'> {
    className?: string;
}
const Header: FC<IHeaderProps> = props => {
    const { t } = useTranslation();
    const { onOpen } = useProFeaturesNotification();

    const {
        className,
        leftElement = <Title>{t('what_is_included')}</Title>,
        rightElement = (
            <ButtonStyled as="button" onClick={onOpen}>
                {t('learn_more')}
            </ButtonStyled>
        )
    } = props;

    return (
        <div className={className}>
            {leftElement}
            {rightElement}
        </div>
    );
};

type LocalBadgedTitleProps = Pick<IProFeature, 'titleKey' | 'badgeComponent'>;
const LocalBadgedTitle: FC<LocalBadgedTitleProps & { className?: string }> = props => {
    const { titleKey, badgeComponent: badge, className } = props;

    return (
        <div className={className}>
            <Label2>{titleKey}</Label2>
            {!!badge && badge}
        </div>
    );
};

interface IProFeature {
    titleKey: string;
    descriptionKey: string;
    iconComponent: JSX.Element;
    badgeComponent?: JSX.Element;
}
const LocalBadge = () => {
    const { t } = useTranslation();

    return (
        <Badge color="textSecondary" size="s" display="inline-block">
            {t('desktop_only')}
        </Badge>
    );
};

const HeaderStyled = styled(Header)`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const ButtonStyled = styled(Body3)`
    height: auto;
    padding: 0 0 0 1rem;
    margin-left: auto;
    color: ${props => props.theme.textAccent};
    opacity: 1;
    transition: opacity 0.3s;

    &:hover {
        opacity: 0.7;
    }
`;

const LocalBadgedTitleStyled = styled(LocalBadgedTitle)`
    display: flex;
    align-items: center;
    gap: 6px;
`;

export const ProFeaturesList = styled(ProFeaturesListContent)`
    width: 100%;
`;

const Text = styled(Body3)`
    display: block;
    color: ${p => p.theme.textSecondary};
`;

const Title = styled(Text)`
    margin: 8px 0;
`;

const FeatureIconContainer = styled.div`
    color: ${p => p.theme.iconSecondary};
`;

const ListItemPayloadStyled = styled(ListItemPayload)`
    padding-top: 10px;
    padding-bottom: 10px;
`;

const TelegramIconStyled = styled(TelegramIcon)`
    color: ${p => p.theme.iconSecondary};
`;

const PRO_FEATURES: IProFeature[] = [
    {
        titleKey: 'pro_feature_multisig_title',
        descriptionKey: 'pro_feature_multisig_description',
        iconComponent: <ListIcon />
    },
    {
        titleKey: 'pro_feature_multi_accounts_title',
        descriptionKey: 'pro_feature_multi_accounts_description',
        iconComponent: <SlidersIcon />
    },
    {
        titleKey: 'pro_feature_multi_send_title',
        descriptionKey: 'pro_feature_multi_send_description',
        badgeComponent: <LocalBadge />,
        iconComponent: <CoinsIcon />
    },
    {
        titleKey: 'pro_feature_priority_support_title',
        descriptionKey: 'pro_feature_priority_support_description',
        iconComponent: <TelegramIconStyled />
    }
];
