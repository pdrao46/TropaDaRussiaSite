import { PRODUCTS } from '../../data/products';
import { useCart } from '../../hooks/useCart';
import { useToast } from '../../hooks/useToast';
import { ProductCard } from '../ProductCard/ProductCard';
import { StepHeader } from './StepHeader';

export function ProductsStep() {
  const { add, quantityOf, state } = useCart();
  const { notify } = useToast();
  return (
    <div>
      <StepHeader step={1} title="Produtos" description="Escolha os itens e as quantidades. Você pode selecionar vários produtos." />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
        {PRODUCTS.map((p, i) => (
          <ProductCard
            key={p.id}
            index={i}
            product={p}
            partnership={state.partnership}
            inCart={quantityOf(p.id)}
            onAdd={(q) => {
              add(p.id, q);
              notify({ title: `${q}× ${p.name} adicionado`, description: 'Carrinho atualizado.' });
            }}
          />
        ))}
      </div>
    </div>
  );
}
