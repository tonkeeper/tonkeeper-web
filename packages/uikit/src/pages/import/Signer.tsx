import { useEffect, useState } from 'react';
import { styled } from 'styled-components';
import { IconPage } from '../../components/Layout';
import { SignerIcon } from '../../components/create/ImportIcons';
import { Button } from '../../components/fields/Button';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { usePairSignerMutation } from '../../state/signer';

const IconBlock = styled.div`
    color: ${props => props.theme.accentBlue};
`;

export const PairSigner = () => {
    const { t } = useTranslation();
    const sdk = useAppSdk();

    const [scanId, setScanId] = useState(Date.now());

    const { mutate, reset, isLoading } = usePairSignerMutation();
    useEffect(() => {
        sdk.uiEvents.emit('scan', {
            method: 'scan',
            id: scanId,
            params: undefined
        });
    }, [scanId]);

    useEffect(() => {
        const handler = (options: {
            method: 'response';
            id?: number | undefined;
            params: string;
        }) => {
            if (options.id === scanId) {
                reset();
                mutate(options.params);
            }
        };
        sdk.uiEvents.on('response', handler);
        return () => {
            sdk.uiEvents.off('response', handler);
        };
    }, [sdk, scanId]);

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
                    onClick={() => setScanId(Date.now())}
                >
                    {t('scan_qr_title')}
                </Button>
            }
        />
    );
};
