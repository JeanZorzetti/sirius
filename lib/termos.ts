// Versions of the legal texts a user accepts at signup: the date in each page's "Última atualização".
// Changing terms.lastUpdated or privacy.lastUpdated in messages/pt-BR/marketing.json means bumping these;
// __tests__/aceite-termos.test.ts fails until they match.
// ponytail: accounts created before a new version are not asked to re-accept; add that when a change is material.
export const VERSAO_TERMOS = '2026-09-28'
export const VERSAO_PRIVACIDADE = '2026-09-27'

// Set by the signup form right before Google OAuth; /api/auth/google-session only creates the account if it is there.
export const COOKIE_ACEITE = 'aceite_termos'

// Risk notice a user confirms before a WhatsApp integrator connection is activated (terms section 6.2).
// Changing the text means bumping the version: the audit row records which one was accepted.
export const VERSAO_AVISO_INTEGRADOR = '2026-09-27'
export const AVISO_INTEGRADOR =
  'Entendo que a conexão por integrador não é oficial: a Meta pode bloquear este número a qualquer momento, e o Sirius não consegue recuperá-lo.'
