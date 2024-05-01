import { FC } from 'react';
import styled from 'styled-components';
import { useOnImportAction } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { AppRoute, ImportRoute } from '../../libs/routes';
import { ColumnText } from '../Layout';
import { Notification } from '../Notification';
import { Body1, H2 } from '../Text';
import { AddIcon, ImportIcon, RightIcon, SignerIcon } from './ImportIcons';

const Title = styled(H2)`
    user-select: none;
`;
const BodyText = styled(Body1)`
    color: ${props => props.theme.textSecondary};
    user-select: none;
`;
const TextBlock = styled.div`
    text-align: center;
    margin-bottom: 2rem;
`;

const ButtonBlock = styled.div`
    display: flex;
    gap: 16px;
    padding: 16px;
    background: ${props => props.theme.backgroundContent};
    cursor: pointer;
    align-items: center;
    margin: 0 16px 16px;
    border-radius: ${props => props.theme.cornerLarge};
`;

const ButtonIcon = styled.div`
    color: ${props => props.theme.accentBlue};
    height: 28px;
    display: flex;
    align-items: center;
    flex-shrink: 0;
`;

export const ImportNotification: FC<{
    isOpen: boolean;
    setOpen: (value: boolean) => void;
}> = ({ isOpen, setOpen }) => {
    const { t } = useTranslation();
    const onImport = useOnImportAction();

    return (
        <Notification isOpen={isOpen} handleClose={() => setOpen(false)}>
            {onClose => (
                <div>
                    <TextBlock>
                        <Title>{t('import_add_wallet')}</Title>
                        <BodyText>{t('import_add_wallet_description')}</BodyText>
                    </TextBlock>
                    <ButtonBlock
                        onClick={() => {
                            onClose(() => onImport(AppRoute.import + ImportRoute.create));
                        }}
                    >
                        <ButtonIcon>
                            <AddIcon />
                        </ButtonIcon>
                        <ColumnText
                            noWrap
                            text={t('import_new_wallet')}
                            secondary={t('import_new_wallet_description')}
                        />
                        <ButtonIcon>
                            <RightIcon />
                        </ButtonIcon>
                    </ButtonBlock>
                    <ButtonBlock
                        onClick={() => {
                            onClose(() => onImport(AppRoute.import + ImportRoute.import));
                        }}
                    >
                        <ButtonIcon>
                            <ImportIcon />
                        </ButtonIcon>
                        <ColumnText
                            noWrap
                            text={t('import_existing_wallet')}
                            secondary={t('import_existing_wallet_description')}
                        />
                        <ButtonIcon>
                            <RightIcon />
                        </ButtonIcon>
                    </ButtonBlock>
                    <ButtonBlock
                        onClick={() => {
                            onClose(() => onImport(AppRoute.import + ImportRoute.signer));
                        }}
                    >
                        <ButtonIcon>
                            <SignerIcon />
                        </ButtonIcon>
                        <ColumnText
                            noWrap
                            text={t('import_signer')}
                            secondary={t('import_signer_description')}
                        />
                        <ButtonIcon>
                            <RightIcon />
                        </ButtonIcon>
                    </ButtonBlock>
                </div>
            )}
        </Notification>
    );
};
