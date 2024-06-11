import { css, styled } from 'styled-components';
import { Body2, Body3 } from '../../../Text';
import { getDecimalSeparator } from '@tonkeeper/core/dist/utils/formatting';
import { useTranslation } from '../../../../hooks/translation';

const ImportTableContainer = styled.div`
    display: grid;
    grid-template-columns: auto min-content auto 130px;
`;

const TDBasic = styled.div<{ borderBottom?: boolean }>`
    padding: 8px 12px;
    box-sizing: border-box;
    background: ${p => p.theme.backgroundContent};
    &:nth-child(4n + 1) {
        border-left: 1px solid ${p => p.theme.separatorCommon};
    }

    border-top: 1px solid ${p => p.theme.separatorCommon};
    ${p =>
        p.borderBottom &&
        css`
            border-bottom: 1px solid ${p => p.theme.separatorCommon};
        `};
    border-right: 1px solid ${p => p.theme.separatorCommon};
`;

const TD = styled(TDBasic)<{
    corner?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}>`
    font-family: ${p => p.theme.fontMono};
    overflow: hidden;
    text-overflow: ellipsis;
    ${p => p.corner && `border-${p.corner}-radius: ${p.theme.corner2xSmall}`};
`;

const TH = styled(TDBasic)`
    color: ${p => p.theme.textTertiary};
    &:first-child {
        border-top-left-radius: ${p => p.theme.corner2xSmall};
        border-bottom-left-radius: ${p => p.theme.corner2xSmall};
    }

    &:nth-child(4) {
        border-top-right-radius: ${p => p.theme.corner2xSmall};
        border-bottom-right-radius: ${p => p.theme.corner2xSmall};
    }
`;

const Body2Secondary = styled(Body2)`
    color: ${p => p.theme.textSecondary};
`;

const Body2Tertiary = styled(Body2)`
    color: ${p => p.theme.textTertiary};
`;

const Gap = styled.div`
    height: 8px;
`;

export const ImportListTable = () => {
    const { t } = useTranslation();
    return (
        <ImportTableContainer>
            <TH borderBottom>
                <Body3>{t('import_multisend_table_heading_address')}</Body3>
            </TH>
            <TH borderBottom>
                <Body3>{t('import_multisend_table_heading_amount')}</Body3>
            </TH>
            <TH borderBottom>
                <Body3>{t('import_multisend_table_heading_asset')}</Body3>
            </TH>
            <TH borderBottom>
                <Body3>{t('import_multisend_table_heading_comment')}</Body3>
            </TH>
            <Gap />
            <Gap />
            <Gap />
            <Gap />
            <TD corner="top-left">
                <Body2Secondary>A</Body2Secondary>
            </TD>
            <TD>
                <Body2Secondary>B</Body2Secondary>
            </TD>
            <TD>
                <Body2Secondary>C</Body2Secondary>
            </TD>
            <TD corner="top-right">
                <Body2Secondary>D</Body2Secondary>
            </TD>
            <TD>
                <Body2>UQD2NmD_lH5f5u1Kj3KfGyTvhZSX0Eg6qp2a5IQUKXxOGzCi</Body2>
            </TD>
            <TD>
                <Body2>1000{getDecimalSeparator()}01</Body2>
            </TD>
            <TD>
                <Body2>TON</Body2>
            </TD>
            <TD>
                <Body2>Salary</Body2>
            </TD>
            <TD>
                <Body2>battery.ton</Body2>
            </TD>
            <TD>
                <Body2>1</Body2>
            </TD>
            <TD>
                <Body2>USD</Body2>
            </TD>
            <TD>
                <Body2>UQD2NmD_lH5f5u1Kj3KfGyTvhZSX0Eg6qp2a5IQUKXxOGzCi</Body2>
            </TD>
            <TD corner="bottom-left" borderBottom>
                <Body2>0:5b078c0f27fdb92ddb8a2aa987bdd9b8425879fb7d5991431c781142b7a60dcf</Body2>
            </TD>
            <TD borderBottom>
                <Body2>11{getDecimalSeparator()}1</Body2>
            </TD>
            <TD borderBottom>
                <Body2>UQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_p0p</Body2>
            </TD>
            <TD corner="bottom-right" borderBottom>
                <Body2Tertiary>{t('import_multisend_table_comment')}</Body2Tertiary>
            </TD>
        </ImportTableContainer>
    );
};
