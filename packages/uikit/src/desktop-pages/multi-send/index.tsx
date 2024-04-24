import React, { FC, useEffect, useState } from 'react';
import styled from 'styled-components';
import { DesktopViewHeader } from '../../components/desktop/DesktopViewLayout';
import { Body2, Body3, Label2 } from '../../components/Text';
import { ListBlock, ListItem } from '../../components/List';
import { ChevronRightIcon, SpinnerIcon } from '../../components/Icon';
import { MultiSendList, useUserMultiSendLists } from '../../state/multiSend';
import { getWillBeMultiSendValue } from '../../components/desktop/multi-send/MultiSendTable';
import { useRate } from '../../state/rates';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { SkeletonText } from '../../components/shared/Skeleton';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { DesktopMultiSendFormPage } from './MultiSendFormPage';

const PageWrapper = styled.div`
    overflow: auto;
    position: relative;
    height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
`;

const LoadingWrapper = styled.div`
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const PageBodyWrapper = styled.div`
    padding: 0 1rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`;

const Body3Secondary = styled(Body3)`
    color: ${p => p.theme.textSecondary};
    display: flex;
`;

const ListBlockStyled = styled(ListBlock)`
    width: 368px;
`;

const IconContainerStyled = styled.div`
    margin-left: auto;
    color: ${props => props.theme.iconTertiary};
    transition: transform 0.15s ease;
`;

const ListItemStyled = styled(ListItem)`
    padding: 8px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    &:not(:first-child) {
        border-top: 1px solid ${props => props.theme.separatorCommon};
    }

    & + & > div {
        border-top: none;
        padding-top: 0;
    }

    &:hover ${IconContainerStyled} {
        transform: translateX(2px);
    }
`;

const ListItemTextContainer = styled.div`
    display: flex;
    flex-direction: column;
`;

export const DesktopMultiSendPage: FC = () => {
    const { data: lists } = useUserMultiSendLists();
    const [selectedList, setSelectedList] = useState<MultiSendList | undefined>();

    useEffect(() => {
        if (lists && !lists.length) {
            setSelectedList({
                id: 1,
                name: 'List 1',
                token: TON_ASSET,
                form: {
                    rows: [
                        {
                            receiver: undefined,
                            amount: undefined,
                            comment: ''
                        },
                        {
                            receiver: undefined,
                            amount: undefined,
                            comment: ''
                        }
                    ]
                }
            });
        }
    }, [lists]);

    useEffect(() => {
        if (selectedList && lists) {
            const updatedList = lists.find(l => l.id === selectedList.id);
            if (updatedList) {
                setSelectedList(updatedList);
            }
        }
    }, [lists]);

    if (!lists) {
        return (
            <LoadingWrapper>
                <SpinnerIcon />
            </LoadingWrapper>
        );
    }

    if (selectedList) {
        return (
            <DesktopMultiSendFormPage
                list={selectedList}
                onBack={() => setSelectedList(undefined)}
            />
        );
    }

    return (
        <PageWrapper>
            <DesktopViewHeader backButton>
                <Label2>New Multi Send</Label2>
            </DesktopViewHeader>
            <PageBodyWrapper>
                <ListBlockStyled>
                    {lists.map(list => (
                        <MultiSendListElement
                            list={list}
                            key={list.id}
                            asset={list.token}
                            onClick={() => setSelectedList(list)}
                        />
                    ))}
                </ListBlockStyled>
            </PageBodyWrapper>
        </PageWrapper>
    );
};

const MultiSendListElement: FC<{
    list: MultiSendList;
    asset: TonAsset;
    onClick: () => void;
}> = ({ list, asset, onClick }) => {
    const { data: rate } = useRate(
        typeof asset.address === 'string' ? asset.address : asset.address.toRawString()
    );

    const { willBeSent } = getWillBeMultiSendValue(list.form.rows, asset, rate);
    return (
        <ListItemStyled key={list.id} onClick={onClick}>
            <ListItemTextContainer>
                <Body2>
                    {list.name} · {list.token.symbol}
                </Body2>
                <Body3Secondary>
                    {list.form.rows.length} wallets · 
                    {rate ? willBeSent : <SkeletonText size="small" />}
                </Body3Secondary>
            </ListItemTextContainer>
            <IconContainerStyled>
                <ChevronRightIcon />
            </IconContainerStyled>
        </ListItemStyled>
    );
};
