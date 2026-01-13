import { useState } from 'react';
import { api } from '../lib/api';
import { Upload, FileText, Send } from 'lucide-react';

export default function EventUpload() {
    const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
    const [formData, setFormData] = useState({ type: '', source: 'manual', metadata: '{}' });
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState({ type: '', message: '' });

    const handleSingleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let meta = {};
            try { meta = JSON.parse(formData.metadata); } catch (e) { /* ignore */ }

            await api.post('/events', { ...formData, metadata: meta });
            setStatus({ type: 'success', message: 'Event submitted successfully!' });
            setFormData({ type: '', source: 'manual', metadata: '{}' });
        } catch (error) {
            setStatus({ type: 'error', message: 'Error submitting event.' });
        }
    };

    const handleBatchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        const form = new FormData();
        form.append('file', file);

        try {
            const { data } = await api.post('/upload', form);
            setStatus({ type: 'success', message: `Batch uploaded! Processed ${data.count} events.` });
            setFile(null);
        } catch (error) {
            setStatus({ type: 'error', message: 'Error uploading batch.' });
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">Event Submission</h1>

            <div className="flex space-x-4 border-b border-slate-200">
                <button
                    onClick={() => { setActiveTab('single'); setStatus({ type: '', message: '' }); }}
                    className={`pb-3 px-4 font-medium transition ${activeTab === 'single' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Single Event
                </button>
                <button
                    onClick={() => { setActiveTab('batch'); setStatus({ type: '', message: '' }); }}
                    className={`pb-3 px-4 font-medium transition ${activeTab === 'batch' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Batch Upload
                </button>
            </div>

            {status.message && (
                <div className={`p-4 rounded-md ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {status.message}
                </div>
            )}

            {activeTab === 'single' ? (
                <form onSubmit={handleSingleSubmit} className="bg-white p-6 rounded-lg shadow border border-slate-200 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Event Type</label>
                        <input type="text" required placeholder="e.g. email_open" className="input-field w-full border border-slate-300 rounded px-3 py-2"
                            value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Source</label>
                        <input type="text" required className="input-field w-full border border-slate-300 rounded px-3 py-2"
                            value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Metadata (JSON)</label>
                        <textarea className="input-field w-full border border-slate-300 rounded px-3 py-2 h-32 font-mono text-sm"
                            value={formData.metadata} onChange={e => setFormData({ ...formData, metadata: e.target.value })}
                            placeholder='{"email": "user@example.com"}'
                        ></textarea>
                    </div>
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 w-full flex justify-center items-center gap-2">
                        <Send size={18} /> Submit Event
                    </button>
                </form>
            ) : (
                <form onSubmit={handleBatchSubmit} className="bg-white p-6 rounded-lg shadow border border-slate-200 space-y-6 text-center">
                    <div className={`border-2 border-dashed border-slate-300 rounded-lg p-10 transition ${file ? 'bg-blue-50 border-blue-300' : 'hover:bg-slate-50'}`}>
                        <input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" id="file-upload" />
                        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                            <Upload size={48} className="text-slate-400" />
                            <span className="text-slate-600 font-medium">{file ? file.name : "Click to upload CSV"}</span>
                            <span className="text-xs text-slate-400">Headers: eventId, type, source, timestamp, ...metadata</span>
                        </label>
                    </div>
                    <button type="submit" disabled={!file} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 w-full disabled:opacity-50">
                        Upload Batch
                    </button>
                </form>
            )}
        </div>
    );
}
