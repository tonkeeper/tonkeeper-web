import React, { FC, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { InputBlockStyled, InputFieldStyled } from './InputStyled';

export const CommentInput: FC<{ index: number }> = ({ index }) => {
    const { control } = useFormContext();
    const [focus, setFocus] = useState(false);

    return (
        <Controller
            render={({ field, fieldState }) => (
                <InputBlockStyled valid={!fieldState.invalid} focus={focus}>
                    <InputFieldStyled
                        {...field}
                        onFocus={() => setFocus(true)}
                        onBlur={() => setFocus(false)}
                        placeholder="Comment"
                    />
                </InputBlockStyled>
            )}
            name={`row.${index}.comment`}
            control={control}
        />
    );
};
