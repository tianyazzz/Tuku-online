import { useState, useMemo } from 'react';
import type { Store, Product } from '../types';

interface Props {
  store: Store;
  onUpdate: (products: Product[]) => void;
}

export function ProductsPage({ store, onUpdate }: Props) {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [adding, setAdding] = useState(false);

  // Filter
  const items = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return store.products.filter((p) => {
      if (!kw) return true;
      return (
        p.name.toLowerCase().includes(kw) ||
        p.spec.toLowerCase().includes(kw) ||
        p.model.toLowerCase().includes(kw)
      );
    });
  }, [store.products, search]);

  const handleDelete = (id: string) => {
    if (confirm('确定删除该产品吗？')) {
      onUpdate(store.products.filter((p) => p.id !== id));
    }
  };

  const handleSave = (product: Product) => {
    if (editing) {
      onUpdate(store.products.map((p) => (p.id === product.id ? product : p)));
    } else {
      onUpdate([...store.products, product]);
    }
    setEditing(null);
    setAdding(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">产品档案</h1>
          <button
            onClick={() => setAdding(true)}
            className="btn btn-primary h-8 px-3 text-xs"
          >
            + 新增产品
          </button>
        </div>
        <div className="mt-3 relative">
          <input
            type="text"
            className="input pl-9"
            placeholder="搜索产品..."
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
        {items.map((item) => (
          <div key={item.id} className="card p-4 flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">{item.name}</div>
              <div className="text-xs text-gray-500 mt-1">
                {item.spec} | {item.model} | {item.unit}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(item)}
                className="text-xs text-primary px-2 py-1 bg-primary/10 rounded"
              >
                编辑
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="text-xs text-danger px-2 py-1 bg-danger/10 rounded"
              >
                删除
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm">暂无产品数据</div>
        )}
      </div>

      {/* Modal */}
      {(adding || editing) && (
        <ProductModal
          initial={editing || undefined}
          onSave={handleSave}
          onClose={() => {
            setEditing(null);
            setAdding(false);
          }}
        />
      )}
    </div>
  );
}

function ProductModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Product;
  onSave: (p: Product) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Product>(
    initial || {
      id: crypto.randomUUID(),
      name: '',
      spec: '',
      model: '',
      unit: '米',
    }
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-200">
        <h2 className="text-lg font-bold mb-4">{initial ? '编辑产品' : '新增产品'}</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">名称</label>
            <input
              className="input border-gray-200"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="如：棉带"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">规格</label>
              <input
                className="input border-gray-200"
                value={form.spec}
                onChange={(e) => setForm({ ...form, spec: e.target.value })}
                placeholder="0.2x20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">型号</label>
              <input
                className="input border-gray-200"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="白色"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">单位</label>
            <select
              className="input border-gray-200"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            >
              <option value="米">米</option>
              <option value="个">个</option>
              <option value="件">件</option>
              <option value="卷">卷</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="btn flex-1 bg-gray-100 text-gray-600">
            取消
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!form.name}
            className="btn btn-primary flex-1 disabled:opacity-50"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
