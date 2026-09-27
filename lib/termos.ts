// Versions of the legal texts a user accepts at signup: the date in each page's "Última atualização".
// Changing terms.lastUpdated or privacy.lastUpdated in messages/pt-BR/marketing.json means bumping these;
// __tests__/aceite-termos.test.ts fails until they match.
// ponytail: accounts created before a new version are not asked to re-accept; add that when a change is material.
export const VERSAO_TERMOS = '2026-09-27'
export const VERSAO_PRIVACIDADE = '2026-01-01'

// Set by the signup form right before Google OAuth; /api/auth/google-session only creates the account if it is there.
export const COOKIE_ACEITE = 'aceite_termos'
