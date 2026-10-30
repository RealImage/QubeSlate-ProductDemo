import type { KycFileType } from './types';

export const KYC_FILE_TYPES: readonly KycFileType[] = ['application/pdf', 'image/png', 'image/jpeg'];
export const KYC_MAX_BYTES = 5 * 1024 * 1024;

/** The MIME type of a base64 data URL, when it is one a KYC document may use. */
export function kycFileType(dataUrl: string): KycFileType | null {
  const m = /^data:([a-z]+\/[a-z0-9.+-]+);base64,/.exec(dataUrl);
  const type = m?.[1];
  return type && (KYC_FILE_TYPES as readonly string[]).includes(type) ? (type as KycFileType) : null;
}

/** Decoded size, in bytes, of a base64 data URL. */
export function dataUrlBytes(dataUrl: string): number {
  const b64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const pad = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.floor((b64.length * 3) / 4) - pad;
}

/** Why an uploaded KYC file is not acceptable, or null when it is. */
export function kycFileError(dataUrl: string): string | null {
  if (!kycFileType(dataUrl)) return 'Upload a PDF, PNG or JPEG file.';
  if (dataUrlBytes(dataUrl) > KYC_MAX_BYTES) return 'The file must be 5 MB or smaller.';
  return null;
}
