import { Body2, H2Label2Responsive } from '../Text';
import styled from 'styled-components';
import { useTranslation } from '../../hooks/translation';
import { ListBlockDesktopAdaptive, ListItem, ListItemPayload } from '../List';
import { TON_ASSET, TRON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { ColumnText } from '../Layout';
import { Checkbox } from '../fields/Checkbox';
import { AssetBlockchainBadge } from '../account/AccountBadge';
import { Button } from '../fields/Button';
import {
    useIsTronEnabledForActiveWallet,
    useIsTronEnabledGlobally,
    useToggleIsTronEnabledForActiveWallet
} from '../../state/tron/tron';
import { FC, useEffect } from 'react';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;

    ${H2Label2Responsive} {
        margin-bottom: 4px;
        text-align: center;
    }
    margin: 0 -16px;
`;

const AssetImage = styled.img<{ $noRadius?: boolean }>`
    width: 40px;
    height: 40px;

    border-radius: ${p => (p.$noRadius ? 0 : p.theme.cornerFull)};
`;

const Subtitle = styled(Body2)`
    display: block;
    max-width: 268px;
    color: ${p => p.theme.textSecondary};
    text-wrap: balance;
    text-align: center;
    margin-bottom: 24px;
`;

const CheckboxStyled = styled(Checkbox)`
    margin-left: auto;
`;

const TextWithLabel = styled.div`
    display: flex;
    gap: 6px;
`;

const ListBlockStyled = styled(ListBlockDesktopAdaptive)`
    width: 100%;
    margin-bottom: 16px;
`;

const ButtonContainer = styled.div`
    padding: 0 1rem;
    width: 100%;
    box-sizing: border-box;
`;

export const SelectWalletNetworks: FC<{ onContinue: (result: { tron: boolean }) => void }> = ({
    onContinue
}) => {
    const { t } = useTranslation();
    const { mutate: toggleTron } = useToggleIsTronEnabledForActiveWallet();
    const isTronEnabled = useIsTronEnabledForActiveWallet();
    const isTronEnabledGlobally = useIsTronEnabledGlobally();

    useEffect(() => {
        if (!isTronEnabledGlobally) {
            onContinue({ tron: false });
        }
    }, [isTronEnabledGlobally]);

    if (!isTronEnabledGlobally) {
        return null;
    }

    return (
        <Wrapper>
            <H2Label2Responsive>{t('select_networks_modal_title')}</H2Label2Responsive>
            <Subtitle>{t('select_networks_modal_subtitle')}</Subtitle>
            <ListBlockStyled>
                <ListItem hover={false}>
                    <ListItemPayload>
                        <AssetImage src={TON_ASSET.image} />
                        <ColumnText
                            text={t('select_networks_modal_ton_title')}
                            secondary={t('select_networks_modal_ton_description')}
                        />
                        <CheckboxStyled checked disabled />
                    </ListItemPayload>
                </ListItem>
                <ListItem hover={false}>
                    <ListItemPayload>
                        <AssetImage src={TRON_USDT_ASSET.image} $noRadius />
                        <ColumnText
                            text={
                                <TextWithLabel>
                                    USD₮
                                    <AssetBlockchainBadge>TRC20</AssetBlockchainBadge>
                                </TextWithLabel>
                            }
                            secondary={t('select_networks_modal_tron_description')}
                        />
                        <CheckboxStyled onChange={() => toggleTron()} checked={isTronEnabled} />
                    </ListItemPayload>
                </ListItem>
            </ListBlockStyled>
            <ButtonContainer>
                <Button fullWidth primary onClick={() => onContinue({ tron: isTronEnabled })}>
                    {t('continue')}
                </Button>
            </ButtonContainer>
        </Wrapper>
    );
};
