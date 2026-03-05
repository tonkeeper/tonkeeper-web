import { useEffect } from 'react';
import { eqAddresses } from '@tonkeeper/core/dist/utils/address';
import { useTranslation } from '../../hooks/translation';
import { useParams } from '../../hooks/router/useParams';
import { stakingSelectedPool$ } from '../../state/staking/stakingAtoms';
import { useStakingPools } from '../../state/staking/useStakingPools';
import { usePoolInfo } from '../../state/staking/usePoolInfo';
import { useAtom } from '../../libs/useAtom';
import {
    DesktopViewHeader,
    DesktopViewHeaderContent
} from '../../components/desktop/DesktopViewLayout';
import { StakingForm } from '../../components/staking/StakingForm';
import { StakingPageWrapper, ContentWrapper } from './StakingLayout';

interface DesktopStakingFormPageProps {
    poolAddress?: string;
}

export const DesktopStakingFormPage = ({ poolAddress }: DesktopStakingFormPageProps) => {
    const { t } = useTranslation();
    const { address: routeAddress } = useParams() as { address?: string };
    const address = poolAddress ?? routeAddress;
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
                <DesktopViewHeaderContent title={t('staking_title')} />
            </DesktopViewHeader>
            <ContentWrapper>
                <StakingForm />
            </ContentWrapper>
        </StakingPageWrapper>
    );
};
