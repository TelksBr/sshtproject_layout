import type { TranslationSchema } from './types';

export type LocaleOverrides = {
  [Section in keyof TranslationSchema]?: Partial<TranslationSchema[Section]>;
};

// Regional variants only store changed messages, sharing the remaining strings.
export function extendLocale(base: TranslationSchema, overrides: LocaleOverrides): TranslationSchema {
  return Object.fromEntries(Object.entries(base).map(([section, messages]) => [
    section, { ...messages, ...overrides[section as keyof TranslationSchema] },
  ])) as unknown as TranslationSchema;
}
