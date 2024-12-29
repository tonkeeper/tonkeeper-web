import UR from '@ngraveio/bc-ur/dist/ur';
import { FC, useCallback, useContext } from 'react';
import { styled } from 'styled-components';
import { IconPage } from '../../components/Layout';
import { Button } from '../../components/fields/Button';
import { useKeystoneScanner } from '../../hooks/keystoneScanner';
import { useTranslation } from '../../hooks/translation';
import { usePairKeystoneMutation } from '../../state/keystone';
import { WalletKeystoneIcon } from '../../components/create/WalletIcons';
import { AddWalletContext } from '../../components/create/AddWalletContext';
import { useSetNotificationOnBack } from '../../components/Notification';

const IconBlock = styled.div`
    color: ${props => props.theme.accentBlue};
`;

export const CreateKeystoneWallet: FC<{ afterCompleted: () => void }> = ({ afterCompleted }) => {
    const { t } = useTranslation();

    const { mutateAsync, reset, isLoading } = usePairKeystoneMutation();
    const onSubmit = useCallback(
        async (result: UR) => {
            reset();
            await mutateAsync(result);
            afterCompleted();
        },
        [reset, mutateAsync, afterCompleted]
    );

    const openScanner = useKeystoneScanner(Date.now(), onSubmit);

    const { navigateHome } = useContext(AddWalletContext);
    useSetNotificationOnBack(navigateHome);

    return (
        <IconPage
            icon={
                <IconBlock>
                    <WalletKeystoneIcon size={144} />
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
