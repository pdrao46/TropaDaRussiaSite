/**
 * GET /api/auth/discord
 *
 * Inicia o login: gera `state` + PKCE, guarda no banco e redireciona para a
 * tela oficial de autorização do Discord.
 *
 * Query:
 *   returnTo — caminho relativo do site para onde voltar após o login.
 */
import { isAuthConfigured } from '../_lib/config.js';
import { buildAuthorizeUrl } from '../_lib/oauth.js';
import { fail, methodGuard, requestOrigin, safeReturnTo, serverError } from '../_lib/http.js';

export default async function handler(req, res) {
  const blocked = methodGuard(req, res, 'GET');
  if (blocked) return blocked;

  if (!isAuthConfigured()) {
    return fail(res, 503, 'auth_not_configured', 'O login com Discord não está configurado neste ambiente.');
  }

  const origin = requestOrigin(req);
  if (!origin) return fail(res, 400, 'bad_request', 'Não foi possível determinar a origem da requisição.');

  const returnTo = safeReturnTo(req.query?.returnTo, '/');

  try {
    const { url } = await buildAuthorizeUrl({ returnTo, origin });
    res.status(302);
    res.setHeader('Location', url);
    res.setHeader('Cache-Control', 'no-store');
    res.end();
  } catch (err) {
    return serverError(res, err, 'início do login com Discord');
  }
}
