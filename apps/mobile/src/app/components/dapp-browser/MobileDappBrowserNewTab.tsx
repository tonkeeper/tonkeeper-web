import { FC, useCallback, useId, useMemo, useState } from 'react';
import { useTranslation } from '@tonkeeper/uikit/dist/hooks/translation';
import { useRecommendations } from '@tonkeeper/uikit/dist/hooks/browser/useRecommendations';
import { HideOnReview } from '@tonkeeper/uikit/dist/components/ios/HideOnReview';

import styled, { css } from 'styled-components';
import { PromotionsCarousel } from '@tonkeeper/uikit/dist/components/browser/PromotionsCarousel';
import {
    MobileProAppsBlock,
    MobileProCategoryBlock
} from '@tonkeeper/uikit/dist/desktop-pages/browser/MobileProCategoryBlock';
import { Input } from '@tonkeeper/uikit/dist/components/fields/Input';
import { Body2, Button, Label2 } from '@tonkeeper/uikit';
import { IconButtonTransparentBackground } from '@tonkeeper/uikit/dist/components/fields/IconButton';
import { CloseIcon, MagnifyingGlassIcon } from '@tonkeeper/uikit/dist/components/Icon';
import {
    useHideActiveBrowserTab,
    useOpenBrowserTab,
    useSearchEngine,
    useSearchEngineName,
    useSearchEngineRecommendations
} from '@tonkeeper/uikit/dist/state/dapp-browser';
import { PromotedApp, Recommendations } from '@tonkeeper/core/dist/tonkeeperApi/tonendpoint';
import { ListBlock, ListItem, ListItemElement } from '@tonkeeper/uikit/dist/components/List';
import { ColumnText } from '@tonkeeper/uikit/dist/components/Layout';
import { useKeyboardHeight } from '@tonkeeper/uikit/dist/hooks/keyboard/useKeyboardHeight';
import { handleSubmit } from '@tonkeeper/uikit/dist/libs/form';
import { iosKeyboardTransition } from '@tonkeeper/uikit/dist/libs/css';
import { AnimatePresence, motion } from 'framer-motion';
import {
    useCountryContextTracker,
    useTrackDappBrowserOpened
} from '@tonkeeper/uikit/dist/hooks/analytics/events-hooks';
import { AnalyticsEventDappClick } from '@tonkeeper/core/dist/analytics';

const InputWrapper = styled.form<{ $keyboardShift: number }>`
    padding: 16px 16px 8px;
    background: ${p => p.theme.backgroundPage};
    flex-shrink: 0;
    z-index: 2;
`;

const Header = styled.div`
    height: 52px;
    flex-shrink: 0;
    padding: 0 0 0 16px;
    justify-content: space-between;
    display: flex;
    align-items: center;
    background: ${p => p.theme.backgroundPage};
    z-index: 10;
`;

const CloseButton = styled(IconButtonTransparentBackground)`
    padding: 0 18px;
    height: 100%;
    display: flex;
    align-items: center;
`;

const CancelButton = styled(Button)`
    margin-right: 16px;
    height: 32px;
`;

const PageWrapper = styled.div<{ $keyboardShift: number }>`
    padding-top: env(safe-area-inset-top);
    box-sizing: border-box;
    background: ${p => p.theme.backgroundPage};
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: env(safe-area-inset-top);
        background: ${p => p.theme.backgroundPage};
        z-index: 10;
    }

    ${p =>
        p.$keyboardShift &&
        css`
            padding-bottom: calc(${p.$keyboardShift}px - var(--footer-full-height) - 1px);
        `}

    transition: padding-bottom ${iosKeyboardTransition};
    will-change: padding-bottom;
`;

const PageBody = styled.div`
    overflow: hidden;
    flex: 1;
    position: relative;
`;

const HiddenSubmitButton = styled.button`
    display: none;
`;

const MotionDiv = styled(motion.div)`
    padding: inherit;
`;

const blurInput = () => {
    if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
    }
};

const useRelevantApps = (recommendations: Recommendations | undefined, inputValue: string) => {
    return useMemo(
        () =>
            recommendations?.categories
                .flatMap(c => c.apps)
                .filter(a => {
                    if (inputValue.length < 2) {
                        return false;
                    }

                    const normalizedInputValue = inputValue.toLowerCase().trim();
                    const relevantName = a.name.toLowerCase().includes(normalizedInputValue);
                    const relevantDescription = a.description
                        .toLowerCase()
                        .includes(normalizedInputValue);
                    const relevantUrl = a.url.toLowerCase().includes(normalizedInputValue);

                    return relevantName || relevantUrl || relevantDescription;
                })
                .slice(0, 3),
        [recommendations, inputValue]
    );
};

export const MobileDappBrowserNewTab = () => {
    useTrackDappBrowserOpened();
    const trackDappOpened = useCountryContextTracker();
    const { t } = useTranslation();
    const { data } = useRecommendations();
    const [isInputFocused, _setIsInputFocused] = useState(false);
    const setIsInputFocused = useCallback((value: boolean) => {
        setTimeout(() => _setIsInputFocused(value));
    }, []);
    const [inputValue, setInputValue] = useState('');
    const isSearching = isInputFocused || inputValue.length > 0;
    const { mutate: hideBrowser } = useHideActiveBrowserTab();

    const id = useId();
    const keyboardShift = useKeyboardHeight();
    const { mutate: openTab } = useOpenBrowserTab();
    const relevantApps = useRelevantApps(data, inputValue);
    const search = useSearchEngine();

    const onSelectApp = useCallback(
        (app: PromotedApp, from: 'banner' | 'browser' = 'browser') => {
            trackDappOpened(
                country =>
                    new AnalyticsEventDappClick({
                        location: country,
                        url: app.url,
                        from
                    })
            );
            openTab({
                url: app.url,
                title: app.name,
                iconUrl: app.icon
            });
        },
        [openTab]
    );

    const onSubmit = () => {
        if (relevantApps?.length) {
            const relevantApp = relevantApps[0];
            trackDappOpened(
                country =>
                    new AnalyticsEventDappClick({
                        location: country,
                        url: relevantApp.url,
                        from: 'browser_search'
                    })
            );
            return onSelectApp(relevantApp);
        }

        openTab({
            url: search(inputValue)
        });
    };

    const onSelectSearchRecommendations = (query: string) => {
        openTab({
            url: search(query)
        });
    };

    if (!data || !relevantApps) {
        return null;
    }

    return (
        <HideOnReview>
            <PageWrapper $keyboardShift={keyboardShift}>
                <Header>
                    <Label2>{t('browser_title')}</Label2>
                    {isSearching ? (
                        <CancelButton
                            secondary
                            size="small"
                            onClick={() => {
                                setInputValue('');
                                blurInput();
                            }}
                        >
                            {t('cancel')}
                        </CancelButton>
                    ) : (
                        <CloseButton onClick={() => hideBrowser()}>
                            <CloseIcon />
                        </CloseButton>
                    )}
                </Header>
                <PageBody>
                    <InactiveSearchContent recommendations={data} onClickApp={onSelectApp} />

                    <AnimatePresence>
                        {isSearching && (
                            <MotionDiv
                                key="new-tab-content-active"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                            >
                                <ActiveSearchContent
                                    relevantApps={relevantApps}
                                    onClickApp={onSelectApp}
                                    topLevelPromotedApps={data.apps}
                                    query={inputValue}
                                    onSelectSearchRecommendations={onSelectSearchRecommendations}
                                />
                            </MotionDiv>
                        )}
                    </AnimatePresence>
                </PageBody>
                <InputWrapper onSubmit={handleSubmit(onSubmit)} $keyboardShift={keyboardShift}>
                    <Input
                        value={inputValue}
                        id={id}
                        size="small"
                        label="Search or enter address"
                        onFocusChange={setIsInputFocused}
                        onChange={setInputValue}
                        inputMode="url"
                        enterKeyHint="go"
                        autoCorrect="off"
                        spellCheck="false"
                        autoCapitalize="off"
                    />
                    <HiddenSubmitButton type="submit" aria-hidden />
                </InputWrapper>
            </PageWrapper>
        </HideOnReview>
    );
};

const InactiveSearchContent: FC<{
    recommendations: Recommendations;
    onClickApp: (app: PromotedApp, source: 'banner' | 'browser') => void;
}> = ({ recommendations, onClickApp }) => {
    return (
        <InactiveSearchContentWrapper>
            <PromotionsCarouselStyled
                apps={recommendations.apps}
                slidesToShow={1}
                onClickApp={a => onClickApp(a, 'banner')}
            />
            {recommendations.categories.map(category => (
                <MobileProCategoryBlock
                    key={category.id}
                    category={category}
                    onClickApp={a => onClickApp(a, 'browser')}
                />
            ))}
        </InactiveSearchContentWrapper>
    );
};

const InactiveSearchContentWrapper = styled.div`
    height: 100%;
    overflow: auto;
`;

const PromotionsCarouselStyled = styled(PromotionsCarousel)`
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    flex-shrink: 0;
`;

const ActiveSearchContent: FC<{
    topLevelPromotedApps: PromotedApp[];
    relevantApps: PromotedApp[];
    query: string;
    onClickApp: (app: PromotedApp) => void;
    onSelectSearchRecommendations: (query: string) => void;
}> = ({ topLevelPromotedApps, relevantApps, onClickApp, query, onSelectSearchRecommendations }) => {
    const { data: searchRecommendations } = useSearchEngineRecommendations(query);
    const searchEngineName = useSearchEngineName();
    const { t } = useTranslation();

    return (
        <ActiveSearchContentWrapper>
            <MobileProAppsBlock apps={topLevelPromotedApps.slice(0, 4)} onClickApp={onClickApp} />
            {relevantApps.length > 0 && (
                <ListBlockStyled>
                    {relevantApps.map(app => (
                        <ListItemStyled key={app.url} onClick={() => onClickApp(app)}>
                            <ListItemElementStyled>
                                <RelevantDappImage src={app.icon} />
                                <ColumnText text={app.name} secondary={app.url} noWrap />
                            </ListItemElementStyled>
                        </ListItemStyled>
                    ))}
                </ListBlockStyled>
            )}
            {!!searchRecommendations?.length && (
                <SearchBlock>
                    <SearchHeading>
                        {searchEngineName}&nbsp;{t('browser_search')}
                    </SearchHeading>
                    {searchRecommendations.map(item => (
                        <SearchItem key={item} onClick={() => onSelectSearchRecommendations(item)}>
                            <MagnifyingGlassIcon />
                            <Body2>{item}</Body2>
                        </SearchItem>
                    ))}
                </SearchBlock>
            )}
        </ActiveSearchContentWrapper>
    );
};

const ActiveSearchContentWrapper = styled.div`
    position: absolute;
    padding: inherit;
    inset: 0;
    z-index: 1;
    flex: 1;
    background: ${p => p.theme.backgroundPage};
    overflow: auto;
`;

const SearchBlock = styled.div`
    padding: 8px 0;
`;

const SearchHeading = styled.div`
    padding: 8px 16px;
`;

const SearchItem = styled.div`
    height: 36px;
    display: flex;
    padding-left: 16px;
    gap: 12px;
    align-items: center;
    overflow: hidden;

    > *:first-child {
        flex-shrink: 0;
        color: ${p => p.theme.iconSecondary};
    }

    ${Body2} {
        overflow: hidden;
        text-overflow: ellipsis;
    }
`;

const ListBlockStyled = styled(ListBlock)`
    margin: 16px 8px 8px;
    overflow: hidden;
`;

const ListItemStyled = styled(ListItem)`
    padding: 0;
`;

const ListItemElementStyled = styled(ListItemElement)`
    padding: 7px 16px 8px !important;
    width: 100%;
    gap: 12px;
`;

const RelevantDappImage = styled.img`
    width: 40px;
    height: 40px;
    border-radius: 10px;
`;
