import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, X, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
            {/* Background Orbs */}
            <div className="bg-animate pointer-events-none">
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
            </div>

            {/* Mobile Header */}
            <header className="lg:hidden absolute top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 flex items-center justify-between z-40">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Zap size={18} className="text-white fill-white" />
                    </div>
                    <div className="text-xl font-bold tracking-tight">
                        Lead<span className="text-indigo-600">Gen</span>
                    </div>
                </div>
                <button
                    onClick={toggleSidebar}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {/* Sidebar Overlay */}
            <div
                className={cn(
                    "fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300",
                    isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsSidebarOpen(false)}
            />

            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Main Content */}
            <div className="flex-1 overflow-auto relative z-0 mt-16 lg:mt-0">
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default Layout;
