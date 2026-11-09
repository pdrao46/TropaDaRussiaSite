# Integração do Login com Discord — TROPA DA RÚSSIA

Guia para o **Arena AI** conectar o backend de autenticação (Discord OAuth2) à interface já pronta no frontend.

> **Estado atual:** somente interface. Nenhuma autenticação real, nenhum usuário simulado e nenhuma chamada à API são feitos enquanto `VITE_AUTH_ENABLED` não for `true`. O site mostra claramente que o login está **em desenvolvimento**.

---

## 1. Componentes criados

| Arquivo | Função |
|---|---|
| `src/types/auth.ts` | Tipos públicos: `DiscordUser`, `AuthUser`, `AuthStatus`, `AuthState`, `SessionResult`, `AuthErrorCode`. |
| `src/services/authService.ts` | **Ponto de integração.** Endpoints, `fetchSession()`, `startDiscordLogin()`, `logout()`, `buildAvatarUrl()`, leitura de `?auth_error=`. |
| `src/context/AuthContext.tsx` | `AuthProvider`: estado global da sessão + abertura da interface de login. |
| `src/hooks/useAuth.ts` | Hook de acesso ao contexto (`status`, `user`, `login`, `logout`, `refresh`, `openLogin`…). |
| `src/components/auth/AuthStatus.tsx` | Slot do header: escolhe o componente certo para cada estado. |
| `src/components/auth/DiscordLoginButton.tsx` | Botão **Entrar com Discord** (versão do header e versão compacta para celular). |
| `src/components/auth/DiscordLoginModal.tsx` | Interface **Conectar conta Discord** com avisos de estado e botão **Continuar com Discord**. |
| `src/components/auth/UserProfileMenu.tsx` | Avatar + nome + indicador "conectado" e menu **Meu Perfil / Minhas Encomendas / Sair da Conta**. |

Arquivos existentes alterados (mínimo necessário):

- `src/main.tsx` — envolve o app com `<AuthProvider>`.
- `src/App.tsx` — monta `<DiscordLoginModal />`.
- `src/components/Header/Header.tsx` — adiciona `<AuthStatus />` antes dos botões Discord/Encomenda (desktop/tablet) e uma faixa discreta abaixo da barra em celulares (< 640px), para não apertar o logotipo nem os botões existentes.
- `src/components/OrderForm/IdentificationForm.tsx` — preenchimento automático e somente leitura dos campos do Discord quando houver sessão.
- `src/config/env.ts`, `src/vite-env.d.ts`, `.env.example` — novas variáveis `VITE_AUTH_ENABLED` e `VITE_API_BASE_URL`.

Nenhuma biblioteca nova foi instalada (usa `motion`, `lucide-react` e `zod`, já presentes).

---

## 2. Funcionamento da interface

1. Ao carregar a página, o `AuthProvider`:
   - se `VITE_AUTH_ENABLED` ≠ `true` → estado `unavailable` (`not_configured`), **sem requisições**;
   - se habilitado → chama `GET /api/auth/me` com `credentials: 'include'`;
   - se a URL tiver `?auth_error=<codigo>` (retorno do callback) → mostra o erro, abre a interface e limpa a URL.
2. O header mostra **Entrar com Discord**. O clique abre a interface de login.
3. **Continuar com Discord** faz navegação de página inteira para `GET /api/auth/discord?returnTo=<caminho>`. O backend redireciona ao Discord e, no callback, cria a sessão e volta para `returnTo`.
4. De volta ao site, `GET /api/auth/me` devolve o usuário → o header troca o botão pelo perfil.
5. Se o usuário voltar do Discord pelo botão "voltar" do navegador (bfcache), a sessão é revalidada para não ficar presa em "conectando".

---

## 3. Estados de autenticação (`AuthStatus`)

| Estado | Quando | Header | Interface de login |
|---|---|---|---|
| `checking` | Verificando sessão ao carregar | Botão com indicador de carregamento | "Verificando…" |
| `unauthenticated` | `/me` → 401 sem `session_expired` | **Entrar com Discord** | **Continuar com Discord** |
| `connecting` | Após clicar em continuar (redirecionando) | Botão com carregamento | "Conectando…" |
| `authenticated` | `/me` → 200 válido | Avatar + nome + indicador | Fecha automaticamente |
| `expired` | `/me` → 401 `{ code: 'session_expired' }` ou `?auth_error=session_expired` | Botão **Reconectar** com alerta vermelho | Aviso + **Conectar novamente** |
| `error` | `?auth_error=...` ou resposta inválida do `/me` | Botão com alerta vermelho | Mensagem profissional + **Tentar novamente** |
| `unavailable` (`not_configured`) | `VITE_AUTH_ENABLED` ≠ `true` | **Entrar com Discord** | "Autenticação em desenvolvimento", botão desativado |
| `unavailable` (`offline`) | Falha de rede, 404, 502, 503, 504 | **Entrar com Discord** | "Login indisponível" + **Tentar novamente** (revalida) |

---

## 4. Tipos TypeScript (`src/types/auth.ts`)

```ts
interface DiscordUser {
  id: string;              // snowflake (17–20 dígitos)
  username: string;        // nome de usuário único
  globalName: string | null;
  avatar: string | null;   // hash do avatar
}

interface AuthUser extends DiscordUser {
  displayName: string;     // globalName ?? username
  avatarUrl: string;       // CDN oficial do Discord (calculado no frontend)
}

type AuthStatus = 'checking' | 'unauthenticated' | 'connecting' | 'authenticated' | 'expired' | 'error' | 'unavailable';
type AuthErrorCode = 'access_denied' | 'invalid_state' | 'oauth_failed' | 'server_error' | 'session_expired';
```

A resposta do `/me` é validada com `zod` antes de ser usada; dados fora do formato viram estado `error`.

---

## 5. Endpoints necessários (contrato sugerido)

Todos na mesma origem do site (recomendado) ou em `VITE_API_BASE_URL`.

### `GET /api/auth/discord`
- Query: `returnTo` (caminho relativo, ex.: `/#catalogo`). **Validar**: aceitar só caminhos que começam com `/` e não com `//`.
- Gera `state` aleatório (e PKCE, opcional), guarda em cookie HttpOnly de curta duração e redireciona (302) para:
  `https://discord.com/oauth2/authorize?client_id=...&response_type=code&redirect_uri=...&scope=identify&state=...`

### `GET /api/auth/discord/callback` (interno do backend)
- Confere `state`; troca `code` por token em `https://discord.com/api/oauth2/token`; busca `GET https://discord.com/api/users/@me`.
- Cria a sessão no servidor e define o cookie de sessão; redireciona para `returnTo`.
- Em falha, redireciona para `/?auth_error=<codigo>` usando um dos códigos de `AuthErrorCode` (`access_denied` quando o usuário cancela no Discord).
- **Não** repassar `access_token`/`refresh_token` ao navegador.

### `GET /api/auth/me`
- `200 { "user": { "id": "...", "username": "...", "globalName": "..." | null, "avatar": "..." | null } }`
- `401 { "code": "unauthenticated" }` — sem sessão.
- `401 { "code": "session_expired" }` — sessão existia mas expirou.
- Enviar `Cache-Control: no-store`.

### `POST /api/auth/logout`
- Invalida a sessão no servidor e apaga o cookie (`Max-Age=0`). Responder `204`.
- O frontend envia o cabeçalho `X-Requested-With: tdr-web`; o backend pode exigi-lo como proteção extra contra CSRF (além de `SameSite=Lax`).

---

## 6. Integração com o formulário de encomendas

`IdentificationForm.tsx` já está preparado:

- Com `status === 'authenticated'`, os campos **Usuário do Discord** (`username`) e **ID do usuário no Discord** (`id`) são preenchidos automaticamente e ficam **somente leitura**, com a dica "Vinculado à sua conta Discord conectada".
- Ao enviar, esses dois valores vêm **da sessão**, nunca do campo editável.
- Nome do personagem, ID do personagem, facção, telefone no jogo e observações continuam iguais.
- Sem sessão, o formulário funciona exatamente como antes (preenchimento manual).

**Regra para o backend de encomendas:** quando a requisição `POST` de encomenda chegar com cookie de sessão válido, use o `id`/`username` da sessão e **ignore** `customer.discordUser`/`customer.discordId` enviados pelo cliente. Lembre de usar `credentials: 'include'` no `fetch` de `submitOrder` (`src/services/orders.ts`).

**Minhas Encomendas:** o item do menu hoje mostra um aviso "será liberada em breve". Quando existir `GET /api/orders/me` (pedidos vinculados ao `discordId` da sessão), substitua o callback `onOrders` em `src/components/auth/AuthStatus.tsx` pela navegação/tela real. O mesmo vale para `onProfile` (**Meu Perfil**).

---

## 7. Dados esperados do Discord

Escopo mínimo: **`identify`** (não pedir `email` nem `guilds` sem necessidade).

De `GET https://discord.com/api/users/@me`, o frontend só precisa de:

| Campo Discord | Campo no `/api/auth/me` |
|---|---|
| `id` | `id` |
| `username` | `username` |
| `global_name` | `globalName` |
| `avatar` | `avatar` |

O avatar é montado no frontend: `https://cdn.discordapp.com/avatars/{id}/{avatar}.png` (ou `.gif` se o hash começar com `a_`). Sem avatar, usa o avatar padrão do Discord. Se a imagem falhar, mostra a inicial do nome.

---

## 8. Como conectar o OAuth2 real

1. No [Discord Developer Portal](https://discord.com/developers/applications): crie/abra a aplicação → **OAuth2** → adicione o Redirect URI: `https://SEU-DOMINIO/api/auth/discord/callback` (e o de preview, se usar).
2. Guarde `DISCORD_CLIENT_ID` e `DISCORD_CLIENT_SECRET` **somente no backend** (variáveis sem prefixo `VITE_`).
3. Implemente os endpoints da seção 5 (ex.: funções serverless em `/api` na Vercel).
4. Sessão: cookie `HttpOnly; Secure; SameSite=Lax; Path=/`, com ID de sessão aleatório (ou JWT assinado de curta duração) — **nunca** tokens do Discord.
5. Ative no frontend: `VITE_AUTH_ENABLED=true` e faça novo deploy.
6. Teste: entrar → perfil no header → abrir encomenda (campos do Discord travados) → sair.

Nada deve ser salvo em `localStorage`/`sessionStorage`; o frontend não guarda nenhum dado de autenticação.

---

## 9. Como implementar o logout

- Frontend (já pronto): **Sair da Conta** chama `POST /api/auth/logout` com `credentials: 'include'` e volta ao estado `unauthenticated`.
- Backend: apagar a sessão no armazenamento do servidor e responder com `Set-Cookie: <nome>=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`.
- Opcional: revogar o token do Discord em `POST https://discord.com/api/oauth2/token/revoke`.

---

## 10. Configurações necessárias na Vercel

| Variável | Onde | Valor |
|---|---|---|
| `VITE_AUTH_ENABLED` | Frontend | `true` quando o backend estiver no ar (padrão: `false`) |
| `VITE_API_BASE_URL` | Frontend | Vazio (mesma origem) — recomendado |
| `DISCORD_CLIENT_ID` | Backend | ID da aplicação |
| `DISCORD_CLIENT_SECRET` | Backend | Segredo da aplicação (**nunca** com prefixo `VITE_`) |
| `DISCORD_REDIRECT_URI` | Backend | `https://SEU-DOMINIO/api/auth/discord/callback` |
| `SESSION_SECRET` | Backend | Segredo longo e aleatório para assinar a sessão |

Observações:

- O `vercel.json` atual já **não** reescreve `/api/*` para o `index.html` (`"source": "/((?!api/|assets/).*)"`), então rotas `/api` funcionam sem mudança.
- Mantenha frontend e API **no mesmo domínio** para os cookies serem first-party (evita bloqueio de cookies de terceiros e dispensa CORS).
- Se a API ficar em outro domínio: configure CORS com `Access-Control-Allow-Origin` exato (não `*`), `Access-Control-Allow-Credentials: true` e cookie `SameSite=None; Secure`.
- Variáveis `VITE_*` são embutidas no bundle e ficam públicas: nunca coloque segredos nelas.
