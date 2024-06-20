import { Notification } from '../../../components/Notification';
import { FC } from 'react';
import { SettingsNFTCollection, SettingsSingleNFT } from './models';
import { styled } from 'styled-components';
import { ListBlock, ListItemElement, ListItemPayload } from '../../../components/List';
import { Body2 } from '../../../components/Text';
import { BorderSmallResponsive } from '../../../components/shared/Styles';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { Button } from '../../../components/fields/Button';
import { CopyButton } from '../../../components/CopyButton';
import { useTranslation } from '../../../hooks/translation';

const ContentWrapper = styled.div``;

const TextBlock = styled.div`
    display: flex;
    flex-direction: column;
    overflow: hidden;

    > ${Body2}:first-child {
        color: ${props => props.theme.textSecondary};
    }

    > * {
        text-overflow: ellipsis;
        overflow: hidden;
    }
`;

const NftImage = styled.img`
    flex-shrink: 0;
    width: 40px;
    min-width: 40px;
    height: 40px;
    ${BorderSmallResponsive}
`;

const ListItemPayloadStyled = styled(ListItemPayload)`
    border-top: none !important;
`;

const ListBlockStyled = styled(ListBlock)`
    margin-bottom: 2rem;
`;

export const SpamNftInfoNotification: FC<{
    nft?: SettingsNFTCollection | SettingsSingleNFT;
    isOpen: boolean;
    onClose: (confirmNotSpam?: boolean) => void;
}> = ({ isOpen, onClose, nft }) => {
    const { t } = useTranslation();
    const address = nft ? toShortValue(formatAddress(nft.address)) : '';
    return (
        <Notification
            title={t('approval_details_token')}
            isOpen={isOpen}
            handleClose={() => onClose()}
        >
            {() => (
                <ContentWrapper>
                    <ListBlockStyled>
                        <ListItemElement hover={false}>
                            <ListItemPayloadStyled>
                                <TextBlock>
                                    <Body2>{t('approval_name')}</Body2>
                                    <Body2>{nft?.name || ' '}</Body2>
                                </TextBlock>
                                <NftImage src={nft?.image} />
                            </ListItemPayloadStyled>
                        </ListItemElement>
                        <ListItemElement hover={false}>
                            <ListItemPayloadStyled>
                                <TextBlock>
                                    <Body2>
                                        {nft?.type === 'collection'
                                            ? t('approval_id_collection')
                                            : t('approval_id_token')}
                                    </Body2>
                                    <Body2>{address}</Body2>
                                </TextBlock>
                                <CopyButton content={nft ? formatAddress(nft.address) : ''} />
                            </ListItemPayloadStyled>
                        </ListItemElement>
                    </ListBlockStyled>
                    <Button fullWidth size="medium" secondary onClick={() => onClose(true)}>
                        {t('approval_not_spam')}
                    </Button>
                </ContentWrapper>
            )}
        </Notification>
    );
};
