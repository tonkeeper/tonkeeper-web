import { FC } from 'react';
import styled from 'styled-components';
import { useRecommendations } from '../../hooks/browser/useRecommendations';
import { H1, Label2 } from '../../components/Text';
import { AppRoute, SettingsRoute } from '../../libs/routes';
import { Link } from 'react-router-dom';
import { useUserCountry } from '../../state/country';
import { SkeletonText } from '../../components/Skeleton';
import { PromotionsCarousel } from './promotions-carousel';
import { CategoryBlock } from './category-block';
import { InnerBody } from '../../components/Body';

const InnerBodyStyled = styled(InnerBody)`
    padding: 0;
`;

const Heading = styled.div`
    position: fixed;
    top: 0;
    width: var(--app-width);
    max-width: 548px;
    box-sizing: border-box;
    padding: 12px 1rem;
    display: flex;
    align-items: center;
    background-color: ${props => props.theme.backgroundPage};
    z-index: 3;
`;
const SkeletonCountry = styled(SkeletonText)`
    position: absolute;
    right: 16px;
    top: 24px;
`;

const CountryButton = styled.button`
    position: absolute;
    right: 16px;
    top: 16px;
    color: ${props => props.theme.buttonSecondaryForeground};
    background: ${props => props.theme.buttonSecondaryBackground};
    border-radius: ${props => props.theme.cornerSmall};
    border: none;
    padding: 6px 12px;
    cursor: pointer;

    &:hover {
        background-color: ${props => props.theme.backgroundContentTint};
    }

    transition: background-color 0.1s ease;
`;

const PromotionsCarouselStyled = styled(PromotionsCarousel)`
    margin-bottom: 16px;
`;

const BrowserPage: FC = () => {
    const { data, isLoading, error } = useRecommendations();
    const { data: country, isLoading: isCountryLoading } = useUserCountry();

    return (
        <div>
            <Heading>
                <H1>Discover</H1>
                {isCountryLoading ? (
                    <SkeletonCountry width="50px" size="large" />
                ) : (
                    <Link to={AppRoute.settings + SettingsRoute.country}>
                        <CountryButton>
                            <Label2>{country || '🌎'}</Label2>
                        </CountryButton>
                    </Link>
                )}
            </Heading>
            {!!data && (
                <InnerBodyStyled>
                    <PromotionsCarouselStyled apps={data.apps} />
                    {data.categories.map(category => (
                        <CategoryBlock key={category.id} category={category} />
                    ))}
                </InnerBodyStyled>
            )}
        </div>
    );
};

export default BrowserPage;
