import { useContext } from 'react';
import { OrderUIContext } from '../context/OrderUIContext';

export function useOrderUI() {
  const ctx = useContext(OrderUIContext);
  if (!ctx) throw new Error('useOrderUI deve ser usado dentro de <OrderUIProvider>.');
  return ctx;
}
