import { useQueryClient } from '@tanstack/react-query';
import { FC, useEffect } from 'react';
import { CheckLottieIcon } from '../../components/lottie/LottieIcons';
import { useTranslation } from '../../hooks/translation';

export const FinalView: FC<{ afterCompleted: () => void }> = ({ afterCompleted }) => {
    const { t } = useTranslation();
    const client = useQueryClient();

    useEffect(() => {
        client.invalidateQueries([]);
        setTimeout(afterCompleted, 3000);
    }, [client, afterCompleted]);

    return (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
            <CheckLottieIcon />
            <h2 className="text-h2 text-textPrimary">{t('check_words_success')}</h2>
        </div>
    );
};
