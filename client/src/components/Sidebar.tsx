import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Settings, Upload, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const location = useLocation();

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: Home },
        { name: 'Leads', path: '/leads', icon: Users },
        { name: 'Rules', path: '/rules', icon: Settings },
        { name: 'Event Upload', path: '/upload', icon: Upload },
    ];

    return (
        <div className={cn(
            "fixed inset-y-0 left-0 lg:static lg:h-screen w-64 bg-slate-900/95 backdrop-blur-lg text-white flex flex-col p-6 shadow-2xl z-50 transition-transform duration-300 transform lg:translate-x-0",
            isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
            <div className="flex items-center gap-3 mb-10 px-2">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Zap size={24} className="text-white fill-white" />
                </div>
                <div className="text-2xl font-bold tracking-tight">
                    Lead<span className="text-indigo-400">Gen</span>
                </div>
            </div>

            <nav className="flex flex-col gap-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={onClose}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                                    : "hover:bg-white/5 text-slate-400 hover:text-white"
                            )}
                        >
                            <Icon size={20} className={cn(
                                "transition-colors",
                                isActive ? "text-white" : "text-slate-500 group-hover:text-indigo-400"
                            )} />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto">
                <div className="p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/20">
                    <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">PRO PLAN</div>
                    <div className="text-sm font-medium text-slate-300">Unlimited Leads</div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
