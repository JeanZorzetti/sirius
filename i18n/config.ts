// Locale EN aposentado (spec 004). Um idioma so; o next-intl segue montado.
export const locales = ['pt-BR'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'pt-BR';
