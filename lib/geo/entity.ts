/**
 * Perfis sociais canônicos e VERIFICADOS para desambiguação de entidade (sameAs).
 *
 * Só entra URL comprovadamente nossa — sameAs apontando pra perfil de terceiro
 * ATRAPALHA a desambiguação do brand (Google funde a entidade errada).
 * Verificado em 2026-07-11:
 * - linkedin.com/company/roi-labs-curadoria — página oficial ROI Labs (owned)
 * - instagram.com/roilabs.curadoria — declarado no schema de roilabs.com.br
 * - linkedin.com/company/roilabs — página DELETADA (não usar)
 * - linkedin.com/company/roi-labs — consultoria americana homônima (não usar)
 * - twitter.com/roilabs e github.com/roilabs — contas de terceiros (não usar)
 */
export const ORG_SAME_AS = [
  'https://www.linkedin.com/company/roi-labs-curadoria/',
  'https://www.instagram.com/roilabs.curadoria/',
]

export const FOUNDER_SAME_AS = [
  'https://www.linkedin.com/in/jean-zorzetti-772742239/',
  'https://github.com/JeanZorzetti',
]

/** Fragmento Person do founder — liga siriuscrm.com.br ao perfil cujo About cita "Sirius CRM". */
export const FOUNDER = {
  '@type': 'Person',
  name: 'Jean Zorzetti',
  jobTitle: 'Founder',
  sameAs: FOUNDER_SAME_AS,
}
