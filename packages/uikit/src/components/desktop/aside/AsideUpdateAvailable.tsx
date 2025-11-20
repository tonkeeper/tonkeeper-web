import styled from 'styled-components';
import { Body3, Label2 } from '../../Text';
import { useTranslation } from '../../../hooks/translation';
import { RefreshIcon } from '../../Icon';
import { useAppSdk } from '../../../hooks/appSdk';
import { useMayBeAtomValue } from '../../../libs/useAtom';

const Wrapper = styled.button`
    margin-top: 6px;
    border: none;
    background: ${p => p.theme.backgroundContentTint};
    border-radius: ${p => p.theme.corner2xSmall};
    padding: 6px 12px 6px 10px;
    display: flex;
    align-items: center;
    gap: 10px;
`;

const TextWrapper = styled.div`
    display: flex;
    align-items: flex-start;
    flex-direction: column;
    text-align: start;

    ${Body3} {
        color: ${p => p.theme.textSecondary};
    }
`;

export const AsideUpdateAvailable = () => {
    const { t } = useTranslation();

    const autoUpdater = useAppSdk()?.autoUpdater;
    const newVersionAvailable = useMayBeAtomValue(autoUpdater?.newVersionAvailable);

    if (!newVersionAvailable) {
        return null;
    }

    return (
        <Wrapper onClick={() => autoUpdater!.installAndQuit()}>
            <RefreshIcon color="iconSecondary" />
            <TextWrapper>
                <Label2>Tonkeeper {newVersionAvailable}</Label2>
                <Body3>{t('update_click_to_install')}</Body3>
            </TextWrapper>
        </Wrapper>
    );
};
