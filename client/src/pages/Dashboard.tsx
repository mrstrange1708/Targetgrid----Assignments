import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import {
    Users,
    Calendar,
    Zap,
    Award,
    Building2,
    Activity
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    Cell
} from 'recharts';
import { socket } from '../lib/socket';

interface Stats {
    totalLeads: number;
    totalEvents: number;
    activeRules: number;
    totalPoints: number;
}

interface CompanyData {
    company: string;
    count: number;
    avgScore: number;
}

interface TrendData {
    date: string;
    label: string;
    count: number;
}

interface Lead {
    _id: string;
    name: string;
    email: string;
    company: string;
    current_score: number;
}


const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [companies, setCompanies] = useState<CompanyData[]>([]);
    const [trends, setTrends] = useState<TrendData[]>([]);
    const [topLeads, setTopLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState('7d');
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [socketConnected, setSocketConnected] = useState(false);
    const refreshTimeout = React.useRef<NodeJS.Timeout | null>(null);
    const lastFetchTime = React.useRef<number>(0);

    const fetchData = useCallback(async (showLoading = false) => {
        if (showLoading) setLoading(true);
        setIsSyncing(true);
        console.log('[Dashboard] Fetching data for range:', range);
        try {
            const [statsRes, companyRes, trendRes, leadsRes] = await Promise.all([
                api.get('/analytics/stats'),
                api.get('/analytics/companies'),
                api.get('/analytics/trends', { params: { range } }),
                api.get('/leads')
            ]);

            setStats(statsRes.data);
            setCompanies(companyRes.data);
            setTrends(trendRes.data);
            setTopLeads(leadsRes.data.slice(0, 5));
        } catch (error) {
            console.error('[Dashboard] Error fetching data:', error);
        } finally {
            if (showLoading) setLoading(false);
            setIsSyncing(false);
            setLastUpdated(new Date());
        }
    }, [range]);

    const debouncedFetch = useCallback(() => {
        const now = Date.now();
        const timeSinceLastFetch = now - lastFetchTime.current;

        // Sync Pulse: If it's been more than 1 second, fetch immediately during high-load
        if (timeSinceLastFetch > 1000) {
            console.log('[Dashboard] Pulse fetch...');
            fetchData();
            lastFetchTime.current = now;
            if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
            return;
        }

        // Otherwise debounce with 500ms for that "every second" feel
        if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
        refreshTimeout.current = setTimeout(() => {
            console.log('[Dashboard] Sync fetch (500ms)...');
            fetchData();
            lastFetchTime.current = Date.now();
        }, 500);
    }, [fetchData]);

    useEffect(() => {
        fetchData(true);

        const onConnect = () => {
            console.log('[Dashboard] Socket connected');
            setSocketConnected(true);
        };

        const onDisconnect = () => {
            console.log('[Dashboard] Socket disconnected');
            setSocketConnected(false);
        };

        const handleRefresh = (data: any) => {
            console.log('[Dashboard] Received analytics-refresh:', data);
            debouncedFetch();
        };

        const handleScoreUpdate = (data: any) => {
            console.log('[Dashboard] Received score-update:', data);

            // Immediate State Update: Update stats counters
            setStats(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    totalEvents: prev.totalEvents + 1,
                    // Note: totalPoints/avgScore is harder to calculate exactly without the change delta, 
                    // but we'll refresh it in the fetch.
                };
            });

            // Immediate State Update: Update Top Leads if lead is already in the list
            setTopLeads(prev => {
                const index = prev.findIndex(l => l._id === data.leadId);
                if (index !== -1) {
                    const newList = [...prev];
                    newList[index] = { ...newList[index], current_score: data.score };
                    // Re-sort the local list briefly (optional, fetch will fix it properly)
                    return newList.sort((a, b) => b.current_score - a.current_score);
                }
                return prev;
            });

            debouncedFetch();
        };

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('analytics-refresh', handleRefresh);
        socket.on('score-update', handleScoreUpdate);

        // Check initial state
        if (socket.connected) setSocketConnected(true);

        return () => {
            console.log('[Dashboard] Cleaning up socket listeners');
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('analytics-refresh', handleRefresh);
            socket.off('score-update', handleScoreUpdate);
            if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
        };
    }, [fetchData, debouncedFetch]);

    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316'];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 md:space-y-8 p-1 md:p-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        Dashboard
                        {isSyncing ? (
                            <span className="flex h-2 w-2 relative ml-1">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                            </span>
                        ) : (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 ml-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">Live</span>
                            </div>
                        )}
                    </h1>
                    <p className="text-gray-500 mt-1 flex items-center gap-2">
                        Real-time performance overview.
                        <span className="text-[10px] text-slate-400 font-medium">
                            Last update: {lastUpdated.toLocaleTimeString()}
                        </span>
                        {!socketConnected && (
                            <span className="text-[10px] text-rose-500 font-bold uppercase animate-pulse">
                                Disconnected
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Leads', value: stats?.totalLeads, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Total Events', value: stats?.totalEvents, icon: Zap, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: 'Active Rules', value: stats?.activeRules, icon: Activity, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Avg Lead Score', value: stats && stats.totalLeads > 0 ? Math.round(stats.totalPoints / stats.totalLeads) : 0, icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-1">
                        <div className={`${stat.bg} p-3 rounded-xl`}>
                            <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                            <p className="text-2xl font-bold text-gray-900">{stat.value?.toLocaleString()}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Event Trends Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Calendar className="text-indigo-600 w-5 h-5" />
                            Activity Trends
                        </h2>
                        <select
                            className="text-xs font-semibold px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl border-none focus:ring-2 focus:ring-indigo-600/20 cursor-pointer outline-none transition-all"
                            value={range}
                            onChange={(e) => setRange(e.target.value)}
                        >
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="6m">Last 6 Months</option>
                            <option value="1y">Last 1 Year</option>
                        </select>
                    </div>
                    <div className="h-64 sm:h-72 flex flex-col items-center justify-center">
                        {trends.length > 0 && trends.some(t => t.count > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trends}>
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="label"
                                        stroke="#94a3b8"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center">
                                <Activity className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                <p className="text-slate-400 font-medium">No activity data found for this range.</p>
                                <p className="text-slate-300 text-xs mt-1">Try uploading events or choosing a larger range.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Company Distribution */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Building2 className="text-purple-600 w-5 h-5" />
                            Leading Companies
                        </h2>
                    </div>
                    <div className="h-64 flex flex-col items-center justify-center">
                        {companies.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={companies} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="company"
                                        type="category"
                                        stroke="#475569"
                                        fontSize={12}
                                        width={100}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                        {companies.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center">
                                <Building2 className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                <p className="text-slate-400 font-medium">No company distribution data.</p>
                                <p className="text-slate-300 text-xs mt-1">Leads from different companies will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Top Leads Table */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Award className="text-amber-500 w-5 h-5" />
                            Top Performing Leads
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-3">Lead</th>
                                    <th className="px-6 py-3">Company</th>
                                    <th className="px-6 py-3 text-right">Score</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {topLeads.map((lead) => (
                                    <tr key={lead._id} className="hover:bg-indigo-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900">{lead.name}</div>
                                            <div className="text-xs text-gray-500">{lead.email}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{lead.company}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                                                {lead.current_score}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="w-full bg-gray-100 rounded-full h-1.5 max-w-[100px]">
                                                <div
                                                    className="bg-indigo-600 h-1.5 rounded-full"
                                                    style={{ width: `${Math.min((lead.current_score / 200) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {topLeads.length === 0 && (
                        <div className="p-8 text-center text-gray-500">No lead data available yet.</div>
                    )}
                </div>

                {/* Quick Actions / Tips */}
                <div className="bg-indigo-600 rounded-2xl p-6 text-white flex flex-col justify-between overflow-hidden relative">
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold mb-4">Pro Scorer Tip</h3>
                        <p className="text-indigo-100 text-sm leading-relaxed mb-6">
                            High lead scores indicate strong purchase intent.
                            Users with scores above 100 are prime candidates for direct demo requests.
                        </p>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                                <Activity className="w-5 h-5 text-indigo-300" />
                                <div>
                                    <p className="text-xs font-semibold text-indigo-200">Active Monitoring</p>
                                    <p className="text-sm">Real-time scoring enabled</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Decorative element */}
                    <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
