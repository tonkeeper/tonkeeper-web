import { FC, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from '../../hooks/translation';
import { CenterContainer } from '../Layout';
import { H2Label2Responsive } from '../Text';
import { ButtonResponsiveSize } from '../fields/Button';
import { TextArea } from '../fields/Input';
import { isValidSKOrSeed } from '@tonkeeper/core/dist/service/mnemonicService';
import { NotificationFooter, NotificationFooterPortal } from '../Notification';
import { SKSigningAlgorithm } from '@tonkeeper/core/dist/service/sign';

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
    signingAlgorithm: SKSigningAlgorithm;
}> = ({ afterInput, isLoading, className, onIsDirtyChange, signingAlgorithm }) => {
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
        if (!sk || !isValidSKOrSeed(sk)) {
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
        <CenterContainer className={className} $mobileFitContent>
            <Block>
                <div>
                    <H2Label2Responsive>
                        {signingAlgorithm === 'fireblocks'
                            ? t('add_by_sk_fireblocks_title')
                            : t('add_by_sk_title')}
                    </H2Label2Responsive>
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
                <NotificationFooterPortal>
                    <NotificationFooter>
                        <ButtonResponsiveSize
                            fullWidth
                            primary
                            marginTop
                            loading={isLoading}
                            disabled={!sk || error}
                            onClick={() => afterInput(sk.slice(0, 64)!)}
                        >
                            {t('continue')}
                        </ButtonResponsiveSize>
                    </NotificationFooter>
                </NotificationFooterPortal>
            </Block>
        </CenterContainer>
    );
};
