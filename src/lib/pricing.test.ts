/* Testes da calculadora — execute com: npm test (Node 22+). Sem dependências extras. */
import assert from 'node:assert/strict';
import { PRODUCTS } from '../data/products.ts';
import { calculateItems, calculateTotal, formatBRL, sanitizeQuantity, calculatePartnerSavings } from './pricing.ts';
import type { CartItem } from '../types/Order';

const EXPECTED: Record<string, [number, number]> = {
  Algema: [7500, 5750], Capuz: [9000, 7500], 'Pé de Cabra': [70000, 65000],
  Colete: [17000, 15000], 'Caixa de Attachments': [12900, 9350],
};

let passed = 0;
const test = (name: string, fn: () => void) => { fn(); passed++; console.log('  ✓', name); };

test('5 produtos no catálogo', () => assert.equal(PRODUCTS.length, 5));
test('10 preços corretos', () => {
  for (const p of PRODUCTS) assert.deepEqual([p.price.normal, p.price.partner], EXPECTED[p.name], p.name);
});
test('exemplo oficial: 2 Coletes + 1 Capuz sem parceria = R$ 43.000', () => {
  const cart: CartItem[] = [{ productId: 'colete', quantity: 2 }, { productId: 'capuz', quantity: 1 }];
  const items = calculateItems(cart, 'sem_parceria');
  assert.equal(items[0].subtotal, 34000);
  assert.equal(items[1].subtotal, 9000);
  assert.equal(calculateTotal(items), 43000);
  assert.equal(formatBRL(43000), 'R$ 43.000');
});
test('modalidade parceria recalcula tudo', () => {
  const cart: CartItem[] = [{ productId: 'colete', quantity: 2 }, { productId: 'capuz', quantity: 1 }];
  assert.equal(calculateTotal(calculateItems(cart, 'com_parceria')), 37500);
  assert.equal(calculatePartnerSavings(cart), 5500);
});
test('quantidades: inteiras, positivas, sem decimais', () => {
  assert.equal(sanitizeQuantity(-3), 1);
  assert.equal(sanitizeQuantity(0), 1);
  assert.equal(sanitizeQuantity(2.9), 2);
  assert.equal(sanitizeQuantity('4'), 4);
  assert.equal(sanitizeQuantity('abc'), null);
  assert.equal(sanitizeQuantity(500), 500);
  assert.equal(sanitizeQuantity(1000), 999);
  assert.equal(sanitizeQuantity(5000), 999);
});
test('formatação pt-BR', () => {
  assert.equal(formatBRL(9350), 'R$ 9.350');
  assert.equal(formatBRL(70000), 'R$ 70.000');
});
console.log(`\n${passed} testes passaram.`);
