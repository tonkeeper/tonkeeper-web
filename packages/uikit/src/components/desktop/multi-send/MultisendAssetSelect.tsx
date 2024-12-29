import { DropDown } from '../../DropDown';
import { Button } from '../../fields/Button';
import { SwitchIcon } from '../../Icon';
import styled from 'styled-components';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { FC } from 'react';
import { AssetSelectDropdownContent } from '../../fields/AssetSelect';

const DropDownPayload = styled.div`
    background-color: ${props => props.theme.backgroundContentTint};
`;

const DropDownWrapper = styled.div`
    .drop-down-container {
        z-index: 100;
        top: calc(100% + 8px);
        left: 0;
    }
`;

export const MultisendAssetSelect: FC<{
    asset: TonAsset;
    onAssetChange: (asset: TonAsset) => void;
}> = ({ asset, onAssetChange }) => {
    return (
        <DropDownWrapper>
            <DropDown
                containerClassName="drop-down-container"
                payload={onClose => (
                    <DropDownPayload>
                        <AssetSelectDropdownContent
                            onAssetChange={a => {
                                onClose();
                                onAssetChange(a);
                            }}
                        />
                    </DropDownPayload>
                )}
            >
                <Button secondary size="small">
                    {asset.symbol}
                    <SwitchIcon />
                </Button>
            </DropDown>
        </DropDownWrapper>
    );
};
