import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { socket } from '../lib/socket';
import type { Lead } from '../types';

export default function LeadList() {
    const [leads, setLeads] = useState<Lead[]>([]);

    useEffect(() => {
        fetchLeads();

        socket.on('score-update', (data: any) => {
            setLeads(prev => {
                // Update the specific lead
                let updated = prev.map(lead => {
                    if (lead._id === data.leadId) {
                        return { ...lead, score: data.score };
                    }
                    return lead;
                });

                // If lead not found, maybe fetch all again or add it?
                // For now, simpler to just re-sort
                return updated.sort((a, b) => b.score - a.score);
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
        <div className="bg-white rounded-lg shadow border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-800">Leads Leaderboard</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
                        <tr>
                            <th className="px-6 py-3 tracking-wider">Rank</th>
                            <th className="px-6 py-3 tracking-wider">Name</th>
                            <th className="px-6 py-3 tracking-wider">Score</th>
                            <th className="px-6 py-3 tracking-wider">Company</th>
                            <th className="px-6 py-3 tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {leads.map((lead, index) => (
                            <tr key={lead._id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-500">#{index + 1}</td>
                                <td className="px-6 py-4 font-semibold text-slate-900">{lead.name}</td>
                                <td className="px-6 py-4 text-blue-600 font-bold">{lead.score}</td>
                                <td className="px-6 py-4 text-slate-600">{lead.company}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 uppercase font-bold tracking-wide">{lead.status}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {leads.length === 0 && (
                    <div className="p-8 text-center text-slate-500">No leads found. Waiting for events...</div>
                )}
            </div>
        </div>
    );
}
