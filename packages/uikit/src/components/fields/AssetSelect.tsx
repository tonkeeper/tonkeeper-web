import React, { FC, useMemo } from 'react';
import {
    isTon,
    TonAsset,
    tonAssetAddressToString
} from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { useTonAssetsBalances } from '../../state/home';
import { DropDownContent, DropDownItem, DropDownItemsDivider } from '../DropDown';
import { ColumnText } from '../Layout';
import styled from 'styled-components';
import { SelectDropDown, SelectDropDownHost, SelectField } from './Select';
import { SwitchIcon } from '../Icon';
import { Body3Class, Label2 } from '../Text';

const AssetIcon = styled.img`
    width: 24px;
    height: 24px;
    border-radius: ${props => props.theme.cornerFull};

    pointer-events: none;
`;

const FormError = styled.div<{ noPaddingTop?: boolean }>`
    padding: 8px 0;
    color: ${p => p.theme.accentRed};
    ${Body3Class};

    ${p => p.noPaddingTop && 'padding-top: 0;'}
`;

const SelectDropDownHostStyled = styled(SelectDropDownHost)`
    justify-content: flex-start;
    gap: 12px;

    > *:last-child {
        margin-left: auto;
    }
`;

export const AssetSelect: FC<{
    className?: string;
    onAssetChange: (asset: TonAsset) => void;
    selectedAssetId: string;
    allowedAssetsAddresses?: string[];
    direction?: 'top' | 'bottom';
    error?: {
        message: string;
    };
}> = ({
    className,
    error,
    selectedAssetId,
    onAssetChange,
    allowedAssetsAddresses,
    direction = 'bottom'
}) => {
    const assets = useTonAssetsBalances();

    const selectedAsset = assets?.find(a => a.asset.id === selectedAssetId)?.asset;

    const topDirectionProps = {
        bottom: '0',
        top: 'unset'
    };

    const bottomDirectionProps = {
        bottom: 'unset',
        top: '0'
    };

    return (
        <SelectDropDown
            {...(direction === 'top' ? topDirectionProps : bottomDirectionProps)}
            right="0"
            payload={onClose => (
                <DropDownContent>
                    <AssetSelectDropdownContent
                        selectedAssetId={selectedAssetId}
                        onAssetChange={a => {
                            onClose();
                            onAssetChange(a);
                        }}
                        allowedAssetsAddresses={allowedAssetsAddresses}
                    />
                </DropDownContent>
            )}
        >
            <SelectField className={className}>
                <SelectDropDownHostStyled isErrored={!!error}>
                    {!!selectedAsset && (
                        <>
                            <AssetIcon src={selectedAsset.image} />
                            <Label2>{selectedAsset.symbol}</Label2>
                            <SwitchIcon />
                        </>
                    )}
                </SelectDropDownHostStyled>
            </SelectField>
            {error && <FormError>{error.message}</FormError>}
        </SelectDropDown>
    );
};

const DropDownItemStyled = styled(DropDownItem)`
    gap: 12px;
`;

export const AssetSelectDropdownContent: FC<{
    onAssetChange: (asset: TonAsset) => void;
    selectedAssetId?: string;
    allowedAssetsAddresses?: string[];
}> = ({ onAssetChange, allowedAssetsAddresses, selectedAssetId }) => {
    const allAssets = useTonAssetsBalances();

    const assets = useMemo(() => {
        return allAssets?.filter(a => {
            if (!allowedAssetsAddresses) {
                return true;
            }

            if (isTon(a.asset.address)) {
                return allowedAssetsAddresses.some(i => i.toUpperCase() === 'TON');
            }

            return allowedAssetsAddresses.includes(tonAssetAddressToString(a.asset.address));
        });
    }, [allAssets, allowedAssetsAddresses]);

    if (!assets) {
        return null;
    }

    return (
        <>
            {assets.map(item => (
                <>
                    <DropDownItemStyled
                        isSelected={selectedAssetId === item.asset.id}
                        key={item.asset.id}
                        onClick={() => {
                            onAssetChange(item.asset);
                        }}
                    >
                        <AssetIcon src={item.asset.image} />
                        <ColumnText
                            text={item.asset.symbol}
                            secondary={item.stringRelativeAmount}
                        />
                    </DropDownItemStyled>
                    <DropDownItemsDivider />
                </>
            ))}
        </>
    );
};
