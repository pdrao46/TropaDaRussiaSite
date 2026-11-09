import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, CheckCheck, Loader2, ShoppingBag, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ORDER_STEPS, type OrderStep } from '../../context/OrderUIContext';
import { useOrderUI } from '../../hooks/useOrderUI';
import { useCart } from '../../hooks/useCart';
import { useToast } from '../../hooks/useToast';
import { formatBRL } from '../../lib/pricing';
import { partnerFactionSchema } from '../../lib/orderSchema';
import { buildOrderPayload, submitOrder } from '../../services/orders';
import type { CustomerData, OrderDraft } from '../../types/Order';
import { media } from '../../assets';
import { Button } from '../ui/Button';
import { CartLines } from '../Cart/CartLines';
import { CartStep } from '../Cart/CartStep';
import { CartTotal } from '../Cart/CartTotal';
import { IdentificationForm, IDENTIFICATION_FORM_ID } from '../OrderForm/IdentificationForm';
import { PartnershipStep } from '../OrderForm/PartnershipStep';
import { IntegrationPending } from '../OrderReview/IntegrationPending';
import { OrderReview } from '../OrderReview/OrderReview';
import { OrderSuccess } from '../OrderReview/OrderSuccess';
import { ProductsStep } from './ProductsStep';
import { StepProgress } from './StepProgress';

type View =
  | { kind: 'step'; step: OrderStep }
  | { kind: 'pending'; message: string }
  | {
      kind: 'success';
      orderId: string;
      message?: string;
      warnings: string[];
      total: number;
      priceMode: string;
    };

const SIDEBAR_STEPS: OrderStep[] = ['produtos', 'modalidade', 'identificacao'];

export function OrderExperience() {
  const { isOpen, initialStep, closeOrder } = useOrderUI();
  return <AnimatePresence>{isOpen && <OrderDialog key="order" initialStep={initialStep} onClose={closeOrder} />}</AnimatePresence>;
}

function OrderDialog({ initialStep, onClose }: { initialStep: OrderStep; onClose: () => void }) {
  const cart = useCart();
  const { notify } = useToast();
  const [view, setView] = useState<View>({ kind: 'step', step: initialStep });
  const [direction, setDirection] = useState(1);
  const [maxReached, setMaxReached] = useState(ORDER_STEPS.indexOf(initialStep));
  const [partnerError, setPartnerError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const step = view.kind === 'step' ? view.step : 'revisao';
  const index = ORDER_STEPS.indexOf(step);

  // trava a rolagem da página e fecha com ESC
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const goTo = useCallback(
    (next: OrderStep) => {
      const ni = ORDER_STEPS.indexOf(next);
      setDirection(ni >= index ? 1 : -1);
      setView({ kind: 'step', step: next });
      setMaxReached((m) => Math.max(m, ni));
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [index],
  );

  // limpa erro da facção parceira quando corrigido / modalidade trocada
  useEffect(() => {
    if (partnerError && (cart.state.partnership === 'sem_parceria' || partnerFactionSchema.safeParse(cart.state.partnerFaction).success)) {
      setPartnerError(undefined);
    }
  }, [cart.state.partnership, cart.state.partnerFaction, partnerError]);

  // carrinho esvaziado em etapas posteriores: volta ao carrinho
  useEffect(() => {
    if (cart.items.length === 0 && index > 1 && view.kind === 'step') goTo('carrinho');
  }, [cart.items.length, index, view.kind, goTo]);

  const draft: OrderDraft | null = useMemo(() => {
    if (!cart.state.customer) return null;
    return {
      customer: cart.state.customer,
      partnership: cart.state.partnership,
      partnerFaction: cart.state.partnership === 'com_parceria' ? cart.state.partnerFaction.trim() : undefined,
      items: cart.items,
      total: cart.total,
    };
  }, [cart.state.customer, cart.state.partnership, cart.state.partnerFaction, cart.items, cart.total]);

  const next = () => {
    switch (step) {
      case 'produtos':
        return goTo('carrinho');
      case 'carrinho':
        if (cart.items.length === 0) {
          notify({ tone: 'warning', title: 'Carrinho vazio', description: 'Adicione ao menos um produto para continuar.' });
          return;
        }
        return goTo('modalidade');
      case 'modalidade':
        if (cart.state.partnership === 'com_parceria') {
          const r = partnerFactionSchema.safeParse(cart.state.partnerFaction);
          if (!r.success) {
            setPartnerError(r.error.issues[0]?.message);
            return;
          }
        }
        return goTo('identificacao');
      case 'identificacao':
        return; // o botão submete o formulário (form="...")
      default:
        return;
    }
  };

  const confirm = async () => {
    if (!draft) return;
    setSubmitting(true);
    const result = await submitOrder(buildOrderPayload(draft));
    setSubmitting(false);
    if (result.status === 'not_configured') setView({ kind: 'pending', message: result.message });
    else if (result.status === 'error') notify({ tone: 'warning', title: 'Não foi possível enviar', description: result.message });
    else if (result.status === 'success') {
      // Confirmação real: só chega aqui com um código devolvido pelo servidor.
      setView({
        kind: 'success',
        orderId: result.orderId,
        message: result.message,
        warnings: result.warnings ?? [],
        total: draft.total,
        priceMode: draft.partnership === 'com_parceria' ? 'parceria' : 'normal',
      });
      notify({ tone: 'success', title: 'Encomenda registrada', description: `Pedido ${result.orderId} enviado à equipe.` });
      cart.dispatch({ type: 'reset' });
    }
  };

  const showSidebar = view.kind === 'step' && SIDEBAR_STEPS.includes(step);

  const stepContent = () => {
    if (view.kind === 'success') {
      return (
        <OrderSuccess
          orderId={view.orderId}
          message={view.message}
          warnings={view.warnings}
          total={view.total}
          priceMode={view.priceMode}
          onClose={onClose}
        />
      );
    }
    if (view.kind === 'pending' && draft) {
      return <IntegrationPending message={view.message} draft={draft} onBack={() => setView({ kind: 'step', step: 'revisao' })} onClose={onClose} />;
    }
    switch (step) {
      case 'produtos':
        return <ProductsStep />;
      case 'carrinho':
        return <CartStep onBrowse={() => goTo('produtos')} />;
      case 'modalidade':
        return <PartnershipStep partnerError={partnerError} />;
      case 'identificacao':
        return (
          <IdentificationForm
            defaultValues={cart.state.customer}
            onValid={(data: CustomerData) => {
              cart.setCustomer(data);
              goTo('revisao');
            }}
          />
        );
      case 'revisao':
        return draft ? <OrderReview draft={draft} /> : null;
    }
  };

  const renderNext = (className = '') => {
    if (view.kind === 'pending' || view.kind === 'success') return null;
    if (step === 'revisao') {
      return (
        <Button variant="red" className={className} onClick={confirm} disabled={submitting || !draft} icon={submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}>
          <span className="sm:hidden">Confirmar</span>
          <span className="hidden sm:inline">Confirmar encomenda</span>
        </Button>
      );
    }
    if (step === 'identificacao') {
      return (
        <Button type="submit" form={IDENTIFICATION_FORM_ID} variant="blue" className={className} iconRight={<ArrowRight className="h-4 w-4" />}>
          Revisar
        </Button>
      );
    }
    return (
      <Button variant="blue" className={className} onClick={next} disabled={step === 'carrinho' && cart.items.length === 0} iconRight={<ArrowRight className="h-4 w-4" />}>
        {step === 'produtos' ? 'Ver carrinho' : 'Continuar'}
      </Button>
    );
  };

  const renderBack = (className = '') =>
    view.kind === 'pending' ? null : step === 'revisao' ? (
      <Button variant="ghost" className={className} onClick={() => goTo('identificacao')} icon={<ArrowLeft className="h-4 w-4" />}>
        <span className="sm:hidden">Editar</span>
        <span className="hidden sm:inline">Voltar e editar</span>
      </Button>
    ) : index > 0 ? (
      <Button variant="ghost" className={className} onClick={() => goTo(ORDER_STEPS[index - 1])} icon={<ArrowLeft className="h-4 w-4" />}>
        Voltar
      </Button>
    ) : null;

  return (
    <motion.div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Fazer encomenda — Tropa da Rússia"
      className="fixed inset-0 z-[60] flex flex-col bg-graphite/80 outline-none backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35 } }}
    >
      <motion.div
        initial={{ y: 40, opacity: 0, scale: 0.985 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 30, opacity: 0, scale: 0.985 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="noise relative mx-auto flex h-full w-full max-w-7xl flex-col overflow-hidden bg-graphite sm:my-4 sm:h-[calc(100%-2rem)] sm:rounded-3xl sm:border sm:border-white/10 sm:shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)]"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_0%_0%,rgba(0,87,184,0.18),transparent_45%),radial-gradient(ellipse_at_100%_100%,rgba(213,43,30,0.12),transparent_45%)]" />

        {/* Topo */}
        <div className="relative border-b border-white/10 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-8 sm:pb-5 sm:pt-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={media.logos.simboloSmall} alt="" className="h-9 w-9 sm:h-10 sm:w-10" />
              <div className="leading-tight">
                <p className="text-display text-[10px] tracking-[0.35em] text-steel">Tropa da Rússia</p>
                <p className="text-display text-lg font-bold tracking-[0.14em]">Encomenda</p>
              </div>
            </div>
            <div className="hidden flex-1 px-6 md:block lg:px-12">
              <StepProgress current={step} maxReached={maxReached} onSelect={goTo} />
            </div>
            <button type="button" onClick={onClose} className="rounded-xl border border-white/10 p-2.5 text-steel transition-colors hover:border-white/30 hover:text-white" aria-label="Fechar encomenda">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-3 md:hidden">
            <StepProgress current={step} maxReached={maxReached} onSelect={goTo} />
          </div>
        </div>

        {/* Corpo */}
        <div className="relative flex min-h-0 flex-1">
          <div ref={scrollRef} className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.div
                key={view.kind === 'pending' ? 'pending' : step}
                custom={direction}
                variants={{
                  enter: (d: number) => ({ opacity: 0, x: d * 40 }),
                  center: { opacity: 1, x: 0 },
                  exit: (d: number) => ({ opacity: 0, x: d * -40 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                {stepContent()}
              </motion.div>
            </AnimatePresence>
            {/* navegação desktop */}
            {view.kind === 'step' && (
              <div className="mt-8 hidden items-center justify-between border-t border-white/10 pt-6 lg:flex">
                {renderBack()}
                <span className="flex-1" />
                {renderNext()}
              </div>
            )}
          </div>

          {/* Carrinho lateral (desktop) */}
          <AnimatePresence initial={false}>
            {showSidebar && (
              <motion.aside
                key="sidebar"
                initial={{ opacity: 0, x: 40, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 360 }}
                exit={{ opacity: 0, x: 40, width: 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="hidden shrink-0 overflow-hidden border-l border-white/10 bg-black/20 lg:block"
                aria-label="Resumo do carrinho"
              >
                <div className="flex h-full w-[360px] flex-col p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-display flex items-center gap-2 text-sm font-semibold tracking-[0.25em]">
                      <ShoppingBag className="h-4 w-4 text-ru-red-light" aria-hidden="true" /> Carrinho
                    </h2>
                    <span className="text-xs text-steel">{cart.items.length} {cart.items.length === 1 ? 'produto' : 'produtos'}</span>
                  </div>
                  <div className="scrollbar-thin -mr-2 min-h-0 flex-1 overflow-y-auto pr-2">
                    <CartLines compact onEmptyAction={step !== 'produtos' ? () => goTo('produtos') : undefined} />
                  </div>
                  <CartTotal className="mt-4" />
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>

        {/* Barra inferior (mobile/tablet) */}
        {view.kind === 'step' && (
          <div className="relative border-t border-white/10 bg-graphite/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
            {step !== 'revisao' && (
              <div className="mb-2.5 flex items-center justify-between text-sm">
                <span className="text-steel">
                  {cart.units} {cart.units === 1 ? 'item' : 'itens'} • {cart.state.partnership === 'com_parceria' ? 'Com parceria' : 'Sem parceria'}
                </span>
                <motion.span key={cart.total} initial={{ opacity: 0.4, y: -4 }} animate={{ opacity: 1, y: 0 }} className="font-bold tabular-nums">
                  {formatBRL(cart.total)}
                </motion.span>
              </div>
            )}
            <div className="flex gap-2">
              {renderBack(step === 'revisao' ? 'flex-1 px-3' : 'px-4')}
              {renderNext('flex-1 px-3')}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
