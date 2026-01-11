import React, { useState } from 'react';
import { MOCK_PROVISIONS } from '../constants';
import { Plus, Filter, Download, MoreHorizontal, Search, Calendar } from 'lucide-react';

export const Provisions: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = MOCK_PROVISIONS.filter(p => 
    p.product_model.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.oem_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusStyle = (status: string) => {
      switch(status) {
          case 'Completed': return 'bg-green-100 text-green-700';
          case 'Ordered': return 'bg-blue-100 text-blue-700';
          case 'Pending': return 'bg-yellow-100 text-yellow-700';
          case 'Cancelled': return 'bg-red-100 text-red-700';
          default: return 'bg-gray-100 text-gray-700';
      }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Provisions</h1>
          <p className="text-gray-500 text-sm mt-1">Manage procurement requests and delivery tracking.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-medium transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 text-sm font-medium shadow-lg shadow-primary-600/30 transition-all active:scale-95">
            <Plus className="w-4 h-4" />
            Create Provision
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
         <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search provisions..." 
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-100 focus:bg-white transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button className="p-2 hover:bg-gray-50 rounded-lg text-gray-500">
                <Filter className="w-4 h-4" />
            </button>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50/50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                        <th className="px-6 py-4">ID / Date</th>
                        <th className="px-6 py-4">OEM</th>
                        <th className="px-6 py-4">Product</th>
                        <th className="px-6 py-4 text-center">Qty</th>
                        <th className="px-6 py-4 text-right">Value</th>
                        <th className="px-6 py-4">Expected Delivery</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {filtered.map((provision) => (
                        <tr key={provision.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                                <span className="font-medium text-gray-900 block">{provision.id}</span>
                                <span className="text-xs text-gray-400">{provision.created_at}</span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                        {provision.oem_name.substring(0,2).toUpperCase()}
                                    </div>
                                    <span className="text-sm text-gray-700 font-medium">{provision.oem_name}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{provision.product_model}</td>
                            <td className="px-6 py-4 text-center">
                                <span className="px-2 py-1 bg-gray-100 rounded-lg text-xs font-semibold text-gray-700">{provision.quantity}</span>
                            </td>
                            <td className="px-6 py-4 text-right font-medium text-gray-900">₹{provision.total_value.toLocaleString()}</td>
                            <td className="px-6 py-4">
                                {provision.expected_delivery_date ? (
                                    <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-md w-fit">
                                        <Calendar className="w-3 h-3 text-gray-400" />
                                        {provision.expected_delivery_date}
                                    </div>
                                ) : (
                                    <span className="text-xs text-gray-400">-</span>
                                )}
                            </td>
                            <td className="px-6 py-4 text-center">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyle(provision.status)}`}>
                                    {provision.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};