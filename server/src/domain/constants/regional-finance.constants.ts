import { CountryCode } from '../enums/country-code.enum';
import { CurrencyCode } from '../enums/currency-code.enum';

export const COUNTRY_DEFAULT_CURRENCY: Record<CountryCode, CurrencyCode> = {
  [CountryCode.GT]: CurrencyCode.GTQ,
  [CountryCode.SV]: CurrencyCode.USD,
  [CountryCode.HN]: CurrencyCode.HNL,
};

export const COUNTRY_DEFAULT_TAX_RATE: Record<CountryCode, number> = {
  [CountryCode.GT]: 0.12,
  [CountryCode.SV]: 0.13,
  [CountryCode.HN]: 0.15,
};

export const COUNTRY_PHONE_PREFIX: Record<
  CountryCode,
  '+502' | '+503' | '+504'
> = {
  [CountryCode.GT]: '+502',
  [CountryCode.SV]: '+503',
  [CountryCode.HN]: '+504',
};

export function resolveDefaultCurrency(countryCode: CountryCode): CurrencyCode {
  return COUNTRY_DEFAULT_CURRENCY[countryCode];
}

export function resolveDefaultTaxRate(countryCode: CountryCode): number {
  return COUNTRY_DEFAULT_TAX_RATE[countryCode];
}
