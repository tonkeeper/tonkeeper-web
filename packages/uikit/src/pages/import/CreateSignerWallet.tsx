import { FC, useCallback, useContext } from 'react';
import { styled } from 'styled-components';
import { IconPage } from '../../components/Layout';
import { ButtonResponsiveSize } from '../../components/fields/Button';
import { useScanner } from '../../hooks/scanner';
import { useTranslation } from '../../hooks/translation';
import { usePairSignerMutation } from '../../state/signer';
import { WalletSignerIcon } from '../../components/create/WalletIcons';
import { AddWalletContext } from '../../components/create/AddWalletContext';
import { useSetNotificationOnBack } from '../../components/Notification';

const IconBlock = styled.div`
    color: ${props => props.theme.accentBlue};
`;

export const CreateSignerWallet: FC<{ afterCompleted: () => void }> = ({ afterCompleted }) => {
    const { t } = useTranslation();

    const { mutate, reset, isLoading } = usePairSignerMutation();
    const onSubmit = useCallback(
        (result: string) => {
            reset();
            mutate(result);
            afterCompleted();
        },
        [reset, mutate, afterCompleted]
    );

    const openScanner = useScanner(Date.now(), onSubmit);

    const { navigateHome } = useContext(AddWalletContext);
    useSetNotificationOnBack(navigateHome);

    return (
        <IconPage
            icon={
                <IconBlock>
                    <WalletSignerIcon size={144} />
                </IconBlock>
            }
            title={t('import_signer')}
            description={t('import_signer_description')}
            button={
                <ButtonResponsiveSize
                    fullWidth
                    primary
                    loading={isLoading}
                    marginTop
                    onClick={openScanner}
                >
                    {t('scan_qr_title')}
                </ButtonResponsiveSize>
            }
        />
    );
};
