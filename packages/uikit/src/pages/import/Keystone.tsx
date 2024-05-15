import { useCallback } from 'react';
import { IconPage } from '../../components/Layout';
import { SignerIcon } from '../../components/create/ImportIcons';
import { Button } from '../../components/fields/Button';
import { useKeystoneScanner } from '../../hooks/keystoneScanner';
import { useTranslation } from '../../hooks/translation';
import { usePairKeystoneMutation } from '../../state/keystone';
import { styled } from 'styled-components';
import { UR } from '@keystonehq/keystone-sdk';

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
                    <SignerIcon size={144} />
                </IconBlock>
            }
            title={t('import_signer')}
            description={t('import_signer_description')}
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
