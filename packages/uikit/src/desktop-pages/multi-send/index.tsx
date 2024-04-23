import { FC } from 'react';
import styled from 'styled-components';
import { DesktopViewHeader } from '../../components/desktop/DesktopViewLayout';
import { Body2, Body3, Label2 } from '../../components/Text';
import { DropDown } from '../../components/DropDown';
import { Button } from '../../components/fields/Button';
import { SwitchIcon } from '../../components/Icon';
import { useAssets } from '../../state/home';
import { formatter } from '../../hooks/balance';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import { MultiSendTable } from '../../components/desktop/multi-send/MultiSendTable';
import { TON_ASSET } from "@tonkeeper/core/dist/entries/crypto/asset/constants";

const PageWrapper = styled.div`
    overflow: auto;
    position: relative;
    height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
`;

const PageBodyWrapper = styled.div`
    padding: 0 1rem;
    flex: 1;
    display: flex;
    flex-direction: column;
`;

const MultiSendTableStyled = styled(MultiSendTable)`
    flex: 1;
`;

export const DesktopMultiSendPage: FC = () => {
    return (
        <PageWrapper>
            <DesktopViewHeader>
                <Label2>Multi Send</Label2>
            </DesktopViewHeader>
            <PageBodyWrapper>
                <MultiSendHeader>
                    <ListSelect />
                    <AssetSelect />
                </MultiSendHeader>
                <MultiSendTableStyled asset={TON_ASSET} />
            </PageBodyWrapper>
        </PageWrapper>
    );
};

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

const Dot = styled.span`
    color: ${p => p.theme.textTertiary};
`;

const Divider = styled.div`
    background-color: ${p => p.theme.separatorCommon};
    height: 1px;
    margin: 0 -0.5rem;
    width: calc(100% + 1rem);
`;

const MultiSendHeader = styled.div`
    display: flex;
    gap: 0.5rem;
    padding-bottom: 1rem;
`;

const ListSelect = () => {
    return (
        <DropDownWrapper>
            <DropDown
                containerClassName="drop-down-container"
                payload={onClose => (
                    <DropDownPayload>
                        <MenuItem onClick={onClose}>
                            <MenuItemText>
                                <Label2>New List</Label2>
                            </MenuItemText>
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={onClose}>
                            <MenuItemText>
                                <Label2>Salary</Label2>
                                <Body3>
                                    24 wallets&nbsp;<Dot>·</Dot>73,1K TON
                                </Body3>
                            </MenuItemText>
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={onClose}>
                            <MenuItemText>
                                <Label2>Salary</Label2>
                                <Body3>
                                    24 wallets&nbsp;<Dot>·</Dot>73,1K TON
                                </Body3>
                            </MenuItemText>
                        </MenuItem>
                    </DropDownPayload>
                )}
            >
                <Button secondary size="small">
                    New List
                    <SwitchIcon />
                </Button>
            </DropDown>
        </DropDownWrapper>
    );
};

const AssetIcon = styled.img`
    width: 24px;
    height: 24px;
    border-radius: ${props => props.theme.cornerFull};

    pointer-events: none;
`;

const AssetSelect = () => {
    const [assets] = useAssets();
    return (
        <DropDownWrapper>
            <DropDown
                containerClassName="drop-down-container"
                payload={onClose => (
                    <DropDownPayload>
                        {assets && (
                            <>
                                <MenuItem onClick={onClose}>
                                    <AssetIcon src="https://wallet.tonkeeper.com/img/toncoin.svg" />
                                    <MenuItemText>
                                        <Label2>TON</Label2>
                                        <Body2>
                                            {formatter.format(
                                                shiftedDecimals(assets.ton.info.balance, 9),
                                                {
                                                    ignoreZeroTruncate: false,
                                                    decimals: 9
                                                }
                                            )}
                                        </Body2>
                                    </MenuItemText>
                                </MenuItem>
                                {assets.ton.jettons.balances.map(jetton => (
                                    <>
                                        <Divider />
                                        <MenuItem onClick={onClose}>
                                            <AssetIcon src={jetton.jetton.image} />
                                            <MenuItemText>
                                                <Label2>{jetton.jetton.symbol}</Label2>
                                                <Body3>
                                                    {formatter.format(
                                                        shiftedDecimals(
                                                            jetton.balance,
                                                            jetton.jetton.decimals
                                                        ),
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
                        )}
                    </DropDownPayload>
                )}
            >
                <Button secondary size="small">
                    TON
                    <SwitchIcon />
                </Button>
            </DropDown>
        </DropDownWrapper>
    );
};
