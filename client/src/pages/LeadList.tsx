import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { socket } from '../lib/socket';
import type { Lead } from '../types';
import { TrendingUp, User, Building2, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

export default function LeadList() {
    const [leads, setLeads] = useState<Lead[]>([]);

    useEffect(() => {
        fetchLeads();

        socket.on('score-update', (data: any) => {
            setLeads(prev => {
                let updated = prev.map(lead => {
                    if (lead._id === data.leadId) {
                        return { ...lead, current_score: data.score };
                    }
                    return lead;
                });
                return updated.sort((a, b) => b.current_score - a.current_score);
            });
        });

        return () => {
            socket.off('score-update');
        };
    }, []);

    const fetchLeads = async () => {
        try {
            const { data } = await api.get('/leads');
            setLeads(data);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Leaderboard</h1>
                    <p className="text-slate-500 mt-2 text-lg">Real-time perspective of your top performing leads.</p>
                </div>
                <div className="bg-indigo-600/10 px-4 py-2 rounded-xl border border-indigo-600/20 flex items-center gap-2">
                    <TrendingUp size={20} className="text-indigo-600" />
                    <span className="text-indigo-700 font-semibold">{leads.length} Active Leads</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {leads.map((lead, index) => (
                    <Link
                        to={`/leads/${lead._id}`}
                        key={lead._id}
                        className="premium-card group relative p-5 flex items-center gap-6 overflow-hidden"
                    >
                        {/* Rank Badge */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                            #{index + 1}
                        </div>

                        {/* Name & Info */}
                        <div className="flex-grow flex items-center gap-10">
                            <div className="min-w-[200px]">
                                <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{lead.name}</h3>
                                <div className="flex items-center gap-2 text-slate-400 mt-1">
                                    <Building2 size={14} />
                                    <span className="text-sm font-medium">{lead.company}</span>
                                </div>
                            </div>

                            <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-200">
                                <span className={cn(
                                    "w-2 h-2 rounded-full",
                                    lead.status === 'qualified' ? "bg-emerald-500" : "bg-blue-500"
                                )}></span>
                                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{lead.status}</span>
                            </div>
                        </div>

                        {/* Score Section */}
                        <div className="flex items-center gap-8">
                            <div className="text-right">
                                <div className="text-4xl font-black text-indigo-600 tabular-nums leading-none">
                                    {lead.current_score}
                                </div>
                                <div className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] mt-1">Consistency Score</div>
                            </div>
                            <ChevronRight size={24} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                        </div>

                        {/* Hover Gradient Overlay */}
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
                    </Link>
                ))}

                {leads.length === 0 && (
                    <div className="text-center py-20 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200">
                        <User size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-xl font-semibold text-slate-900">No leads found</h3>
                        <p className="text-slate-500 mt-1">Upload a CSV or wait for real-time events to begin.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
