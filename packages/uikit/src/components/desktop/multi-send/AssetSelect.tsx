import { useAssets } from '../../../state/home';
import { DropDown } from '../../DropDown';
import { Body2, Body3, Label2 } from '../../Text';
import { formatter } from '../../../hooks/balance';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import { Button } from '../../fields/Button';
import { SwitchIcon } from '../../Icon';
import styled from 'styled-components';
import { jettonToTonAsset, TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { FC } from 'react';
import { JettonBalance } from '@tonkeeper/core/dist/tonApiV2';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';

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

const MenuItem = styled.button`
    width: 100%;
    text-align: start;
    align-items: center;
    padding: 0.5rem 0.75rem;
    display: flex;
    gap: 0.75rem;
    cursor: pointer;

    transition: background-color 0.15s ease-in-out;

    &:hover {
        background-color: ${p => p.theme.backgroundHighlighted};
    }
`;

const MenuItemText = styled.div`
    display: flex;
    flex-direction: column;
    overflow: hidden;
    text-overflow: ellipsis;

    > ${Body3} {
        color: ${p => p.theme.textSecondary};
    }
`;

const Divider = styled.div`
    background-color: ${p => p.theme.separatorCommon};
    height: 1px;
    width: 100%;
`;

const AssetIcon = styled.img`
    width: 24px;
    height: 24px;
    border-radius: ${props => props.theme.cornerFull};

    pointer-events: none;
`;

export const AssetSelect: FC<{ asset: TonAsset; onAssetChange: (asset: TonAsset) => void }> = ({
    asset,
    onAssetChange
}) => {
    return (
        <DropDownWrapper>
            <DropDown
                containerClassName="drop-down-container"
                payload={onClose => (
                    <DropDownPayload>
                        <AssetSelectBody
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

const AssetSelectBody: FC<{ onAssetChange: (asset: TonAsset) => void }> = ({ onAssetChange }) => {
    const [assets] = useAssets();
    if (!assets) {
        return null;
    }

    const onSelectJetton = (jetton: JettonBalance) => {
        const tonAsset = jettonToTonAsset(jetton.jetton.address, assets.ton.jettons);
        onAssetChange(tonAsset);
    };

    return (
        <>
            <MenuItem onClick={() => onAssetChange(TON_ASSET)}>
                <AssetIcon src="https://wallet.tonkeeper.com/img/toncoin.svg" />
                <MenuItemText>
                    <Label2>TON</Label2>
                    <Body2>
                        {formatter.format(shiftedDecimals(assets.ton.info.balance, 9), {
                            ignoreZeroTruncate: false,
                            decimals: 9
                        })}
                    </Body2>
                </MenuItemText>
            </MenuItem>
            {assets.ton.jettons.balances.map(jetton => (
                <>
                    <Divider />
                    <MenuItem onClick={() => onSelectJetton(jetton)}>
                        <AssetIcon src={jetton.jetton.image} />
                        <MenuItemText>
                            <Label2>{jetton.jetton.symbol}</Label2>
                            <Body3>
                                {formatter.format(
                                    shiftedDecimals(jetton.balance, jetton.jetton.decimals),
                                    {
                                        ignoreZeroTruncate: false,
                                        decimals: jetton.jetton.decimals
                                    }
                                )}
                            </Body3>
                        </MenuItemText>
                    </MenuItem>
                </>
            ))}
        </>
    );
};
