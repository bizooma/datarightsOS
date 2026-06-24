import { Link, useLocation } from 'react-router-dom';
import {
  Inbox,
  FileText,
  Cookie,
  Settings as SettingsIcon,
  Shield,
  BarChart3,
  Building2,
  Accessibility,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';

const navItems = [
  { path: '/dashboard', label: 'Request Inbox', icon: Inbox },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/consent-log', label: 'Consent Log', icon: Cookie },
  { path: '/widget-studio', label: 'Widget Studio', icon: FileText },
  { path: '/audit-trail', label: 'Audit Trail', icon: Shield },
  { path: '/accessibility', label: 'Accessibility', icon: Accessibility },
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
];

const superAdminItems = [
  { path: '/organizations', label: 'Organizations', icon: Building2 },
  { path: '/admin/users', label: 'User Management', icon: Users },
];

export default function Sidebar() {
  const location = useLocation();
  const { user, isSuperAdmin } = useCurrentUser();
  const [collapsed, setCollapsed] = useState(false);

  // Resolve effective orgId — supports super-admin impersonation via sessionStorage
  const impersonateOrgId = sessionStorage.getItem('dros_impersonate_org');
  const effectiveOrgId = impersonateOrgId || user?.organization;

  const { data: org } = useQuery({
    queryKey: ['org-branding', effectiveOrgId],
    queryFn: async () => {
      const orgs = await base44.entities.Organization.filter({ id: effectiveOrgId });
      return orgs[0] || null;
    },
    enabled: !!effectiveOrgId,
    staleTime: 60_000,
  });

  const brandColor = org?.brand_primary_color || '#0d7d74';
  const productName = org?.white_label_product_name || 'Data Rights OS';
  const logoUrl = org?.brand_logo_url;

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
      {/* Logo / Brand Header */}
      <Link to="/" className="flex items-center gap-2.5 px-4 h-16 border-b border-white/10 shrink-0 hover:bg-white/5 transition-colors" title="Go to home page">
        {!collapsed ? (
          <img
            src={logoUrl || "https://media.base44.com/images/public/6a3735f4f27dcb14405892ae/9664d0c97_datarights.png"}
            alt="Logo"
            className="h-8 object-contain"
            style={{ filter: 'brightness(0) invert(1)' }}
            onError={e => e.target.style.display = 'none'}
          />
        ) : (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: brandColor }}
          >
            <Shield className="w-4 h-4 text-white" />
          </div>
        )}
      </Link>

      {/* Impersonation banner */}
      {!collapsed && impersonateOrgId && (
        <div className="px-3 py-1.5 bg-amber-500/20 border-b border-amber-400/20">
          <p className="text-[10px] text-amber-300 truncate">
            ⚡ {sessionStorage.getItem('dros_impersonate_org_name') || 'Impersonating'}
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {allItems.map(item => {
          const isActive =
            item.path === '/dashboard'
              ? location.pathname === '/dashboard'
              : location.pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              style={isActive ? { backgroundColor: `${brandColor}30`, color: 'white' } : undefined}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-4 h-4 shrink-0" style={isActive ? { color: brandColor } : undefined} />
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
            <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300 capitalize">
              {user.role}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <button
            onClick={() => base44.auth.logout('/')}
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