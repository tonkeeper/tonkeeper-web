/**
 * @deprecated Use the primitives directly:
 *   import { Input, InputBlock, InputField, ... } from '../../primitives/Input';
 *
 * Legacy re-export kept for the existing callers (`TonRecipientInput`,
 * `InputWithScanner`, `multi-send/InputStyled`, `MultisigConfigForm`). New
 * code MUST import from `primitives/Input`.
 */
export { InputBlock, InputField, Label, OuterBlock, HelpText, Input } from '../../primitives/Input';
export type { InputProps } from '../../primitives/Input';
