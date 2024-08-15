import { FC } from 'react';
import styled, { css } from 'styled-components';
import { useAppContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { AppRoute, ImportRoute } from '../../libs/routes';
import { Body2, Body3Class, Label1, Label2Class } from '../Text';
import {
    ImportIcon,
    KeystoneIcon,
    LedgerIcon,
    RightIcon,
    SignerIcon,
    WatchOnlyIcon
} from './ImportIcons';
import { BorderSmallResponsive } from '../shared/Styles';
import { PlusIcon } from '../Icon';

const AddMethod = styled.button`
    display: flex;
    gap: 16px;
    padding: 16px;
    background: ${props => props.theme.backgroundContent};
    border: none;
    align-items: center;
    ${BorderSmallResponsive};
    text-align: left;
    cursor: pointer;

    ${p =>
        p.theme.displayType === 'full-width' &&
        css`
            padding: 10px 12px 10px 16px;
        `}

    *:last-child {
        margin-left: auto;
    }
`;

const ButtonIcon = styled.div`
    color: ${props => props.theme.accentBlue};
    height: 28px;
    display: flex;
    align-items: center;
    flex-shrink: 0;
`;

const AddMethodsWrapper = styled.div``;

const AddMethodsGroup = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 8px;
`;

const AddMethodText = styled.div`
    display: flex;
    flex-direction: column;
`;

const AddMethodLabel = styled(Label1)`
    ${p => p.theme.displayType === 'full-width' && Label2Class}
`;

const AddMethodDescription = styled(Body2)`
    color: ${p => p.theme.textSecondary};
    ${p => p.theme.displayType === 'full-width' && Body3Class}
`;

const GroupsDivider = styled(Body2)`
    display: block;
    text-align: center;
    color: ${p => p.theme.textSecondary};
    margin: 24px 0 16px;
`;

const PlusIconStyled = styled(PlusIcon)`
    height: 28px;
    width: 28px;
`;

export const AddWalletContent: FC<{ onSelect: (path: string) => void }> = ({ onSelect }) => {
    const { t } = useTranslation();
    const { hideMam, hideSigner, hideLedger, hideKeystone } = useAppContext();
    const hideAllHardwareWallets = hideSigner && hideLedger && hideKeystone;

    return (
        <AddMethodsWrapper>
            <AddMethodsGroup>
                <AddMethod onClick={() => onSelect(AppRoute.import + ImportRoute.create)}>
                    <ButtonIcon>
                        <PlusIconStyled />
                    </ButtonIcon>
                    <AddMethodText>
                        <AddMethodLabel>{t('import_new_wallet')}</AddMethodLabel>
                        <AddMethodDescription>
                            {t('import_new_wallet_description')}
                        </AddMethodDescription>
                    </AddMethodText>
                    <ButtonIcon>
                        <RightIcon />
                    </ButtonIcon>
                </AddMethod>
                {!hideMam && (
                    <AddMethod onClick={() => onSelect(AppRoute.import + ImportRoute.mam)}>
                        <ButtonIcon>
                            <PlusIconStyled />
                        </ButtonIcon>
                        <AddMethodText>
                            <AddMethodLabel>{t('add_wallet_modal_mam_title')}</AddMethodLabel>
                            <AddMethodDescription>
                                {t('add_wallet_modal_mam_subtitle')}
                            </AddMethodDescription>
                        </AddMethodText>
                        <ButtonIcon>
                            <RightIcon />
                        </ButtonIcon>
                    </AddMethod>
                )}
                <AddMethod onClick={() => onSelect(AppRoute.import + ImportRoute.import)}>
                    <ButtonIcon>
                        <ImportIcon />
                    </ButtonIcon>
                    <AddMethodText>
                        <AddMethodLabel>{t('import_existing_wallet')}</AddMethodLabel>
                        <AddMethodDescription>
                            {t('import_existing_wallet_description')}
                        </AddMethodDescription>
                    </AddMethodText>
                    <ButtonIcon>
                        <RightIcon />
                    </ButtonIcon>
                </AddMethod>
                <AddMethod onClick={() => onSelect(AppRoute.import + ImportRoute.readOnly)}>
                    <ButtonIcon>
                        <WatchOnlyIcon />
                    </ButtonIcon>
                    <AddMethodText>
                        <AddMethodLabel>{t('add_wallet_modal_watch_only_title')}</AddMethodLabel>
                        <AddMethodDescription>
                            {t('add_wallet_modal_watch_only_subtitle')}
                        </AddMethodDescription>
                    </AddMethodText>
                    <ButtonIcon>
                        <RightIcon />
                    </ButtonIcon>
                </AddMethod>
            </AddMethodsGroup>
            {!hideAllHardwareWallets && (
                <>
                    <GroupsDivider>{t('add_wallet_group_hardware_title')}</GroupsDivider>
                    <AddMethodsGroup>
                        {!hideSigner && (
                            <AddMethod
                                onClick={() => onSelect(AppRoute.import + ImportRoute.signer)}
                            >
                                <ButtonIcon>
                                    <SignerIcon />
                                </ButtonIcon>
                                <AddMethodText>
                                    <AddMethodLabel>{t('import_signer')}</AddMethodLabel>
                                    <AddMethodDescription>
                                        {t('import_signer_description')}
                                    </AddMethodDescription>
                                </AddMethodText>
                                <ButtonIcon>
                                    <RightIcon />
                                </ButtonIcon>
                            </AddMethod>
                        )}
                        {!hideLedger && (
                            <AddMethod
                                onClick={() => onSelect(AppRoute.import + ImportRoute.ledger)}
                            >
                                <ButtonIcon>
                                    <LedgerIcon />
                                </ButtonIcon>
                                <AddMethodText>
                                    <AddMethodLabel>{t('ledger_pair_title')}</AddMethodLabel>
                                    <AddMethodDescription>
                                        {t('ledger_pair_subtitle')}
                                    </AddMethodDescription>
                                </AddMethodText>
                                <ButtonIcon>
                                    <RightIcon />
                                </ButtonIcon>
                            </AddMethod>
                        )}
                        {!hideKeystone && (
                            <AddMethod
                                onClick={() => onSelect(AppRoute.import + ImportRoute.keystone)}
                            >
                                <ButtonIcon>
                                    <KeystoneIcon />
                                </ButtonIcon>
                                <AddMethodText>
                                    <AddMethodLabel>{t('keystone_pair_title')}</AddMethodLabel>
                                    <AddMethodDescription>
                                        {t('keystone_pair_subtitle')}
                                    </AddMethodDescription>
                                </AddMethodText>
                                <ButtonIcon>
                                    <RightIcon />
                                </ButtonIcon>
                            </AddMethod>
                        )}
                    </AddMethodsGroup>
                </>
            )}
        </AddMethodsWrapper>
    );
};
