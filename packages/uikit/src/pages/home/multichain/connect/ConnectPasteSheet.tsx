import { FC, useEffect, useState } from 'react';

import { parseTonConnect } from '@tonkeeper/core/dist/service/tonConnect/connectService';
import { TonConnectHttpConnectionParams } from '@tonkeeper/core/dist/service/tonConnect/connectionService';
import { parseWalletConnectUri } from '@tonkeeper/core/dist/service/walletConnect/wcUri';

import { useCompleteHttpConnection } from '../../../../components/connect/connectHook';
import { useTranslation } from '../../../../hooks/translation';
import { Button, Input, Link, Modal, ModalFooter, ModalFooterPortal } from '../../../../primitives';
import { useWalletConnectPair } from '../../../../state/walletConnect';
import { MultichainConnectFlow, TonConnectCompleteResult } from './MultichainConnectFlow';

/**
 * Paste-a-link connect entry for both protocols. A WalletConnect `wc:`
 * link pairs over the relay and closes the sheet — the session proposal
 * then arrives through `MultichainConnectSubscription`. A TonConnect link
 * carries the whole connect request, so the sheet closes straight into
 * the connect flow rendered here.
 */
export const ConnectPasteSheet: FC<{ isOpen: boolean; onClose: () => void }> = ({
    isOpen,
    onClose
}) => {
    const { t } = useTranslation();
    const [value, setValue] = useState('');
    const [error, setError] = useState<string | undefined>();
    const { mutateAsync: pair, isLoading } = useWalletConnectPair();
    const [tonConnectParams, setTonConnectParams] = useState<TonConnectHttpConnectionParams | null>(
        null
    );
    const { mutateAsync: completeTonConnect, reset: resetTonConnect } = useCompleteHttpConnection();

    useEffect(() => {
        setValue('');
        setError(undefined);
    }, [isOpen]);

    const submit = async (input: string) => {
        const uri = parseWalletConnectUri(input);
        if (uri === null) {
            const params = parseTonConnect({ url: input.trim() });
            if (typeof params === 'string') {
                setError(t('connect_invalid_link'));
                return;
            }
            setTonConnectParams(params);
            onClose();
            return;
        }
        try {
            await pair({ uri, source: 'paste' });
            onClose();
        } catch (e) {
            // The relay's wording is implementation detail; the recovery is
            // the same whatever it says.
            console.error(e);
            setError(t('connect_pair_failed'));
        }
    };

    const answerTonConnect = async (result: TonConnectCompleteResult) => {
        if (!tonConnectParams) return;
        resetTonConnect();
        try {
            await completeTonConnect({ params: tonConnectParams, result });
        } finally {
            setTonConnectParams(null);
        }
    };

    const onPaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setValue(text);
            setError(undefined);
            await submit(text);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                variant="content"
                heading={t('connect_dapp_title')}
                subheading={t('connect_paste_description')}
            >
                <form
                    id="connect-paste-form"
                    onSubmit={e => {
                        e.preventDefault();
                        void submit(value);
                    }}
                >
                    <Input
                        id="connect-link"
                        value={value}
                        onChange={next => {
                            setValue(next);
                            setError(undefined);
                        }}
                        label="tc://… · wc:…"
                        autoFocus
                        isValid={!error}
                        helpText={error}
                        marginRight="48px"
                        rightElement={
                            <Link
                                onClick={
                                    value
                                        ? () => {
                                              setValue('');
                                              setError(undefined);
                                          }
                                        : onPaste
                                }
                            >
                                {t(value ? 'clear' : 'paste')}
                            </Link>
                        }
                    />
                    <ModalFooterPortal>
                        <ModalFooter>
                            <Button
                                type="submit"
                                form="connect-paste-form"
                                variant="primaryBlue"
                                size="large"
                                fullWidth
                                loading={isLoading}
                                disabled={isLoading || value.trim() === ''}
                            >
                                {t('connect_wallet')}
                            </Button>
                        </ModalFooter>
                    </ModalFooterPortal>
                </form>
            </Modal>
            <MultichainConnectFlow
                request={
                    tonConnectParams ? { protocol: 'tonConnect', params: tonConnectParams } : null
                }
                onClose={() => answerTonConnect(null)}
                onTonConnectComplete={answerTonConnect}
            />
        </>
    );
};
