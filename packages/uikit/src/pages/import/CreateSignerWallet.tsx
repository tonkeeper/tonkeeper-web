import { FC, useCallback, useContext } from 'react';
import { styled } from 'styled-components';
import { IconPage } from '../../components/Layout';
import { ButtonResponsiveSize } from '../../components/fields/Button';
import { useScanner } from '../../hooks/scanner';
import { useTranslation } from '../../hooks/translation';
import { WalletSignerIcon } from '../../components/create/WalletIcons';
import { AddWalletContext } from '../../components/create/AddWalletContext';
import { useSetNotificationOnBack } from '../../components/Notification';
import { useParseAndAddSigner } from '../../state/wallet';
import { useAppSdk, useAppTargetEnv } from '../../hooks/appSdk';
import { ForTargetEnv, NotForTargetEnv } from '../../components/shared/TargetEnv';

const IconBlock = styled.div`
    color: ${props => props.theme.accentBlue};
`;

const ButtonsContainer = styled.div`
    display: flex;
    align-items: center;
    width: 100%;
    gap: 8px;
    flex-direction: column;
`;

export const CreateSignerWallet: FC<{ afterCompleted: () => void }> = ({ afterCompleted }) => {
    const { t } = useTranslation();

    const { mutateAsync, reset, isLoading } = useParseAndAddSigner();
    const onSubmit = useCallback(
        async (link: string) => {
            reset();
            await mutateAsync({ link, source: 'qr' });
            afterCompleted();
        },
        [reset, mutateAsync, afterCompleted]
    );
    const env = useAppTargetEnv();

    const openScanner = useScanner(
        env === 'mobile' || env === 'tablet' ? null : Date.now(),
        onSubmit
    );

    const { navigateHome } = useContext(AddWalletContext);
    useSetNotificationOnBack(navigateHome);
    const sdk = useAppSdk();

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
                <>
                    <ForTargetEnv env="mobile">
                        <ButtonsContainer>
                            <ButtonResponsiveSize
                                primary
                                fullWidth
                                marginTop
                                onClick={() => sdk.openPage('tonsign://v1')}
                            >
                                {t('pairSigner_open_signer')}
                            </ButtonResponsiveSize>
                            <ButtonResponsiveSize
                                fullWidth
                                loading={isLoading}
                                marginTop
                                onClick={openScanner}
                            >
                                {t('scan_qr_title')}
                            </ButtonResponsiveSize>
                        </ButtonsContainer>
                    </ForTargetEnv>
                    <NotForTargetEnv env="mobile">
                        <ButtonResponsiveSize
                            fullWidth
                            primary
                            loading={isLoading}
                            marginTop
                            onClick={openScanner}
                        >
                            {t('scan_qr_title')}
                        </ButtonResponsiveSize>
                    </NotForTargetEnv>
                </>
            }
        />
    );
};
