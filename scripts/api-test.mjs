/**
 * Testes de integração da API — executa os handlers reais contra o banco real.
 *
 * Uso:
 *   cp .env.local.example .env.local   # preencha
 *   node scripts/api-test.mjs
 *
 * Nenhuma biblioteca de teste é necessária: o script simula req/res da Vercel.
 */
import { randomBytes } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

/* ------------------------------------------------ carrega .env.local ==== */
function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvFile(resolve(root, '.env.local'));

/* ----------------------------------------------------- mock req/res ==== */
function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: undefined,
    ended: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(key, value) {
      this.headers[key.toLowerCase()] = value;
      return this;
    },
    getHeader(key) {
      return this.headers[key.toLowerCase()];
    },
    end(chunk) {
      this.body = chunk;
      this.ended = true;
      return this;
    },
  };
  res.json = () => {
    try {
      return JSON.parse(res.body ?? 'null');
    } catch {
      return res.body;
    }
  };
  return res;
}

function mockReq({ method = 'GET', body, query = {}, headers = {}, cookies = {} } = {}) {
  const cookieHeader = Object.entries(cookies)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('; ');
  return {
    method,
    body,
    query,
    headers: { host: 'localhost:3000', 'x-forwarded-proto': 'https', ...headers, ...(cookieHeader ? { cookie: cookieHeader } : {}) },
    socket: { remoteAddress: '127.0.0.1' },
  };
}

/* ------------------------------------------------------------ runner ==== */
let passed = 0;
let failed = 0;
const failures = [];

function check(name, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  ✅ ${name}`);
  } else {
    failed += 1;
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
    console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function section(title) {
  console.log(`\n\x1b[1m${title}\x1b[0m`);
}

async function call(handlerPath, options) {
  const module = await import(handlerPath);
  const req = mockReq(options);
  const res = mockRes();
  await module.default(req, res);
  return { res, req };
}

/* -------------------------------------------------------------- tests ==== */
const api = (p) => resolve(root, 'api', p).replace(/\\/g, '/');

async function main() {
  console.log('\x1b[1m=== TESTES DA API — TROPA DA RÚSSIA ===\x1b[0m');

  section('1. GET /api/health');
  {
    const { res } = await call(api('health.js'), { method: 'GET' });
    const body = res.json();
    check('responde 200', res.statusCode === 200, `status ${res.statusCode}`);
    check('banco conectado', body?.checks?.database === 'ok', JSON.stringify(body?.checks));
    check('catálogo com 5 produtos', body?.checks?.catalog === 'ok', String(body?.checks?.catalog));
    check('auth configurado', body?.auth === 'configured', String(body?.auth));
  }

  section('2. GET /api/products (catálogo oficial)');
  {
    const { res } = await call(api('products.js'), { method: 'GET' });
    const body = res.json();
    const expected = {
      algema: [7500, 5750],
      capuz: [9000, 7500],
      'pe-de-cabra': [70000, 65000],
      colete: [17000, 15000],
      'box-attachs': [12900, 9350],
    };
    check('responde 200', res.statusCode === 200);
    check('exatamente 5 produtos', body?.products?.length === 5, `veio ${body?.products?.length}`);
    for (const [slug, [normal, partner]] of Object.entries(expected)) {
      const p = body?.products?.find((x) => x.slug === slug);
      check(
        `${slug}: ${normal}/${partner}`,
        p?.price?.normal === normal && p?.price?.partner === partner,
        p ? `${p.price.normal}/${p.price.partner}` : 'ausente',
      );
    }
  }

  section('3. GET /api/auth/me sem sessão');
  {
    const { res } = await call(api('auth/me.js'), { method: 'GET' });
    const body = res.json();
    check('responde 401', res.statusCode === 401, `status ${res.statusCode}`);
    check('código unauthenticated', body?.code === 'unauthenticated', JSON.stringify(body));
  }

  section('4. GET /api/auth/discord (início do OAuth2)');
  {
    const { res } = await call(api('auth/discord.js'), { method: 'GET', query: { returnTo: '/#catalogo' } });
    const location = res.headers.location ?? '';
    check('redireciona 302', res.statusCode === 302, `status ${res.statusCode}`);
    check('vai para o Discord', location.startsWith('https://discord.com/oauth2/authorize'));
    const params = new URLSearchParams(location.split('?')[1] ?? '');
    check('usa client_id configurado', params.get('client_id') === process.env.DISCORD_CLIENT_ID);
    check('response_type=code', params.get('response_type') === 'code');
    check('escopo identify', params.get('scope') === 'identify');
    check('tem state', Boolean(params.get('state')));
    check('tem code_challenge (PKCE)', Boolean(params.get('code_challenge')));
    check('code_challenge_method=S256', params.get('code_challenge_method') === 'S256');
    check('redirect_uri aponta para o callback', (params.get('redirect_uri') ?? '').includes('/api/auth/discord/callback'));
  }

  section('5. GET /api/auth/discord (open redirect bloqueado)');
  {
    const { res } = await call(api('auth/discord.js'), { method: 'GET', query: { returnTo: 'https://evil.example.com' } });
    const location = res.headers.location ?? '';
    const state = new URLSearchParams(location.split('?')[1] ?? '').get('state');
    // O returnTo inválido deve ter sido substituído por "/" no banco.
    const { db } = await import(api('_lib/db.js'));
    const row = await db.selectOne('oauth_states', { state: `eq.${state}` });
    check('returnTo externo é descartado', row?.return_to === '/', String(row?.return_to));
  }

  section('6. POST /api/orders — dados inválidos');
  {
    const { res } = await call(api('orders.js'), {
      method: 'POST',
      body: { items: [], customer: { characterName: 'A', characterId: 'abc' } },
    });
    const body = res.json();
    check('responde 400', res.statusCode === 400, `status ${res.statusCode}`);
    check('lista os problemas', Array.isArray(body?.issues) && body.issues.length >= 3, JSON.stringify(body?.issues));
  }

  section('7. POST /api/orders — produto inexistente');
  {
    const { res } = await call(api('orders.js'), {
      method: 'POST',
      body: {
        items: [{ productId: 'metralhadora-quantica', quantity: 1 }],
        customer: {
          characterName: 'Ivan Petrov', characterId: '1452', factionName: 'Tropa da Russia',
          phoneRp: '555-0123', discordUser: 'ivan.petrov', discordId: '123456789012345678',
        },
        partnership: 'sem_parceria',
      },
    });
    const body = res.json();
    check('responde 400', res.statusCode === 400, `status ${res.statusCode}`);
    check('mensagem em português', typeof body?.message === 'string' && body.message.length > 0, JSON.stringify(body));
  }

  section('8. POST /api/orders — pedido válido (SEM parceria)');
  let createdCode = null;
  {
    const { res } = await call(api('orders.js'), {
      method: 'POST',
      body: {
        schemaVersion: 1,
        items: [
          { productId: 'colete', quantity: 2 },
          { productId: 'capuz', quantity: 1 },
        ],
        customer: {
          characterName: 'Ivan Petrov', characterId: '1452', factionName: 'Tropa da Russia',
          phoneRp: '555-0123', discordUser: 'ivan.petrov', discordId: '123456789012345678',
          notes: 'Entregar às 21h',
        },
        partnership: 'sem_parceria',
        // O navegador tenta mentir sobre o total — deve ser ignorado.
        clientPreview: { total: 1, items: [{ productId: 'colete', quantity: 2, unitPrice: 1, subtotal: 1 }] },
      },
    });
    const body = res.json();
    createdCode = body?.orderId ?? null;
    check('responde 201', res.statusCode === 201, `status ${res.statusCode} ${JSON.stringify(body)}`);
    check('devolve um código TDR-000xxx', /^TDR-\d{6}$/.test(createdCode ?? ''), String(createdCode));
    check('total recalculado no servidor = 43000', body?.order?.total === 43000, String(body?.order?.total));
    check('status inicial = aguardando', body?.order?.status === 'aguardando', String(body?.order?.status));
    check('preço normal aplicado', body?.order?.priceMode === 'normal', String(body?.order?.priceMode));
  }

  section('9. POST /api/orders — parceria NÃO aprovada fica em verificação');
  let partnerCode = null;
  {
    const { res } = await call(api('orders.js'), {
      method: 'POST',
      body: {
        items: [{ productId: 'colete', quantity: 1 }],
        customer: {
          characterName: 'Dmitri Volkov', characterId: '9987', factionName: 'Tropa da Russia',
          phoneRp: '555-9999', discordUser: 'dmitri', discordId: '123456789012345678',
        },
        partnership: 'com_parceria',
        partnerFaction: 'Familia Vermelha',
      },
    });
    const body = res.json();
    partnerCode = body?.orderId ?? null;
    check('responde 201', res.statusCode === 201, JSON.stringify(body));
    check('status = parceria (em verificação)', body?.order?.status === 'parceria', String(body?.order?.status));
    check('preço de parceria aplicado', body?.order?.total === 15000, String(body?.order?.total));
    check('avisa que está em análise', (body?.warnings ?? []).some((w) => w.includes('verificação')), JSON.stringify(body?.warnings));
  }

  section('10. Evento na fila de integração (outbox)');
  {
    const { db } = await import(api('_lib/db.js'));
    const events = await db.select('integration_outbox', { order_code: `eq.${createdCode}` });
    check('evento criado para o pedido', events.length === 1, `${events.length} evento(s)`);
    check('evento é order.created', events[0]?.event_type === 'order.created', String(events[0]?.event_type));
    check('evento pendente', events[0]?.status === 'pending', String(events[0]?.status));

    const claim = await db.rpc('claim_outbox_events', { p_limit: 10, p_worker: 'test-suite' });
    check('bot consegue reivindicar o evento', Array.isArray(claim) && claim.length >= 1, JSON.stringify(claim).slice(0, 200));
    const claimed = claim.find((e) => e.orderCode === createdCode);
    check('evento traz os itens do pedido', claimed?.items?.length === 2, JSON.stringify(claimed?.items ?? []).slice(0, 200));

    if (claimed?.eventId) {
      const ack = await db.rpc('ack_outbox_event', { p_event_id: claimed.eventId, p_success: true });
      check('confirmação (ack) funciona', ack?.ok === true && ack?.status === 'done', JSON.stringify(ack));
    }
  }

  section('11. Consulta de pedido exige sessão');
  {
    const { res } = await call(api('orders/my.js'), { method: 'GET' });
    check('GET /api/orders/my sem sessão → 401', res.statusCode === 401, `status ${res.statusCode}`);

    const { res: r2 } = await call(api('orders/[id].js'), { method: 'GET', query: { id: 'TDR-000001' } });
    check('GET /api/orders/:id sem sessão → 401', r2.statusCode === 401, `status ${r2.statusCode}`);
  }

  section('12. Sessão forjada é rejeitada');
  {
    const { res } = await call(api('auth/me.js'), {
      method: 'GET',
      cookies: { tdr_session: randomBytes(32).toString('base64url') },
    });
    const body = res.json();
    check('token aleatório → 401', res.statusCode === 401, `status ${res.statusCode}`);
    check('código unauthenticated', body?.code === 'unauthenticated', JSON.stringify(body));
  }

  section('13. Rate limit');
  {
    let lastStatus = 0;
    for (let i = 0; i < 12; i += 1) {
      const { res } = await call(api('orders.js'), {
        method: 'POST',
        headers: { 'x-forwarded-for': '203.0.113.99' },
        body: {
          items: [{ productId: 'algema', quantity: 1 }],
          customer: {
            characterName: 'Teste Rate', characterId: '1', factionName: 'F',
            phoneRp: '555', discordUser: 'rate.test', discordId: '123456789012345678',
          },
          partnership: 'sem_parceria',
        },
      });
      lastStatus = res.statusCode;
      if (res.statusCode === 429) break;
    }
    check('limite de encomendas por IP aplicado', lastStatus === 429, `último status ${lastStatus}`);
  }

  /* ------------------------------------------------------------ resumo ==== */
  console.log(`\n\x1b[1m=== RESULTADO ===\x1b[0m`);
  console.log(`✅ ${passed} passaram   ❌ ${failed} falharam`);
  if (failures.length) {
    console.log('\nFalhas:');
    for (const f of failures) console.log(` - ${f}`);
  }
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('\n💥 Erro fatal na suíte de testes:', err);
  process.exit(1);
});
