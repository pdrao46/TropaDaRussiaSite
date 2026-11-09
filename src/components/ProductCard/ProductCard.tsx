import { motion } from 'motion/react';
import { Handshake } from 'lucide-react';
import { useState } from 'react';
import type { PartnershipType } from '../../types/Order';
import type { Product } from '../../types/Product';
import { formatBRL } from '../../lib/pricing';
import { PRODUCT_ICONS } from '../Catalog/productVisuals';
import { AddToCartButton } from '../ui/AddToCartButton';
import { QuantityStepper } from '../ui/QuantityStepper';

interface ProductCardProps {
  product: Product;
  partnership: PartnershipType;
  inCart: number;
  onAdd: (quantity: number) => void;
  index?: number;
}

export function ProductCard({ product, partnership, inCart, onAdd, index = 0 }: ProductCardProps) {
  const [qty, setQty] = useState(1);
  const Icon = PRODUCT_ICONS[product.id];
  const partnerActive = partnership === 'com_parceria';

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.035, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
      className={`panel group relative flex flex-col overflow-hidden rounded-2xl p-4 transition-[border-color,box-shadow] duration-300 hover:border-white/25 hover:shadow-[0_20px_50px_-24px_rgba(0,87,184,0.8)] ${
        inCart > 0 ? 'border-ru-red/40' : ''
      }`}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-ru-blue/20 blur-2xl transition-opacity duration-500 group-hover:opacity-100 sm:opacity-0" aria-hidden="true" />
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-white/12 to-transparent transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[-4deg]">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        {inCart > 0 && (
          <motion.span
            key={inCart}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-full border border-ru-red/40 bg-ru-red/15 px-2 py-0.5 text-[11px] font-semibold text-ru-red-light"
          >
            {inCart} no carrinho
          </motion.span>
        )}
      </div>
      <h3 className="text-display mt-4 text-lg font-semibold tracking-[0.08em]">{product.name}</h3>

      <dl className="mt-3 space-y-1.5 text-sm">
        <div className={`flex items-center justify-between rounded-md px-2 py-1 transition-colors ${!partnerActive ? 'bg-white/[0.07] text-white' : 'text-steel'}`}>
          <dt>Sem parceria</dt>
          <dd className="font-semibold tabular-nums">{formatBRL(product.price.normal)}</dd>
        </div>
        <div className={`flex items-center justify-between rounded-md px-2 py-1 transition-colors ${partnerActive ? 'bg-ru-blue/20 text-white ring-1 ring-ru-blue/50' : 'text-ru-blue-light'}`}>
          <dt className="flex items-center gap-1.5"><Handshake className="h-3.5 w-3.5" aria-hidden="true" />Com parceria</dt>
          <dd className="font-bold tabular-nums">{formatBRL(product.price.partner)}</dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center gap-2 pt-1">
        <QuantityStepper value={qty} onChange={setQty} label={product.name} />
        <AddToCartButton
          className="flex-1"
          onAdd={() => {
            onAdd(qty);
            setQty(1);
          }}
          ariaLabel={`Adicionar ${qty} ${product.name} ao carrinho`}
        />
      </div>
    </motion.article>
  );
}
