'use client';

import { useState } from 'react';
import { Phone, ChevronDown, ChevronUp, FileText, Clock } from 'lucide-react';

interface CallLog {
    id: string;
    bolna_call_id: string;
    status: string;
    current_phase: string | null;
    started_at: Date | null;
    ended_at: Date | null;
    full_transcript: string | null;
    transcript_chunk: string | null;
    created_at: Date;
}

export default function CallLogs({ logs }: { logs: CallLog[] }) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const formatDateTime = (date: Date) => {
        return new Intl.DateTimeFormat('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).format(date);
    };

    if (logs.length === 0) {
        return (
            <div className="mt-8 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="bg-blue-100 text-blue-600 p-1 rounded mr-2">
                        <Phone size={18} />
                    </span>
                    AI Call Logs
                </h3>
                <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
                    <p className="text-sm italic">No Bolna AI calls recorded for this lead yet.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-blue-100 text-blue-600 p-1 rounded mr-2">
                    <Phone size={18} />
                </span>
                AI Call Logs
            </h3>

            <div className="space-y-3">
                {logs.map((log) => (
                    <div key={log.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                        <div
                            className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-3 h-3 rounded-full ${log.status === 'completed' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' :
                                        log.status === 'failed' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' :
                                            'bg-blue-500 animate-pulse'
                                    }`} />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-sm text-gray-900 capitalize">
                                            {log.status}
                                        </p>
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200 uppercase tracking-tighter">
                                            {log.current_phase || 'In Progress'}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5 font-medium">
                                        <Clock size={10} />
                                        {log.started_at ? formatDateTime(new Date(log.started_at)) : 'Waiting...'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="hidden md:block text-right">
                                    <p className="text-[10px] text-gray-400 font-mono">ID: {log.bolna_call_id.slice(-8)}</p>
                                </div>
                                {expandedId === log.id ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                            </div>
                        </div>

                        {expandedId === log.id && (
                            <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                                <div className="py-3 flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    <FileText size={14} className="text-blue-500" />
                                    Conversation Transcript
                                </div>
                                <div className="text-xs text-gray-700 bg-white border border-gray-200 p-4 rounded-lg whitespace-pre-wrap max-h-[300px] overflow-y-auto font-sans leading-relaxed shadow-inner">
                                    {log.full_transcript || log.transcript_chunk ? (
                                        <div className="space-y-4">
                                            {(log.full_transcript || log.transcript_chunk || '').split('\n').map((line, i) => (
                                                <div key={i} className={`p-2 rounded-md ${line.toLowerCase().startsWith('ai:') ? 'bg-blue-50/50 border-l-2 border-blue-400' : 'bg-gray-50/50 border-l-2 border-gray-300'}`}>
                                                    {line}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-6 text-gray-400 italic">
                                            <p>Transcript is being generated...</p>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-3 flex justify-between items-center text-[10px] text-gray-400 font-medium px-1">
                                    <span>Full Bolna ID: {log.bolna_call_id}</span>
                                    {log.ended_at && log.started_at && (
                                        <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                                            Duration: {Math.round((new Date(log.ended_at).getTime() - new Date(log.started_at).getTime()) / 1000)}s
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
