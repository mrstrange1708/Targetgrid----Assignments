import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { ScoringRule } from '../types';
import { Settings, Plus, Trash2, ShieldCheck, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

export default function RuleConfig() {
    const [rules, setRules] = useState<ScoringRule[]>([]);
    const [newRule, setNewRule] = useState({ event_type: '', points: 0 });
    const [isSaving, setIsSaving] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            const { data } = await api.get('/rules');
            setRules(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.post('/rules', newRule);
            setNewRule({ event_type: '', points: 0 });
            setIsAdding(false);
            fetchRules();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to terminate this rule?')) return;
        try {
            await api.delete(`/rules/${id}`);
            fetchRules();
        } catch (error) {
            console.error(error);
        }
    };

    const handleToggle = async (id: string, currentActive: boolean) => {
        try {
            await api.put(`/rules/${id}`, { active: !currentActive });
            fetchRules();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Scoring Engine</h1>
                    <p className="text-slate-500 mt-2 text-lg">Define the behavior that drives your lead qualification.</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-3 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center gap-2"
                >
                    <Plus size={20} /> forge rule
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Rule Creation Form Component (Overlay style or Sidebar style) */}
                {isAdding && (
                    <div className="col-span-1 lg:col-span-full animate-in slide-in-from-top-4 duration-300">
                        <form onSubmit={handleCreate} className="premium-card p-8 flex flex-wrap items-end gap-6 bg-indigo-600/5 border-indigo-600/20">
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Event Signal</label>
                                <input
                                    type="text" required placeholder="EMAIL_OPEN"
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                    value={newRule.event_type} onChange={e => setNewRule({ ...newRule, event_type: e.target.value })}
                                />
                            </div>
                            <div className="w-40">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Point Weight</label>
                                <input
                                    type="number" required
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                                    value={newRule.points} onChange={e => setNewRule({ ...newRule, points: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="submit" disabled={isSaving}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest px-8 py-3 rounded-xl shadow-lg transition-all active:scale-[0.95]"
                                >
                                    {isSaving ? "Forging..." : "Save Rule"}
                                </button>
                                <button
                                    type="button" onClick={() => setIsAdding(false)}
                                    className="px-6 py-3 text-slate-500 font-bold uppercase tracking-widest hover:text-slate-700"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Rules Inventory */}
                <div className="col-span-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {rules.map((rule) => (
                        <div key={rule._id} className="premium-card p-6 flex flex-col group relative overflow-hidden">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                    <Zap size={24} />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleToggle(rule._id, rule.active)}
                                        className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                                            rule.active ? "bg-emerald-100 text-emerald-700 shadow-sm shadow-emerald-200/50" : "bg-slate-100 text-slate-400"
                                        )}
                                    >
                                        {rule.active ? 'Active' : 'Inactive'}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(rule._id)}
                                        className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight truncate">
                                {rule.event_type}
                            </h3>

                            <div className="mt-4 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Weight Distribution</span>
                                    <span className={cn(
                                        "text-3xl font-black tabular-nums mt-1",
                                        rule.points >= 0 ? "text-emerald-500" : "text-rose-500"
                                    )}>
                                        {rule.points > 0 ? '+' : ''}{rule.points}
                                    </span>
                                </div>

                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300">
                                    <ShieldCheck size={20} className="text-slate-300" />
                                </div>
                            </div>

                            {/* Decorative line */}
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
                        </div>
                    ))}

                    {rules.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-white/50 rounded-3xl border-2 border-dashed border-slate-200">
                            <Settings size={48} className="mx-auto text-slate-200 mb-4" />
                            <h3 className="text-xl font-bold text-slate-900">Engine Cold</h3>
                            <p className="text-slate-500 mt-1">No scoring rules detected in the inventory.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
