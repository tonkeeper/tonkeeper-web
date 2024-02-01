import { useCallback } from 'react';
import { styled } from 'styled-components';
import { IconPage } from '../../components/Layout';
import { SignerIcon } from '../../components/create/ImportIcons';
import { Button } from '../../components/fields/Button';
import { useScanner } from '../../hooks/scanner';
import { useTranslation } from '../../hooks/translation';
import { usePairSignerMutation } from '../../state/signer';

const IconBlock = styled.div`
    color: ${props => props.theme.accentBlue};
`;

export const PairSigner = () => {
    const { t } = useTranslation();

    const { mutate, reset, isLoading } = usePairSignerMutation();
    const onSubmit = useCallback(
        (result: string) => {
            reset();
            mutate(result);
        },
        [reset, mutate]
    );

    const openScanner = useScanner(Date.now(), onSubmit);

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
