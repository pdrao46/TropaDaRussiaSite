import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';

export const ORDER_STEPS = ['produtos', 'carrinho', 'modalidade', 'identificacao', 'revisao'] as const;
export type OrderStep = (typeof ORDER_STEPS)[number];

interface OrderUIValue {
  isOpen: boolean;
  initialStep: OrderStep;
  openOrder: (step?: OrderStep) => void;
  closeOrder: () => void;
}

export const OrderUIContext = createContext<OrderUIValue | null>(null);

export function OrderUIProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const [initialStep, setInitialStep] = useState<OrderStep>('produtos');
  const openOrder = useCallback((step: OrderStep = 'produtos') => {
    setInitialStep(step);
    setOpen(true);
  }, []);
  const closeOrder = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ isOpen, initialStep, openOrder, closeOrder }), [isOpen, initialStep, openOrder, closeOrder]);
  return <OrderUIContext.Provider value={value}>{children}</OrderUIContext.Provider>;
}
