/**
 * Sessão segura do website.
 *
 * Regras:
 *  - O cookie guarda SOMENTE um token opaco e aleatório (nunca o token do Discord).
 *  - No banco fica apenas o hash do token com "pimenta" (SESSION_SECRET).
 *  - Cookie: HttpOnly + Secure (produção) + SameSite=Lax + Path=/.
 *  - Nada é gravado em localStorage/sessionStorage pelo frontend.
 */
import { config } from './config.js';
import { db } from './db.js';
import { clientIp, clearCookie, readCookie, setCookie, userAgent } from './http.js';
import { hashSessionToken, randomToken } from './security.js';

const COOKIE = () => config.session.cookieName;

/** Cria a sessão do usuário e grava o cookie HttpOnly. */
export async function createSession(req, res, userId) {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + config.session.ttlSeconds * 1000);

  await db.insert('sessions', {
    user_id: userId,
    token_hash: hashSessionToken(token),
    expires_at: expiresAt.toISOString(),
    user_agent: userAgent(req),
    ip: clientIp(req),
  });

  setCookie(res, COOKIE(), token, {
    maxAge: config.session.ttlSeconds,
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'Lax',
    path: '/',
  });

  return token;
}

/**
 * Resolve a sessão atual.
 * @returns {{kind:'none'} | {kind:'expired'} | {kind:'ok', user:object, sessionId:string}}
 */
export async function resolveSession(req) {
  const token = readCookie(req, COOKIE());
  if (!token) return { kind: 'none' };

  let row;
  try {
    row = await db.selectOne('sessions', {
      token_hash: `eq.${hashSessionToken(token)}`,
      select: 'id,user_id,expires_at,revoked_at,last_seen_at,users(id,discord_id,username,global_name,display_name,avatar)',
    });
  } catch (err) {
    console.error('[tdr-api] falha ao consultar sessão:', err?.message ?? err);
    return { kind: 'none' };
  }

  if (!row) return { kind: 'none' };
  if (row.revoked_at) return { kind: 'none' };
  if (Date.parse(row.expires_at) <= Date.now()) return { kind: 'expired' };

  // Atualiza "último acesso" no máximo a cada 5 minutos (evita escrita em toda requisição).
  const lastSeen = row.last_seen_at ? Date.parse(row.last_seen_at) : 0;
  if (!lastSeen || Date.now() - lastSeen > 5 * 60 * 1000) {
    void db.update('sessions', { id: `eq.${row.id}` }, { last_seen_at: new Date().toISOString() }).catch(() => {});
  }

  return { kind: 'ok', user: row.users ?? null, sessionId: row.id, userId: row.user_id };
}

/** Encerra a sessão atual (revoga no banco e apaga o cookie). */
export async function destroySession(req, res) {
  const token = readCookie(req, COOKIE());
  if (token) {
    try {
      await db.update('sessions', { token_hash: `eq.${hashSessionToken(token)}` }, { revoked_at: new Date().toISOString() });
    } catch (err) {
      console.error('[tdr-api] falha ao revogar sessão:', err?.message ?? err);
    }
  }
  clearCookie(res, COOKIE(), { httpOnly: true, secure: config.isProduction, sameSite: 'Lax', path: '/' });
}

/* ------------------------------------------------------------- USUÁRIOS */

/** Normaliza o perfil vindo da API do Discord. */
export function normalizeDiscordProfile(profile) {
  const globalName = typeof profile.global_name === 'string' && profile.global_name.trim()
    ? profile.global_name.trim()
    : null;
  return {
    discord_id: String(profile.id),
    username: String(profile.username ?? ''),
    global_name: globalName,
    display_name: globalName || String(profile.username ?? ''),
    avatar: profile.avatar ? String(profile.avatar) : null,
  };
}

/** Cria ou atualiza o usuário e devolve a linha do banco. */
export async function upsertUser(profile) {
  const rows = await db.insert('users', { ...profile, last_login_at: new Date().toISOString() }, {
    prefer: 'return=representation,resolution=merge-duplicates',
  });
  const row = rows[0] ?? null;
  if (row) return row;
  return db.selectOne('users', { discord_id: `eq.${profile.discord_id}` });
}

/** Formato público devolvido ao navegador (sem nenhum dado sensível). */
export function publicUser(row) {
  if (!row) return null;
  return {
    id: String(row.discord_id ?? ''),
    username: String(row.username ?? ''),
    globalName: row.global_name ?? null,
    avatar: row.avatar ?? null,
  };
}
