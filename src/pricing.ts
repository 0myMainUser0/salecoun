import type { PriceResult, Product, Reason } from "./types";

export function calculatePrice(product: Product): PriceResult {
  let bestPrice = Infinity;

  for (const competitor of product.competitors) {
    if (competitor.inStock) {
      bestPrice = Math.min(bestPrice, competitor.price);
    }
  }

  let newPrice = product.maxPrice;
  let reason: Reason = "NO_COMPETITORS";

  if (bestPrice !== Infinity) {
    const candidate = Math.floor(bestPrice - product.step);

    if (candidate < product.minPrice) {
      newPrice = product.minPrice;
      reason = "AT_MIN";
    } else if (candidate > product.maxPrice) {
      newPrice = product.maxPrice;
      reason = "AT_MAX";
    } else {
      newPrice = candidate;
      reason = "UNDERCUT";
    }
  }

  return {
    sku: product.sku,
    oldPrice: product.myPrice,
    newPrice,
    reason,
  };
}
