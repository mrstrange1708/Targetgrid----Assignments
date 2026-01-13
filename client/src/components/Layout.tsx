import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
    return (
        <div className="flex h-screen bg-slate-100 font-sans text-slate-900">
            <Sidebar />
            <div className="flex-1 overflow-auto">
                <div className="p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default Layout;
