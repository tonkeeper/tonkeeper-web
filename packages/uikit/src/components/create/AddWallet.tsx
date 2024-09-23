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
import { PencilIcon, PlusIcon } from '../Icon';
import { Badge } from '../shared';
import { useAccountsState } from '../../state/wallet';

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

    >:last-child {
        margin-left: auto;
    }
`;

const ButtonIcon = styled.div<{ large?: boolean }>`
    color: ${props => props.theme.accentBlue};
    height: 28px;
    display: flex;
    align-items: center;
    flex-shrink: 0;

    ${p =>
        p.large &&
        css`
            > svg {
                width: 28px;
                height: 28px;
            }
        `}
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
    display: flex;
    align-items: center;
    gap: 4px;
    color: ${p => p.theme.textPrimary};
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

export const AddWalletContent: FC<{ onSelect: (path: string) => void }> = ({ onSelect }) => {
    const { t } = useTranslation();
    const { hideMam, hideSigner, hideLedger, hideKeystone, hideMultisig } = useAppContext();
    const hideAllHardwareWallets = hideSigner && hideLedger && hideKeystone;

    const accounts = useAccountsState();
    const canAddMultisig = accounts.some(
        acc => acc.type !== 'watch-only' && acc.type !== 'ton-multisig'
    );

    return (
        <AddMethodsWrapper>
            <AddMethodsGroup>
                <AddMethod onClick={() => onSelect(AppRoute.import + ImportRoute.create)}>
                    <ButtonIcon large>
                        <PlusIcon />
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
                        <ButtonIcon large>
                            <PlusIcon />
                        </ButtonIcon>
                        <AddMethodText>
                            <AddMethodLabel>
                                {t('add_wallet_modal_mam_title')}
                                <Badge color="accentOrange">Beta</Badge>
                            </AddMethodLabel>
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
                    <ButtonIcon large>
                        <ImportIcon />
                    </ButtonIcon>
                    <AddMethodText>
                        <AddMethodLabel>{t('import_existing_wallet')}</AddMethodLabel>
                        <AddMethodDescription>
                            {t('import_existing_wallet_description_extended')}
                        </AddMethodDescription>
                    </AddMethodText>
                    <ButtonIcon>
                        <RightIcon />
                    </ButtonIcon>
                </AddMethod>
                <AddMethod onClick={() => onSelect(AppRoute.import + ImportRoute.readOnly)}>
                    <ButtonIcon large>
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
                {canAddMultisig && !hideMultisig && (
                    <AddMethod onClick={() => onSelect('multisig')}>
                        <ButtonIcon large>
                            <PencilIcon />
                        </ButtonIcon>
                        <AddMethodText>
                            <AddMethodLabel>
                                {t('add_wallet_new_multisig_title')}{' '}
                                <Badge color="accentBlue">PRO</Badge>
                            </AddMethodLabel>
                            <AddMethodDescription>
                                {t('add_wallet_new_multisig_description')}
                            </AddMethodDescription>
                        </AddMethodText>
                        <ButtonIcon>
                            <RightIcon />
                        </ButtonIcon>
                    </AddMethod>
                )}
            </AddMethodsGroup>
            {!hideAllHardwareWallets && (
                <>
                    <GroupsDivider>{t('add_wallet_group_hardware_title')}</GroupsDivider>
                    <AddMethodsGroup>
                        {!hideSigner && (
                            <AddMethod
                                onClick={() => onSelect(AppRoute.import + ImportRoute.signer)}
                            >
                                <ButtonIcon large>
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
                                <ButtonIcon large>
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
                                <ButtonIcon large>
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
