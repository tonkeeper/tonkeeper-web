import { Notification } from '@tonkeeper/uikit/dist/components/Notification';
import { FC, useState } from 'react';
import styled from 'styled-components';
import { Body1, Button, H2 } from '@tonkeeper/uikit';
import { useTranslation } from '@tonkeeper/uikit/dist/hooks/translation';
import { Checkbox } from '@tonkeeper/uikit/dist/components/fields/Checkbox';
import { useMutateGlobalPreferences } from '@tonkeeper/uikit/dist/state/global-preferences';
import { useProcessOpenedLink } from '@tonkeeper/uikit/dist/components/connect/connectHook';

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    text-wrap: balance;

    > svg {
        margin-bottom: 12px;
        color: ${p => p.theme.accentBlue};
    }

    > ${H2} {
        margin-bottom: 4px;
        display: block;
        padding: 0 16px;
    }

    > ${Body1} {
        color: ${p => p.theme.textSecondary};
        margin-bottom: 16px;
        display: block;
        padding: 0 32px;
    }
`;

const CheckboxStyled = styled(Checkbox)`
    margin-top: 26px;
`;

const LinkIcon = () => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="84"
            height="84"
            viewBox="0 0 84 84"
            fill="none"
        >
            <path
                d="M23.7827 30.5102C24.9601 29.4463 26.7785 29.4822 27.9135 30.6167C29.0851 31.7882 29.0851 33.6883 27.9135 34.8598L20.9682 41.8051C15.1072 47.6662 15.1074 57.1695 20.9682 63.0307C26.8293 68.8916 36.3317 68.8915 42.1928 63.0307L49.1391 56.0844C50.3105 54.9133 52.2098 54.9136 53.3813 56.0844C54.5529 57.256 54.5529 59.156 53.3813 60.3276L46.436 67.2729C38.2317 75.4772 24.9294 75.4772 16.7251 67.2729C8.52145 59.0686 8.52122 45.7671 16.7251 37.563L23.6714 30.6167L23.7827 30.5102ZM46.4565 33.0854C47.628 31.9141 49.5272 31.9141 50.6987 33.0854C51.8703 34.257 51.8703 36.157 50.6987 37.3286L37.2563 50.771C36.0847 51.9425 34.1847 51.9425 33.0131 50.771C31.8419 49.5995 31.8421 47.7003 33.0131 46.5288L46.4565 33.0854ZM37.563 16.7251C45.7671 8.52122 59.0686 8.52144 67.2729 16.7251C75.4772 24.9294 75.4772 38.2317 67.2729 46.436L64.3432 49.3657L64.2309 49.4721C63.0533 50.5363 61.2351 50.5007 60.1001 49.3657C58.9292 48.1941 58.9288 46.2949 60.1001 45.1235L63.0307 42.1928C68.8915 36.3317 68.8916 26.8293 63.0307 20.9682C57.1695 15.1074 47.6662 15.1072 41.8051 20.9682L38.8842 23.8891C37.7127 25.0607 35.8126 25.0607 34.6411 23.8891C33.4702 22.7176 33.4701 20.8183 34.6411 19.6469L37.563 16.7251Z"
                fill="currentColor"
            />
        </svg>
    );
};

type TonLinkForm = { rememberChoice: boolean; processInExtension: boolean };

export const InterceptTonLinkNotification: FC<{
    handleClose: (processInExtension?: boolean) => void;
    url: string | null;
}> = ({ url, handleClose }) => {
    const { mutateAsync: saveGlobalPreferences } = useMutateGlobalPreferences();
    const { mutateAsync: processOpenedLink } = useProcessOpenedLink();

    const onSubmit = async ({ rememberChoice, processInExtension }: TonLinkForm) => {
        if (!url) return;
        if (rememberChoice) {
            await saveGlobalPreferences({
                interceptTonLinks: processInExtension ? 'always' : 'never'
            });
        }

        handleClose(processInExtension);

        if (processInExtension) {
            await processOpenedLink(url);
        }
    };

    return (
        <Notification isOpen={!!url} handleClose={handleClose}>
            {() => <Content onSubmit={onSubmit} />}
        </Notification>
    );
};

const Content: FC<{ onSubmit: (form: TonLinkForm) => void }> = ({ onSubmit }) => {
    const { t } = useTranslation();
    const [rememberChoice, setRememberChoice] = useState(false);

    return (
        <ContentWrapper>
            <LinkIcon />
            <H2>{t('links_interceptor_modal_title')}</H2>
            <Body1>{t('links_interceptor_modal_description')}</Body1>
            <Button
                primary
                size="large"
                fullWidth
                onClick={() => onSubmit({ rememberChoice, processInExtension: true })}
            >
                {t('links_interceptor_modal_continue_button')}
            </Button>
            <Button
                secondary
                size="large"
                fullWidth
                marginTop
                onClick={() => onSubmit({ rememberChoice, processInExtension: false })}
            >
                {t('links_interceptor_modal_browser_button')}
            </Button>
            <CheckboxStyled checked={rememberChoice} onChange={setRememberChoice}>
                {t('links_interceptor_modal_checkbox_label')}
            </CheckboxStyled>
        </ContentWrapper>
    );
};
