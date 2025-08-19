import styled from "styled-components";
import { Body1, Container, H2 } from "@tonkeeper/uikit";
import { TonkeeperSvgIcon } from "@tonkeeper/uikit/dist/components/Icon";
import { useTranslation } from "react-i18next";

const RegionIsNotSupportedWrapper = styled(Container)`
    height: var(--app-height);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
`;

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 32px 48px;
    text-align: center;
`

const TonkeeperIconBox = styled.div`
    background: ${p => p.theme.backgroundContent};
    border-radius: 26px;
    margin-bottom: 20px;
    padding: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${p => p.theme.accentBlue};
`

const Body1Styled = styled(Body1)`
    margin-top: 4px;
    color: ${p => p.theme.textSecondary};
`

export const RegionIsNotSupported = () => {
  const { t } = useTranslation();
    return (
        <RegionIsNotSupportedWrapper>
            <ContentWrapper>
              <TonkeeperIconBox>
                <TonkeeperSvgIcon size="68" />
              </TonkeeperIconBox>
              <H2>{t('tonkeeper_is_not_available_in_region_title')}</H2>
              <Body1Styled>{t('tonkeeper_is_not_available_in_region_description')}</Body1Styled>
            </ContentWrapper>
        </RegionIsNotSupportedWrapper>
    );
};
