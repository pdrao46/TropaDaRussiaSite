/**
 * Utilidades HTTP das funções serverless (assinatura Node `req`/`res` da Vercel).
 */
import { config } from './config.js';

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };

/** Resposta JSON com `Cache-Control: no-store` (padrão para rotas de sessão/dados). */
export function json(res, status, body, extraHeaders = {}) {
  res.status(status);
  res.setHeader('Cache-Control', 'no-store');
  for (const [key, value] of Object.entries({ ...JSON_HEADERS, ...extraHeaders })) {
    res.setHeader(key, value);
  }
  res.end(JSON.stringify(body));
}

export function ok(res, body) {
  return json(res, 200, body);
}

export function created(res, body) {
  return json(res, 201, body);
}

export function noContent(res) {
  res.status(204);
  res.setHeader('Cache-Control', 'no-store');
  res.end();
}

export function fail(res, status, code, message, extra = {}) {
  return json(res, status, { error: code, code, message, ...extra });
}

export function badRequest(res, message, issues) {
  return fail(res, 400, 'validation_error', message, issues ? { issues } : {});
}

export function unauthorized(res, message = 'Não autenticado.', code = 'unauthenticated') {
  return fail(res, 401, code, message);
}

export function forbidden(res, message = 'Acesso não permitido.') {
  return fail(res, 403, 'forbidden', message);
}

export function notFound(res, message = 'Recurso não encontrado.') {
  return fail(res, 404, 'not_found', message);
}

export function tooMany(res, message = 'Muitas requisições. Aguarde um instante.') {
  return fail(res, 429, 'rate_limited', message);
}

export function serverError(res, err, context = 'requisição') {
  // Nunca devolvemos detalhes internos ao navegador; o log fica no servidor.
  console.error(`[tdr-api] falha em ${context}:`, err);
  return fail(res, 500, 'server_error', 'Erro interno do servidor. Tente novamente em instantes.');
}

/** Bloqueia métodos diferentes do esperado. */
export function methodGuard(req, res, ...allowed) {
  const list = allowed.map((m) => m.toUpperCase());
  if (!list.includes(String(req.method || 'GET').toUpperCase())) {
    res.setHeader('Allow', list.join(', '));
    return fail(res, 405, 'method_not_allowed', `Método ${req.method} não permitido.`);
  }
  return null;
}

/** Lê o corpo já parseado pela Vercel (com fallback para string/Buffer). */
export function readBody(req) {
  const body = req.body;
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  if (Buffer.isBuffer(body)) {
    try {
      return JSON.parse(body.toString('utf8'));
    } catch {
      return {};
    }
  }
  return body;
}

/** Serializa um cookie com os atributos de segurança exigidos. */
export function serializeCookie(name, value, options = {}) {
  const {
    maxAge = 0,
    httpOnly = true,
    secure = config.isProduction,
    sameSite = 'Lax',
    path = '/',
    domain,
  } = options;

  const parts = [`${name}=${value}`, `Path=${path}`];
  if (maxAge > 0) parts.push(`Max-Age=${maxAge}`, `Expires=${new Date(Date.now() + maxAge * 1000).toUTCString()}`);
  if (httpOnly) parts.push('HttpOnly');
  if (secure) parts.push('Secure');
  parts.push(`SameSite=${sameSite}`);
  if (domain) parts.push(`Domain=${domain}`);
  return parts.join('; ');
}

export function setCookie(res, name, value, options) {
  const serialized = serializeCookie(name, value, options);
  const existing = res.getHeader('Set-Cookie');
  if (!existing) {
    res.setHeader('Set-Cookie', serialized);
  } else if (Array.isArray(existing)) {
    res.setHeader('Set-Cookie', [...existing, serialized]);
  } else {
    res.setHeader('Set-Cookie', [existing, serialized]);
  }
}

/** Remove o cookie (Max-Age=0 mantendo os mesmos atributos de segurança). */
export function clearCookie(res, name, options = {}) {
  setCookie(res, name, '', { maxAge: 0, ...options });
}

/** Lê um cookie específico do cabeçalho. */
export function readCookie(req, name) {
  const raw = req.headers?.cookie;
  if (!raw) return null;
  for (const part of raw.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    if (key === name) {
      return decodeURIComponent(part.slice(index + 1).trim());
    }
  }
  return null;
}

/**
 * Origem pública da requisição (atrás do proxy da Vercel).
 * Usada para montar o redirect_uri do OAuth2 quando ele não está fixado.
 */
export function requestOrigin(req) {
  const proto = (req.headers?.['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const host = req.headers?.['x-forwarded-host'] || req.headers?.host;
  if (!host) return null;
  const cleanHost = String(host).split(',')[0].trim();
  // Em desenvolvimento local usamos http; em produção, sempre https.
  const scheme = cleanHost.includes('localhost') || cleanHost.startsWith('127.') ? 'http' : proto;
  return `${scheme}://${cleanHost}`;
}

/** Aceita apenas caminhos relativos do próprio site (evita open redirect). */
export function safeReturnTo(value, fallback = '/') {
  if (typeof value !== 'string') return fallback;
  const path = value.trim();
  if (!path.startsWith('/')) return fallback;
  if (path.startsWith('//')) return fallback;
  if (/^\/+[a-z0-9+.-]+:/i.test(path)) return fallback; // /http:..., /javascript:...
  if (path.includes('\\')) return fallback;
  return path.slice(0, 512);
}

/** IP do cliente para rate limit e auditoria. */
export function clientIp(req) {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();
  const real = req.headers?.['x-real-ip'];
  if (real) return String(real).split(',')[0].trim();
  return req.socket?.remoteAddress ?? 'unknown';
}

export function userAgent(req) {
  return String(req.headers?.['user-agent'] ?? '').slice(0, 300);
}
