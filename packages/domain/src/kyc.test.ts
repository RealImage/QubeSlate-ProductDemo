import { describe, expect, it } from 'vitest';
import { KYC_MAX_BYTES, dataUrlBytes, kycFileError, kycFileType } from './kyc';

const b64 = (bytes: number) => btoa('\0'.repeat(bytes));

describe('KYC files', () => {
  it('accepts PDF, PNG and JPEG data URLs only', () => {
    expect(kycFileType(`data:application/pdf;base64,${b64(3)}`)).toBe('application/pdf');
    expect(kycFileType(`data:image/jpeg;base64,${b64(3)}`)).toBe('image/jpeg');
    expect(kycFileType(`data:image/svg+xml;base64,${b64(3)}`)).toBeNull();
    expect(kycFileType('https://example.com/a.pdf')).toBeNull();
  });
  it('measures the decoded size', () => {
    for (const n of [0, 1, 2, 3, 10]) expect(dataUrlBytes(`data:image/png;base64,${b64(n)}`)).toBe(n);
  });
  it('rejects files over the limit', () => {
    expect(kycFileError(`data:application/pdf;base64,${b64(KYC_MAX_BYTES)}`)).toBeNull();
    expect(kycFileError(`data:application/pdf;base64,${b64(KYC_MAX_BYTES + 1)}`)).toMatch(/5 MB/);
    expect(kycFileError(`data:text/plain;base64,${b64(3)}`)).toMatch(/PDF, PNG or JPEG/);
  });
  it('rejects empty or malformed base64', () => {
    expect(kycFileError('data:application/pdf;base64,')).toMatch(/empty/);
    expect(kycFileError('data:application/pdf;base64,!!!!')).toMatch(/empty/);
    expect(kycFileError('data:application/pdf;base64,AAA')).toMatch(/empty/);
  });
});
