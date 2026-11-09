import type { ProductId } from './Product';

/** Modalidade de preço escolhida pelo cliente. */
export type PartnershipType = 'sem_parceria' | 'com_parceria';

/** Item no carrinho: somente referência + quantidade. O preço é sempre derivado do catálogo. */
export interface CartItem {
  productId: ProductId;
  quantity: number;
}

/** Dados de identificação do personagem (somente dados do jogo / Discord). */
export interface CustomerData {
  characterName: string;
  characterId: string;
  factionName: string;
  phoneRp: string;
  discordUser: string;
  discordId?: string;
  notes?: string;
}

/** Linha calculada do pedido (para exibição e revisão). */
export interface OrderItem {
  productId: ProductId;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

/** Rascunho completo exibido na tela de revisão. */
export interface OrderDraft {
  customer: CustomerData;
  partnership: PartnershipType;
  partnerFaction?: string;
  items: OrderItem[];
  total: number;
}

/**
 * Corpo que será enviado à API (Arena).
 * Os preços enviados são apenas informativos: o backend DEVE recalcular
 * a partir de `productId` + `quantity` + `partnership`.
 */
export interface OrderPayload {
  schemaVersion: 1;
  createdAt: string;
  partnership: PartnershipType;
  partnerFaction?: string;
  customer: CustomerData;
  items: Array<{ productId: ProductId; quantity: number }>;
  clientPreview: {
    items: OrderItem[];
    total: number;
    currency: 'BRL_RP';
  };
}

/** Resultado do envio. `not_configured` é o estado atual (sem backend). */
export type SubmitOrderResult =
  | { status: 'not_configured'; message: string }
  | { status: 'success'; orderId: string; message?: string; warnings?: string[] }
  | { status: 'error'; message: string };
