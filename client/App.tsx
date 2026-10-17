import { useEffect, useState } from 'react';
import products from '../data/products.json';
import type { PriceResult } from '../src/types';

export default function App() {
  const [results, setResults] = useState<PriceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function repriceProducts() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/reprice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(products),
      });

      if (!response.ok) {
        throw new Error('Не удалось пересчитать цены. Проверьте, что сервер запущен.');
      }

      const data: PriceResult[] = await response.json();
      setResults(data);
    } catch {
      setError('Не удалось пересчитать цены. Проверьте, что сервер запущен.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void repriceProducts();
  }, []);

  return (
    <main>
      <h1>SaleScout</h1>
      <p>Пересчёт цен с учётом конкурентов. Все цены в тенге.</p>
      <button onClick={repriceProducts} disabled={loading}>
        {loading ? 'Расчёт…' : 'Пересчитать цены'}
      </button>
      {error && <p role="alert">{error}</p>}

      <div className="table-wrapper">
        <table aria-label="Цены до и после пересчёта" aria-busy={loading}>
          <thead>
            <tr>
              <th scope="col">SKU</th>
              <th scope="col">Название</th>
              <th scope="col">Старая цена</th>
              <th scope="col">Новая цена</th>
              <th scope="col">Причина</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr key={product.sku}>
                <td>{product.sku}</td>
                <td>{product.name}</td>
                <td>{results[index]?.oldPrice ?? product.myPrice}</td>
                <td>{results[index]?.newPrice ?? '—'}</td>
                <td>{results[index]?.reason ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="hint">
        UNDERCUT — дешевле конкурента; AT_MIN — минимальная цена;
        AT_MAX — максимальная цена; NO_COMPETITORS — нет конкурентов в наличии.
      </p>
    </main>
  );
}
