import React, { FC, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from '../../hooks/translation';
import { CenterContainer } from '../Layout';
import { Body2, H2Label2Responsive } from '../Text';
import { ButtonResponsiveSize } from '../fields/Button';
import { TonRecipientInput } from '../fields/TonRecipientInput';
import { TonRecipient } from '@tonkeeper/core/dist/entries/send';
import { Address } from '@ton/core';
import { useMobileModalFullScreenStretcher } from '../../hooks/useElementHeight';
import { NotificationFooter, NotificationFooterPortal } from '../Notification';

const Block = styled.div`
    display: flex;
    text-align: center;
    gap: 1rem;
    flex-direction: column;
`;

const Body = styled(Body2)`
    text-align: center;
    color: ${props => props.theme.textSecondary};
`;

export const AddressInput: FC<{
    afterInput: (address: string) => void;
    isLoading?: boolean;
    className?: string;
    onIsDirtyChange?: (isDirty: boolean) => void;
}> = ({ afterInput, isLoading, className, onIsDirtyChange }) => {
    const { t } = useTranslation();
    const { ref: containerRef, stretcher } = useMobileModalFullScreenStretcher();

    const ref = useRef<HTMLInputElement>(null);

    const [error, setError] = useState<boolean>(false);
    const [isDataLoading, setDataIsLoading] = useState<boolean>(false);
    const [recipient, setRecipient] = useState<TonRecipient | undefined>();

    useEffect(() => {
        onIsDirtyChange?.(!!recipient);
    }, [recipient]);

    useEffect(() => {
        if (ref.current) {
            ref.current.focus();
        }
    }, [ref]);

    return (
        <>
            <CenterContainer className={className} ref={containerRef} $mobileFitContent>
                <Block>
                    <div>
                        <H2Label2Responsive>{t('add_watch_only_title')}</H2Label2Responsive>
                        <Body>{t('add_wallet_modal_watch_only_subtitle')}</Body>
                    </div>
                    <TonRecipientInput
                        ref={ref}
                        onChange={setRecipient}
                        onIsErroredChange={setError}
                        onIsLoadingChange={setDataIsLoading}
                        placeholder={t('wallet_address')}
                    />
                    <NotificationFooterPortal>
                        <NotificationFooter>
                            <ButtonResponsiveSize
                                fullWidth
                                primary
                                marginTop
                                loading={isLoading || isDataLoading}
                                disabled={error || !recipient}
                                onClick={() =>
                                    afterInput(Address.parse(recipient!.address).toRawString())
                                }
                            >
                                {t('continue')}
                            </ButtonResponsiveSize>
                        </NotificationFooter>
                    </NotificationFooterPortal>
                </Block>
            </CenterContainer>
            {stretcher}
        </>
    );
};
