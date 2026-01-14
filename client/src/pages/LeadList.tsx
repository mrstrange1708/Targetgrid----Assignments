import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { socket } from '../lib/socket';
import type { Lead } from '../types';
import {
    TrendingUp,
    Building2,
    ChevronRight,
    Search,
    Filter,
    SortAsc,
    SortDesc
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function LeadList() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('current_score');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');
    const [companyFilter, setCompanyFilter] = useState('');
    const [companies, setCompanies] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeads();
        fetchCompanies();

        socket.on('score-update', (_data: any) => {
            fetchLeads();
        });

        return () => {
            socket.off('score-update');
        };
    }, [searchTerm, sortBy, order, companyFilter]);

    const fetchLeads = async () => {
        try {
            const { data } = await api.get('/leads', {
                params: {
                    search: searchTerm,
                    sortBy,
                    order,
                    company: companyFilter
                }
            });
            setLeads(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanies = async () => {
        try {
            const { data } = await api.get('/analytics/companies');
            setCompanies(data.map((c: any) => c.company));
        } catch (err) {
            console.error(err);
        }
    };

    const toggleOrder = () => setOrder(prev => prev === 'asc' ? 'desc' : 'asc');

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Leaderboard</h1>
                    <p className="text-slate-500 mt-2 text-lg">Real-time perspective of your top performing leads.</p>
                </div>
                <div className="bg-indigo-600/10 px-4 py-2 rounded-xl border border-indigo-600/20 flex items-center gap-2 self-start">
                    <TrendingUp size={20} className="text-indigo-600" />
                    <span className="text-indigo-700 font-semibold">{leads.length} Matching Leads</span>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search leads by name, email or company..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600/20 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Company Filter */}
                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select
                            className="pl-10 pr-10 py-3 bg-slate-50 border-none rounded-2xl text-slate-900 font-medium appearance-none focus:ring-2 focus:ring-indigo-600/20 transition-all cursor-pointer"
                            value={companyFilter}
                            onChange={(e) => setCompanyFilter(e.target.value)}
                        >
                            <option value="">All Companies</option>
                            {companies.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    {/* Sort By */}
                    <div className="flex items-center gap-2 bg-slate-50 rounded-2xl p-1">
                        <select
                            className="pl-4 pr-10 py-2 bg-transparent border-none rounded-xl text-slate-900 font-bold text-sm appearance-none focus:ring-0 cursor-pointer"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="current_score">Sort by Score</option>
                            <option value="name">Sort by Name</option>
                            <option value="company">Sort by Company</option>
                        </select>
                        <button
                            onClick={toggleOrder}
                            className="p-2 hover:bg-white rounded-xl text-indigo-600 transition-colors shadow-sm"
                            title={order === 'asc' ? 'Sort Ascending' : 'Sort Descending'}
                        >
                            {order === 'asc' ? <SortAsc size={18} /> : <SortDesc size={18} />}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : leads.map((lead, index) => (
                    <Link
                        to={`/leads/${lead._id}`}
                        key={lead._id}
                        className="premium-card group relative p-5 flex items-center gap-6 overflow-hidden"
                    >
                        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                            #{index + 1}
                        </div>

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

                        <div className="flex items-center gap-8">
                            <div className="text-right">
                                <div className="text-4xl font-black text-indigo-600 tabular-nums leading-none">
                                    {lead.current_score}
                                </div>
                                <div className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] mt-1">Consistency Score</div>
                            </div>
                            <ChevronRight size={24} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                        </div>

                        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
                    </Link>
                ))}

                {!loading && leads.length === 0 && (
                    <div className="text-center py-20 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200">
                        <Search size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-xl font-semibold text-slate-900">No matching leads found</h3>
                        <p className="text-slate-500 mt-1">Try adjusting your filters or search terms.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
