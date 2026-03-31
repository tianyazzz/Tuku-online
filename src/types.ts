// Local Storage Keys
export const STORAGE_KEY = 'kucun-v2';

// Types
export interface Product {
  id: string;
  name: string;
  spec: string; // 规格 e.g. 0.2x20
  model: string; // 型号 e.g. 桔色
  unit: string; // 单位 e.g. 米
}

export type RecordType = 'in' | 'out';

export interface Record {
  id: string;
  productId: string;
  type: RecordType;
  quantity: number;
  remark: string;
  date: string; // YYYY-MM-DD HH:mm:ss
}

export interface Store {
  products: Product[];
  records: Record[];
}

// Initial State (Seed Data)
export const initialStore: Store = {
  products: [
    { id: 'p1', name: '棉带', spec: '0.2x20', model: '桔色', unit: '米' },
    { id: 'p2', name: '棉带', spec: '0.2x15', model: '白色', unit: '米' },
  ],
  records: [
    {
      id: 'r1',
      productId: 'p1',
      type: 'in',
      quantity: 50000,
      remark: '初始化库存',
      date: new Date().toISOString(),
    },
    {
      id: 'r2',
      productId: 'p2',
      type: 'in',
      quantity: 50000,
      remark: '初始化库存',
      date: new Date().toISOString(),
    },
  ],
};
