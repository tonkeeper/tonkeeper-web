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
    const address = nft ? toShortValue(formatAddress(nft.address)) : '';
    return (
        <Notification title="Token Details" isOpen={isOpen} handleClose={() => onClose()}>
            {() => (
                <ContentWrapper>
                    <ListBlockStyled>
                        <ListItemElement hover={false}>
                            <ListItemPayloadStyled>
                                <TextBlock>
                                    <Body2>Name</Body2>
                                    <Body2>{nft?.name || 'Unknown'}</Body2>
                                </TextBlock>
                                <NftImage src={nft?.image} />
                            </ListItemPayloadStyled>
                        </ListItemElement>
                        <ListItemElement hover={false}>
                            <ListItemPayloadStyled>
                                <TextBlock>
                                    <Body2>
                                        {nft?.type === 'collection' ? 'Collection ID' : 'Token ID'}
                                    </Body2>
                                    <Body2>{address}</Body2>
                                </TextBlock>
                                <CopyButton content={nft ? formatAddress(nft.address) : ''} />
                            </ListItemPayloadStyled>
                        </ListItemElement>
                    </ListBlockStyled>
                    <Button fullWidth size="medium" secondary onClick={() => onClose(true)}>
                        Not Spam
                    </Button>
                </ContentWrapper>
            )}
        </Notification>
    );
};
