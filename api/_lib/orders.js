/**
 * Regras de negócio das encomendas.
 *
 * Princípio central: **o navegador nunca decide preço, desconto nem identidade**.
 * O backend recalcula tudo a partir do catálogo do banco e, quando existe sessão,
 * ignora os campos de Discord enviados pelo cliente.
 */
import { config, ORDER_STATUS, STATUS_LABELS } from './config.js';
import { db } from './db.js';

/* ------------------------------------------------------------ VALIDAÇÃO */

const RE_CHARACTER_NAME = /^[\p{L}\d\s.'-]{3,40}$/u;
const RE_CHARACTER_ID = /^\d{1,8}$/;
const RE_PHONE = /^[\d\s-]{3,15}$/;
const RE_DISCORD_USER = /^[A-Za-z0-9_.]{2,32}$/;
const RE_DISCORD_ID = /^\d{17,20}$/;
const RE_SLUG = /^[a-z0-9-]{1,40}$/;

function clean(value, max = 500) {
  if (value === undefined || value === null) return '';
  return String(value).replace(/\s+/g, ' ').trim().slice(0, max);
}

export function normalizeFaction(value) {
  return clean(value, 60)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Valida e normaliza o corpo do pedido.
 * @param {object} body corpo recebido do frontend
 * @param {{user:object}|null} session sessão autenticada (ou null)
 */
export function validateOrderInput(body, session) {
  const issues = [];
  const data = body && typeof body === 'object' ? body : {};
  const customer = data.customer && typeof data.customer === 'object' ? data.customer : {};

  /* ---------------- itens ---------------- */
  const rawItems = Array.isArray(data.items) ? data.items : [];
  if (rawItems.length === 0) issues.push({ field: 'items', message: 'Adicione ao menos um produto.' });
  if (rawItems.length > config.orders.maxItems) {
    issues.push({ field: 'items', message: `Máximo de ${config.orders.maxItems} itens por pedido.` });
  }

  const items = [];
  const seen = new Map();
  for (const raw of rawItems.slice(0, config.orders.maxItems)) {
    const slug = clean(raw?.productId ?? raw?.slug, 40).toLowerCase();
    const quantity = Number(raw?.quantity);

    if (!RE_SLUG.test(slug)) {
      issues.push({ field: 'items', message: 'Produto inválido.' });
      continue;
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > config.orders.maxUnitsPerItem) {
      issues.push({ field: 'items', message: `Quantidade inválida para "${slug}".` });
      continue;
    }
    if (seen.has(slug)) {
      // Junta quantidades repetidas em vez de criar duas linhas do mesmo produto.
      seen.set(slug, seen.get(slug) + quantity);
      continue;
    }
    seen.set(slug, quantity);
    items.push({ slug, quantity });
  }
  for (const [slug, quantity] of seen) {
    const item = items.find((x) => x.slug === slug);
    if (item) item.quantity = quantity;
  }

  /* ---------------- dados de RP ---------------- */
  const characterName = clean(customer.characterName, 40);
  if (!RE_CHARACTER_NAME.test(characterName)) {
    issues.push({ field: 'characterName', message: 'Nome do personagem deve ter de 3 a 40 caracteres.' });
  }

  const characterId = clean(customer.characterId, 8);
  if (!RE_CHARACTER_ID.test(characterId)) {
    issues.push({ field: 'characterId', message: 'ID do personagem deve conter apenas números (até 8 dígitos).' });
  }

  const factionName = clean(customer.factionName, 40);
  if (factionName.length < 2 || factionName.length > 40) {
    issues.push({ field: 'factionName', message: 'Nome da facção deve ter de 2 a 40 caracteres.' });
  }

  const phoneRp = clean(customer.phoneRp, 15);
  if (!RE_PHONE.test(phoneRp)) {
    issues.push({ field: 'phoneRp', message: 'Telefone do jogo inválido (use apenas números, espaço e hífen).' });
  }

  const notes = clean(customer.notes, 500);
  if (notes.length > 500) issues.push({ field: 'notes', message: 'Observações devem ter no máximo 500 caracteres.' });

  /* ---------------- parceria ---------------- */
  const partnership = data.partnership === 'com_parceria' ? 'com_parceria' : 'sem_parceria';
  let partnerFaction = null;
  if (partnership === 'com_parceria') {
    partnerFaction = clean(data.partnerFaction ?? customer.partnerFaction, 40);
    if (partnerFaction.length < 2 || partnerFaction.length > 40) {
      issues.push({ field: 'partnerFaction', message: 'Informe o nome da facção parceira (2 a 40 caracteres).' });
    }
  }

  /* ---------------- identidade Discord ---------------- */
  // Com sessão, a identidade vem do banco — os valores do formulário são ignorados.
  let discordId;
  let discordUser;

  if (session?.user) {
    discordId = String(session.user.discord_id);
    discordUser = String(session.user.username);
  } else {
    const manualUser = clean(customer.discordUser, 37).replace(/^@/, '');
    const manualId = clean(customer.discordId, 20);
    if (!RE_DISCORD_USER.test(manualUser)) {
      issues.push({ field: 'discordUser', message: 'Informe um usuário do Discord válido.' });
    }
    if (manualId && !RE_DISCORD_ID.test(manualId)) {
      issues.push({ field: 'discordId', message: 'ID do Discord inválido (17 a 20 dígitos).' });
    }
    discordId = manualId || '';
    discordUser = manualUser;
  }

  if (issues.length) return { ok: false, issues };

  return {
    ok: true,
    value: {
      items,
      characterName,
      characterId,
      factionName,
      phoneRp,
      notes: notes || null,
      partnership,
      partnerFaction,
      discordId,
      discordUser,
    },
  };
}

/* ----------------------------------------------------------- CONFIGURAÇÕES */

const settingsCache = new Map();
const SETTINGS_TTL = 30_000;

async function getSetting(key, fallback) {
  const cached = settingsCache.get(key);
  if (cached && Date.now() - cached.at < SETTINGS_TTL) return cached.value;

  try {
    const row = await db.selectOne('app_settings', { key: `eq.${key}` });
    const value = row ? row.value : fallback;
    settingsCache.set(key, { at: Date.now(), value });
    return value;
  } catch {
    return fallback;
  }
}

/** Limpa o cache (usado quando uma configuração é alterada). */
export function clearSettingsCache() {
  settingsCache.clear();
}

/* ------------------------------------------------------------- PARCERIA */

/**
 * Decide a modalidade de preço. O cliente NUNCA aprova o próprio desconto:
 * a parceria precisa estar com status 'aprovada' no banco.
 */
export async function resolvePartnership({ partnership, partnerFaction }) {
  if (partnership !== 'com_parceria') {
    return {
      priceMode: 'normal',
      partnershipStatus: 'nao_solicitada',
      initialStatus: ORDER_STATUS.AGUARDANDO,
      approved: false,
    };
  }

  const normalized = normalizeFaction(partnerFaction);
  let record = null;
  try {
    record = await db.selectOne('partnerships', {
      normalized_name: `eq.${normalized}`,
      ...(config.guildId ? { guild_id: `eq.${config.guildId}` } : {}),
    });
  } catch (err) {
    console.error('[tdr-api] falha ao consultar parcerias:', err?.message ?? err);
  }

  if (record?.status === 'aprovada') {
    return {
      priceMode: 'parceria',
      partnershipStatus: 'aprovada',
      initialStatus: ORDER_STATUS.AGUARDANDO,
      approved: true,
      record,
    };
  }

  // Parceria ainda não aprovada: registra o pedido de análise (uma vez) e
  // aplica a regra configurada (manter em análise ou cobrar o preço normal).
  if (normalized && !record) {
    try {
      await db.insert('partnerships', {
        guild_id: config.guildId || null,
        faction_name: partnerFaction,
        normalized_name: normalized,
        status: 'pendente',
        created_by: 'website',
      });
    } catch {
      // Já existe (corrida) — ignorado.
    }
  }

  const fallback = await getSetting('partner_fallback', 'analise');
  if (fallback === 'normal') {
    return {
      priceMode: 'normal',
      partnershipStatus: record?.status === 'recusada' ? 'recusada' : 'pendente',
      initialStatus: ORDER_STATUS.AGUARDANDO,
      approved: false,
      record,
      downgraded: true,
    };
  }

  return {
    priceMode: 'parceria',
    partnershipStatus: record?.status === 'recusada' ? 'recusada' : 'pendente',
    initialStatus: ORDER_STATUS.PARCERIA,
    approved: false,
    record,
    pendingReview: true,
  };
}

/* --------------------------------------------------------------- CATÁLOGO */

export async function listProducts({ onlyActive = true } = {}) {
  const rows = await db.select('products', {
    select: 'id,slug,name,description,price_normal,price_partner,max_per_order,stock,active,sort_order',
    ...(onlyActive ? { active: 'eq.true' } : {}),
    order: 'sort_order.asc',
  });
  return rows.map((row) => ({
    id: row.slug,
    slug: row.slug,
    name: row.name,
    description: row.description,
    image: null,
    price: { normal: row.price_normal, partner: row.price_partner },
    maxPerOrder: row.max_per_order,
    stock: row.stock,
    active: row.active,
    sortOrder: row.sort_order,
  }));
}

/** Prévia de preços calculada no servidor (o frontend nunca envia valores). */
export async function priceQuote(items) {
  const slugs = items.map((x) => x.slug);
  const products = await db.select('products', {
    select: 'slug,name,price_normal,price_partner,max_per_order,active',
    slug: `in.(${slugs.join(',')})`,
  });

  const problems = [];
  const lines = [];
  for (const item of items) {
    const product = products.find((p) => p.slug === item.slug);
    if (!product || !product.active) {
      problems.push(`Produto "${item.slug}" indisponível.`);
      continue;
    }
    if (item.quantity > product.max_per_order) {
      problems.push(`${product.name}: máximo de ${product.max_per_order} por pedido.`);
      continue;
    }
    lines.push({
      slug: product.slug,
      name: product.name,
      quantity: item.quantity,
      priceNormal: product.price_normal,
      pricePartner: product.price_partner,
      maxPerOrder: product.max_per_order,
    });
  }

  const totalNormal = lines.reduce((sum, l) => sum + l.priceNormal * l.quantity, 0);
  const totalPartner = lines.reduce((sum, l) => sum + l.pricePartner * l.quantity, 0);
  return { lines, totalNormal, totalPartner, problems };
}

/* --------------------------------------------------------------- CRIAÇÃO */

/** Cria o pedido (transação atômica no Postgres). */
export async function createOrder({ input, session, partnership }) {
  const result = await db.rpc('place_order', {
    p_user_id: session?.userId ?? null,
    p_discord_id: input.discordId,
    p_discord_user: input.discordUser,
    p_character_name: input.characterName,
    p_character_id: input.characterId,
    p_faction_name: input.factionName,
    p_phone_rp: input.phoneRp,
    p_notes: input.notes,
    p_partnership: input.partnership,
    p_partner_faction: input.partnerFaction,
    p_partnership_status: partnership.partnershipStatus,
    p_price_mode: partnership.priceMode,
    p_initial_status: partnership.initialStatus,
    p_items: input.items,
    p_guild_id: config.guildId || null,
  });

  return result;
}

/* --------------------------------------------------------------- CONSULTAS */

/** Enriquece um pedido com itens e histórico. */
async function hydrate(orders) {
  if (!orders.length) return [];
  const ids = orders.map((o) => o.id);

  const items = await db.select('order_items', {
    order_id: `in.(${ids.join(',')})`,
    select: 'id,order_id,slug,name,quantity,unit_price,subtotal,sort_order',
    order: 'sort_order.asc',
  });
  const history = await db.select('order_status_history', {
    order_id: `in.(${ids.join(',')})`,
    select: 'id,order_id,status,label,note,actor_type,actor_id,created_at',
    order: 'created_at.desc',
  });

  return orders.map((order) => ({
    id: order.id,
    code: order.code,
    status: order.status,
    statusLabel: STATUS_LABELS[order.status] ?? order.status,
    source: order.source,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    partnership: order.partnership,
    partnerFaction: order.partner_faction,
    partnershipStatus: order.partnership_status,
    priceMode: order.price_mode,
    total: order.total,
    currency: order.currency,
    customer: {
      characterName: order.character_name,
      characterId: order.character_id,
      factionName: order.faction_name,
      phoneRp: order.phone_rp,
      discordUser: order.discord_user,
      discordId: order.discord_id,
      notes: order.notes,
    },
    items: items
      .filter((i) => i.order_id === order.id)
      .map((i) => ({
        slug: i.slug,
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.unit_price,
        subtotal: i.subtotal,
      })),
    history: history
      .filter((h) => h.order_id === order.id)
      .map((h) => ({
        status: h.status,
        label: h.label ?? STATUS_LABELS[h.status] ?? h.status,
        note: h.note,
        actorType: h.actor_type,
        at: h.created_at,
      })),
    discord: {
      published: order.sync_state === 'synced',
      messageId: order.discord_message_id,
      assignedTo: order.discord_assigned_to,
    },
  }));
}

const ORDER_SELECT =
  'id,code,user_id,status,source,created_at,updated_at,partnership,partner_faction,partnership_status,price_mode,total,currency,character_name,character_id,faction_name,phone_rp,discord_user,discord_id,notes,sync_state,discord_message_id,discord_assigned_to';

/** Pedidos do usuário autenticado (por user_id e, como rede de segurança, discord_id). */
export async function listMyOrders(session, limit = 50) {
  const filters = [];
  if (session?.userId) filters.push(`user_id.eq.${session.userId}`);
  if (session?.user?.discord_id) filters.push(`discord_id.eq.${session.user.discord_id}`);
  if (!filters.length) return [];

  const rows = await db.select('orders', {
    select: ORDER_SELECT,
    or: `(${filters.join(',')})`,
    order: 'created_at.desc',
    limit,
  });
  return hydrate(rows);
}

/** Busca um pedido pelo código, garantindo que ele pertença a quem pediu. */
export async function getOrderFor(code, session) {
  const order = await db.selectOne('orders', { select: ORDER_SELECT, code: `eq.${code}` });
  if (!order) return null;

  const owns =
    (session?.userId && order.user_id === session.userId) ||
    (session?.user?.discord_id && order.discord_id === session.user.discord_id);

  if (!owns) return { forbidden: true };
  const [hydrated] = await hydrate([order]);
  return hydrated;
}
