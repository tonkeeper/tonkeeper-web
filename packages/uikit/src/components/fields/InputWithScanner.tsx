import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { ScanIcon, XmarkIcon } from '../Icon';
import { InputBlock, Label } from './Input';
import { TextareaAutosize } from './TextareaAutosize';

export interface IInputWithScanner {
    value: string;
    onScan: (signature: string) => void;
    onChange?: (value: string) => void;
    onSubmit?: () => void;
    isValid?: boolean;
    label?: string;
    disabled?: boolean;
}

const ClearBlock = styled.div`
    position: absolute;
    right: 1rem;
    height: 100%;
    display: flex;
    align-items: center;
    cursor: pointer;
    color: ${props => props.theme.textSecondary};

    &:hover {
        color: ${props => props.theme.textTertiary};
    }
`;

const ScanBlock = styled.div`
    position: absolute;
    right: 1rem;
    height: 100%;
    display: flex;
    align-items: center;
    cursor: pointer;

    color: ${props => props.theme.accentBlue};
`;

export const InputWithScanner = React.forwardRef<HTMLTextAreaElement, IInputWithScanner>(
    ({ value, onChange, isValid = true, label, disabled, onScan, onSubmit }, ref) => {
        const [focus, setFocus] = useState(false);
        const [scanId, setScanId] = useState<number | undefined>(undefined);
        const sdk = useAppSdk();
        const { hideQrScanner } = useAppContext();

        const onClear: React.MouseEventHandler<HTMLDivElement> = e => {
            e.stopPropagation();
            e.preventDefault();
            if (disabled) return;
            onChange?.('');
        };

        const onClick: React.MouseEventHandler<HTMLDivElement> = e => {
            e.stopPropagation();
            e.preventDefault();
            if (disabled) return;
            const id = Date.now();
            sdk.uiEvents.emit('scan', {
                method: 'scan',
                id: id,
                params: undefined
            });
            setScanId(id);
        };

        useEffect(() => {
            const handler = (options: {
                method: 'response';
                id?: number | undefined;
                params: string;
            }) => {
                if (options.id === scanId) {
                    onScan(options.params);
                }
            };
            sdk.uiEvents.on('response', handler);

            return () => {
                sdk.uiEvents.off('response', handler);
            };
        }, [sdk, scanId, onScan]);

        return (
            <InputBlock focus={focus} valid={isValid} scanner>
                <TextareaAutosize
                    onSubmit={onSubmit}
                    ref={ref}
                    disabled={disabled}
                    value={value}
                    onChange={e => onChange && onChange(e.target.value)}
                    onFocus={() => setFocus(true)}
                    onBlur={() => setFocus(false)}
                />
                {label && <Label active={value !== ''}>{label}</Label>}

                {value === '' ? (
                    hideQrScanner === true ? (
                        <></>
                    ) : (
                        <ScanBlock onClick={onClick}>
                            <ScanIcon />
                        </ScanBlock>
                    )
                ) : (
                    <ClearBlock onClick={onClear}>
                        <XmarkIcon />
                    </ClearBlock>
                )}
            </InputBlock>
        );
    }
);
