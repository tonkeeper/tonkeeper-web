import { FC, FormEventHandler, useEffect, useRef, useState } from 'react';

import { walletColorById } from '@tonkeeper/core/dist/entries/walletColor';

import { useTranslation } from '../../hooks/translation';
import { Button } from '../../primitives/Button';
import { Input } from '../../primitives/Input';
import { ModalFooter, ModalFooterPortal } from '../../primitives/Modal';
import { EmojisList } from '../shared/emoji/EmojisList';
import { WalletEmoji } from '../shared/emoji/WalletEmoji';
import { WalletColorPicker } from '../shared/WalletColorPicker';

/**
 * The submit button is portaled into the modal footer, outside the form's
 * DOM subtree, so it is tied back to the form through the `form` attribute.
 */
const FORM_ID = 'customize-wallet-form';

export interface CustomizeWalletForm {
    name: string;
    emoji: string;
    colorId: string;
}

/**
 * Create-flow "Customize your wallet". Wallet name, avatar colour and
 * emoji selection in the same screen — the picked emoji on the picked
 * colour renders as the input's right affordance.
 */
export const CustomizeWallet: FC<{
    walletEmoji: string;
    walletColorId: string;
    name?: string;
    submitHandler: (form: CustomizeWalletForm) => void;
    isLoading?: boolean;
    buttonText?: string;
}> = ({ walletEmoji, walletColorId, name: nameProp, submitHandler, isLoading, buttonText }) => {
    const { t } = useTranslation();
    const inputRef = useRef<HTMLInputElement | null>(null);

    const [name, setName] = useState(nameProp || '');
    const [emoji, setEmoji] = useState(walletEmoji);
    const [colorId, setColorId] = useState(walletColorId);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const trimmedName = name.trim();

    const onSubmit: FormEventHandler<HTMLFormElement> = e => {
        e.preventDefault();
        if (!trimmedName) return;
        submitHandler({ name: trimmedName, emoji, colorId });
    };

    return (
        <form
            id={FORM_ID}
            onSubmit={onSubmit}
            className="mx-auto flex w-full max-w-[524px] flex-col gap-4"
        >
            <div className="flex flex-col items-center gap-1 px-8 pb-4 text-center">
                <h2 className="text-h2 text-textPrimary">{t('customize_wallet_title')}</h2>
                <p className="text-balance text-body1 text-textSecondary">
                    {t('customize_wallet_description')}
                </p>
            </div>

            <Input
                id="wallet-name"
                ref={inputRef}
                value={name}
                onChange={setName}
                label={t('Wallet_name')}
                rightElement={
                    <div
                        style={{ backgroundColor: walletColorById(colorId)?.hex }}
                        className="flex size-8 items-center justify-center rounded-full"
                    >
                        <WalletEmoji
                            emoji={emoji}
                            emojiSize="18px"
                            containerSize="18px"
                            className="text-constantWhite"
                        />
                    </div>
                }
            />

            <WalletColorPicker value={colorId} onChange={setColorId} />

            <EmojisList keepShortListForMS={500} onClick={setEmoji} />

            <ModalFooterPortal>
                <ModalFooter>
                    <Button
                        size="large"
                        variant="primaryBlue"
                        fullWidth
                        type="submit"
                        form={FORM_ID}
                        loading={isLoading}
                        disabled={!trimmedName}
                    >
                        {buttonText ?? t('continue')}
                    </Button>
                </ModalFooter>
            </ModalFooterPortal>
        </form>
    );
};
