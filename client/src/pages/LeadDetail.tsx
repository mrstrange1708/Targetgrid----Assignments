import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import type { Lead, ScoreHistory } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
        time: new Date(h.timestamp).toLocaleDateString(),
        fullTime: new Date(h.timestamp).toLocaleString(),
        score: h.newScore,
    }));

    if (!lead) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{lead.name}</h1>
                        <div className="text-slate-500 mt-1">{lead.email} &bull; {lead.company}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-bold text-blue-600">{lead.score}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{lead.status}</div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border border-slate-200 h-96">
                <h3 className="text-lg font-semibold mb-4 text-slate-800">Score Trend</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            labelFormatter={(label, payload) => payload[0]?.payload.fullTime}
                        />
                        <Line
                            type="monotone"
                            dataKey="score"
                            stroke="#2563eb"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
                <h3 className="text-lg font-semibold mb-6 text-slate-800">Activity Timeline</h3>
                <div className="space-y-0">
                    {history.map((item, idx) => (
                        <div key={item._id} className="flex gap-4 relative">
                            {/* Line connector */}
                            {idx !== history.length - 1 && (
                                <div className="absolute left-[7.5rem] top-8 bottom-0 w-0.5 bg-slate-200 -ml-px"></div>
                            )}

                            <div className="w-28 text-sm text-slate-500 text-right pt-1 shrink-0">
                                <div className="font-medium text-slate-700">{new Date(item.timestamp).toLocaleDateString()}</div>
                                <div className="text-xs text-slate-400">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>

                            <div className="relative pt-1 pl-6 pb-8">
                                <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm ring-1 ring-slate-100"></div>
                                <div className="font-medium text-slate-900">{item.reason.replace('Event: ', '')}</div>
                                <div className="text-sm mt-1">
                                    <span className={item.scoreChange >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                        {item.scoreChange > 0 ? '+' : ''}{item.scoreChange}
                                    </span>
                                    <span className="text-slate-400 mx-1">&rarr;</span>
                                    <span className="text-slate-600">New Score: {item.newScore}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {history.length === 0 && <div className="text-slate-500 italic">No history yet.</div>}
                </div>
            </div>
        </div>
    );
}
