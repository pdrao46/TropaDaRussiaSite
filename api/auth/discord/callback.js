/**
 * GET /api/auth/discord/callback
 *
 * Retorno do Discord. Valida `state` (uso único), troca o código pelo token
 * (com PKCE), lê o perfil, cria/atualiza o usuário e abre a sessão.
 *
 * Em qualquer falha redireciona para o site com `?auth_error=<codigo>`,
 * usando apenas os códigos que o frontend conhece.
 */
import { config, isAuthConfigured } from '../../_lib/config.js';
import { consumeState, exchangeCode, fetchDiscordProfile } from '../../_lib/oauth.js';
import { createSession, normalizeDiscordProfile, upsertUser } from '../../_lib/session.js';
import { audit } from '../../_lib/security.js';
import { methodGuard, requestOrigin, safeReturnTo } from '../../_lib/http.js';

/** Redireciona de volta para o site, opcionalmente com um código de erro conhecido. */
function back(req, res, origin, returnTo, errorCode) {
  let target = `${origin}${safeReturnTo(returnTo, '/')}`;
  if (errorCode) {
    target += `${target.includes('?') ? '&' : '?'}auth_error=${encodeURIComponent(errorCode)}`;
  }
  res.status(302);
  res.setHeader('Location', target);
  res.setHeader('Cache-Control', 'no-store');
  res.end();
}

export default async function handler(req, res) {
  const blocked = methodGuard(req, res, 'GET');
  if (blocked) return blocked;

  const origin = requestOrigin(req) ?? '';
  const query = req.query ?? {};

  if (!isAuthConfigured()) {
    return back(req, res, origin, '/', 'server_error');
  }

  // O `state` é consultado antes de qualquer coisa para recuperar o returnTo.
  const consumed = await consumeState(query.state).catch(() => null);
  const returnTo = consumed?.returnTo ?? '/';

  if (!consumed) {
    return back(req, res, origin, returnTo, 'invalid_state');
  }

  if (query.error) {
    await audit(req, { actorType: 'anonymous', action: 'auth.discord.denied', details: { reason: String(query.error) } });
    return back(req, res, origin, returnTo, String(query.error) === 'access_denied' ? 'access_denied' : 'oauth_failed');
  }

  if (!query.code) {
    return back(req, res, origin, returnTo, 'invalid_state');
  }

  try {
    const redirectUri = consumed.redirectUri || config.discordRedirectUri || `${origin}/api/auth/discord/callback`;
    const token = await exchangeCode(query.code, {
      codeVerifier: consumed.codeVerifier,
      redirectUri,
    });

    const profile = await fetchDiscordProfile(token.access_token);
    const user = await upsertUser(normalizeDiscordProfile(profile));
    await createSession(req, res, user.id);

    await audit(req, {
      actorType: 'user',
      actorId: user.discord_id,
      action: 'auth.discord.login',
      entityType: 'user',
      entityId: user.id,
    });

    // Opcional: o token do Discord não é mais necessário — a sessão é nossa.
    return back(req, res, origin, returnTo);
  } catch (err) {
    console.error('[tdr-api] falha no callback do Discord:', err?.message ?? err);
    return back(req, res, origin, returnTo, 'oauth_failed');
  }
}
