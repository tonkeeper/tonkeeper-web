import { seeIfValidTonAddress } from '@tonkeeper/core/dist/utils/common';
import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { LogoutButton } from '../BackButton';
import { CenterContainer } from '../Layout';
import { Body2, H2 } from '../Text';
import { Button } from '../fields/Button';
import { Input } from '../fields/Input';

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
}> = ({ afterInput, isLoading, className }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();

    const ref = useRef<HTMLInputElement>(null);

    const [error, setError] = useState<string | undefined>(undefined);

    const [address, setAddress] = useState('');
    const valid = useMemo(() => {
        return seeIfValidTonAddress(address);
    }, [address]);

    const onCreate: React.FormEventHandler<HTMLFormElement> = async e => {
        e.stopPropagation();
        e.preventDefault();

        if (valid) {
            afterInput(address);
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

    return (
        <CenterContainer className={className}>
            <LogoutButton />
            <Block onSubmit={onCreate}>
                <div>
                    <H2>{t('add_watch_only_title')}</H2>
                    <Body>{t('add_wallet_modal_watch_only_subtitle')}</Body>
                </div>
                <Input
                    ref={ref}
                    label={t('wallet_address')}
                    value={address}
                    onChange={value => {
                        setAddress(value);
                        setError(undefined);
                    }}
                    isValid={error === undefined || valid}
                />
                <Button
                    size="large"
                    fullWidth
                    primary
                    marginTop
                    loading={isLoading}
                    disabled={!!error}
                    type="submit"
                >
                    {t('continue')}
                </Button>
            </Block>
        </CenterContainer>
    );
};
