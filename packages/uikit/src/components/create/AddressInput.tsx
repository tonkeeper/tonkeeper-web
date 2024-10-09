import { seeIfValidTonAddress } from '@tonkeeper/core/dist/utils/common';
import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { CenterContainer } from '../Layout';
import { Body2, H2Responsive } from '../Text';
import { ButtonResponsiveSize } from '../fields/Button';
import { Input } from '../fields/Input';
import { useResolveDns } from '../../state/dns';
import { seeIfInvalidDns } from '../transfer/RecipientView';
import { ShowAddress, useShowAddress } from '../transfer/ShowAddress';

const Block = styled.form`
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
    const sdk = useAppSdk();

    const ref = useRef<HTMLInputElement>(null);

    const [error, setError] = useState<string | undefined>(undefined);

    const [value, setValue] = useState('');
    const validAddress = useMemo(() => {
        return seeIfValidTonAddress(value);
    }, [value]);

    const validDns = useMemo(() => {
        return !seeIfInvalidDns(value);
    }, [value]);

    const { data: dnsWallet, isLoading: isDnsFetching } = useResolveDns(value);

    const isDirty = !!value;

    useEffect(() => {
        if (onIsDirtyChange) {
            onIsDirtyChange(isDirty);
        }
    }, [isDirty, onIsDirtyChange]);

    const onCreate: React.FormEventHandler<HTMLFormElement> = async e => {
        e.stopPropagation();
        e.preventDefault();

        if (validDns && dnsWallet) {
            afterInput(dnsWallet.address);
            return;
        }

        if (validAddress) {
            afterInput(value);
        } else {
            sdk.hapticNotification('error');
            setError('invalid');
        }
    };

    useEffect(() => {
        if (ref.current) {
            ref.current.focus();
        }
    }, [ref]);

    const showAddress = useShowAddress(ref, value, dnsWallet?.address);

    return (
        <CenterContainer className={className}>
            <Block onSubmit={onCreate}>
                <div>
                    <H2Responsive>{t('add_watch_only_title')}</H2Responsive>
                    <Body>{t('add_wallet_modal_watch_only_subtitle')}</Body>
                </div>
                <ShowAddress value={showAddress}>
                    <Input
                        ref={ref}
                        label={t('wallet_address')}
                        value={value}
                        onChange={v => {
                            setValue(v);
                            setError(undefined);
                        }}
                        clearButton
                        isValid={error === undefined}
                    />
                </ShowAddress>
                <ButtonResponsiveSize
                    fullWidth
                    primary
                    marginTop
                    loading={isLoading || isDnsFetching}
                    disabled={!!error}
                    type="submit"
                >
                    {t('continue')}
                </ButtonResponsiveSize>
            </Block>
        </CenterContainer>
    );
};
