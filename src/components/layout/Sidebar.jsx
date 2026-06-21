import { Link, useLocation } from 'react-router-dom';
import {
  Inbox,
  FileText,
  Cookie,
  Settings as SettingsIcon,
  Shield,
  Building2,
  Accessibility,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';

const navItems = [
  { path: '/', label: 'Request Inbox', icon: Inbox },
  { path: '/consent-log', label: 'Consent Log', icon: Cookie },
  { path: '/widget-studio', label: 'Widget Studio', icon: FileText },
  { path: '/audit-trail', label: 'Audit Trail', icon: Shield },
  { path: '/accessibility', label: 'Accessibility', icon: Accessibility },
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
];

const superAdminItems = [
  { path: '/organizations', label: 'Organizations', icon: Building2 },
];

export default function Sidebar() {
  const location = useLocation();
  const { user, isSuperAdmin } = useCurrentUser();
  const [collapsed, setCollapsed] = useState(false);

  const allItems = isSuperAdmin
    ? [...superAdminItems, ...navItems]
    : navItems;

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
      style={{ backgroundColor: 'hsl(210, 40%, 11%)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-white/10 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Shield className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="text-white font-semibold text-sm tracking-tight truncate">
            Tessera Privacy
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {allItems.map(item => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
                isActive
                  ? 'bg-primary/20 text-primary'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User & Collapse */}
      <div className="border-t border-white/10 p-3 space-y-2 shrink-0">
        {!collapsed && user && (
          <div className="px-1 mb-2">
            <p className="text-white text-xs font-medium truncate">{user.full_name}</p>
            <p className="text-slate-500 text-[11px] truncate">{user.email}</p>
          </div>
        )}
        <div className="flex items-center justify-between">
          <button
            onClick={() => base44.auth.logout()}
            className="flex items-center gap-2 text-slate-500 hover:text-white text-xs transition-colors"
            title="Log out"
          >
            <LogOut className="w-3.5 h-3.5" />
            {!collapsed && <span>Log out</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-500 hover:text-white transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}