import express from 'express';
import { calculatePrice } from './pricing';
import type { Product } from './types';

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isProduct(value: unknown): value is Product {
  if (typeof value !== 'object' || value === null) return false;

  const product = value as Partial<Product>;

  return (
    typeof product.sku === 'string' &&
    typeof product.name === 'string' &&
    isNonNegativeNumber(product.myPrice) &&
    isNonNegativeNumber(product.minPrice) &&
    Number.isInteger(product.minPrice) &&
    isNonNegativeNumber(product.maxPrice) &&
    Number.isInteger(product.maxPrice) &&
    product.minPrice <= product.maxPrice &&
    isNonNegativeNumber(product.step) &&
    Array.isArray(product.competitors) &&
    product.competitors.every((competitor: unknown) => {
      if (typeof competitor !== 'object' || competitor === null) return false;

      const item = competitor as Record<string, unknown>;
      return (
        typeof item.seller === 'string' &&
        isNonNegativeNumber(item.price) &&
        typeof item.inStock === 'boolean'
      );
    })
  );
}

export const app = express();

app.use(express.json());

app.post('/reprice', (req, res) => {
  const products: unknown = req.body;

  if (!Array.isArray(products) || !products.every(isProduct)) {
    res.status(400).json({ error: 'Ожидается массив корректных товаров.' });
    return;
  }

  res.json(products.map(calculatePrice));
});
