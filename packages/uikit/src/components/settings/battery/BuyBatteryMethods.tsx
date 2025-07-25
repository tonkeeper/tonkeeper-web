import { FC } from 'react';
import { ListBlock, ListItem, ListItemPayload } from '../../List';
import { useBatteryAvailableRechargeMethods } from '../../../state/battery';
import styled from 'styled-components';
import { useTranslation } from '../../../hooks/translation';
import { IconButtonTransparentBackground } from '../../fields/IconButton';
import { ChevronRightIcon } from '../../Icon';
import { SkeletonImage, SkeletonText } from '../../shared/Skeleton';
import { Body3, Label2 } from '../../Text';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { packAssetId } from '@tonkeeper/core/dist/entries/crypto/asset/basic-asset';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { Image } from '../../shared/Image';
import { shouldHideTonJettonImageCorners } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';

export const MethodImageRounded = styled(Image)`
    width: 40px;
    height: 40px;
    border-radius: ${props => props.theme.cornerFull};

    margin-right: 12px;
    pointer-events: none;
    flex-shrink: 0;
`;

const ListItemStyled = styled(ListItem)`
    padding: 0;

    & + & > div {
        padding-top: 7px;
    }
`;

const ListItemPayloadStyled = styled(ListItemPayload)`
    justify-content: flex-start;
    padding: 8px 12px;

    &:nth-child(2) {
        padding-right: 6px;
    }
`;

const IconButtonStyled = styled(IconButtonTransparentBackground)`
    flex-shrink: 0;
    margin-right: -10px;
    margin-left: auto;
`;
const TextContainer = styled.div`
    display: flex;
    flex-direction: column;

    ${Body3} {
        color: ${p => p.theme.textSecondary};
    }
`;

export const BuyBatteryMethods: FC<{
    className?: string;
    onMethodSelected: (value: { type: 'asset'; assetId: string } | { type: 'gift' }) => void;
}> = ({ className, onMethodSelected }) => {
    const { t } = useTranslation();
    const methods = useBatteryAvailableRechargeMethods();

    if (!methods) {
        return (
            <ListBlock className={className} margin={false}>
                {[...new Array(4)].map((_, index) => (
                    <ListItemStyled key={index}>
                        <ListItemPayloadStyled>
                            <SkeletonImage width="40px" />
                            <SkeletonText size="large" width="200px" />
                            <IconButtonStyled>
                                <ChevronRightIcon />
                            </IconButtonStyled>
                        </ListItemPayloadStyled>
                    </ListItemStyled>
                ))}
            </ListBlock>
        );
    }

    return (
        <ListBlock className={className} margin={false}>
            {methods.map(m => (
                <ListItemStyled
                    key={m.key}
                    onClick={() =>
                        onMethodSelected({
                            type: 'asset',
                            assetId:
                                m.type === 'ton'
                                    ? TON_ASSET.id
                                    : packAssetId(BLOCKCHAIN_NAME.TON, m.jettonMaster!)
                        })
                    }
                >
                    <ListItemPayloadStyled>
                        <MethodImageRounded
                            src={m.image}
                            noRadius={shouldHideTonJettonImageCorners(m.jettonMaster!)}
                        />
                        <Label2>
                            {t('battery_other_ways_by_crypto_title', { symbol: m.symbol })}
                        </Label2>
                        <IconButtonStyled>
                            <ChevronRightIcon />
                        </IconButtonStyled>
                    </ListItemPayloadStyled>
                </ListItemStyled>
            ))}
            <ListItemStyled onClick={() => onMethodSelected({ type: 'gift' })}>
                <ListItemPayloadStyled>
                    <GiftIcon />
                    <TextContainer>
                        <Label2>{t('battery_other_ways_gift_title')}</Label2>
                        <Body3>{t('battery_other_ways_gift_subtitle')}</Body3>
                    </TextContainer>
                    <IconButtonStyled>
                        <ChevronRightIcon />
                    </IconButtonStyled>
                </ListItemPayloadStyled>
            </ListItemStyled>
        </ListBlock>
    );
};

const GiftIcon = () => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            style={{ borderRadius: '10px', marginRight: '12px' }}
        >
            <g clipPath="url(#clip0_45119_78795)">
                <rect width="40" height="40" fill="url(#paint0_linear_45119_78795)" />
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M25 -3C25.5523 -3 26 -2.55228 26 -2V16.8072C26.5833 15.9405 27.269 15.2704 28.0226 14.7846C30.3438 13.2879 33.1175 13.6989 34.7115 15.2929C36.3054 16.8868 36.7166 19.6595 35.2188 21.9798C34.733 22.7325 34.0632 23.4173 33.197 24H42C42.5523 24 43 24.4477 43 25C43 25.5523 42.5523 26 42 26H29.7298C31.0975 27.3774 31.9999 29.423 31.9999 32C31.9999 32.5523 31.5522 33 30.9999 33C30.4476 33 29.9999 32.5523 29.9999 32C29.9999 28.5546 28.0681 26.5925 26 26.1151V42C26 42.5523 25.5523 43 25 43C24.4477 43 24 42.5523 24 42V26.115C21.9317 26.5922 19.9996 28.5543 19.9996 32C19.9996 32.5523 19.5519 33 18.9996 33C18.4473 33 17.9996 32.5523 17.9996 32C17.9996 29.423 18.902 27.3774 20.2697 26H-2C-2.55228 26 -3 25.5523 -3 25C-3 24.4477 -2.55228 24 -2 24H16.8074C15.9411 23.4173 15.2714 22.7325 14.7855 21.9798C13.2877 19.6595 13.6989 16.8868 15.2929 15.2929C16.8869 13.6989 19.6605 13.2879 21.9817 14.7846C22.7334 15.2692 23.4176 15.9371 24 16.8007V-2C24 -2.55228 24.4477 -3 25 -3ZM23.9825 23.9778C23.7866 19.5906 22.33 17.3888 20.898 16.4654C19.3418 15.4621 17.6131 15.8011 16.7071 16.7071C15.801 17.6132 15.4624 19.3405 16.4659 20.8952C17.3897 22.3263 19.5927 23.7821 23.9825 23.9778ZM29.1064 16.4654C27.6743 17.3888 26.2178 19.5906 26.0219 23.9778C30.4116 23.7821 32.6147 22.3263 33.5385 20.8952C34.542 19.3405 34.2034 17.6132 33.2973 16.7071C32.3913 15.8011 30.6625 15.4621 29.1064 16.4654Z"
                    fill="white"
                />
            </g>
            <defs>
                <linearGradient
                    id="paint0_linear_45119_78795"
                    x1="0"
                    y1="0"
                    x2="40"
                    y2="40"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#F57F87" />
                    <stop offset="0.0666667" stopColor="#F57F87" />
                    <stop offset="0.133333" stopColor="#F57D86" />
                    <stop offset="0.2" stopColor="#F67B84" />
                    <stop offset="0.266667" stopColor="#F67881" />
                    <stop offset="0.333333" stopColor="#F7757D" />
                    <stop offset="0.4" stopColor="#F87079" />
                    <stop offset="0.466667" stopColor="#F96B74" />
                    <stop offset="0.533333" stopColor="#FB6670" />
                    <stop offset="0.6" stopColor="#FC616B" />
                    <stop offset="0.666667" stopColor="#FD5C67" />
                    <stop offset="0.733333" stopColor="#FE5963" />
                    <stop offset="0.8" stopColor="#FE5660" />
                    <stop offset="0.866667" stopColor="#FF545E" />
                    <stop offset="0.933333" stopColor="#FF525D" />
                    <stop offset="1" stopColor="#FF525D" />
                </linearGradient>
                <clipPath id="clip0_45119_78795">
                    <rect width="40" height="40" fill="white" />
                </clipPath>
            </defs>
        </svg>
    );
};
