/* eslint-disable i18next/no-literal-string, no-console -- dev-only settings page, not user-facing */
import { FC, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { isFirstSemverStringGreater } from '@tonkeeper/core/dist/utils/common';
import { isWalletInOrigin } from '@tonkeeper/core/dist/utils/pro';

import { useAppContext } from '../../../../hooks/appContext';
import { useAppSdk, useIsCapacitorApp } from '../../../../hooks/appSdk';
import { useIsOnIosReview, useMutateEnableReviewerMode } from '../../../../hooks/ios';
import { useNavigate } from '../../../../hooks/router/useNavigate';
import { MultichainRoute } from '../../../../libs/routes';
import { useMutateProApiUrl, useProApiUrl } from '../../../../state/pro';
import { useSecurityCheck } from '../../../../state/password';
import { AddWalletContext } from '../../../../components/create/AddWalletContext';
import { Button, Loader, Modal, Switch } from '../../../../primitives';
import { ImportBySKWallet } from '../../../import/ImportBySKWallet';
import { SettingsListCell, SettingsListGroup } from './SettingsList';
import { SettingsPageLayout } from './SettingsPageLayout';

/**
 * Hidden dev menu, reached by tapping the logo in the settings footer six
 * times (see SettingsVersionFooter). The gesture itself is the access
 * gate, so unlike the legacy screen there is no stored-visibility
 * redirect. Dev logs render inline in an expandable block instead of the
 * legacy logs subpage — the settings routing has no dev subroutes.
 */
export const SettingsDevPage: FC<{ compact?: boolean }> = ({ compact = false }) => {
    const sdk = useAppSdk();
    const navigate = useNavigate();
    const client = useQueryClient();
    const { mainnetConfig } = useAppContext();
    const isCapacitor = useIsCapacitorApp();
    const isOnReview = useIsOnIosReview();

    const { mutate: cleanCookies, isLoading: cookiesLoading } = useMutation(async () => {
        await sdk.cookie?.cleanUp();
        await sdk.subscriptionService.logout();
        await sdk.storage.delete(AppKey.PRO_PENDING_SUBSCRIPTION);
        await client.invalidateQueries();
    });

    const [skImportOpen, setSkImportOpen] = useState(false);
    const { mutateAsync: securityCheck } = useSecurityCheck();

    const { mutate: setReviewerMode, isLoading: reviewerLoading } = useMutateEnableReviewerMode();

    const { mutate: changeProApiUrl } = useMutateProApiUrl();
    const { data: proApiUrl } = useProApiUrl(mainnetConfig);

    const [logsExpanded, setLogsExpanded] = useState(false);
    const [logs, setLogs] = useState('');
    const logger = sdk.logger;
    useEffect(() => {
        if (logsExpanded) {
            logger?.read().then(setLogs);
        }
    }, [logsExpanded, logger]);

    const showCookies = !!sdk.cookie;
    const showReviewerMode = isCapacitor && !mainnetConfig.tablet_enable_additional_security;
    const showLogs = !!logger && !isOnReview;
    const isDevVersion = isFirstSemverStringGreater(sdk.version, mainnetConfig.pro_apk_name ?? '');
    const showProEnvToggle = !isWalletInOrigin() && isDevVersion && !isOnReview;

    const onAddBySK = () =>
        securityCheck()
            .then(() => setSkImportOpen(true))
            .catch(e => console.error(e));

    const onClearLogs = async () => {
        const confirmed = await sdk.confirm({
            title: 'Delete logs',
            message: 'Are you sure you want to clear all logs?',
            okButtonTitle: 'Delete Logs',
            cancelButtonTitle: 'Cancel'
        });
        if (confirmed) {
            await logger!.clear();
            setLogs('');
        }
    };

    const onCopyLogs = async () => {
        const confirmed = await sdk.confirm({
            title: 'Copy logs',
            message: 'Logs might contain sensitive data. Check it before copying and sharing',
            okButtonTitle: 'Copy Logs Anyway'
        });
        if (confirmed) {
            sdk.copyToClipboard(logs);
        }
    };

    return (
        <SettingsPageLayout
            compact={compact}
            title="Dev Menu"
            onBack={() => navigate(MultichainRoute.settings)}
        >
            <div className="px-4 pb-4">
                <SettingsListGroup>
                    {showCookies && (
                        <SettingsListCell
                            title="Clean All Cookies"
                            rightNode={cookiesLoading ? <Loader size="small" /> : undefined}
                            onClick={() => cleanCookies()}
                        />
                    )}
                    <SettingsListCell title="Add account with private key" onClick={onAddBySK} />
                    {showReviewerMode && (
                        <SettingsListCell
                            title="Enable extra security"
                            rightNode={
                                <Switch
                                    checked={isOnReview}
                                    onChange={setReviewerMode}
                                    disabled={reviewerLoading}
                                />
                            }
                        />
                    )}
                    {showProEnvToggle && (
                        <SettingsListCell
                            title="Is dev-pro on?"
                            rightNode={
                                <Switch
                                    checked={proApiUrl === mainnetConfig.pro_dev_api_url}
                                    onChange={changeProApiUrl}
                                />
                            }
                        />
                    )}
                </SettingsListGroup>
            </div>
            {showLogs && (
                <div className="px-4 pb-4">
                    <SettingsListGroup>
                        <SettingsListCell
                            title="Dev Logs"
                            chevron
                            onClick={() => setLogsExpanded(v => !v)}
                        />
                        {logsExpanded && (
                            <div className="p-4">
                                <div className="flex gap-2 pb-3">
                                    <Button variant="secondary" size="small" onClick={onCopyLogs}>
                                        Copy
                                    </Button>
                                    <Button variant="secondary" size="small" onClick={onClearLogs}>
                                        Delete Logs
                                    </Button>
                                </div>
                                <pre className="whitespace-pre-wrap break-words text-body3 text-textSecondary">
                                    {logs}
                                </pre>
                            </div>
                        )}
                    </SettingsListGroup>
                </div>
            )}
            <AddWalletContext.Provider
                value={{ navigateHome: () => setSkImportOpen(false), analyticsFrom: 'main' }}
            >
                <Modal
                    isOpen={skImportOpen}
                    onClose={() => setSkImportOpen(false)}
                    mobileHeight="full"
                >
                    <ImportBySKWallet
                        signingAlgorithm="ed25519"
                        afterCompleted={() => {
                            setSkImportOpen(false);
                            navigate(MultichainRoute.home);
                        }}
                    />
                </Modal>
            </AddWalletContext.Provider>
        </SettingsPageLayout>
    );
};
