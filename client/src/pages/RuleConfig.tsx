import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { ScoringRule } from '../types';
import { Plus, Trash2 } from 'lucide-react';

export default function RuleConfig() {
    const [rules, setRules] = useState<ScoringRule[]>([]);
    const [newRule, setNewRule] = useState({ eventType: '', points: 0 });
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        const { data } = await api.get('/rules');
        setRules(data);
    };

    const handleToggle = async (id: string, currentActive: boolean) => {
        await api.put(`/rules/${id}`, { active: !currentActive });
        fetchRules();
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure?')) {
            await api.delete(`/rules/${id}`);
            fetchRules();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await api.post('/rules', newRule);
        setNewRule({ eventType: '', points: 0 });
        setIsAdding(false);
        fetchRules();
    };

    return (
        <div className="bg-white rounded-lg shadow border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">Scoring Rules</h2>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                >
                    <Plus size={18} /> Add Rule
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="mb-6 bg-slate-50 p-4 rounded-md border border-slate-200 flex gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Event Type</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. email_open"
                            className="border border-slate-300 rounded px-3 py-2 w-64"
                            value={newRule.eventType}
                            onChange={e => setNewRule({ ...newRule, eventType: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Points</label>
                        <input
                            type="number"
                            required
                            className="border border-slate-300 rounded px-3 py-2 w-32"
                            value={newRule.points}
                            onChange={e => setNewRule({ ...newRule, points: parseInt(e.target.value) })}
                        />
                    </div>
                    <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Save</button>
                    <button type="button" onClick={() => setIsAdding(false)} className="text-slate-500 px-4 py-2">Cancel</button>
                </form>
            )}

            <table className="w-full text-left">
                <thead className="border-b border-slate-200 text-slate-500 uppercase text-xs">
                    <tr>
                        <th className="py-3">Event Type</th>
                        <th className="py-3">Points</th>
                        <th className="py-3">Active</th>
                        <th className="py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {rules.map(rule => (
                        <tr key={rule._id} className="group">
                            <td className="py-3 font-medium text-slate-700">{rule.eventType}</td>
                            <td className="py-3 font-bold text-blue-600">+{rule.points}</td>
                            <td className="py-3">
                                <button
                                    onClick={() => handleToggle(rule._id, rule.active)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition ${rule.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}
                                >
                                    {rule.active ? 'Active' : 'Inactive'}
                                </button>
                            </td>
                            <td className="py-3 text-right">
                                <button onClick={() => handleDelete(rule._id)} className="text-slate-400 hover:text-red-600">
                                    <Trash2 size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
