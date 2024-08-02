import React, { FC, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from '../../hooks/translation';
import { CenterContainer } from '../Layout';
import { Body2, H2 } from '../Text';
import { Button } from '../fields/Button';
import { Input } from '../fields/Input';
import { EmojisList } from '../shared/emoji/EmojisList';
import { WalletEmoji } from '../shared/emoji/WalletEmoji';

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

export const UpdateWalletName: FC<{
    walletEmoji: string;
    name?: string;
    submitHandler: ({ name, emoji }: { name: string; emoji: string }) => void;
    isLoading?: boolean;
}> = ({ walletEmoji, submitHandler, name: nameProp, isLoading }) => {
    const { t } = useTranslation();

    const ref = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (ref.current) {
            ref.current.focus();
        }
    }, [ref.current]);

    const [name, setName] = useState(nameProp || '');
    const [emoji, setEmoji] = useState(walletEmoji);

    const onSubmit: React.FormEventHandler<HTMLFormElement> = async e => {
        e.preventDefault();
        submitHandler({ name, emoji });
    };

    const onChange = (value: string) => {
        setName(value);
    };

    const isValid = name.length >= 3;

    return (
        <CenterContainer>
            <Block onSubmit={onSubmit}>
                <div>
                    <H2>{t('Name_your_wallet')}</H2>
                    <Body>{t('Name_your_wallet_description')}</Body>
                </div>

                <Input
                    ref={ref}
                    value={name}
                    onChange={onChange}
                    label={t('Wallet_name')}
                    isValid={isValid}
                    rightElement={emoji ? <WalletEmoji emoji={emoji} /> : null}
                />
                <EmojisList keepShortListForMS={500} onClick={setEmoji} />

                <Button
                    size="large"
                    fullWidth
                    marginTop
                    primary
                    disabled={!isValid}
                    type="submit"
                    loading={isLoading}
                >
                    {t('add_edit_favorite_save')}
                </Button>
            </Block>
        </CenterContainer>
    );
};
