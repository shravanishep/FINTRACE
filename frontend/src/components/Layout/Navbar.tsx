import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Shield, LayoutDashboard, FolderKanban, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { username, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="h-12 border-b border-fin-border bg-white px-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-6">
        {/* Brand */}
        <Link to="/dashboard" className="flex items-center gap-2 group">
          <div className="p-1 rounded bg-blue-50 border border-blue-200 text-fin-accent">
            <Shield className="h-4 w-4" />
          </div>
          <span className="font-sans font-bold text-sm text-fin-text tracking-tight">
            FIN<span className="text-fin-accent">TRACE</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1 font-sans text-xs">
          <Link
            to="/dashboard"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
              isActive('/dashboard')
                ? 'bg-slate-100 text-fin-text font-medium border border-fin-border'
                : 'text-fin-subtext hover:text-fin-text hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </Link>

          <Link
            to="/investigations/new"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
              isActive('/investigations/new')
                ? 'bg-slate-100 text-fin-text font-medium border border-fin-border'
                : 'text-fin-subtext hover:text-fin-text hover:bg-slate-50'
            }`}
          >
            <FolderKanban className="h-3.5 w-3.5" />
            <span>Investigations</span>
          </Link>
        </nav>
      </div>

      {/* Right User Controls */}
      <div className="flex items-center gap-3 text-xs font-sans">
        <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded border border-fin-border text-fin-subtext">
          <User className="h-3.5 w-3.5 text-fin-accent" />
          <span className="text-fin-text font-medium">{username || 'admin'}</span>
        </div>

        <button
          onClick={handleLogout}
          className="p-1.5 rounded text-fin-subtext hover:text-fin-danger hover:bg-red-50 transition-colors"
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
