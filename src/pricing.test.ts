import { describe, expect, it } from "vitest";
import products from "../data/products.json";
import expected from "../data/expected.json";
import { calculatePrice } from "./pricing";
import type { Product } from "./types";

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    sku: "TEST-001",
    name: "Тестовый товар",
    myPrice: 150,
    minPrice: 100,
    maxPrice: 200,
    step: 10,
    competitors: [{ seller: "Магазин А", price: 160, inStock: true }],
    ...overrides,
  };
}

describe("calculatePrice", () => {
  it("возвращает ожидаемые результаты для исходного набора товаров", () => {
    expect(products.map(calculatePrice)).toEqual(expected);
  });

  it("при пустом списке конкурентов возвращает максимальную цену", () => {
    expect(calculatePrice(makeProduct({ competitors: [] }))).toEqual({
      sku: "TEST-001",
      oldPrice: 150,
      newPrice: 200,
      reason: "NO_COMPETITORS",
    });
  });

  it("игнорирует более дешёвого конкурента без товара в наличии", () => {
    const product = makeProduct({
      competitors: [
        { seller: "Нет в наличии", price: 1, inStock: false },
        { seller: "Есть в наличии", price: 160, inStock: true },
      ],
    });

    expect(calculatePrice(product)).toMatchObject({ newPrice: 150, reason: "UNDERCUT" });
  });

  it.each([100, 200])("считает точную границу %i причиной UNDERCUT", (boundary) => {
    const product = makeProduct({
      competitors: [{ seller: "Магазин А", price: boundary + 10, inStock: true }],
    });

    expect(calculatePrice(product)).toMatchObject({ newPrice: boundary, reason: "UNDERCUT" });
  });

  it("округляет дробную разницу вниз", () => {
    const product = makeProduct({
      step: 0.5,
      competitors: [{ seller: "Магазин А", price: 160.9, inStock: true }],
    });

    expect(calculatePrice(product)).toMatchObject({ newPrice: 160, reason: "UNDERCUT" });
  });

  it("допускает нулевой шаг", () => {
    expect(calculatePrice(makeProduct({ step: 0 }))).toMatchObject({
      newPrice: 160,
      reason: "UNDERCUT",
    });
  });

  it.each([
    { price: 100, reason: "AT_MIN" },
    { price: 160, reason: "UNDERCUT" },
    { price: 200, reason: "AT_MAX" },
  ])("при min = max сохраняет причину $reason", ({ price, reason }) => {
    const product = makeProduct({
      minPrice: 150,
      maxPrice: 150,
      competitors: [{ seller: "Магазин А", price, inStock: true }],
    });

    expect(calculatePrice(product)).toMatchObject({ newPrice: 150, reason });
  });

  it.each([0, 150.75, 1000])("сохраняет oldPrice %s без влияния на расчёт", (myPrice) => {
    expect(calculatePrice(makeProduct({ myPrice }))).toEqual({
      sku: "TEST-001",
      oldPrice: myPrice,
      newPrice: 150,
      reason: "UNDERCUT",
    });
  });

  it.each([
    [190, 140, 170],
    [170, 190, 140],
    [140, 140, 190],
  ])("использует минимум независимо от порядка и повторов: %j", (...prices) => {
    const product = makeProduct({
      competitors: prices.map((price, index) => ({ seller: `Магазин ${index}`, price, inStock: true })),
    });

    expect(calculatePrice(product)).toMatchObject({ newPrice: 130, reason: "UNDERCUT" });
  });

  it("не изменяет исходный товар и список конкурентов", () => {
    const product = makeProduct({
      competitors: [
        { seller: "Магазин А", price: 190, inStock: true },
        { seller: "Магазин Б", price: 140, inStock: true },
      ],
    });
    const original = structuredClone(product);
    product.competitors.forEach(Object.freeze);
    Object.freeze(product.competitors);
    Object.freeze(product);

    expect(calculatePrice(product)).toMatchObject({ newPrice: 130, reason: "UNDERCUT" });
    expect(product).toEqual(original);
  });
});
