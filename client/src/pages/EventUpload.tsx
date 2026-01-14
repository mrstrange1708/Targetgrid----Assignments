import { useState } from 'react';
import { api } from '../lib/api';
import { Upload, Send, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export default function EventUpload() {
    const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
    const [formData, setFormData] = useState({ event_type: '', source: 'manual', metadata: '{}' });
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSingleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus({ type: '', message: '' });
        try {
            let meta = {};
            try { meta = JSON.parse(formData.metadata); } catch (e) { /* ignore */ }

            await api.post('/events', { ...formData, metadata: meta });
            setStatus({ type: 'success', message: 'Event ingested successfully.' });
            setFormData({ event_type: '', source: 'manual', metadata: '{}' });
        } catch (error) {
            setStatus({ type: 'error', message: 'Failed to ingest event.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBatchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setIsSubmitting(true);
        setStatus({ type: '', message: '' });
        const form = new FormData();
        form.append('file', file);

        try {
            const { data } = await api.post('/upload', form);
            setStatus({ type: 'success', message: `Batch of ${data.count} events uploaded and queued.` });
            setFile(null);
        } catch (error) {
            setStatus({ type: 'error', message: 'Batch upload failed.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="text-center">
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Ingest Events</h1>
                <p className="text-slate-500 mt-2">Feed your lead engine with direct or batch event data.</p>
            </div>

            <div className="flex p-1.5 bg-slate-200/50 rounded-2xl w-full max-w-sm mx-auto">
                <button
                    onClick={() => { setActiveTab('single'); setStatus({ type: '', message: '' }); }}
                    className={cn(
                        "flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all",
                        activeTab === 'single' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                >
                    Single Ingest
                </button>
                <button
                    onClick={() => { setActiveTab('batch'); setStatus({ type: '', message: '' }); }}
                    className={cn(
                        "flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all",
                        activeTab === 'batch' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                >
                    Batch CSV
                </button>
            </div>

            {status.message && (
                <div className={cn(
                    "p-4 rounded-2xl flex items-center gap-3 animate-in zoom-in-95 duration-300",
                    status.type === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"
                )}>
                    {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <span className="font-semibold text-sm">{status.message}</span>
                </div>
            )}

            {activeTab === 'single' ? (
                <form onSubmit={handleSingleSubmit} className="premium-card p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-1">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Event Type</label>
                            <input type="text" required placeholder="EMAIL_OPEN"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                                value={formData.event_type} onChange={e => setFormData({ ...formData, event_type: e.target.value })}
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Source</label>
                            <input type="text" required
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                                value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Metadata (JSON)</label>
                        <textarea
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none h-40 font-mono text-xs"
                            value={formData.metadata} onChange={e => setFormData({ ...formData, metadata: e.target.value })}
                            placeholder='{"email": "user@example.com", "name": "John Doe"}'
                        ></textarea>
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2">
                        {isSubmitting ? "Ingesting..." : <><Send size={20} /> Deploy Event</>}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleBatchSubmit} className="premium-card p-10 space-y-8 text-center flex flex-col items-center">
                    <div className={cn(
                        "w-full border-4 border-dashed rounded-3xl p-12 transition-all group cursor-pointer relative",
                        file ? "bg-indigo-50 border-indigo-200" : "bg-slate-50 border-slate-200 hover:border-indigo-400"
                    )}>
                        <input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" id="file-upload" />
                        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-4">
                            <div className={cn(
                                "w-20 h-20 rounded-2xl flex items-center justify-center transition-all",
                                file ? "bg-indigo-600 text-white shadow-xl rotate-0" : "bg-slate-200 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-400 group-hover:rotate-12"
                            )}>
                                {file ? <FileText size={40} /> : <Upload size={40} />}
                            </div>
                            <div>
                                <span className="block text-xl font-black text-slate-800 tracking-tight">{file ? file.name : "Select CSV File"}</span>
                                <span className="text-sm text-slate-400 font-medium">Drag or click to choose your ingestion source</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-200 text-slate-500 uppercase tracking-wider">event_id</span>
                                <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-200 text-slate-500 uppercase tracking-wider">event_type</span>
                                <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-200 text-slate-500 uppercase tracking-wider">lead_id</span>
                            </div>
                        </label>
                    </div>
                    <button type="submit" disabled={!file || isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-50">
                        {isSubmitting ? "Spooling Batch..." : "Synchronize Batch"}
                    </button>
                </form>
            )}

            {/* Inspiration / Help Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                <div className="premium-card p-6 bg-white">
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <CheckCircle2 className="text-emerald-500 w-4 h-4" />
                        Valid Event Types
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {['EMAIL_OPEN', 'PAGE_VIEW', 'FORM_SUBMISSION', 'DEMO_REQUEST', 'PURCHASE'].map(type => (
                            <span key={type} className="text-[10px] font-mono font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded border border-slate-200">
                                {type}
                            </span>
                        ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-4 leading-relaxed">
                        Ensure your event type matches one of the above for scoring to apply.
                    </p>
                </div>

                <div className="premium-card p-6 bg-white">
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <AlertCircle className="text-amber-500 w-4 h-4" />
                        Pro Tip: Identification
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Events must include <code className="bg-slate-100 px-1 rounded">email</code> or <code className="bg-slate-100 px-1 rounded">lead_id</code> in the metadata to be linked to a lead.
                    </p>
                    <div className="mt-4 p-3 bg-slate-900 rounded-xl">
                        <pre className="text-[10px] text-indigo-300 font-mono whitespace-pre-wrap">
                            {`{
  "email": "alice@microsoft.com",
  "name": "Alice Johnson"
}`}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
}

