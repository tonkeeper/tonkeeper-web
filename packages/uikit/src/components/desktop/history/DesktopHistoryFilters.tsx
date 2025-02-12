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
import { ForTargetEnv, NotForTargetEnv } from '../../shared/TargetEnv';

const AssetIcon = styled.img<{ $noBorders?: boolean }>`
    width: 24px;
    height: 24px;
    border-radius: ${props => !props.$noBorders && props.theme.cornerFull};
    margin-right: 12px;

    pointer-events: none;
`;

const AssetIconSm = styled(AssetIcon)`
    width: 16px;
    height: 16px;
    margin-right: 0;
`;

const AllAssetsIcon = styled(CoinsHorizontalIcon)`
    margin-right: 12px;
    color: ${p => p.theme.iconSecondary};
`;

const AllAssetsIconSm = styled(AllAssetsIcon)`
    width: 16px;
    height: 16px;
    margin-right: 0;
    color: ${p => p.theme.iconPrimary};
`;

const DropDownButton = styled.button`
    border: none;
    background-color: transparent;
    display: flex;
    align-items: center;
    gap: 6px;
    color: ${p =>
        p.theme.proDisplayType === 'mobile' ? p.theme.textPrimary : p.theme.textSecondary};
`;

const DropDownTokensButton = styled(DropDownButton)`
    white-space: nowrap;

    ${p =>
        p.theme.proDisplayType === 'mobile' &&
        css`
            width: 100%;
        `}

    ${p =>
        p.theme.proDisplayType === 'desktop' &&
        css`
            padding-right: 8px;
            padding-left: 12px;
        `}
`;

const DropDownOtherFiltersButton = styled(DropDownButton)<{ $badge: boolean }>`
    position: relative;
    height: 20px;
    padding-right: 16px;

    ${p =>
        p.theme.proDisplayType === 'mobile' &&
        css`
            width: 100%;
            padding-right: 0;
        `}

    &::after {
        content: '';
        position: absolute;
        top: -3px;
        left: 14px;
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

const ChevronDownIconRight = styled(ChevronDownIcon)`
    margin-left: auto;
`;

const DropDownItemAsset = styled(DropDownItem)`
    color: ${p => p.theme.textPrimary};
`;

export const AssetHistoryFilter = () => {
    const { t } = useTranslation();
    const { assets } = useAllChainsAssets();
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
                    <DropDownItemAsset
                        onClick={() => {
                            setAsset(undefined);
                            onClose();
                        }}
                        isSelected={selectedAsset === undefined}
                    >
                        <AllAssetsIcon />
                        <Label2>{t('history_filters_all_assets')}</Label2>
                    </DropDownItemAsset>
                    {assets.map(assetAmount => (
                        <>
                            <DropDownItemsDivider />
                            <DropDownItemAsset
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
                            </DropDownItemAsset>
                        </>
                    ))}
                </DropDownContent>
            )}
        >
            <DropDownTokensButton>
                <ForTargetEnv env="mobile">
                    {selectedAsset ? (
                        <AssetIconSm
                            src={selectedAsset.image}
                            $noBorders={selectedAsset.id === TRON_USDT_ASSET.id}
                        />
                    ) : (
                        <AllAssetsIconSm />
                    )}
                </ForTargetEnv>
                <Body2>
                    {selectedAsset ? selectedAsset.symbol : t('history_filters_all_assets')}
                </Body2>
                <ChevronDownIconRight />
            </DropDownTokensButton>
        </SelectDropDown>
    );
};

const CheckboxStyled = styled(Checkbox)`
    margin-right: 12px;
    pointer-events: none;
`;

const DropDownItemStyled = styled(DropDownItem)<{ $isDisabled?: boolean }>`
    color: ${p => p.theme.textPrimary};

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
                <ForTargetEnv env="mobile">
                    <SlidersIcon />
                    <Body2>{t('settings_title')}</Body2>
                    <ChevronDownIconRight />
                </ForTargetEnv>
                <NotForTargetEnv env="mobile">
                    <SlidersIcon />
                </NotForTargetEnv>
            </DropDownOtherFiltersButton>
        </SelectDropDown>
    );
};
