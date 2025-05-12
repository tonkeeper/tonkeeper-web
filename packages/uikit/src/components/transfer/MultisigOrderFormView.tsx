import {
    FullHeightBlock,
    NotificationFooter,
    NotificationFooterPortal,
    NotificationHeader,
    NotificationHeaderPortal
} from '../Notification';
import React, { FC, ReactNode, useState } from 'react';
import { useAppContext } from '../../hooks/appContext';
import { useIsFullWidthMode } from '../../hooks/useIsFullWidthMode';
import { multisigOrderLifetimeMinutes, MultisigOrderLifetimeMinutes } from '../../libs/multisig';
import { styled } from 'styled-components';
import { Body2, Body3, Label2 } from '../Text';
import { DropDownContent, DropDownItem, DropDownItemsDivider } from '../DropDown';
import { useTranslation } from '../../hooks/translation';
import {
    SelectDropDown,
    SelectDropDownHost,
    SelectDropDownHostText,
    SelectField
} from '../fields/Select';
import { SwitchIcon } from '../Icon';

const DescriptionText = styled(Body2)`
    color: ${p => p.theme.textSecondary};
`;

const SelectDropDownStyled = styled(SelectDropDown)`
    padding-top: 16px;
    padding-bottom: 32px;
`;

export const MultisigOrderFormView: FC<{
    onSubmit: (form: { lifetime: MultisigOrderLifetimeMinutes }) => void;
    isAnimationProcess: boolean;
    header?: ReactNode;
    MainButton: ({
        isLoading,
        onClick
    }: {
        isLoading?: boolean;
        onClick: () => void;
    }) => React.JSX.Element;
}> = ({ isAnimationProcess, header, MainButton, onSubmit }) => {
    const isFullWidth = useIsFullWidthMode();
    const { standalone } = useAppContext();
    const shouldHideHeaderAndFooter = isFullWidth && isAnimationProcess;
    const [lifetime, lifetimeTime] = useState<MultisigOrderLifetimeMinutes>('1440');
    const { t } = useTranslation();

    const handleSubmit = () => {
        onSubmit({ lifetime });
    };

    return (
        <FullHeightBlock
            onSubmit={e => {
                e.stopPropagation();
                e.preventDefault();
                handleSubmit();
            }}
            standalone={standalone}
            noPadding
        >
            {!shouldHideHeaderAndFooter && !!header && (
                <NotificationHeaderPortal>
                    <NotificationHeader>{header}</NotificationHeader>
                </NotificationHeaderPortal>
            )}

            <DescriptionText>{t('multisig_order_select_time_description')}</DescriptionText>
            <SelectDropDownStyled
                bottom="calc(50% - 35px)"
                right="32px"
                top="unset"
                maxHeight="116px"
                payload={onClose => (
                    <DropDownContent>
                        {Object.entries(multisigOrderLifetimeMinutes).map(
                            ([value, translation]) => (
                                <>
                                    <DropDownItem
                                        isSelected={lifetime === value}
                                        key={value}
                                        onClick={() => {
                                            onClose();
                                            lifetimeTime(value as MultisigOrderLifetimeMinutes);
                                        }}
                                    >
                                        <Label2>{t(translation)}</Label2>
                                    </DropDownItem>
                                    <DropDownItemsDivider />
                                </>
                            )
                        )}
                    </DropDownContent>
                )}
            >
                <SelectField>
                    <SelectDropDownHost>
                        <SelectDropDownHostText>
                            <Body3>{t('multisig_time_to_sign_transaction')}</Body3>
                            <Body2>{t(multisigOrderLifetimeMinutes[lifetime])}</Body2>
                        </SelectDropDownHostText>
                        <SwitchIcon />
                    </SelectDropDownHost>
                </SelectField>
            </SelectDropDownStyled>

            {!shouldHideHeaderAndFooter && (
                <NotificationFooterPortal>
                    <NotificationFooter>
                        <MainButton onClick={handleSubmit} />
                    </NotificationFooter>
                </NotificationFooterPortal>
            )}
        </FullHeightBlock>
    );
};
