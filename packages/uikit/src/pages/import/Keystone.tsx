import UR from '@ngraveio/bc-ur/dist/ur';
import { useCallback } from 'react';
import { styled } from 'styled-components';
import { IconPage } from '../../components/Layout';
import { KeystoneIcon } from '../../components/create/ImportIcons';
import { Button } from '../../components/fields/Button';
import { useKeystoneScanner } from '../../hooks/keystoneScanner';
import { useTranslation } from '../../hooks/translation';
import { usePairKeystoneMutation } from '../../state/keystone';

const IconBlock = styled.div`
    color: ${props => props.theme.accentBlue};
`;

export const PairKeystone = () => {
    const { t } = useTranslation();

    const { mutate, reset, isLoading } = usePairKeystoneMutation();
    const onSubmit = useCallback(
        (result: UR) => {
            reset();
            mutate(result);
        },
        [reset, mutate]
    );

    const openScanner = useKeystoneScanner(Date.now(), onSubmit);

    return (
        <IconPage
            logOut
            icon={
                <IconBlock>
                    <KeystoneIcon size={144} />
                </IconBlock>
            }
            title={t('keystone_pair_title')}
            description={t('keystone_pair_subtitle')}
            button={
                <Button
                    size="large"
                    fullWidth
                    primary
                    loading={isLoading}
                    marginTop
                    onClick={openScanner}
                >
                    {t('scan_qr_title')}
                </Button>
            }
        />
    );
};
