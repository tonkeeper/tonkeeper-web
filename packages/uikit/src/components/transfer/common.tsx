import { QueryClient } from '@tanstack/react-query';
import { IAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { jettonToTonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { TonRecipientData } from '@tonkeeper/core/dist/entries/send';
import { TonTransferParams } from '@tonkeeper/core/dist/service/deeplinkingService';
import { seeIfBalanceError, seeIfTimeError } from '@tonkeeper/core/dist/service/transfer/common';
import { Account, JettonsBalances } from '@tonkeeper/core/dist/tonApiV2';
import React, { FC, PropsWithChildren } from 'react';
import styled, { css, useTheme } from 'styled-components';
import { useAppContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { ChevronLeftIcon } from '../Icon';
import { NotificationCancelButton, NotificationTitleBlock } from '../Notification';
import { Body1, H3 } from '../Text';
import { RoundedButton, ButtonMock } from '../fields/RoundedButton';
import { Button } from '../fields/Button';
import { Center, Title } from './amountView/AmountViewUI';
import { AmountState } from './amountView/amountState';
import { useIsActiveWalletLedger } from '../../state/ledger';

export const duration = 300;
export const timingFunction = 'ease-in-out';

const rightToLeft = 'right-to-left';
const leftToTight = 'left-to-right';

const ButtonBlockElement = styled.div<{ standalone: boolean }>`
    position: fixed;
    padding: 0 1rem;
    box-sizing: border-box;
    width: var(--app-width);

    &:after {
        content: '';
        position: absolute;
        width: 100%;
        left: 0;
        ${props =>
            props.standalone
                ? css`
                      bottom: -2rem;
                  `
                : css`
                      bottom: -1rem;
                  `}
        height: calc(100% + 2rem);
        z-index: -1;
        background: ${props => props.theme.gradientBackgroundBottom};
    }

    ${props =>
        props.standalone
            ? css`
                  bottom: 2rem;
              `
            : css`
                  bottom: 1rem;
              `}
`;

export const Wrapper = styled.div<{ standalone: boolean; extension: boolean; fullWidth?: boolean }>`
    position: relative;
    overflow: hidden;
    background-color: ${props => props.theme.backgroundPage};

    ${props =>
        props.fullWidth
            ? css`
                  width: 100%;
              `
            : undefined}

    ${props =>
        props.extension
            ? undefined
            : css`
                  margin-bottom: -1rem;
              `}

    .${rightToLeft}-exit, .${leftToTight}-exit {
        position: absolute;
        inset: 0;
        transform: translateX(0);
        opacity: 1;
    }

    .${rightToLeft}-enter {
        transform: translateX(100%);
        opacity: 0;
    }
    .${rightToLeft}-enter-active {
        transform: translateX(0);
        opacity: 1;
        transition: transform ${duration}ms ${timingFunction},
            opacity ${duration / 2}ms ${timingFunction};
    }

    .${rightToLeft}-exit-active {
        transform: translateX(-100%);
        opacity: 0;
        transition: transform ${duration}ms ${timingFunction},
            opacity ${duration / 2}ms ${timingFunction};
    }

    .${leftToTight}-enter {
        transform: translateX(-100%);
        opacity: 0;
    }
    .${leftToTight}-enter-active {
        transform: translateX(0);
        opacity: 1;
        transition: transform ${duration}ms ${timingFunction},
            opacity ${duration / 2}ms ${timingFunction};
    }

    .${leftToTight}-exit-active {
        transform: translateX(100%);
        opacity: 0;
        transition: transform ${duration}ms ${timingFunction},
            opacity ${duration / 2}ms ${timingFunction};
    }

    .${leftToTight}-exit-active
        ${ButtonBlockElement},
        .${leftToTight}-enter-active
        ${ButtonBlockElement},
        .${rightToLeft}-exit-active
        ${ButtonBlockElement},
        .${rightToLeft}-enter-active
        ${ButtonBlockElement} {
        display: none;

        position: absolute !important;

        ${props =>
            props.standalone && !props.extension
                ? css`
                      bottom: 1rem !important;
                  `
                : undefined}
    }
`;

export const ButtonBlock = React.forwardRef<HTMLDivElement, PropsWithChildren>(
    ({ children }, ref) => {
        const { standalone, extension } = useAppContext();
        const { displayType } = useTheme();

        if (displayType === 'full-width') {
            return <>{children}</>;
        }

        return (
            <ButtonBlockElement ref={ref} standalone={standalone && !extension}>
                {children}
            </ButtonBlockElement>
        );
    }
);
ButtonBlock.displayName = 'ButtonBlock';

export const MainButton = ({ isLoading, onClick }: { isLoading: boolean; onClick: () => void }) => {
    const { t } = useTranslation();

    return (
        <ButtonBlock>
            <Button
                fullWidth
                size="large"
                primary
                type="submit"
                loading={isLoading}
                onClick={onClick}
            >
                {t('continue')}
            </Button>
        </ButtonBlock>
    );
};

export type AmountMainButtonComponent = (props: {
    isLoading: boolean;
    isDisabled: boolean;
    onClick: () => void;
    ref: React.RefObject<HTMLDivElement>;
}) => JSX.Element;

interface AmountMainButtonProps {
    isLoading: boolean;
    isDisabled: boolean;
    onClick: () => void;
}
export const AmountMainButton = React.forwardRef<HTMLDivElement, AmountMainButtonProps>(
    ({ isLoading, isDisabled, onClick }, refButton) => {
        const { t } = useTranslation();

        return (
            <ButtonBlock ref={refButton}>
                <Button
                    fullWidth
                    size="large"
                    primary
                    type="submit"
                    disabled={isDisabled}
                    loading={isLoading}
                    onClick={onClick}
                >
                    {t('continue')}
                </Button>
            </ButtonBlock>
        );
    }
) as AmountMainButtonComponent;

export type ConfirmMainButtonProps = (props: {
    isLoading: boolean;
    isDisabled: boolean;
    onClick: () => Promise<boolean>;
    onClose: () => void;
}) => JSX.Element;

export const ConfirmMainButton: ConfirmMainButtonProps = ({ isLoading, isDisabled, onClick }) => {
    const { t } = useTranslation();
    const isLedger = useIsActiveWalletLedger();
    return (
        <Button
            fullWidth
            size="large"
            primary
            type="submit"
            disabled={isDisabled}
            loading={isLoading}
            onClick={onClick}
        >
            {t(isLedger ? 'ledger_continue_with_ledger' : 'confirm_sending_submit')}
        </Button>
    );
};

const ConfirmViewButtonsContainerStyled = styled.div`
    width: 100%;
    display: flex;
    gap: 1rem;
    & > * {
        flex: 1;
    }
`;

export const ConfirmAndCancelMainButton: ConfirmMainButtonProps = ({
    isLoading,
    isDisabled,
    onClose
}) => {
    const { t } = useTranslation();
    const isLedger = useIsActiveWalletLedger();
    return (
        <ConfirmViewButtonsContainerStyled>
            <Button size="large" secondary type="button" onClick={onClose}>
                {t('cancel')}
            </Button>
            <Button size="large" primary type="submit" disabled={isDisabled} loading={isLoading}>
                {t(isLedger ? 'ledger_continue_with_ledger' : 'confirm')}
            </Button>
        </ConfirmViewButtonsContainerStyled>
    );
};

export const RecipientHeaderBlock: FC<{ title: string; onClose: () => void }> = ({
    title,
    onClose
}) => {
    return (
        <NotificationTitleBlock>
            <ButtonMock />
            <H3>{title}</H3>
            <NotificationCancelButton handleClose={onClose} />
        </NotificationTitleBlock>
    );
};

export type AmountHeaderBlockComponent = (
    props: PropsWithChildren<{
        onBack: () => void;
        onClose: () => void;
    }>
) => JSX.Element;

export const AmountHeaderBlock: AmountHeaderBlockComponent = ({ onBack, onClose, children }) => {
    const { t } = useTranslation();
    return (
        <NotificationTitleBlock>
            <RoundedButton onClick={onBack}>
                <ChevronLeftIcon />
            </RoundedButton>
            <Center>
                <Title>{t('txActions_amount')}</Title>
                {children}
            </Center>
            <NotificationCancelButton handleClose={onClose} />
        </NotificationTitleBlock>
    );
};

export const ResultButton = styled.div<{ done?: boolean }>`
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: center;
    color: ${props => (props.done ? props.theme.accentGreen : props.theme.accentRed)};
    height: 56px;
    width: 100%;
`;

export const Label = styled(Body1)`
    user-select: none;
    color: ${props => props.theme.textSecondary};
`;

export const childFactoryCreator = (right: boolean) => (child: React.ReactElement) =>
    React.cloneElement(child, {
        classNames: right ? rightToLeft : leftToTight,
        timeout: duration,
        isAnimating: true
    });

export const notifyError = async (
    client: QueryClient,
    sdk: IAppSdk,
    t: (value: string) => string,
    error: unknown
) => {
    if (seeIfBalanceError(error)) {
        sdk.uiEvents.emit('copy', {
            method: 'copy',
            params: t('send_screen_steps_amount_insufficient_balance')
        });
    }

    if (seeIfTimeError(error)) {
        sdk.alert(t('send_sending_wrong_time_description'));
    }

    throw error;
};

export interface InitTransferData {
    initRecipient?: TonRecipientData;
    initAmountState?: Partial<AmountState>;
}

export const getInitData = (
    tonTransfer: TonTransferParams,
    toAccount: Account,
    jettons: JettonsBalances | undefined
): InitTransferData => {
    const initRecipient: TonRecipientData = {
        address: {
            blockchain: BLOCKCHAIN_NAME.TON,
            address: tonTransfer.address
        },
        toAccount,
        comment: tonTransfer.text ?? '',
        done: toAccount.memoRequired ? tonTransfer.text !== '' && tonTransfer.text !== null : true
    };

    const { initAmountState } = getJetton(tonTransfer.jetton, jettons);

    return {
        initRecipient,
        initAmountState
    };
};

export const getJetton = (
    asset: string | undefined,
    jettons: JettonsBalances | undefined
): InitTransferData => {
    try {
        if (asset) {
            const token = jettonToTonAsset(asset, jettons || { balances: [] });

            return {
                initAmountState: { token: token }
            };
        }
    } catch {
        return {};
    }
    return {};
};
