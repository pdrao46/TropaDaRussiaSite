/**
 * Discord OAuth2 — Authorization Code Flow com PKCE (S256) e parâmetro `state`.
 *
 * O Client Secret nunca sai do servidor. O navegador recebe apenas o cookie de
 * sessão; os tokens do Discord são usados uma vez e descartados.
 */
import { createHash, randomBytes } from 'node:crypto';
import { config } from './config.js';
import { db } from './db.js';
import { randomToken } from './security.js';

const DISCORD_API = 'https://discord.com/api/v10';
const AUTHORIZE_URL = 'https://discord.com/oauth2/authorize';

/** Escopo mínimo: identidade básica. Não pedimos e-mail nem servidores. */
const SCOPES = ['identify'];

/** PKCE: challenge = base64url( SHA256(verifier) ) — método S256. */
function codeChallengeS256(verifier) {
  return createHash('sha256').update(verifier, 'utf8').digest('base64url');
}

/** Cria o `state` + `code_verifier`, persiste e devolve a URL de autorização. */
export async function buildAuthorizeUrl({ returnTo = '/', origin }) {
  const state = randomToken(24);
  const codeVerifier = randomBytes(48).toString('base64url'); // 64 chars — dentro do limite 43..128
  const redirectUri = config.discordRedirectUri || `${origin}/api/auth/discord/callback`;

  await db.insert('oauth_states', {
    state,
    code_verifier: codeVerifier,
    return_to: returnTo,
    redirect_uri: redirectUri,
    expires_at: new Date(Date.now() + config.session.oauthStateTtlSeconds * 1000).toISOString(),
  });

  const params = new URLSearchParams({
    client_id: config.discordClientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: SCOPES.join(' '),
    state,
    code_challenge: codeChallengeS256(codeVerifier),
    code_challenge_method: 'S256',
    prompt: 'consent',
  });

  return { url: `${AUTHORIZE_URL}?${params.toString()}`, state, redirectUri };
}

/**
 * Consome o `state` (uso único) e devolve o `code_verifier` dele.
 * Retorna null quando o state não existe, expirou ou já foi usado.
 */
export async function consumeState(state) {
  if (typeof state !== 'string' || state.length < 10) return null;

  const row = await db.selectOne('oauth_states', { state: `eq.${state}` });
  if (!row) return null;
  if (row.used_at) return null;
  if (Date.parse(row.expires_at) <= Date.now()) return null;

  // Marca como usado: protege contra replay do mesmo state.
  await db.update('oauth_states', { state: `eq.${state}` }, { used_at: new Date().toISOString() });

  return {
    codeVerifier: row.code_verifier,
    returnTo: row.return_to,
    redirectUri: row.redirect_uri,
  };
}

/** Troca o código de autorização pelo token de acesso (com PKCE). */
export async function exchangeCode(code, { codeVerifier, redirectUri }) {
  const body = new URLSearchParams({
    client_id: config.discordClientId,
    client_secret: config.discordClientSecret,
    grant_type: 'authorization_code',
    code: String(code),
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const res = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Falha ao trocar o código (${res.status}): ${detail.slice(0, 300)}`);
  }
  return res.json();
}

/** Busca o perfil do usuário autenticado. */
export async function fetchDiscordProfile(accessToken) {
  const res = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Falha ao consultar o perfil (${res.status}): ${detail.slice(0, 300)}`);
  }
  const data = await res.json();
  if (!data?.id) throw new Error('Perfil do Discord inválido.');
  return data;
}

/** Revoga o token do Discord (melhor esforço; falha não derruba o logout). */
export async function revokeToken(accessToken) {
  if (!accessToken) return;
  try {
    await fetch(`${DISCORD_API}/oauth2/token/revoke`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.discordClientId,
        client_secret: config.discordClientSecret,
        token: accessToken,
      }).toString(),
    });
  } catch {
    /* ignorado de propósito */
  }
}
