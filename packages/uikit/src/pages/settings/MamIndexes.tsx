import { AccountMAM } from '@tonkeeper/core/dist/entries/account';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { FC, useLayoutEffect, useRef } from 'react';
import styled from 'styled-components';
import { InnerBody } from '../../components/Body';
import { PencilIcon } from '../../components/Icon';
import { NotificationFooterPortal } from '../../components/Notification';
import { SubHeader } from '../../components/SubHeader';
import { Body2, Label2 } from '../../components/Text';
import { useTranslation } from '../../hooks/translation';
import {
    useTonWalletsBalances,
    useMutateAccountActiveDerivation,
    useActiveAccount,
    useCreateMAMAccountDerivation,
    useHideMAMAccountDerivation,
    useEnableMAMAccountDerivation,
    useActiveConfig
} from '../../state/wallet';
import { ListBlockDesktopAdaptive, ListItem } from '../../components/List';
import { toFormattedTonBalance } from '../../hooks/balance';
import { Button } from '../../components/fields/Button';
import { AppRoute } from '../../libs/routes';
import { SkeletonListDesktopAdaptive } from '../../components/Skeleton';
import { WalletEmoji } from '../../components/shared/emoji/WalletEmoji';
import { WalletIndexBadge } from '../../components/account/AccountBadge';
import {
    DesktopViewHeader,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { IconButtonTransparentBackground } from '../../components/fields/IconButton';
import { useProFeaturesNotification } from '../../components/modals/ProFeaturesNotificationControlled';
import { useRenameNotification } from '../../components/modals/RenameNotificationControlled';
import { useIsFullWidthMode } from '../../hooks/useIsFullWidthMode';
import { usePrevious } from '../../hooks/usePrevious';
import { scrollToContainersBottom } from '../../libs/web';
import { useProState } from '../../state/pro';
import { HideOnReview } from '../../components/ios/HideOnReview';
import { Navigate } from '../../components/shared/Navigate';
import { useNavigate } from '../../hooks/router/useNavigate';

const FirstLineContainer = styled.div`
    display: flex;
    gap: 6px;
    align-items: center;
`;

const TextContainer = styled.span`
    flex-direction: column;
    display: flex;
    align-items: flex-start;
`;

const Body2Secondary = styled(Body2)`
    color: ${props => props.theme.textSecondary};
`;

const ButtonsContainer = styled.div`
    margin-left: auto;
    display: flex;
    gap: 8px;
`;

export const MAMIndexesPage = () => {
    const { t } = useTranslation();
    const account = useActiveAccount();
    const isFullWidth = useIsFullWidthMode();

    if (account.type !== 'mam') {
        return <Navigate to="../" />;
    }

    if (isFullWidth) {
        return (
            <DesktopViewPageLayout>
                <DesktopViewHeader backButton>
                    <Label2>{t('settings_mam_indexes')}</Label2>
                </DesktopViewHeader>
                <MAMIndexesPageContentStyled
                    buttonWrapperClassName="mam-page-sticky-button-wrapper"
                    account={account}
                />
            </DesktopViewPageLayout>
        );
    }

    return (
        <>
            <SubHeader title={t('settings_mam_indexes')} />
            <InnerBody>
                <MAMIndexesPageContent account={account} />
            </InnerBody>
        </>
    );
};

const ListBlockStyled = styled(ListBlockDesktopAdaptive)`
    margin-bottom: 0;
`;

const FooterButtonContainerStyled = styled.div`
    padding: 1rem;
    margin: 0 -1rem;
    background-color: ${p => p.theme.backgroundPage};
`;

const IconButtonTransparentBackgroundStyled = styled(IconButtonTransparentBackground)`
    > svg {
        color: ${p => p.theme.iconTertiary};
    }
`;

const NameContainer = styled.div`
    display: flex;
    gap: 1rem;
`;
const ListItemPayload = styled.div`
    flex-grow: 1;
    display: flex;
    justify-content: space-between;
    padding: 1rem 1rem 1rem 0;
    box-sizing: border-box;
    gap: 10px;

    width: 100%;

    ${props =>
        props.theme.displayType === 'full-width'
            ? 'align-items: center;'
            : 'flex-direction: column;'}
`;

const ContentWrapper = styled.div``;

export const MAMIndexesPageContent: FC<{
    afterWalletOpened?: () => void;
    account: AccountMAM;
    className?: string;
    buttonWrapperClassName?: string;
}> = ({ afterWalletOpened, account, className, buttonWrapperClassName }) => {
    const { t } = useTranslation();
    const config = useActiveConfig();
    const { data: proState } = useProState();
    const { onOpen: buyPro } = useProFeaturesNotification();
    const ref = useRef<HTMLDivElement | null>(null);

    const { mutateAsync: selectDerivation, isLoading: isSelectDerivationLoading } =
        useMutateAccountActiveDerivation();
    const navigate = useNavigate();

    const { data: balances } = useTonWalletsBalances(
        account.allAvailableDerivations.map(
            d => d.tonWallets.find(w => w.id === d.activeTonWalletId)!.rawAddress
        )
    );

    const { mutate: createDerivation, isLoading: isCreatingDerivationLoading } =
        useCreateMAMAccountDerivation();

    const { mutate: hideDerivation, isLoading: isHideDerivationLoading } =
        useHideMAMAccountDerivation();

    const { mutate: enableDerivation, isLoading: isEnableDerivationLoading } =
        useEnableMAMAccountDerivation();

    const { onOpen: rename } = useRenameNotification();

    const onOpenDerivation = async (index: number) => {
        if (index !== account.activeDerivationIndex) {
            await selectDerivation({ accountId: account.id, derivationIndex: index });
        }
        navigate(AppRoute.home);
        afterWalletOpened?.();
    };

    const onCreateDerivation = async () => {
        createDerivation({
            accountId: account.id
        });
    };

    const totalDerivationsDisplayed = balances?.length;
    const totalDerivationsDisplayedPrev = usePrevious(totalDerivationsDisplayed);
    useLayoutEffect(() => {
        if (
            totalDerivationsDisplayed !== undefined &&
            totalDerivationsDisplayedPrev !== undefined &&
            totalDerivationsDisplayed > totalDerivationsDisplayedPrev &&
            ref.current
        ) {
            scrollToContainersBottom(ref.current);
        }
    }, [totalDerivationsDisplayed, totalDerivationsDisplayedPrev]);

    const onEnableDerivation = async (index: number) => {
        enableDerivation({
            accountId: account.id,
            derivationIndex: index
        });
    };

    const onHideDerivation = async (index: number) => {
        hideDerivation({
            accountId: account.id,
            derivationIndex: index
        });
    };

    if (!balances) {
        return <SkeletonListDesktopAdaptive size={account.allAvailableDerivations.length} />;
    }

    const isLoading =
        isSelectDerivationLoading ||
        isCreatingDerivationLoading ||
        isHideDerivationLoading ||
        isEnableDerivationLoading;

    const canHide = account.derivations.length > 1;

    const mamMaxWalletsWithoutPro = config.mam_max_wallets_without_pro || 3;
    const showByProButton =
        !proState?.subscription.valid &&
        account.allAvailableDerivations.length >= mamMaxWalletsWithoutPro;

    return (
        <ContentWrapper className={className} ref={ref}>
            <ListBlockStyled>
                {balances.map((balance, cycleIndex) => {
                    const derivationIndex = account.allAvailableDerivations[cycleIndex].index;
                    const derivation = account.allAvailableDerivations.find(
                        d => d.index === derivationIndex
                    )!;

                    const isDerivationAdded = account.derivations.some(
                        d => d.index === derivationIndex
                    );

                    return (
                        <ListItem hover={false} key={balance.address}>
                            <ListItemPayload>
                                <NameContainer>
                                    <WalletEmoji containerSize="24px" emoji={derivation.emoji} />
                                    <TextContainer>
                                        <FirstLineContainer>
                                            <Label2>{derivation.name}</Label2>
                                            <WalletIndexBadge>
                                                #{derivationIndex + 1}
                                            </WalletIndexBadge>
                                        </FirstLineContainer>
                                        <Body2Secondary>
                                            {toShortValue(formatAddress(balance.address)) + ' '}·
                                            {' ' + toFormattedTonBalance(balance.tonBalance)}
                                            &nbsp;TON
                                        </Body2Secondary>
                                    </TextContainer>
                                </NameContainer>
                                {isDerivationAdded ? (
                                    <ButtonsContainer>
                                        <IconButtonTransparentBackgroundStyled
                                            onClick={() =>
                                                rename({ accountId: account.id, derivationIndex })
                                            }
                                        >
                                            <PencilIcon />
                                        </IconButtonTransparentBackgroundStyled>
                                        <Button
                                            onClick={() => onOpenDerivation(derivationIndex)}
                                            loading={isLoading}
                                        >
                                            {t('open')}
                                        </Button>
                                        {canHide && (
                                            <Button
                                                onClick={() => onHideDerivation(derivationIndex)}
                                                loading={isLoading}
                                            >
                                                {t('hide')}
                                            </Button>
                                        )}
                                    </ButtonsContainer>
                                ) : (
                                    <ButtonsContainer>
                                        <IconButtonTransparentBackgroundStyled
                                            onClick={() =>
                                                rename({ accountId: account.id, derivationIndex })
                                            }
                                        >
                                            <PencilIcon />
                                        </IconButtonTransparentBackgroundStyled>
                                        <Button
                                            primary
                                            onClick={() => onEnableDerivation(derivationIndex)}
                                            loading={isLoading}
                                        >
                                            {t('add')}
                                        </Button>
                                    </ButtonsContainer>
                                )}
                            </ListItemPayload>
                        </ListItem>
                    );
                })}
            </ListBlockStyled>
            <NotificationFooterPortal>
                <FooterButtonContainerStyled className={buttonWrapperClassName}>
                    {showByProButton ? (
                        <HideOnReview>
                            <Button primary fullWidth onClick={buyPro}>
                                {t('settings_mam_add_wallet_with_pro')}
                            </Button>
                        </HideOnReview>
                    ) : (
                        <Button fullWidth onClick={onCreateDerivation}>
                            {t('settings_mam_add_wallet')}
                        </Button>
                    )}
                </FooterButtonContainerStyled>
            </NotificationFooterPortal>
        </ContentWrapper>
    );
};

const MAMIndexesPageContentStyled = styled(MAMIndexesPageContent)`
    .mam-page-sticky-button-wrapper {
        margin: 0;
        position: sticky;
        bottom: 0;
    }
`;
