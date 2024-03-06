import { FC, PropsWithChildren, useState } from 'react';
import styled, { css } from 'styled-components';
import { CenterContainer } from '../../components/Layout';
import { H1 } from '../../components/Text';
import { RocketIcon, ShieldIcon } from '../../components/create/CreateIcon';
import { Description } from '../../components/create/Description';
import { ImportNotification } from '../../components/create/ImportNotification';
import { Button } from '../../components/fields/Button';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';

const Block = styled.div<{ fullHeight: boolean }>`
    display: flex;
    flex-direction: column;
    min-height: var(--app-height);
    padding: 1rem 1rem;
    box-sizing: border-box;
    position: relative;

    ${p =>
        p.theme.displayType === 'full-width' &&
        css`
            height: auto;
            min-height: unset;
            position: static;
        `}

    ${props =>
        props.fullHeight
            ? css`
                  justify-content: space-between;
              `
            : css`
                  justify-content: center;
              `}
`;

export const InitializeContainer: FC<
    PropsWithChildren<{ fullHeight?: boolean; className?: string }>
> = ({ fullHeight = true, children, className }) => {
    return (
        <Block fullHeight={fullHeight} className={className}>
            {children}
        </Block>
    );
};

const Accent = styled.span`
    color: ${props => props.theme.accentBlue};
`;

const Title = styled(H1)`
    margin-bottom: 2rem;
    user-select: none;
`;

const Initialize: FC = () => {
    const { t } = useTranslation();
    const [isOpen, setOpen] = useState(false);
    const sdk = useAppSdk();

    const onClick = () => {
        sdk.requestExtensionPermission().then(() => setOpen(true));
    };

    return (
        <CenterContainer>
            <Title>
                {t('intro_title')}
                <Accent>Tonkeeper</Accent>
            </Title>
            <div>
                <Description
                    icon={<RocketIcon />}
                    title={t('intro_item1_title')}
                    description={t('intro_item1_caption')}
                />
                <Description
                    icon={<ShieldIcon />}
                    title={t('intro_item2_title')}
                    description={t('intro_item2_caption')}
                />
            </div>
            <Button size="large" fullWidth primary marginTop onClick={onClick}>
                {t('intro_continue_btn')}
            </Button>
            <ImportNotification isOpen={isOpen} setOpen={setOpen} />
        </CenterContainer>
    );
};

export default Initialize;
