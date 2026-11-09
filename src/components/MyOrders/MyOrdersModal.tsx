/**
 * MINHAS ENCOMENDAS — consulta real a `GET /api/orders/my`.
 *
 * Construído com a mesma linguagem visual do site (graphite, linhas sutis,
 * tipografia display e tricolor) para não destoar do layout original.
 */
import { AnimatePresence, motion } from 'motion/react';
import { Loader2, PackageSearch, RefreshCw, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { fetchMyOrders, type ApiOrder } from '../../services/orders';
import { formatBRL } from '../../lib/pricing';

const STATUS_STYLE: Record<string, string> = {
  aguardando: 'border-amber-400/40 bg-amber-400/10 text-amber-200',
  parceria: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200',
  aprovado: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200',
  preparo: 'border-ru-blue-light/40 bg-ru-blue/15 text-ru-blue-light',
  disponivel: 'border-violet-400/40 bg-violet-400/10 text-violet-200',
  finalizado: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  cancelado: 'border-ru-red/40 bg-ru-red/10 text-ru-red-light',
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return '—';
  }
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function MyOrdersModal({ open, onClose }: Props) {
  const [state, setState] = useState<'loading' | 'ready' | 'error' | 'unauthenticated'>('loading');
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [reloading, setReloading] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    const result = await fetchMyOrders(signal);
    if (result.kind === 'ok') {
      setOrders(result.orders);
      setState('ready');
    } else if (result.kind === 'unauthenticated') {
      setState('unauthenticated');
    } else {
      setState('error');
    }
    return result;
  }, []);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setState('loading');
    void load(controller.signal).catch(() => undefined);
    return () => controller.abort();
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const reload = async () => {
    setReloading(true);
    await load().catch(() => undefined);
    setReloading(false);
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="my-orders-title"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-graphite shadow-2xl sm:rounded-2xl"
          >
            {/* cabeçalho */}
            <div className="flex items-start justify-between gap-4 border-b border-white/10 bg-panel px-5 py-4 sm:px-6">
              <div>
                <span className="tricolor mb-3 block h-[3px] w-16 rounded-full" aria-hidden="true" />
                <h2 id="my-orders-title" className="text-display text-lg font-bold tracking-[0.14em] sm:text-xl">
                  MINHAS ENCOMENDAS
                </h2>
                <p className="mt-1 text-xs text-steel">Acompanhe o andamento dos pedidos feitos nesta conta.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={reload}
                  disabled={reloading}
                  aria-label="Atualizar lista"
                  className="rounded-full border border-white/10 p-2 text-steel transition hover:border-ru-blue/50 hover:text-ru-white disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${reloading ? 'animate-spin' : ''}`} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Fechar"
                  className="rounded-full border border-white/10 p-2 text-steel transition hover:border-ru-red/50 hover:text-ru-white"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* conteúdo */}
            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              {state === 'loading' ? (
                <div className="flex flex-col items-center gap-3 py-14 text-steel">
                  <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
                  <p className="text-sm">Carregando suas encomendas…</p>
                </div>
              ) : null}

              {state === 'unauthenticated' ? (
                <div className="py-14 text-center text-steel">
                  <p className="text-sm">Conecte sua conta Discord para ver suas encomendas.</p>
                </div>
              ) : null}

              {state === 'error' ? (
                <div className="py-14 text-center">
                  <p className="text-sm text-steel">Não foi possível carregar suas encomendas.</p>
                  <button
                    type="button"
                    onClick={reload}
                    className="mt-3 text-sm font-semibold text-ru-blue-light underline-offset-4 hover:underline"
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : null}

              {state === 'ready' && orders.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-14 text-center text-steel">
                  <PackageSearch className="h-8 w-8 opacity-70" aria-hidden="true" />
                  <p className="text-sm">Você ainda não fez encomendas.</p>
                </div>
              ) : null}

              {state === 'ready' && orders.length > 0 ? (
                <ul className="space-y-3">
                  {orders.map((order) => (
                    <li
                      key={order.id}
                      className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-ru-blue/30"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-display text-base font-bold tracking-[0.1em] text-ru-white">
                          #{order.code}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                            STATUS_STYLE[order.status] ?? 'border-white/15 bg-white/5 text-steel'
                          }`}
                        >
                          {order.statusLabel}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-steel">
                        {formatDate(order.createdAt)} • {order.customer.characterName} ({order.customer.factionName})
                      </p>

                      <ul className="mt-3 space-y-1 text-sm text-steel">
                        {order.items.map((item) => (
                          <li key={`${order.id}-${item.slug}`} className="flex justify-between gap-3">
                            <span>
                              {item.quantity}× {item.name}
                            </span>
                            <span className="tabular-nums">{formatBRL(item.subtotal)}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
                        <span className="text-xs uppercase tracking-[0.18em] text-steel">
                          {order.priceMode === 'parceria' ? 'Parceria' : 'Normal'}
                        </span>
                        <span className="text-display text-base font-bold text-ru-white">{formatBRL(order.total)}</span>
                      </div>

                      {order.customer.notes ? (
                        <p className="mt-2 text-xs italic text-steel">Obs.: {order.customer.notes}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="border-t border-white/10 px-5 py-3 text-center text-[11px] text-steel sm:px-6">
              Valores em moeda fictícia do GTA RP • o status é atualizado pela equipe no Discord.
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
