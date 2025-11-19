import React from 'react';
import { ShoppingBag, PackageX } from 'lucide-react';

interface InventoryListProps {
  items: string[];
}

const InventoryList: React.FC<InventoryListProps> = ({ items }) => {
  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
      <div className="flex items-center gap-2 mb-3 text-pink-400">
        <ShoppingBag size={20} />
        <h3 className="font-bold uppercase tracking-wider text-sm">Backpack</h3>
      </div>
      
      {items.length === 0 ? (
        <div className="text-slate-500 text-sm italic flex items-center gap-2">
            <PackageX size={16} />
            <span>Just lint in here...</span>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li key={idx} className="bg-slate-900/50 px-3 py-2 rounded border border-slate-800 text-sm text-slate-200 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-pink-500 rounded-full"></span>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default InventoryList;