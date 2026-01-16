'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  Users,
  Shield,
  Sliders,
  FileText,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ADMIN_NAV = [
  { label: 'Company', href: '/admin', icon: Building2 },
  { label: 'Users & Roles', href: '/admin/users', icon: Users },
  { label: 'Permissions', href: '/admin/roles', icon: Shield },
  { label: 'Parameters', href: '/admin/parameters', icon: Sliders },
  { label: 'Benchmarks', href: '/admin/benchmarks', icon: FileText },
  { label: 'System', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full gap-6">
      {/* Admin Sidebar */}
      <aside className="w-56 flex-shrink-0">
        <div className="sticky top-0">
          <h2 className="text-lg font-semibold mb-4">Administration</h2>
          <nav className="space-y-1">
            {ADMIN_NAV.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Admin Content */}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
