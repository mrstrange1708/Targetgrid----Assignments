import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { Lead, ScoreHistory } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronLeft, Calendar, Activity, ArrowUpRight, ArrowDownRight, User } from 'lucide-react';
import { cn } from '../lib/utils';

export default function LeadDetail() {
    const { id } = useParams();
    const [lead, setLead] = useState<Lead | null>(null);
    const [history, setHistory] = useState<ScoreHistory[]>([]);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const { data: leadData } = await api.get(`/leads/${id}`);
            setLead(leadData);
            const { data: historyData } = await api.get(`/leads/${id}/history`);
            setHistory(historyData);
        } catch (error) {
            console.error(error);
        }
    };

    const chartData = [...history].reverse().map(h => ({
        time: new Date(h.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        fullTime: new Date(h.timestamp).toLocaleString(),
        score: h.score,
    }));

    if (!lead) return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
            <Link to="/leads" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium transition-colors">
                <ChevronLeft size={20} /> Back to Dashboard
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="lg:col-span-1 premium-card p-8 flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-3xl bg-indigo-600/10 flex items-center justify-center text-blue-600 mb-6 shadow-inner">
                        <User size={48} className="text-indigo-600" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">{lead.name}</h1>
                    <p className="text-slate-500 font-medium mt-1">{lead.company}</p>
                    <div className="mt-4 px-4 py-2 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-widest">
                        {lead.status}
                    </div>

                    <div className="w-full h-px bg-slate-100 my-8"></div>

                    <div className="w-full grid grid-cols-2 gap-4">
                        <div className="text-left">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Email</div>
                            <div className="text-sm font-semibold text-slate-700 truncate">{lead.email}</div>
                        </div>
                        <div className="text-left">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Member Since</div>
                            <div className="text-sm font-semibold text-slate-700">
                                {new Date(lead.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Score Chart Card */}
                <div className="lg:col-span-2 premium-card p-5 md:p-8 flex flex-col">
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 leading-tight">Score Progress</h3>
                            <p className="text-slate-400 text-xs md:text-sm mt-1">Growth trajectory over the last activity period.</p>
                        </div>
                        <div className="text-left sm:text-right">
                            <div className="text-4xl md:text-5xl font-black text-indigo-600 tabular-nums">
                                {lead.current_score}
                            </div>
                            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] mt-1">Current Score</div>
                        </div>
                    </div>

                    <div className="flex-grow min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="time"
                                    stroke="#94a3b8"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    dx={-10}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
                                        backdropFilter: 'blur(8px)'
                                    }}
                                    labelStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#6366f1"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#scoreGradient)"
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Timeline Section */}
            <div className="premium-card p-8">
                <div className="flex items-center gap-3 mb-10">
                    <Activity className="text-indigo-600" />
                    <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tighter">Activity Pulse</h3>
                </div>

                <div className="space-y-4">
                    {history.map((item) => (
                        <div
                            key={item._id}
                            className="bg-slate-50/50 hover:bg-white border border-transparent hover:border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between transition-all group gap-4 sm:gap-0"
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                                    item.scoreChange >= 0 ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                                )}>
                                    {item.scoreChange >= 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight text-sm md:text-base truncate">
                                        {item.reason.replace('Event: ', '')}
                                    </div>
                                    <div className="flex items-center gap-2 md:gap-3 text-slate-400 text-[10px] md:text-xs font-semibold uppercase tracking-widest mt-1">
                                        <div className="flex items-center gap-1"><Calendar size={10} /> {new Date(item.timestamp).toLocaleDateString()}</div>
                                        <div>&bull;</div>
                                        <div>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="text-right flex items-center self-end sm:self-center gap-6">
                                <div>
                                    <div className={cn(
                                        "text-lg md:text-xl font-black tabular-nums",
                                        item.scoreChange >= 0 ? "text-emerald-500" : "text-rose-500"
                                    )}>
                                        {item.scoreChange > 0 ? '+' : ''}{item.scoreChange}
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">Points</div>
                                </div>
                                <div className="hidden sm:block">
                                    <div className="text-xl font-black text-slate-700 tabular-nums">
                                        {item.score}
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">Result</div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {history.length === 0 && (
                        <div className="text-center py-12 text-slate-400 italic font-medium">
                            No patterns detected yet for this lead.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
