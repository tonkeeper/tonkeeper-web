import { useEffect } from 'react';
import { eqAddresses } from '@tonkeeper/core/dist/utils/address';
import { useTranslation } from '../../hooks/translation';
import { useParams } from '../../hooks/router/useParams';
import { stakingSelectedPool$, useStakingPools } from '../../state/staking/useStakingPools';
import { usePoolInfo } from '../../state/staking/usePoolInfo';
import { useAtom } from '../../libs/useAtom';
import {
    DesktopViewHeader,
    DesktopViewHeaderContent
} from '../../components/desktop/DesktopViewLayout';
import { UnstakeForm } from '../../components/staking/UnstakeForm';
import { StakingPageWrapper, ContentWrapper } from './StakingLayout';

export const DesktopUnstakeFormPage = () => {
    const { t } = useTranslation();
    const { address } = useParams();
    const { data: pools } = useStakingPools();
    const { data: poolFromInfo } = usePoolInfo(address);
    const [, setSelectedPool] = useAtom(stakingSelectedPool$);

    useEffect(() => {
        if (address) {
            const pool = pools?.find(p => eqAddresses(p.address, address)) ?? poolFromInfo;
            if (pool) setSelectedPool(pool);
        }
        return () => setSelectedPool(undefined);
    }, [address, pools, poolFromInfo, setSelectedPool]);

    return (
        <StakingPageWrapper mobileContentPaddingTop>
            <DesktopViewHeader borderBottom>
                <DesktopViewHeaderContent title={t('staking_unstake_title')} />
            </DesktopViewHeader>
            <ContentWrapper>
                <UnstakeForm />
            </ContentWrapper>
        </StakingPageWrapper>
    );
};
