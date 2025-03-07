import React, { FC, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from '../../hooks/translation';
import { CenterContainer } from '../Layout';
import { H2Label2Responsive } from '../Text';
import { ButtonResponsiveSize } from '../fields/Button';
import { TextArea } from '../fields/Input';
import { isValidSecretKey } from '@tonkeeper/core/dist/service/mnemonicService';

const Block = styled.div`
    display: flex;
    text-align: center;
    gap: 1rem;
    flex-direction: column;
`;

export const SKInput: FC<{
    afterInput: (address: string) => void;
    isLoading?: boolean;
    className?: string;
    onIsDirtyChange?: (isDirty: boolean) => void;
}> = ({ afterInput, isLoading, className, onIsDirtyChange }) => {
    const { t } = useTranslation();

    const ref = useRef<HTMLTextAreaElement>(null);
    const [sk, setSk] = useState<string>('');
    const [error, setError] = useState<boolean>(false);
    const [touched, setTouched] = useState<boolean>(false);

    useEffect(() => {
        onIsDirtyChange?.(!!sk);
    }, [sk]);

    useEffect(() => {
        if (!touched) {
            return;
        }
        if (!sk || !isValidSecretKey(sk)) {
            setError(true);
        } else {
            setError(false);
        }
    }, [touched, sk]);

    useEffect(() => {
        if (ref.current) {
            ref.current.focus();
        }
    }, [ref]);

    const onChange = (val: string) => {
        setTouched(true);
        setSk(val);
    };

    return (
        <CenterContainer className={className}>
            <Block>
                <div>
                    <H2Label2Responsive>{t('add_by_sk_title')}</H2Label2Responsive>
                </div>
                <TextArea
                    id="secret-key"
                    ref={ref}
                    value={sk}
                    onChange={onChange}
                    isValid={!error}
                    label={t('recovery_wallet_secret_key')}
                    helpText={t('sk_input_label')}
                />
                <ButtonResponsiveSize
                    fullWidth
                    primary
                    marginTop
                    loading={isLoading}
                    disabled={!sk || error}
                    onClick={() => afterInput(sk!)}
                >
                    {t('continue')}
                </ButtonResponsiveSize>
            </Block>
        </CenterContainer>
    );
};
