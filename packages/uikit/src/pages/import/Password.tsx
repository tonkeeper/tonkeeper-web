import { useQueryClient } from '@tanstack/react-query';
import { FC, useEffect } from 'react';
import { IconPage } from '../../components/Layout';
import { CheckLottieIcon } from '../../components/lottie/LottieIcons';
import { useTranslation } from '../../hooks/translation';

export const FinalView: FC<{ afterCompleted: () => void }> = ({ afterCompleted }) => {
    const { t } = useTranslation();
    const client = useQueryClient();

    useEffect(() => {
        client.invalidateQueries([]);
        setTimeout(afterCompleted, 3000);
    }, []);

    return <IconPage icon={<CheckLottieIcon />} title={t('check_words_success')} />;
};
