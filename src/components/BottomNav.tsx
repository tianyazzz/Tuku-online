import { type ReactNode } from 'react';
import { Package, FolderOpen, ClipboardList, Settings, Plus } from 'lucide-react';

type Tab = 'inventory' | 'products' | 'records' | 'settings';

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
  onPlus: () => void;
}

export function BottomNav({ active, onChange, onPlus }: Props) {
  const items: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: 'inventory', label: '库存', icon: <Package size={24} /> },
    { id: 'products', label: '产品档案', icon: <FolderOpen size={24} /> },
    { id: 'records', label: '记录', icon: <ClipboardList size={24} /> },
    { id: 'settings', label: '设置', icon: <Settings size={24} /> },
  ];

  return (
    <div className="flex w-full items-center justify-between px-2 pt-2 pb-1">
      {/* Inventory & Products */}
      {items.slice(0, 2).map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={`flex flex-1 flex-col items-center justify-center gap-1 p-2 transition-colors ${
            active === item.id ? 'text-primary' : 'text-gray-400'
          }`}
        >
          <span className="leading-none">{item.icon}</span>
          <span className="text-[10px] font-medium">{item.label}</span>
        </button>
      ))}

      {/* Plus Button - Center */}
      <div className="flex flex-1 flex-col items-center justify-center -mt-1">
        <button
          onClick={onPlus}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg active:scale-95 transition-transform"
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>
        <span className="text-[10px] font-medium text-gray-400 mt-1 opacity-0">Add</span>
      </div>

      {/* Records & Settings */}
      {items.slice(2).map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={`flex flex-1 flex-col items-center justify-center gap-1 p-2 transition-colors ${
            active === item.id ? 'text-primary' : 'text-gray-400'
          }`}
        >
          <span className="leading-none">{item.icon}</span>
          <span className="text-[10px] font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
