import React, { useState } from 'react';
import { MOCK_LEADS } from '../constants';
import { Phone, MoreHorizontal, Search, Play, BarChart2, Zap } from 'lucide-react';
import { CallMonitor } from './CallMonitor';

export const Leads: React.FC = () => {
  const [activeCallId, setActiveCallId] = useState<string | null>(null);

  const handleInitiateCall = (leadId: string) => {
    setActiveCallId(leadId);
  };

  if (activeCallId) {
    const lead = MOCK_LEADS.find(l => l.id === activeCallId);
    return <CallMonitor lead={lead!} onBack={() => setActiveCallId(null)} />;
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPhaseColor = (phase: string | undefined) => {
      if (!phase) return 'bg-gray-100 text-gray-500';
      if (phase === 'Transaction' || phase === 'Feedback') return 'bg-purple-100 text-purple-700';
      return 'bg-blue-50 text-blue-700';
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Management</h1>
          <p className="text-gray-500 text-sm mt-1">Track and qualify leads using Bolna.ai agents.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 text-sm font-medium shadow-lg shadow-primary-600/30 transition-all active:scale-95">
            <Play className="w-4 h-4" />
            Auto-Assign Leads
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
         <div className="p-5 border-b border-gray-100 flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search leads..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-100 focus:bg-white transition-all"/>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50/50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                        <th className="px-6 py-4">Lead Name</th>
                        <th className="px-6 py-4">Source</th>
                        <th className="px-6 py-4 text-center">Score</th>
                        <th className="px-6 py-4 text-center">AI Engagement</th>
                        <th className="px-6 py-4">Current Phase</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {MOCK_LEADS.map((lead) => (
                        <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <img src={`https://ui-avatars.com/api/?name=${lead.name}&background=random`} alt={lead.name} className="w-8 h-8 rounded-full" />
                                    <div>
                                        <div className="font-medium text-gray-900">{lead.name}</div>
                                        <div className="text-xs text-gray-400">{lead.phone}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-md">{lead.source}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-1">
                                    <BarChart2 className={`w-4 h-4 ${getScoreColor(lead.score)}`} />
                                    <span className={`font-bold ${getScoreColor(lead.score)}`}>{lead.score}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                                {lead.ai_engagement_score ? (
                                    <div className="flex items-center justify-center gap-1 text-xs">
                                        <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                        <span className="font-semibold text-gray-700">{lead.ai_engagement_score}%</span>
                                    </div>
                                ) : (
                                    <span className="text-xs text-gray-400">-</span>
                                )}
                            </td>
                            <td className="px-6 py-4">
                                <span className={`text-xs px-2 py-1 rounded-md font-medium ${getPhaseColor(lead.highest_phase_reached)}`}>
                                    {lead.highest_phase_reached || 'Not Started'}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium 
                                    ${lead.status === 'AI_In_Progress' ? 'bg-purple-100 text-purple-700 animate-pulse' : 
                                      lead.status === 'Qualified' ? 'bg-green-100 text-green-700' :
                                      lead.status === 'New' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                    {lead.status === 'AI_In_Progress' && <Phone className="w-3 h-3 mr-1" />}
                                    {lead.status.replace(/_/g, ' ')}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    {lead.status !== 'AI_In_Progress' && (
                                        <button 
                                            onClick={() => handleInitiateCall(lead.id)}
                                            className="px-3 py-1.5 bg-primary-50 text-primary-700 text-xs font-semibold rounded-lg hover:bg-primary-100 transition-colors flex items-center gap-1"
                                        >
                                            <Phone className="w-3 h-3" /> Initiate Call
                                        </button>
                                    )}
                                    <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                </div>
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