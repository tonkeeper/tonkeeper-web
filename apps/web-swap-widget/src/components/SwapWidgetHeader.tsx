import { FC } from 'react';
import styled from 'styled-components';
import { SwapRefreshButton } from '@tonkeeper/uikit/dist/components/swap/icon-buttons/SwapRefreshButton';
import { SwapSettingsButton } from '@tonkeeper/uikit/dist/components/swap/icon-buttons/SwapSettingsButton';
import { Label2 } from '@tonkeeper/uikit';
import { IconButtonTransparentBackground } from '@tonkeeper/uikit/dist/components/fields/IconButton';
import { CloseIcon } from '@tonkeeper/uikit/dist/components/Icon';
import { useTranslation } from 'react-i18next';
import { getTonkeeperInjectionContext } from '../libs/tonkeeper-injection-context';

const Wrapper = styled.div`
    margin: 8px -10px 0;
    position: relative;
    display: flex;
    align-items: center;
    height: 36px;
    box-sizing: border-box;
`;

const ButtonsWrapper = styled.div`
    position: absolute;
    inset: 0;
    gap: 12px;
    display: flex;
    align-items: center;
`;

const CloseButton = styled(IconButtonTransparentBackground)`
    margin-left: auto;
`;

const Heading = styled(Label2)`
    margin: 0 auto;
`;

export const SwapWidgetHeader: FC = () => {
    const { t } = useTranslation();

    const onClose = () => {
        getTonkeeperInjectionContext()?.close();
    };

    return (
        <Wrapper>
            <ButtonsWrapper>
                <SwapRefreshButton />
                <SwapSettingsButton />
                <CloseButton onClick={onClose}>
                    <CloseIcon />
                </CloseButton>
            </ButtonsWrapper>
            <Heading>{t('swap_title')}</Heading>
        </Wrapper>
    );
};
