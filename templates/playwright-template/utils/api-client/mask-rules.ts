// Organization-wide field masking profiles for API test logging.
//
// These rules control what appears in Allure / Playwright reports.
// Actual request/response data is never altered.
//
// Review changes to this file carefully — it governs PII exposure
// in CI artifacts, screenshots, and shared reports.
import type { MaskRules } from './types';

const base: MaskRules = {
  password: 'asterisk',
  token: 'asterisk',
  secret: 'asterisk',
  authorization: { fixed: '[BEARER]' },
  apiKey: 'partial:4:0',
  accessToken: 'asterisk',
  refreshToken: 'asterisk'
};

export const maskProfiles: Record<string, MaskRules | false> = {
  default: base,

  healthcare: {
    ...base,
    ssn: { pattern: /(\d{3})-(\d{2})-(\d{4})/, replace: '***-**-$3' },
    dateOfBirth: 'asterisk',
    medicalRecordNumber: 'partial:0:-4',
    diagnosis: 'asterisk'
  },

  fintech: {
    ...base,
    creditCard: 'partial:4:-4',
    cardNumber: 'partial:4:-4',
    cvv: 'asterisk',
    accountNumber: 'partial:0:-4',
    routingNumber: 'asterisk',
    pin: 'asterisk'
  },

  pii: {
    ...base,
    email: { pattern: /(.{2}).+(@.+)/, replace: '$1***$2' },
    phone: { pattern: /(.{4}).+(.{2})/, replace: '$1****$2' },
    ssn: { pattern: /(\d{3})-(\d{2})-(\d{4})/, replace: '***-**-$3' },
    dateOfBirth: 'asterisk',
    address: 'asterisk'
  },

  none: false
};
