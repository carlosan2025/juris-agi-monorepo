'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  ChevronDown,
  Search,
  Bell,
  User,
  LogOut,
  HelpCircle,
  Building2,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const parts = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  if (parts[0] === 'company') {
    if (parts[1] === 'configuration') {
      breadcrumbs.push({ label: 'Configuration' });
    } else if (parts[1] === 'users') {
      breadcrumbs.push({ label: 'Users' });
      if (parts[2] === 'invite') {
        breadcrumbs.push({ label: 'Invite User' });
      } else if (parts[2]) {
        breadcrumbs.push({ label: 'User Details' });
      }
    } else if (parts[1] === 'portfolios') {
      breadcrumbs.push({ label: 'Portfolios' });
      if (parts[2] === 'new') {
        breadcrumbs.push({ label: 'New Portfolio' });
      } else if (parts[2]) {
        breadcrumbs.push({ label: 'Portfolio Details' });
      }
    } else if (parts[1] === 'settings') {
      breadcrumbs.push({ label: 'Settings' });
    } else if (parts[1] === 'billing') {
      breadcrumbs.push({ label: 'Billing' });
    } else if (parts[1] === 'support') {
      breadcrumbs.push({ label: 'Support' });
    }
  }

  return breadcrumbs;
}

export function CompanyTopBar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { company, currentUser } = useNavigation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const breadcrumbs = getBreadcrumbs(pathname);

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
  };

  return (
    <header className="h-12 border-b bg-background flex items-center px-4 gap-4 sticky top-0 z-50">
      {/* Company Name - clickable to return to company level */}
      <Link
        href="/company"
        className="flex items-center gap-2 hover:bg-muted/50 rounded-md px-2 py-1 -ml-2 transition-colors"
      >
        <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center overflow-hidden">
          {company?.logoUrl ? (
            <Image
              src={company.logoUrl}
              alt={company.name || 'Company'}
              width={28}
              height={28}
              className="w-full h-full object-contain"
            />
          ) : (
            <Building2 className="h-4 w-4 text-primary" />
          )}
        </div>
        <span className="font-medium text-sm">{company?.name || 'Company'}</span>
      </Link>

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-muted-foreground mx-2">|</span>
          {breadcrumbs.map((crumb, i) => (
            <div key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
              {crumb.href ? (
                <Link href={crumb.href} className="text-muted-foreground hover:text-foreground">
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium">{crumb.label}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <Button variant="ghost" size="sm" className="h-8 px-3 text-muted-foreground">
        <Search className="h-4 w-4 mr-2" />
        <span className="text-sm">Search...</span>
        <kbd className="ml-4 text-xs bg-muted px-1.5 py-0.5 rounded">⌘K</kbd>
      </Button>

      {/* Help */}
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <HelpCircle className="h-4 w-4" />
      </Button>

      {/* User Menu */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2"
          onClick={() => setShowUserMenu(!showUserMenu)}
        >
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm">{currentUser?.name || user?.name || 'User'}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>

        {showUserMenu && (
          <div className="absolute right-0 top-10 w-56 bg-popover border rounded-lg shadow-lg z-50">
            <div className="p-3 border-b">
              <div className="font-medium text-sm">{currentUser?.name || user?.name || 'User'}</div>
              <div className="text-xs text-muted-foreground">{currentUser?.email || user?.email || ''}</div>
              <Badge variant="outline" className="mt-1 text-xs capitalize">
                {currentUser?.role || 'member'}
              </Badge>
            </div>
            <div className="p-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-8 text-red-600"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
