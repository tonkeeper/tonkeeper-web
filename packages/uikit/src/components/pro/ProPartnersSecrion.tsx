import styled, { css } from 'styled-components';
import { Body3, Label2 } from '../Text';
import { useTranslation } from '../../hooks/translation';
import { TonkeeperProCardIcon } from '../Icon';
import { TRON_TRX_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { useTrc20FreeTransfersConfig } from '../../state/tron/tron';
import { Dot } from '../Dot';
import { useDateTimeFormat } from '../../hooks/useDateTimeFormat';
import { useProState } from '../../state/pro';
import { isValidSubscription } from '@tonkeeper/core/dist/entries/pro';
import { FLAGGED_FEATURE, useIsFeatureEnabled } from '../../state/tonendpoint';

const Wrapper = styled.div`
    width: 100%;
`;

const Heading = styled(Label2)`
    padding: 8px 0;
    display: block;
`;

export const ProSettingsPartnersSection = () => {
    const { t } = useTranslation();
    const { data: subscription } = useProState();
    const { data: config } = useTrc20FreeTransfersConfig();
    const formatDate = useDateTimeFormat();
    const isTronEnabled = useIsFeatureEnabled(FLAGGED_FEATURE.TRON);

    if (isTronEnabled || !isValidSubscription(subscription)) {
        return null;
    }

    return (
        <Wrapper>
            <Heading>{t('pro_settings_partners_section_title')}</Heading>
            <PartnersGrid>
                <PartnerCard>
                    <TonkeeperProImageWrapper>
                        <TonkeeperProCardIcon />
                        <TrxBadge src={TRON_TRX_ASSET.image} />
                    </TonkeeperProImageWrapper>
                    <PartnerCardText>
                        <Label2>
                            {t('pro_settings_partners_section_partner_pro_free_trc20_title')}
                        </Label2>
                        <Body3>
                            {t('pro_settings_partners_section_partner_pro_free_trc20_subtitle')}
                        </Body3>
                        {config?.type !== 'active' ? (
                            <Body3 />
                        ) : config.availableTransfersNumber > 0 ? (
                            <Body3>
                                {t(
                                    'pro_settings_partners_section_partner_pro_free_trc20_transfers_available',
                                    { number: config.availableTransfersNumber }
                                )}
                            </Body3>
                        ) : (
                            <span>
                                <Body3>
                                    {t(
                                        'pro_settings_partners_section_partner_pro_free_trc20_transfers_used'
                                    )}
                                </Body3>
                                <Dot />
                                <Body3>
                                    {t(
                                        'pro_settings_partners_section_partner_pro_free_trc20_transfers_used_next_on',
                                        { date: formatDate(config.rechargeDate) }
                                    )}
                                </Body3>
                            </span>
                        )}
                    </PartnerCardText>
                </PartnerCard>
            </PartnersGrid>
        </Wrapper>
    );
};

const PartnersGrid = styled.div`
    padding: 4px 0 16px;
    display: grid;
    gap: 4px;
    grid-template-columns: repeat(auto-fill, minmax(300px, 400px));

    ${p =>
        p.theme.proDisplayType === 'mobile' &&
        css`
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        `}
`;

const PartnerCard = styled.div`
    min-height: 80px;
    padding: 10px 16px;
    background: ${p => p.theme.backgroundContent};
    border-radius: ${p => p.theme.corner2xSmall};
    display: flex;
    align-items: center;
    gap: 12px;
`;

const TrxBadge = styled.img`
    position: absolute;
    bottom: -8px;
    right: -8px;
    border-radius: ${p => p.theme.cornerFull};
    height: 16px;
    width: 16px;
`;

const TonkeeperProImageWrapper = styled.div`
    position: relative;
    height: 40px;
    width: 40px;
`;

const PartnerCardText = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;

    > * {
        text-wrap: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
    }

    ${Body3}:nth-child(2) {
        opacity: 0.76;
    }

    ${Body3}:nth-child(3) {
        margin-top: auto;
        color: ${p => p.theme.textSecondary};
    }
`;
