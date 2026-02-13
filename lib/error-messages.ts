/**
 * Centralized error messages
 *
 * User-facing: PT-BR (returned in API responses)
 * Internal logs: EN (used with logger.error/warn/info)
 */

export const ERR = {
  UNAUTHORIZED: 'Não autorizado',
  FORBIDDEN: 'Acesso negado',
  NOT_FOUND: 'Não encontrado',
  INTERNAL_ERROR: 'Erro interno do servidor',
  BAD_REQUEST: 'Requisição inválida',
  VALIDATION_ERROR: 'Erro de validação',
  RATE_LIMITED: 'Muitas requisições. Tente novamente em alguns minutos.',

  // Auth
  SESSION_EXPIRED: 'Sessão expirada. Faça login novamente.',

  // Organization
  ORG_NOT_FOUND: 'Organização não encontrada',
  ORG_REQUIRED: 'Organização obrigatória',

  // Resources
  CONTACT_NOT_FOUND: 'Contato não encontrado',
  DEAL_NOT_FOUND: 'Negócio não encontrado',
  PIPELINE_NOT_FOUND: 'Pipeline não encontrado',
  CONNECTION_NOT_FOUND: 'Conexão não encontrada',
  MESSAGE_NOT_FOUND: 'Mensagem não encontrada',
  USER_NOT_FOUND: 'Usuário não encontrado',
  TAG_NOT_FOUND: 'Tag não encontrada',
  WEBHOOK_NOT_FOUND: 'Webhook não encontrado',
  AUTOMATION_NOT_FOUND: 'Automação não encontrada',
  API_KEY_NOT_FOUND: 'API key não encontrada',

  // Operations
  FAILED_CREATE: 'Falha ao criar',
  FAILED_UPDATE: 'Falha ao atualizar',
  FAILED_DELETE: 'Falha ao deletar',
  FAILED_FETCH: 'Falha ao buscar dados',
  FAILED_SEND: 'Falha ao enviar',

  // Fields
  MISSING_FIELDS: 'Campos obrigatórios faltando',
  INVALID_INPUT: 'Entrada inválida',
} as const
