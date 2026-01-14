import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
            <div className="bg-animate">
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
            </div>
            <Sidebar />
            <div className="flex-1 overflow-auto relative z-0">
                <div className="p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default Layout;
