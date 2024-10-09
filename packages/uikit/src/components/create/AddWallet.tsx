import { FC } from 'react';
import styled, { css } from 'styled-components';
import { useAppContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { Body2, Body3Class, Label1, Label2Class } from '../Text';
import { BorderSmallResponsive } from '../shared/Styles';
import { Badge } from '../shared';
import { useAccountsState } from '../../state/wallet';
import {
    WalletImportIcon,
    WalletKeystoneIcon,
    WalletLedgerIcon,
    WalletMagnifyingGlassIcon,
    WalletPencilIcon,
    WalletPlusIcon,
    WalletSignerIcon
} from './WalletIcons';
import { ChevronRightIcon } from '../Icon';

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

const ButtonIcon = styled.div`
    color: ${props => props.theme.accentBlue};
    flex-shrink: 0;
`;

const RightIconStyled = styled(ChevronRightIcon)`
    color: ${props => props.theme.iconTertiary};
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

export const addWalletMethod = [
    'multisig',
    'create-standard',
    'create-mam',
    'import',
    'watch-only',
    'signer',
    'keystone',
    'ledger'
] as const;
export type AddWalletMethod = (typeof addWalletMethod)[number];

export const AddWalletContent: FC<{ onSelect: (path: AddWalletMethod) => void }> = ({
    onSelect
}) => {
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
                <AddMethod onClick={() => onSelect('create-standard')}>
                    <ButtonIcon>
                        <WalletPlusIcon />
                    </ButtonIcon>
                    <AddMethodText>
                        <AddMethodLabel>{t('import_new_wallet')}</AddMethodLabel>
                        <AddMethodDescription>
                            {t('import_new_wallet_description')}
                        </AddMethodDescription>
                    </AddMethodText>
                    <RightIconStyled />
                </AddMethod>
                {!hideMam && (
                    <AddMethod onClick={() => onSelect('create-mam')}>
                        <ButtonIcon>
                            <WalletPlusIcon />
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
                        <RightIconStyled />
                    </AddMethod>
                )}
                <AddMethod onClick={() => onSelect('import')}>
                    <ButtonIcon>
                        <WalletImportIcon />
                    </ButtonIcon>
                    <AddMethodText>
                        <AddMethodLabel>{t('import_existing_wallet')}</AddMethodLabel>
                        <AddMethodDescription>
                            {t('import_existing_wallet_description_extended')}
                        </AddMethodDescription>
                    </AddMethodText>
                    <RightIconStyled />
                </AddMethod>
                <AddMethod onClick={() => onSelect('watch-only')}>
                    <ButtonIcon>
                        <WalletMagnifyingGlassIcon />
                    </ButtonIcon>
                    <AddMethodText>
                        <AddMethodLabel>{t('add_wallet_modal_watch_only_title')}</AddMethodLabel>
                        <AddMethodDescription>
                            {t('add_wallet_modal_watch_only_subtitle')}
                        </AddMethodDescription>
                    </AddMethodText>
                    <RightIconStyled />
                </AddMethod>
                {canAddMultisig && !hideMultisig && (
                    <AddMethod onClick={() => onSelect('multisig')}>
                        <ButtonIcon>
                            <WalletPencilIcon />
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
                        <RightIconStyled />
                    </AddMethod>
                )}
            </AddMethodsGroup>
            {!hideAllHardwareWallets && (
                <>
                    <GroupsDivider>{t('add_wallet_group_hardware_title')}</GroupsDivider>
                    <AddMethodsGroup>
                        {!hideSigner && (
                            <AddMethod onClick={() => onSelect('signer')}>
                                <ButtonIcon>
                                    <WalletSignerIcon />
                                </ButtonIcon>
                                <AddMethodText>
                                    <AddMethodLabel>{t('import_signer')}</AddMethodLabel>
                                    <AddMethodDescription>
                                        {t('import_signer_description')}
                                    </AddMethodDescription>
                                </AddMethodText>
                                <RightIconStyled />
                            </AddMethod>
                        )}
                        {!hideLedger && (
                            <AddMethod onClick={() => onSelect('ledger')}>
                                <ButtonIcon>
                                    <WalletLedgerIcon />
                                </ButtonIcon>
                                <AddMethodText>
                                    <AddMethodLabel>{t('ledger_pair_title')}</AddMethodLabel>
                                    <AddMethodDescription>
                                        {t('ledger_pair_subtitle')}
                                    </AddMethodDescription>
                                </AddMethodText>
                                <RightIconStyled />
                            </AddMethod>
                        )}
                        {!hideKeystone && (
                            <AddMethod onClick={() => onSelect('keystone')}>
                                <ButtonIcon>
                                    <WalletKeystoneIcon />
                                </ButtonIcon>
                                <AddMethodText>
                                    <AddMethodLabel>{t('keystone_pair_title')}</AddMethodLabel>
                                    <AddMethodDescription>
                                        {t('keystone_pair_subtitle')}
                                    </AddMethodDescription>
                                </AddMethodText>
                                <RightIconStyled />
                            </AddMethod>
                        )}
                    </AddMethodsGroup>
                </>
            )}
        </AddMethodsWrapper>
    );
};
