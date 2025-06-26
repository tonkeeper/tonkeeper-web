import { PromotedApp, PromotionCategory } from '@tonkeeper/core/dist/tonkeeperApi/tonendpoint';
import { FC, useMemo } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { ChevronRightIcon } from '../../components/Icon';
import { ListBlock, ListItem } from '../../components/List';
import { Body3, H3, Label1, Label2 } from '../../components/Text';
import { Carousel } from '../../components/shared';
import { useAppContext } from '../../hooks/appContext';
import { useOpenPromotedAppInExternalBrowser } from '../../hooks/useAreaClick';
import { useElementSize } from '../../hooks/useElementSize';
import { AppRoute, BrowserRoute } from '../../libs/routes';
import { PromotedItem, PromotedItemImage, PromotedItemText } from './PromotedItem';
import { useTranslation } from '../../hooks/translation';

const Heading = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 1rem;
    gap: 1rem;
`;

const AllButton = styled.button`
    border: none;
    background: transparent;
    height: fit-content;
    width: fit-content;
    color: ${props => props.theme.textAccent};
    cursor: pointer;
    padding: 4px 8px;
`;

const ListContainer = styled.div`
    padding-left: 1rem;
    padding-right: 1rem;
`;

const ListBlockStyled = styled(ListBlock)<{ width: string; marginLeft?: string }>`
    width: ${props => props.width} !important;
    margin-left: ${props => props.marginLeft} !important;
    margin-bottom: 0;
`;

const IconContainerStyled = styled.div`
    margin-left: auto;
    margin-right: 1rem;
    color: ${props => props.theme.iconTertiary};
    transition: transform 0.15s ease;
`;

const ListItemStyled = styled(ListItem)`
    padding-left: 1rem;

    &:hover ${IconContainerStyled} {
        transform: translateX(2px);
    }
`;

export const CategoryBlock: FC<{ category: PromotionCategory; className?: string }> = ({
    category,
    className
}) => {
    const { t } = useTranslation();
    const { browserLength } = useAppContext();
    const [containerRef, { width: w }] = useElementSize();
    const width = w - 36;
    const groups = useMemo(
        () =>
            category.apps.reduce((acc, app, index) => {
                if (index % (browserLength ?? 3) === 0) {
                    acc.push([app]);
                } else {
                    acc[acc.length - 1].push(app);
                }
                return acc;
            }, [] as PromotedApp[][]),
        [category.apps]
    );

    const groupsKeys = useMemo(() => groups.map(group => group.map(i => i.url).join('')), [groups]);
    const canExpand = groups.length > 1;

    return (
        <div className={className} ref={containerRef}>
            <Heading>
                <H3>{category.title}</H3>
                {canExpand && (
                    <Link to={AppRoute.browser + BrowserRoute.category + '/' + category.id}>
                        <AllButton>
                            <Label1>{t('browser_apps_all')}</Label1>
                        </AllButton>
                    </Link>
                )}
            </Heading>
            {canExpand ? (
                <Carousel gap="8px" infinite={false}>
                    {groups.map((group, groupIndex) => (
                        <ListBlockStyled key={groupsKeys[groupIndex]}>
                            {group.map(item => (
                                <CategoryGroupItem key={item.url} item={item} />
                            ))}
                        </ListBlockStyled>
                    ))}
                </Carousel>
            ) : (
                groups.map((group, groupIndex) => (
                    <ListContainer key={groupsKeys[groupIndex]}>
                        <ListBlockStyled key={groupsKeys[groupIndex]} width="100%">
                            {group.map(item => (
                                <CategoryGroupItem key={item.url} item={item} />
                            ))}
                        </ListBlockStyled>
                    </ListContainer>
                ))
            )}
        </div>
    );
};

export const CategoryGroupItem: FC<{ item: PromotedApp }> = ({ item }) => {
    const openAppCallback = useOpenPromotedAppInExternalBrowser(item.url, 'recommendation');

    return (
        <ListItemStyled key={item.url} onClick={openAppCallback}>
            <PromotedItem>
                <PromotedItemImage src={item.icon} />
                <PromotedItemText>
                    <Label2>{item.name}</Label2>
                    <Body3>{item.description}</Body3>
                </PromotedItemText>
                <IconContainerStyled>
                    <ChevronRightIcon />
                </IconContainerStyled>
            </PromotedItem>
        </ListItemStyled>
    );
};
