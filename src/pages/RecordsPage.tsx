import { useState, useMemo } from 'react';
import type { Store } from '../types';

interface Props {
  store: Store;
}

export function RecordsPage({ store }: Props) {
  const [search, setSearch] = useState('');

  const records = useMemo(() => {
    // Join product
    const list = store.records.map((r) => {
      const p = store.products.find((p) => p.id === r.productId);
      return { ...r, product: p };
    });

    // Sort by date desc
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Filter
    const kw = search.trim().toLowerCase();
    return list.filter((r) => {
      if (!kw) return true;
      return (
        r.product?.name.toLowerCase().includes(kw) ||
        r.product?.spec.toLowerCase().includes(kw) ||
        r.product?.model.toLowerCase().includes(kw) ||
        r.remark.toLowerCase().includes(kw)
      );
    });
  }, [store.records, store.products, search]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white px-4 py-3 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">出入库记录</h1>
        <div className="mt-3 relative">
          <input
            type="text"
            className="input pl-9"
            placeholder="搜索记录..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <svg
            className="absolute left-3 top-3 h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </header>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {records.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">暂无记录</div>
        ) : (
          records.map((r) => (
            <div key={r.id} className="card p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-lg ${
                    r.type === 'in' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
                  }`}
                >
                  {r.type === 'in' ? '⬇️' : '⬆️'}
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {r.product?.name || '未知产品'}
                    <span className="text-xs text-gray-400 ml-2 font-normal">
                      {new Date(r.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {r.product?.spec} | {r.product?.model}
                  </div>
                </div>
              </div>
              <div
                className={`text-base font-bold tabular-nums ${
                  r.type === 'in' ? 'text-green-600' : 'text-red-500'
                }`}
              >
                {r.type === 'in' ? '+' : '-'}
                {r.quantity.toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
