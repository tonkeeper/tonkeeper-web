import React, { FC, useEffect } from 'react';
import styled from 'styled-components';
import { DesktopBackButton, DesktopViewHeader } from '../../components/desktop/DesktopViewLayout';
import { Body2, Body3, Label2 } from '../../components/Text';
import { ListBlock, ListItem } from '../../components/List';
import { ChevronRightIcon, CloseIcon, SpinnerIcon } from '../../components/Icon';
import { MultiSendList, useUserMultiSendLists } from '../../state/multiSend';
import { useRate } from '../../state/rates';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { SkeletonText } from '../../components/shared/Skeleton';
import { DesktopMultiSendFormPage } from './MultiSendFormPage';
import { Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { getWillBeMultiSendValue } from '../../components/desktop/multi-send/utils';
import { ErrorBoundary } from 'react-error-boundary';
import { fallbackRenderOver } from '../../components/Error';
import { useAssetWeiBalance } from '../../state/home';
import { unShiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import { useTranslation } from '../../hooks/translation';
import { useDisclosure } from '../../hooks/useDisclosure';
import { ImportListNotification } from '../../components/desktop/multi-send/import-list/ImportListNotification';

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

const SubText = styled(Body3)`
    display: flex;
    align-items: center;
`;

const Body3Secondary = styled(Body3)`
    color: ${p => p.theme.textSecondary};
`;

const Body3Orange = styled(Body3)`
    color: ${p => p.theme.accentOrange};
`;

const SkeletonTextStyled = styled(SkeletonText)`
    margin-left: 4px;
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

const DesktopBackButtonStyled = styled(DesktopBackButton)`
    padding: 0 1rem;
    height: 2rem;
`;

export const DesktopMultiSendPage: FC = () => {
    const { t } = useTranslation();
    const { data: lists } = useUserMultiSendLists();
    const navigate = useNavigate();
    const { isOpen, onClose, onOpen } = useDisclosure();

    useEffect(() => {
        if (lists && !lists.length) {
            navigate('./list/' + 1);
        }
    }, [lists]);

    const onCreateList = () => {
        const id = Math.max(1, ...lists!.map(l => l.id)) + 1;
        navigate('./list/' + id);
    };

    const onImportList = (newListId?: number) => {
        onClose();
        if (newListId !== undefined) {
            navigate('./list/' + newListId);
        }
    };

    if (!lists) {
        return (
            <LoadingWrapper>
                <SpinnerIcon />
            </LoadingWrapper>
        );
    }

    return (
        <Routes>
            <Route path="/list/:id" element={<ListRouteElement />} />
            <Route
                path="*"
                element={
                    <ErrorBoundary
                        fallbackRender={fallbackRenderOver('Failed to display multi-send page')}
                    >
                        <PageWrapper>
                            <DesktopViewHeader
                                backButton={<DesktopBackButtonStyled icon={<CloseIcon />} />}
                            >
                                <Label2>{t('multi_send_header')}</Label2>
                            </DesktopViewHeader>
                            <PageBodyWrapper>
                                <ListBlockStyled>
                                    <ListItemStyled onClick={onCreateList}>
                                        <Body2>{t('multi_send_new_list')}</Body2>
                                        <IconContainerStyled>
                                            <ChevronRightIcon />
                                        </IconContainerStyled>
                                    </ListItemStyled>
                                    <ListItemStyled onClick={onOpen}>
                                        <Body2>{t('import_csv')}</Body2>
                                        <IconContainerStyled>
                                            <ChevronRightIcon />
                                        </IconContainerStyled>
                                    </ListItemStyled>
                                    {lists.map(list => (
                                        <MultiSendListElement
                                            list={list}
                                            key={list.id}
                                            asset={list.token}
                                            onClick={() => navigate('./list/' + list.id)}
                                        />
                                    ))}
                                </ListBlockStyled>
                            </PageBodyWrapper>
                            <ImportListNotification isOpen={isOpen} onClose={onImportList} />
                        </PageWrapper>
                    </ErrorBoundary>
                }
            ></Route>
        </Routes>
    );
};

const ListRouteElement = () => {
    const { id } = useParams();

    return (
        <ErrorBoundary
            fallbackRender={fallbackRenderOver('Failed to display multi-send page')}
            key={id}
        >
            <DesktopMultiSendFormPage />
        </ErrorBoundary>
    );
};

const MultiSendListElement: FC<{
    list: MultiSendList;
    asset: TonAsset;
    onClick: () => void;
}> = ({ list, asset, onClick }) => {
    const { t } = useTranslation();
    const { data: rate, isFetched } = useRate(
        typeof asset.address === 'string' ? asset.address : asset.address.toRawString()
    );

    const weiBalance = useAssetWeiBalance(asset);

    const { willBeSent, willBeSentBN } = getWillBeMultiSendValue(
        list.form.rows,
        asset,
        rate || { prices: 0 }
    );

    const isInsifficientBalance = weiBalance
        ? unShiftedDecimals(willBeSentBN, asset.decimals).gt(weiBalance)
        : false;

    return (
        <ListItemStyled key={list.id} onClick={onClick}>
            <ListItemTextContainer>
                <Body3>
                    {list.name}&nbsp;·&nbsp;{list.token.symbol}
                </Body3>
                <SubText>
                    <Body3Secondary>
                        {list.form.rows.length}&nbsp;{t('multi_send_wallets')}&nbsp;·&nbsp;
                        {isFetched ? willBeSent : <SkeletonTextStyled width="50px" size="small" />}
                    </Body3Secondary>
                    {isInsifficientBalance && (
                        <Body3Secondary>
                            &nbsp;·&nbsp;
                            <Body3Orange>{t('multi_send_insufficient_balance')}</Body3Orange>
                        </Body3Secondary>
                    )}
                </SubText>
            </ListItemTextContainer>
            <IconContainerStyled>
                <ChevronRightIcon />
            </IconContainerStyled>
        </ListItemStyled>
    );
};
