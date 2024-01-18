import { FC } from 'react';
import { Carousel } from '../../components/shared';
import styled from 'styled-components';
import { useRecommendations } from '../../hooks/browser/useRecommendations';
import { Body3, H1, Label2 } from '../../components/Text';
import { AppRoute, SettingsRoute } from '../../libs/routes';
import { Link } from 'react-router-dom';
import { useUserCountry } from '../../state/country';
import { SkeletonText } from '../../components/Skeleton';

const Heading = styled.div`
    position: fixed;
    top: 0;
    width: var(--app-width);
    max-width: 548px;
    box-sizing: border-box;
    padding: 12px 1rem;
    display: flex;
    align-items: center;
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

const CarouselCard = styled.div<{ img: string }>`
    width: 448px;
    height: 224px;

    background-image: ${props => `url(${props.img})`};
    background-size: cover;
    border-radius: ${props => props.theme.cornerSmall};

    display: inline-flex !important;
    align-items: flex-end;
    justify-content: flex-start;
`;

const CardFooter = styled.div`
    height: 76px;
    display: flex;
    align-items: center;
    padding-left: 16px;
`;

const CardFooterImage = styled.img`
    height: 44px;
    width: 44px;
    border-radius: ${props => props.theme.cornerExtraSmall};
`;

const CardFooterText = styled.div<{ color?: string }>`
    display: flex;
    flex-direction: column;
    padding: 11px 12px 13px;
    word-break: break-word;
    color: ${props => props.color || props.theme.textPrimary};
`;

const Body3Styled = styled(Body3)`
    opacity: 0.73;
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
                <Carousel gap="8px">
                    {data.apps.map(item => (
                        <CarouselCard img={item.poster} key={item.url}>
                            <CardFooter>
                                <CardFooterImage src={item.icon} />
                                <CardFooterText color={item.textColor}>
                                    <Label2>{item.name}</Label2>
                                    <Body3Styled>{item.description}</Body3Styled>
                                </CardFooterText>
                            </CardFooter>
                        </CarouselCard>
                    ))}
                </Carousel>
            )}
        </div>
    );
};

export default BrowserPage;
