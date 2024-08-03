import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { IconPage } from '../../components/Layout';
import { CheckLottieIcon, ConfettiLottieIcon } from '../../components/lottie/LottieIcons';
import { useAfterImportAction } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';

const ConfettiBlock = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    z-index: 10;
`;

export const FinalView = () => {
    const { t } = useTranslation();
    const afterImport = useAfterImportAction();
    const client = useQueryClient();

    const [size, setSize] = useState<{ width: number; height: number } | undefined>(undefined);

    useEffect(() => {
        client.invalidateQueries([]);
        setTimeout(afterImport, 3000);
    }, []);

    useEffect(() => {
        const { innerWidth: width, innerHeight: height } = window;
        setSize({ width, height });
    }, []);

    return (
        <>
            {size && (
                <ConfettiBlock>
                    <ConfettiLottieIcon {...size} />
                </ConfettiBlock>
            )}
            <IconPage icon={<CheckLottieIcon />} title={t('check_words_success')} />
        </>
    );
};
