# FRONTEND — INTEGRAÇÃO ARENA AI
### Site oficial TROPA DA RÚSSIA (TDR) • GTA Roleplay

Este documento descreve o frontend entregue pelo Hark e tudo o que o Arena AI precisa para implementar o backend **sem reconstruir a interface**.

> Estado atual: frontend 100% funcional no navegador (catálogo, carrinho, calculadora, formulário, revisão). **Nenhuma encomenda é enviada.** O botão "Confirmar encomenda" mostra a tela "INTEGRAÇÃO EM DESENVOLVIMENTO".

---

## 1. Stack

| Item | Versão / uso |
|---|---|
| React | 18 (SPA) |
| TypeScript | 5, `strict: true` |
| Vite | 8 (build estático em `dist/`) |
| Tailwind CSS | v4 via `@tailwindcss/vite` (tokens em `src/styles/index.css` → `@theme`) |
| Motion | `motion/react` (Framer Motion) — `MotionConfig reducedMotion="user"` |
| Lucide React | ícones adicionais |
| React Hook Form + Zod | formulário e validação local |
| Fontes | Oswald + Inter auto-hospedadas (`@fontsource`), sem chamadas externas |

Nenhuma dependência de backend. Node 20+ recomendado (testes usam Node 22+).

---

## 2. Estrutura do projeto

```text
src/
├── assets/                    # mídia oficial (otimizada) + index.ts (mapa central `media`)
│   ├── logos/                 # logo-principal, logo-principal-branca, simbolo, simbolo-128, logo-horizontal
│   ├── images/                # banners, posters dos vídeos, ícone do servidor Discord
│   ├── gifs/                  # animacao-logo.gif, banner-animado-discord.gif (fallback dos vídeos)
│   └── videos/                # hero-loop.mp4, abertura-1080.mp4, abertura-720.mp4
├── components/
│   ├── Header/                # header fixo (transparente → vidro escuro ao rolar)
│   ├── Hero/                  # hero cinematográfico com vídeo e entrada em sequência
│   ├── LoadingScreen/         # loading com logo + linha tricolor
│   ├── Manifesto/             # interlúdio com a animação oficial do logo
│   ├── Catalog/               # CATÁLOGO OFICIAL (tabela desktop + cards mobile) e productVisuals.ts (ícones)
│   ├── ProductCard/           # card com quantidade + adicionar (etapa 1)
│   ├── Cart/                  # CartLines, CartTotal, CartStep, FloatingCartButton
│   ├── OrderExperience/       # modal de encomenda: etapas, progresso, navegação, carrinho lateral
│   ├── OrderForm/             # PartnershipStep (etapa 3), IdentificationForm (etapa 4), Field
│   ├── OrderReview/           # OrderReview (etapa 5) + IntegrationPending (estado temporário)
│   ├── OrderCTA/ DiscordSection/ Footer/ Toast/
│   └── ui/                    # Button, DiscordIcon, MediaLoop, QuantityStepper, Reveal, SectionHeading...
├── config/env.ts              # leitura/validação das variáveis VITE_*
├── context/                   # CartContext (estado), OrderUIContext (abrir/fechar), ToastContext
├── data/products.ts           # CATÁLOGO — fonte única dos preços
├── hooks/                     # useCart, useOrderUI, useDiscordInvite, useToast, useAssetPreload, useMediaQuery, useScrolled
├── lib/
│   ├── pricing.ts             # regras de cálculo (puras, testáveis)
│   ├── pricing.test.ts        # testes da calculadora (npm test)
│   ├── cartReducer.ts         # reducer do carrinho + hidratação segura
│   └── orderSchema.ts         # schemas Zod do formulário
├── services/orders.ts         # submitOrder() — PONTO DE INTEGRAÇÃO
├── types/Product.ts, Order.ts # tipos TypeScript
├── styles/index.css
├── App.tsx
└── main.tsx
```

Separação: **dados** (`data/`), **regras** (`lib/`), **estado** (`context/` + `hooks/`), **transporte** (`services/`), **apresentação** (`components/`).

---

## 3. Modelo dos produtos (`src/data/products.ts`)

```ts
interface Product {
  id: ProductId;           // slug estável — use como chave no banco
  name: string;
  price: { normal: number; partner: number }; // inteiros, em R$ fictícios
  image?: string;
  category?: 'protecao' | 'ferramentas';
}
```

| id | Produto | Sem parceria | Com parceria |
|---|---|---:|---:|
| algema | Algema | 7500 | 5750 |
| capuz | Capuz | 9000 | 7500 |
| pe-de-cabra | Pé de Cabra | 70000 | 65000 |
| colete | Colete | 17000 | 15000 |
| box-attachs | Caixa de Attachments | 12900 | 9350 |

Para servir o catálogo pela API no futuro: troque a constante `PRODUCTS` por dados vindos de `GET /api/products` mantendo o mesmo formato (ou mantenha o arquivo como fallback). O backend deve ter **a mesma tabela** como fonte da verdade.

---

## 4. Tipos (`src/types/Order.ts`)

- `PartnershipType = 'sem_parceria' | 'com_parceria'`
- `CartItem { productId; quantity }` — o carrinho guarda **só** referência + quantidade; preço é sempre derivado do catálogo.
- `CustomerData { characterName; characterId; factionName; phoneRp; discordUser; discordId?; notes? }`
- `OrderItem { productId; name; quantity; unitPrice; subtotal }`
- `OrderDraft { customer; partnership; partnerFaction?; items: OrderItem[]; total }`
- `OrderPayload` — corpo a enviar:

```json
{
  "schemaVersion": 1,
  "createdAt": "2026-11-09T12:00:00.000Z",
  "partnership": "com_parceria",
  "partnerFaction": "Família Vermelha",
  "customer": {
    "characterName": "Ivan Petrov", "characterId": "1452", "factionName": "Tropa da Rússia",
    "phoneRp": "555-0123", "discordUser": "tdr.membro", "discordId": "123456789012345678", "notes": "Entrega às 21h"
  },
  "items": [{ "productId": "colete", "quantity": 2 }, { "productId": "capuz", "quantity": 1 }],
  "clientPreview": { "items": [/* OrderItem[] */], "total": 37500, "currency": "BRL_RP" }
}
```

- `SubmitOrderResult = { status: 'not_configured', message } | { status: 'success', orderId, message? } | { status: 'error', message }`

⚠️ `clientPreview` é **apenas informativo**. O backend deve recalcular tudo a partir de `items[].productId`, `items[].quantity` e `partnership`, e rejeitar `productId` desconhecido.

---

## 5. Campos do formulário (`src/lib/orderSchema.ts`)

| Campo | Obrigatório | Regra local |
|---|---|---|
| characterName | sim | 3–40 caracteres; letras, espaço, `. ' -` |
| characterId | sim | só dígitos, 1–8 |
| factionName | sim | 2–40 |
| phoneRp | sim | dígitos, espaço e hífen, 3–15 (ex.: `555-0123`) |
| discordUser | sim | `[A-Za-z0-9_.]{2,32}`, `@` inicial removido, aceita legado `#1234` |
| discordId | não | 17–20 dígitos |
| notes | não | até 500 |
| partnerFaction (etapa 3) | sim, se `com_parceria` | 2–40 |

O backend deve repetir essas validações (ex.: com o mesmo schema Zod).

---

## 6. Carrinho e estado

- `CartProvider` (`context/CartContext.tsx`) usa `useReducer(orderReducer)`.
- Ações: `add`, `setQuantity`, `increment`, `decrement` (em 1 remove), `remove`, `clear`, `setPartnership`, `setPartnerFaction`, `setCustomer`, `reset`.
- `useCart()` expõe `state`, `items` (calculados), `total`, `units`, `partnerSavings` e os métodos.
- Persistência: `sessionStorage` (`tdr:cart:v1`) apenas para itens + modalidade + facção parceira. **Dados do personagem não são persistidos.** A hidratação descarta dados adulterados.
- Após um envio real bem-sucedido, o Arena deve chamar `dispatch({ type: 'reset' })`.

## 7. Regras de cálculo (`src/lib/pricing.ts`)

- Quantidades inteiras entre 1 e 99 (`sanitizeQuantity`): negativos → 1, decimais truncados, texto rejeitado.
- `getUnitPrice(product, partnership)` → preço oficial (nunca vem do usuário).
- `subtotal = unitPrice × quantity`; `total = Σ subtotais`.
- Trocar modalidade recalcula tudo; remover item recalcula o total.
- `formatBRL(17000)` → `"R$ 17.000"` (pt-BR, sem centavos).
- Exemplo testado: 2 Coletes + 1 Capuz sem parceria = R$ 43.000; com parceria = R$ 37.500.
- Rodar testes: `npm test`.

---

## 8. Onde integrar a API — `src/services/orders.ts`

```ts
export async function submitOrder(order: OrderPayload): Promise<SubmitOrderResult> {
  // HOJE: sem HTTP, sem confirmação falsa
  return { status: 'not_configured', message: BACKEND_PENDING_MESSAGE };
}
```

Substitua por (exemplo, função serverless na Vercel em `/api/orders`):

```ts
import { config } from '../config/env';

export async function submitOrder(order: OrderPayload): Promise<SubmitOrderResult> {
  const base = config.ordersApiUrl ?? ''; // '' = mesma origem (/api)
  try {
    const res = await fetch(`${base}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { status: 'error', message: data.message ?? 'Não foi possível enviar a encomenda.' };
    return { status: 'success', orderId: data.orderId, message: data.message };
  } catch {
    return { status: 'error', message: 'Falha de conexão. Tente novamente.' };
  }
}
```

`OrderExperience.tsx` já trata `not_configured` (tela pendente) e `error` (aviso). Falta apenas o caso `success`.

## 9. Substituindo o comportamento temporário do botão "Confirmar"

Em `src/components/OrderExperience/OrderExperience.tsx`, função `confirm()`:

1. Adicione ao tipo `View` algo como `{ kind: 'success'; orderId: string }`.
2. Em `result.status === 'success'`: `setView({ kind: 'success', orderId })` e `cart.dispatch({ type: 'reset' })`.
3. Crie `OrderReview/OrderSuccess.tsx` (pode copiar o layout de `IntegrationPending.tsx`) mostrando o ID real.
4. `IntegrationPending` pode permanecer como fallback para `not_configured`.

**Nunca** mostre "Encomenda enviada com sucesso" sem um `orderId` real retornado pelo backend.

---

## 10. Autenticação administrativa (futuro)

O site público não tem área admin. Recomendações:
- Painel em rota separada (`/admin`) com code-splitting (`React.lazy`) para não pesar o site público, ou painel direto no Discord.
- Autenticação no servidor (ex.: OAuth2 do Discord verificando cargo no servidor), sessão em cookie `HttpOnly`/`Secure`.
- Nunca colocar segredos em variáveis `VITE_*` (são públicas). Tokens do bot, webhooks e chaves ficam só em variáveis do servidor (sem prefixo `VITE_`).
- O `vercel.json` já reserva `/api/*` (não reescreve para o SPA).

---

## 11. Compilar e rodar

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # testes da calculadora
npm run build      # tsc + vite build → dist/
npm run preview    # serve dist/
```

## 12. Publicar na Vercel

1. Suba o projeto para um repositório (GitHub/GitLab).
2. Vercel → New Project → importe o repo. Framework detectado: **Vite** (já em `vercel.json`).
3. Build: `npm run build` • Output: `dist`.
4. Em *Environment Variables*, defina `VITE_DISCORD_INVITE_URL` (ex.: `https://discord.gg/SEUCODIGO`).
5. Deploy. Funções do Arena podem ser adicionadas em `/api/*.ts` na raiz do projeto.

## 13. Variáveis de ambiente

| Variável | Escopo | Uso |
|---|---|---|
| `VITE_DISCORD_INVITE_URL` | público | URL do convite. Validada: `https://discord.gg/...` ou `https://discord.com/invite/...`. Ausente/inválida → botões mostram estado "link indisponível" (nenhum endereço é inventado). |
| `VITE_ORDERS_API_URL` | público | Reservada. Base da API se ficar em outro domínio; vazio = mesma origem. |
| (servidor) `DISCORD_BOT_TOKEN`, `DATABASE_URL`, etc. | **privado** | A definir pelo Arena. Nunca com prefixo `VITE_`. |

Veja `.env.example`.

---

## 14. Mídias

- Hero: `hero-loop.mp4` (banner animado) com blur, overlay, gradientes e vinheta; poster `hero-poster.webp`; fallback GIF.
- Manifesto: animação oficial do logo (`abertura-1080.mp4` desktop / `abertura-720.mp4` mobile), toca só quando visível; fallback `animacao-logo.gif`.
- Discord: loop do banner animado com poster `banner-discord.webp`.
- `MediaLoop` degrada: vídeo → GIF → poster. Com "reduzir movimento" ativo, mostra apenas o poster.
- Loading: espera logo, símbolo, poster e o vídeo do hero (`canplay`), com mínimo de 650 ms e teto de 3,5 s — nunca trava.

## 15. O que ainda depende do Arena

- [ ] API `POST /api/orders` + validação (Zod) e **recálculo de preços no servidor**
- [ ] Banco de dados e IDs reais de pedidos
- [ ] Envio ao bot / embeds no Discord, sincronização de status
- [ ] Validação real das parcerias (o frontend só exibe o aviso)
- [ ] Tela de sucesso com `orderId` real (seção 9)
- [ ] Rate limit / anti-spam / segurança do servidor
- [ ] Autenticação administrativa (seção 10)
- [ ] Opcional: servir o catálogo pela API
