import { Input } from '@slate/ui';
import type { Contract } from '@slate/domain';

/** Form-state for a contract: strings while typing, parsed on submit. */
export interface ContractDraft { ref: string; creditLimit: string; paymentTermsDays: string; validUntil: string }

export const emptyContractDraft = (): ContractDraft => ({ ref: '', creditLimit: '', paymentTermsDays: '30', validUntil: '' });
export const draftFromContract = (c: Contract | null): ContractDraft => c
  ? { ref: c.ref, creditLimit: String(c.creditLimit), paymentTermsDays: String(c.paymentTermsDays), validUntil: c.validUntil }
  : emptyContractDraft();

export function contractFromDraft(d: ContractDraft): Contract {
  return { ref: d.ref.trim(), creditLimit: Number(d.creditLimit), paymentTermsDays: Number(d.paymentTermsDays), validUntil: d.validUntil };
}

/** Explicit whole number of days; an empty field is missing, not zero. */
const termsValid = (v: string) => v.trim() !== '' && Number.isInteger(Number(v)) && Number(v) >= 0;

/** First problem with the draft, or null when it is valid. */
export function contractDraftError(d: ContractDraft): string | null {
  if (!d.ref.trim()) return 'Enter the contract reference.';
  if (!(Number(d.creditLimit) > 0)) return 'Enter a credit limit greater than ₹0.';
  if (!termsValid(d.paymentTermsDays)) return 'Payment terms must be a whole number of days (0 for due on invoice).';
  if (!d.validUntil) return 'Choose the date the contract is valid until.';
  return null;
}

export function ContractFields({ value, onChange, showErrors }: { value: ContractDraft; onChange: (d: ContractDraft) => void; showErrors?: boolean }) {
  const set = (p: Partial<ContractDraft>) => onChange({ ...value, ...p });
  const bad = (cond: boolean, msg: string) => (showErrors && cond ? msg : undefined);
  return (
    <div className="sl-grid sl-grid--2">
      <Input label="Contract reference" value={value.ref} onChange={ref => set({ ref })} isRequired errorMessage={bad(!value.ref.trim(), 'Required')} />
      <Input label="Credit limit (₹)" type="number" inputMode="numeric" value={value.creditLimit} onChange={creditLimit => set({ creditLimit })} isRequired errorMessage={bad(!(Number(value.creditLimit) > 0), 'Must be above 0')} />
      <Input label="Payment terms (days)" type="number" inputMode="numeric" value={value.paymentTermsDays} onChange={paymentTermsDays => set({ paymentTermsDays })} isRequired errorMessage={bad(!termsValid(value.paymentTermsDays), 'Whole days')} />
      <Input label="Valid until" type="date" value={value.validUntil} onChange={validUntil => set({ validUntil })} isRequired errorMessage={bad(!value.validUntil, 'Required')} />
    </div>
  );
}
