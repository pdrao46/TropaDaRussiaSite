/**
 * Configuração do backend — SOMENTE SERVIDOR.
 *
 * Nenhum valor daqui pode chegar ao navegador. Variáveis com prefixo VITE_*
 * são públicas e, por isso, jamais devem conter segredos.
 */

const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on', 'sim']);

function bool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return TRUE_VALUES.has(String(value).trim().toLowerCase());
}

function int(value, fallback) {
  const parsed = Number.parseInt(String(value ?? '').trim(), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function str(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

/** Remove barras finais para evitar URLs duplicadas. */
function baseUrl(value) {
  return str(value).replace(/\/+$/, '');
}

const supabaseUrl = baseUrl(process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL);

export const config = {
  /** Restaurado em 2026-11-09 (estava pausado). */
  supabaseUrl,
  supabaseServiceRoleKey: str(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY),

  discordClientId: str(process.env.DISCORD_CLIENT_ID),
  discordClientSecret: str(process.env.DISCORD_CLIENT_SECRET),
  discordRedirectUri: str(process.env.DISCORD_REDIRECT_URI),

  /** "Pimenta" do hash da sessão: mesmo com o banco exposto, o token não é reutilizável. */
  sessionSecret: str(process.env.SESSION_SECRET),

  /** Servidor Discord que recebe os pedidos do site. */
  guildId: str(process.env.TDR_GUILD_ID || process.env.DISCORD_GUILD_ID),

  /** Segredo compartilhado com o bot (reservado para chamadas autenticadas). */
  botIntegrationSecret: str(process.env.DISCORD_ORDER_INTEGRATION_SECRET),

  isProduction: process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production',

  session: {
    cookieName: 'tdr_session',
    ttlSeconds: int(process.env.SESSION_TTL_SECONDS, 60 * 60 * 24 * 30), // 30 dias
    oauthStateTtlSeconds: int(process.env.OAUTH_STATE_TTL_SECONDS, 600), // 10 minutos
  },

  orders: {
    maxItems: int(process.env.MAX_ITEMS_PER_ORDER, 20),
    maxUnitsPerItem: int(process.env.MAX_UNITS_PER_ITEM, 999),
    /** Requisições por janela para rotas sensíveis. */
    rateLimitPerMinute: int(process.env.RATE_LIMIT_PER_MINUTE, 20),
  },
};

/** Status oficiais — IDÊNTICOS aos do bot Discord (garante a sincronização). */
export const ORDER_STATUS = {
  AGUARDANDO: 'aguardando',
  PARCERIA: 'parceria',
  APROVADO: 'aprovado',
  PREPARO: 'preparo',
  DISPONIVEL: 'disponivel',
  FINALIZADO: 'finalizado',
  CANCELADO: 'cancelado',
};

export const STATUS_LABELS = {
  aguardando: 'Aguardando análise',
  parceria: 'Parceria em verificação',
  aprovado: 'Aprovado',
  preparo: 'Em preparação no GTA RP',
  disponivel: 'Disponível no jogo',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
};

/** Transições permitidas — impede mudanças inconsistentes de status. */
export const STATUS_TRANSITIONS = {
  aguardando: ['parceria', 'aprovado', 'preparo', 'disponivel', 'finalizado', 'cancelado'],
  parceria: ['aguardando', 'aprovado', 'preparo', 'disponivel', 'finalizado', 'cancelado'],
  aprovado: ['preparo', 'disponivel', 'finalizado', 'cancelado'],
  preparo: ['disponivel', 'finalizado', 'cancelado'],
  disponivel: ['finalizado', 'cancelado'],
  finalizado: [],
  cancelado: [],
};

export function statusLabel(status) {
  return STATUS_LABELS[status] ?? status;
}

/** Verdadeiro quando o backend tem o mínimo para autenticar de verdade. */
export function isAuthConfigured() {
  return Boolean(config.supabaseUrl && config.supabaseServiceRoleKey && config.discordClientId && config.discordClientSecret);
}

/** Verdadeiro quando o backend consegue persistir pedidos. */
export function isDatabaseConfigured() {
  return Boolean(config.supabaseUrl && config.supabaseServiceRoleKey);
}

export { bool, int, str };
