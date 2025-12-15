import { NavLink } from 'react-router-dom';
import { Database, FlaskConical, FileText, LayoutDashboard, Layers } from 'lucide-react';

const Sidebar = () => {
    const navItems = [
        { to: '/', icon: Database, label: 'Data Explorer' },
        { to: '/factor-lab', icon: FlaskConical, label: 'Factor Lab' },
        { to: '/strategy', icon: Layers, label: 'Factor Strategy' },
        { to: '/report', icon: FileText, label: 'Reports' },
    ];

    return (
        <aside className="w-64 bg-surface border-r border-border flex flex-col">
            <div className="p-6 flex items-center space-x-2 border-b border-border">
                <LayoutDashboard className="w-6 h-6 text-primary" />
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Open Alpha
                </span>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                ? 'bg-primary/10 text-primary border-r-2 border-primary'
                                : 'text-gray-400 hover:bg-white/5 hover:text-foreground'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-border">
                <div className="text-xs text-gray-500 text-center">
                    v1.0.0 Alpha
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
