import React from 'react';
import { LayoutDashboard, ShoppingCart, Users, FileText, Settings, LogOut, Phone, PieChart, Package, FileCheck } from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate }) => {
  const menuItems = [
    { section: 'OVERVIEW', items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
    { section: 'PROCUREMENT', items: [
      { id: 'provisions', label: 'Provisions', icon: ShoppingCart },
      { id: 'orders', label: 'Orders', icon: Package },
      { id: 'invoices', label: 'Invoices', icon: FileText },
    ]},
    { section: 'DEALER', items: [
      { id: 'leads', label: 'Leads', icon: Users },
      { id: 'calls', label: 'Calls (AI)', icon: Phone },
      { id: 'conversions', label: 'Conversions', icon: FileCheck },
    ]},
    { section: 'ANALYTICS', items: [
      { id: 'reports', label: 'Reports', icon: PieChart },
    ]}
  ];

  return (
    <div className="w-64 bg-white h-full border-r border-gray-100 flex flex-col fixed left-0 top-0 z-10 hidden md:flex">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 bg-white rounded-sm opacity-50 rotate-45"></div>
        </div>
        <span className="text-xl font-bold text-gray-800 tracking-tight">iTarang</span>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-4 space-y-8">
        {menuItems.map((group) => (
          <div key={group.section}>
            <h3 className="text-xs font-semibold text-gray-400 mb-3 px-2 tracking-wider">{group.section}</h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                      ${isActive 
                        ? 'bg-primary-50 text-primary-700' 
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                    {item.label}
                    {item.id === 'calls' && (
                      <span className="ml-auto w-5 h-5 bg-orange-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">2</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-50">
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer">
           <img src="https://picsum.photos/100/100" alt="User" className="w-9 h-9 rounded-full object-cover" />
           <div className="flex-1 min-w-0">
             <p className="text-sm font-semibold text-gray-900 truncate">Orely Studio</p>
             <p className="text-xs text-gray-500 truncate">Admin</p>
           </div>
           <Settings className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </div>
  );
};