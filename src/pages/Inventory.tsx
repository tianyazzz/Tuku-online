import { useState, useMemo } from 'react';
import type { Store } from '../types';

interface Props {
  store: Store;
}

export function InventoryPage({ store }: Props) {
  const [search, setSearch] = useState('');

  const items = useMemo(() => {
    // Calculate stock
    const stockMap = new Map<string, number>();
    store.products.forEach((p) => stockMap.set(p.id, 0));
    store.records.forEach((r) => {
      const current = stockMap.get(r.productId) || 0;
      if (r.type === 'in') {
        stockMap.set(r.productId, current + r.quantity);
      } else {
        stockMap.set(r.productId, Math.max(0, current - r.quantity));
      }
    });

    // Filter
    const kw = search.trim().toLowerCase();
    return store.products
      .filter((p) => {
        if (!kw) return true;
        return (
          p.name.toLowerCase().includes(kw) ||
          p.spec.toLowerCase().includes(kw) ||
          p.model.toLowerCase().includes(kw)
        );
      })
      .map((p) => ({
        ...p,
        qty: stockMap.get(p.id) || 0,
      }));
  }, [store, search]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white px-4 py-3 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">库存通</h1>
        <div className="mt-3 relative">
          <input
            type="text"
            className="input pl-9"
            placeholder="请输入名称、规格、型号搜索"
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

      {/* Stats */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-medium text-gray-500">库存列表</span>
        <span className="badge bg-gray-200 text-gray-600">{items.length}项</span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {items.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-gray-400">
            <span className="text-4xl mb-2">📦</span>
            <span className="text-sm">暂无库存数据</span>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="card flex items-center justify-between p-4 transition-colors active:bg-gray-50">
              <div className="flex flex-col gap-1">
                <span className="text-base font-medium text-gray-900">{item.name}</span>
                <span className="text-xs text-gray-500">
                  规格：{item.spec} <span className="mx-1 text-gray-300">|</span> 型号：{item.model}
                </span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-primary tabular-nums">
                  {item.qty.toLocaleString()}
                </div>
                <div className="text-xs text-gray-400">{item.unit}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
