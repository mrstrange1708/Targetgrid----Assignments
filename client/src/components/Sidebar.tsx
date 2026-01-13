import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Settings, Upload } from 'lucide-react';
import { cn } from '../lib/utils';

const Sidebar = () => {
    const location = useLocation();

    const navItems = [
        { name: 'Dashboard', path: '/', icon: Home },
        { name: 'Leads', path: '/leads', icon: Users },
        { name: 'Rules', path: '/rules', icon: Settings },
        { name: 'Event Upload', path: '/upload', icon: Upload },
    ];

    return (
        <div className="h-screen w-64 bg-slate-900 text-white flex flex-col p-4">
            <div className="text-2xl font-bold mb-8 text-center text-blue-400">LeadScore</div>
            <nav className="flex flex-col gap-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-md transition-colors",
                                isActive ? "bg-blue-600 text-white" : "hover:bg-slate-800 text-slate-300"
                            )}
                        >
                            <Icon size={20} />
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
};

export default Sidebar;
