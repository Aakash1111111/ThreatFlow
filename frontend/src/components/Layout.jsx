import { Shield, Activity, Database, FileText, Layers } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

const Sidebar = () => {
  const navItems = [
    { path: '/', label: 'Dashboard', icon: Activity },
    { path: '/analyze', label: 'Analyze IOCs', icon: Layers },
    { path: '/enrichment', label: 'Enrichment', icon: Database },
    { path: '/reports', label: 'Reports', icon: FileText },
  ];

  return (
    <div className="fixed inset-y-0 left-0 w-60 bg-card border-r border-border text-textPrimary flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <Shield className="w-6 h-6 text-primary mr-2" />
        <span className="text-xl font-bold tracking-wide">ThreatFlow</span>
        <span className="ml-auto text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">v1.0</span>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-primary text-white font-medium shadow-md shadow-indigo-500/20' 
                  : 'text-textSecondary hover:bg-slate-700/50 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-border text-xs text-textSecondary text-center">
        &copy; 2026 ThreatFlow Engine
      </div>
    </div>
  );
};

const Layout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-60 flex flex-col min-h-screen">
        <header className="h-16 flex items-center px-8 border-b border-border bg-background/95 backdrop-blur z-10 sticky top-0">
          <h1 className="text-lg font-semibold text-textSecondary">Security Operations Center</h1>
        </header>
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
