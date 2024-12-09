import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { Dot } from '@tonkeeper/uikit/dist/components/Dot';
import { Body3Class } from '@tonkeeper/uikit';

const Wrapper = styled.div``;

const Row = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${p => p.theme.textTertiary};
    ${Body3Class}
`;

const Link = styled.a`
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: unset;
    color: ${p => p.theme.textSecondary};

    &:active {
        color: ${p => p.theme.textPrimary};
    }
`;

export const SwapWidgetFooter = () => {
    const { t } = useTranslation();
    return (
        <Wrapper>
            <Row>
                {t('legal_powered_by')}
                {/* <Link href="https://dedust.io/" target="_blank">
                    <DedustIcon />
                    Dedust
                </Link>
                ,*/}
                <Link href="https://ston.fi/" target="_blank">
                    <StonfiIcon />
                    STON.fi
                </Link>
                &nbsp;{t('and')}&nbsp;TON
            </Row>
            <Row>
                <Link href="https://tonkeeper.com/privacy" target="_blank">
                    {t('legal_privacy')}
                </Link>
                <Dot />
                <Link href="https://tonkeeper.com/terms" target="_blank">
                    {t('legal_terms')}
                </Link>
            </Row>
        </Wrapper>
    );
};

/*const DedustIcon = () => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="13"
            height="14"
            viewBox="0 0 13 14"
            fill="none"
            style={{ margin: '0 4px' }}
        >
            <path opacity="0.5" d="M6.5 7V14L12.5 10.5V3.5L6.5 7Z" fill="currentColor" />
            <path opacity="0.75" d="M6.5 7V14L0.5 10.5V3.5L6.5 7Z" fill="currentColor" />
            <path d="M6.5 0L0.5 3.5L6.5 7L12.5 3.5L6.5 0Z" fill="currentColor" />
        </svg>
    );
};*/

const StonfiIcon = () => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="17"
            height="16"
            viewBox="0 0 17 16"
            fill="none"
            style={{ margin: '0 4px' }}
        >
            <path
                d="M11.8477 2.52187C11.7166 2.30045 11.6511 2.18974 11.5427 2.16746C11.4343 2.14519 11.3304 2.22108 11.1226 2.37286L7.02813 5.36359C6.8672 5.48113 6.78673 5.53991 6.74337 5.62529C6.7 5.71067 6.7 5.81031 6.7 6.0096V7.13606C6.7 7.44479 6.7 7.59916 6.80112 7.67412C6.90223 7.74908 7.04994 7.70421 7.34534 7.61447L9.35932 7.00263C9.95013 6.82314 10.2455 6.7334 10.4478 6.88332C10.65 7.03324 10.65 7.34198 10.65 7.95945V9.78382C10.65 9.85572 10.65 9.89166 10.6563 9.92685C10.6627 9.96204 10.6752 9.99573 10.7003 10.0631L11.5288 12.2868C11.7226 12.8072 11.8196 13.0674 11.9923 13.0683C12.1649 13.0692 12.2646 12.8101 12.464 12.2917L14.1516 7.9038C14.3224 7.45986 14.4078 7.23788 14.3886 7.00935C14.3694 6.78081 14.2482 6.57617 14.0059 6.16688L11.8477 2.52187Z"
                fill="currentColor"
            />
            <path
                d="M8.58018 2.09122C9.29806 2.03091 9.657 2.00075 9.72329 2.1783C9.78958 2.35584 9.49871 2.5683 8.91696 2.99323L6.65865 4.64278C6.44455 4.79916 6.3375 4.87735 6.21173 4.89953C6.08596 4.92171 5.95863 4.88485 5.70395 4.81112L4.40692 4.43566C4.0366 4.32846 3.85144 4.27486 3.81696 4.13456C3.78247 3.99427 3.92169 3.86094 4.20011 3.59428L4.98828 2.83941C5.24124 2.59714 5.36772 2.47601 5.52419 2.40542C5.68066 2.33482 5.85518 2.32016 6.20421 2.29084L8.58018 2.09122Z"
                fill="currentColor"
            />
            <path
                d="M4.00893 5.15329C3.59219 5.03266 3.38382 4.97234 3.22996 5.07325C3.0761 5.17417 3.04841 5.38932 2.99302 5.81962L2.63377 8.61077C2.56823 9.11993 2.53547 9.37451 2.62092 9.6053C2.70637 9.83608 2.89702 10.0079 3.27833 10.3516L5.42287 12.2847C5.56156 12.4097 5.63091 12.4723 5.71643 12.4785C5.80194 12.4847 5.87962 12.4329 6.03499 12.3294L9.49376 10.0235C9.66815 9.90725 9.75534 9.84912 9.80267 9.76069C9.85 9.67225 9.85 9.56746 9.85 9.35787V8.36412C9.85 8.05539 9.85 7.90102 9.74888 7.82606C9.64777 7.7511 9.50006 7.79597 9.20466 7.88571L7.19068 8.49756C6.59987 8.67704 6.30447 8.76679 6.10223 8.61686C5.9 8.46694 5.9 8.15821 5.9 7.54074V6.30198C5.9 6.01252 5.9 5.86779 5.81976 5.76103C5.73952 5.65426 5.60049 5.61402 5.32245 5.53353L4.00893 5.15329Z"
                fill="currentColor"
            />
            <path
                d="M7.49887 12.3149C7.08509 12.5908 6.8782 12.7287 6.90797 12.8906C6.93775 13.0525 7.18017 13.1078 7.66502 13.2184L10.4308 13.8493C10.8288 13.9401 11.0278 13.9855 11.126 13.8733C11.2243 13.7611 11.153 13.5698 11.0105 13.1873L10.4043 11.56C10.2417 11.1235 10.1604 10.9052 9.97627 10.8456C9.79218 10.786 9.5984 10.9152 9.21084 11.1736L7.49887 12.3149Z"
                fill="currentColor"
            />
        </svg>
    );
};
