export const PHONE_COUNTRIES = [
  { code: '+502', label: 'Guatemala (+502)' },
  { code: '+503', label: 'El Salvador (+503)' },
  { code: '+504', label: 'Honduras (+504)' },
] as const

export type PhoneCountryCode = (typeof PHONE_COUNTRIES)[number]['code']

const DEFAULT_CODE: PhoneCountryCode = '+502'
const LOCAL_DIGITS = 8

export function normalizeLocalPhone(value: string): string {
  return value.replace(/\D/g, '').slice(0, LOCAL_DIGITS)
}

export function splitPrefixedPhone(value?: string | null): {
  countryCode: PhoneCountryCode
  localNumber: string
} {
  if (!value) {
    return { countryCode: DEFAULT_CODE, localNumber: '' }
  }

  const compact = value.replace(/[\s-]/g, '')
  const match = compact.match(/^\+(502|503|504)(\d{0,8})$/)

  if (!match) {
    return { countryCode: DEFAULT_CODE, localNumber: normalizeLocalPhone(compact) }
  }

  return {
    countryCode: (`+${match[1]}`) as PhoneCountryCode,
    localNumber: match[2],
  }
}

export function buildPrefixedPhone(countryCode: PhoneCountryCode, localNumber: string): string {
  const normalized = normalizeLocalPhone(localNumber)
  if (!normalized) return ''
  return `${countryCode}${normalized}`
}

export function isValidPrefixedPhone(value: string): boolean {
  return /^\+50[234]\d{8}$/.test(value)
}
