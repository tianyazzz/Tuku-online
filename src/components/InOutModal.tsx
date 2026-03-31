import { useState, useMemo } from 'react';
import type { Store, RecordType } from '../types';

interface Props {
  store: Store;
  onConfirm: (data: {
    productId: string;
    type: RecordType;
    quantity: number;
    remark: string;
  }) => void;
  onClose: () => void;
}

export function InOutModal({ store, onConfirm, onClose }: Props) {
  const [tab, setTab] = useState<RecordType>('in');
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState('');
  const [remark, setRemark] = useState('');

  const selectedProduct = useMemo(
    () => store.products.find((p) => p.id === productId),
    [store.products, productId]
  );

  const handleSubmit = () => {
    if (!productId || !qty) return;
    const quantity = parseInt(qty, 10);
    if (isNaN(quantity) || quantity <= 0) return;

    onConfirm({
      productId,
      type: tab,
      quantity,
      remark,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="w-full bg-white rounded-t-2xl sm:rounded-2xl sm:max-w-md p-5 animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">快速出入库</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex rounded-lg bg-gray-100 p-1 mb-5">
          <button
            onClick={() => setTab('in')}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
              tab === 'in' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            入库
          </button>
          <button
            onClick={() => setTab('out')}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
              tab === 'out' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            出库
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">选择产品</label>
            <select
              className="input w-full appearance-none bg-white border border-gray-200"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">请选择产品</option>
              {store.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.spec} {p.model})
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              当前库存：
              <span className="font-bold text-gray-900 mx-1">
                {/* Simple calculation for display */}
                {store.records
                  .filter((r) => r.productId === productId)
                  .reduce(
                    (acc, r) => (r.type === 'in' ? acc + r.quantity : acc - r.quantity),
                    0
                  )}
              </span>
              {selectedProduct.unit}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">数量</label>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                className="input border-gray-200 text-lg font-bold text-gray-900"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="0"
              />
              <span className="absolute right-3 top-2.5 text-gray-400 text-sm">
                {selectedProduct?.unit || '单位'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">备注</label>
            <input
              type="text"
              className="input border-gray-200"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="选填"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!productId || !qty}
            className={`w-full h-12 rounded-xl font-bold text-white transition-colors mt-2 ${
              !productId || !qty
                ? 'bg-gray-300 cursor-not-allowed'
                : tab === 'in'
                ? 'bg-green-600 hover:bg-green-700 active:bg-green-800'
                : 'bg-red-600 hover:bg-red-700 active:bg-red-800'
            }`}
          >
            确认{tab === 'in' ? '入库' : '出库'}
          </button>
        </div>
      </div>
    </div>
  );
}
