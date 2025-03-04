import styled from 'styled-components';
import { Label2Class } from '../../../Text';
import { FC, PropsWithChildren } from 'react';
import { Link } from '../../../shared/Link';
import { useTranslation } from '../../../../hooks/translation';

export const WidgetHeaderStyled = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;

    ${Label2Class}
`;

const LinkStyled = styled(Link)`
    color: ${p => p.theme.accentBlueConstant};
`;

export const WidgetHeader: FC<PropsWithChildren<{ className?: string; to: string }>> = ({
    className,
    children,
    to
}) => {
    const { t } = useTranslation();
    return (
        <WidgetHeaderStyled className={className}>
            {children}
            <LinkStyled to={to}>{t('browser_apps_all')}</LinkStyled>
        </WidgetHeaderStyled>
    );
};
