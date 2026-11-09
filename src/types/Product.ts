/** Identificadores estáveis dos produtos. Use-os como chave no backend (Arena). */
export type ProductId =
  | 'algema'
  | 'capuz'
  | 'pe-de-cabra'
  | 'colete'
  | 'box-attachs';

export type ProductCategory = 'protecao' | 'ferramentas';

/** Valores fictícios do GTA RP, em reais inteiros (sem centavos). */
export interface ProductPrice {
  /** Preço "Sem Parceria". */
  normal: number;
  /** Preço "Com Parceria". */
  partner: number;
}

export interface Product {
  id: ProductId;
  name: string;
  price: ProductPrice;
  /** Caminho/URL opcional de imagem do produto (ainda não fornecida). */
  image?: string;
  category?: ProductCategory;
}
