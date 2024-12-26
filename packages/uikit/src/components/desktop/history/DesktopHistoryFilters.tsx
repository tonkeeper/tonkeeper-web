import { DropDownContent, DropDownItem, DropDownItemsDivider } from '../../DropDown';
import { SelectDropDown } from '../../fields/Select';
import React, { FC } from 'react';
import { Body2, Body3, Label2 } from '../../Text';
import styled, { css } from 'styled-components';
import { useAllChainsAssets } from '../../../state/home';
import { ChevronDownIcon, CoinsHorizontalIcon, SlidersIcon } from '../../Icon';
import { Checkbox } from '../../fields/Checkbox';
import { isInitiatorFiltrationForAssetAvailable, useHistoryFilters } from '../../../state/activity';
import { useTranslation } from '../../../hooks/translation';
import { TRON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { Badge } from '../../shared';

const AssetIcon = styled.img<{ $noBorders?: boolean }>`
    width: 24px;
    height: 24px;
    border-radius: ${props => !props.$noBorders && props.theme.cornerFull};
    margin-right: 12px;

    pointer-events: none;
`;

const AllAssetsIcon = styled(CoinsHorizontalIcon)`
    margin-right: 12px;
    color: ${p => p.theme.iconSecondary};
`;

const DropDownButton = styled.button`
    border: none;
    background-color: transparent;
    display: flex;
    align-items: center;
    gap: 6px;
    color: ${p => p.theme.textSecondary};
`;

const DropDownTokensButton = styled(DropDownButton)`
    padding-left: 12px;
    padding-right: 8px;
    white-space: nowrap;
`;

const DropDownOtherFiltersButton = styled(DropDownButton)<{ $badge: boolean }>`
    position: relative;
    height: 20px;
    padding-left: 8px;
    padding-right: 16px;

    &::after {
        content: '';
        position: absolute;
        top: -6px;
        right: 10px;
        height: 6px;
        width: 6px;
        background-color: ${p => p.theme.accentBlue};
        border-radius: ${p => p.theme.cornerFull};

        display: ${p => (p.$badge ? 'block' : 'none')};
    }
`;

const TRCBadge = styled(Badge)`
    margin-left: 8px;
`;

export const AssetHistoryFilter = () => {
    const { t } = useTranslation();
    const assets = useAllChainsAssets();
    const { asset: selectedAsset, setAsset } = useHistoryFilters();
    if (!assets) {
        return null;
    }

    return (
        <SelectDropDown
            top="30px"
            right="0"
            width="200px"
            payload={onClose => (
                <DropDownContent>
                    <DropDownItem
                        onClick={() => {
                            setAsset(undefined);
                            onClose();
                        }}
                        isSelected={selectedAsset === undefined}
                    >
                        <AllAssetsIcon />
                        <Label2>{t('history_filters_all_assets')}</Label2>
                    </DropDownItem>
                    {assets.map(assetAmount => (
                        <>
                            <DropDownItemsDivider />
                            <DropDownItem
                                onClick={() => {
                                    setAsset(assetAmount.asset);
                                    onClose();
                                }}
                                isSelected={selectedAsset?.id === assetAmount.asset.id}
                            >
                                <AssetIcon
                                    src={assetAmount.image}
                                    $noBorders={assetAmount.asset.id === TRON_USDT_ASSET.id}
                                />
                                <Label2>{assetAmount.asset.symbol}</Label2>
                                {assetAmount.asset.id === TRON_USDT_ASSET.id && (
                                    <TRCBadge color="textSecondary">TRC20</TRCBadge>
                                )}
                            </DropDownItem>
                        </>
                    ))}
                </DropDownContent>
            )}
        >
            <DropDownTokensButton>
                <Body2>
                    {selectedAsset ? selectedAsset.symbol : t('history_filters_all_assets')}
                </Body2>
                <ChevronDownIcon />
            </DropDownTokensButton>
        </SelectDropDown>
    );
};

const CheckboxStyled = styled(Checkbox)`
    margin-right: 12px;
    pointer-events: none;
`;

const DropDownItemStyled = styled(DropDownItem)<{ $isDisabled?: boolean }>`
    ${p =>
        p.$isDisabled &&
        css`
            cursor: not-allowed;
            opacity: 0.4;
        `}

    &:hover {
        background-color: transparent;
    }
`;

const TextContainer = styled.div`
    display: flex;
    flex-direction: column;

    ${Body3} {
        color: ${p => p.theme.textSecondary};
    }
`;

export const OtherHistoryFilters: FC<{ disableInitiatorFilter?: boolean }> = ({
    disableInitiatorFilter
}) => {
    const { t } = useTranslation();
    const { onlyInitiator, filterSpam, toggleFilterSpam, toggleOnlyInitiator, asset } =
        useHistoryFilters();

    disableInitiatorFilter =
        disableInitiatorFilter || !isInitiatorFiltrationForAssetAvailable(asset);

    const onlyInitiatorChecked = onlyInitiator && !disableInitiatorFilter;

    return (
        <SelectDropDown
            top="30px"
            right="10px"
            payload={() => (
                <DropDownContent>
                    <DropDownItemStyled
                        onClick={disableInitiatorFilter ? () => {} : toggleOnlyInitiator}
                        isSelected={false}
                        $isDisabled={disableInitiatorFilter}
                    >
                        <CheckboxStyled
                            size="s"
                            disabled={disableInitiatorFilter}
                            checked={onlyInitiatorChecked}
                            onChange={toggleOnlyInitiator}
                            borderColor="textTertiary"
                        />
                        <Label2>{t('history_filters_initiator')}</Label2>
                    </DropDownItemStyled>
                    <DropDownItemsDivider />
                    <DropDownItemStyled onClick={toggleFilterSpam} isSelected={false}>
                        <CheckboxStyled
                            size="s"
                            checked={filterSpam}
                            onChange={toggleFilterSpam}
                            borderColor="textTertiary"
                        />
                        <TextContainer>
                            <Label2>{t('history_filters_hide_spam')}</Label2>
                            <Body3>{t('history_filters_hide_spam_description')}</Body3>
                        </TextContainer>
                    </DropDownItemStyled>
                </DropDownContent>
            )}
        >
            <DropDownOtherFiltersButton $badge={filterSpam || onlyInitiatorChecked}>
                <SlidersIcon />
            </DropDownOtherFiltersButton>
        </SelectDropDown>
    );
};
