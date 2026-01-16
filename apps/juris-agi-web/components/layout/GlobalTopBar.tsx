'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  HelpCircle,
  Target,
  FileText,
  FolderOpen,
  BarChart3,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';

const MOCK_NOTIFICATIONS = [
  { id: '1', title: 'New document uploaded', time: '5 min ago', read: false },
  { id: '2', title: 'Evaluation completed', time: '1 hour ago', read: false },
  { id: '3', title: 'Exception requires review', time: '2 hours ago', read: true },
];

interface ProcessBreadcrumb {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

function getProcessBreadcrumbs(pathname: string): ProcessBreadcrumb[] {
  const parts = pathname.split('/').filter(Boolean);
  const breadcrumbs: ProcessBreadcrumb[] = [];

  if (parts[0] === 'mandates') {
    breadcrumbs.push({ label: 'Mandates', href: '/mandates', icon: <Target className="h-3.5 w-3.5" /> });
    if (parts[1] && parts[1] !== 'new') {
      breadcrumbs.push({ label: 'Mandate Detail', href: `/mandates/${parts[1]}` });
      if (parts[2] === 'constitution') {
        breadcrumbs.push({ label: 'Constitution', href: `/mandates/${parts[1]}/constitution` });
      } else if (parts[2] === 'schema') {
        breadcrumbs.push({ label: 'Schema', href: `/mandates/${parts[1]}/schema` });
      } else if (parts[2] === 'cases') {
        breadcrumbs.push({ label: 'New Case' });
      }
    }
  } else if (parts[0] === 'cases') {
    breadcrumbs.push({ label: 'Cases', href: '/cases', icon: <FileText className="h-3.5 w-3.5" /> });
    if (parts[1]) {
      breadcrumbs.push({ label: 'Case Detail', href: `/cases/${parts[1]}` });
      if (parts[2]) {
        const stepLabels: Record<string, string> = {
          evidence: 'Evidence',
          evaluation: 'Evaluation',
          exceptions: 'Exceptions',
          decision: 'Decision',
          portfolio: 'Portfolio',
          reporting: 'Reporting',
          monitoring: 'Monitoring',
        };
        breadcrumbs.push({ label: stepLabels[parts[2]] || parts[2] });
      }
    }
  } else if (parts[0] === 'documents') {
    breadcrumbs.push({ label: 'Documents', href: '/documents', icon: <FolderOpen className="h-3.5 w-3.5" /> });
  } else if (parts[0] === 'portfolios') {
    breadcrumbs.push({ label: 'Portfolios', href: '/portfolios', icon: <BarChart3 className="h-3.5 w-3.5" /> });
  } else if (parts[0] === 'admin') {
    breadcrumbs.push({ label: 'Admin', href: '/admin', icon: <Shield className="h-3.5 w-3.5" /> });
  }

  return breadcrumbs;
}

export function GlobalTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const {
    company,
    selectedPortfolio,
    portfolios,
    navigateToPortfolio,
    navigateToCompany,
    getPortfolioLabel,
  } = useNavigation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const breadcrumbs = getProcessBreadcrumbs(pathname);
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;
  const portfolioLabelSingular = getPortfolioLabel(false);
  const portfolioLabelPlural = getPortfolioLabel(true);

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
  };

  const handlePortfolioChange = (portfolioId: string) => {
    if (portfolioId === 'all') {
      navigateToCompany();
      router.push('/company/portfolios');
    } else {
      const portfolio = portfolios.find((p) => p.id === portfolioId);
      if (portfolio) {
        navigateToPortfolio(portfolio);
        router.push(`/company/portfolios/${portfolioId}`);
      }
    }
  };

  return (
    <header className="h-12 border-b bg-background flex items-center px-4 gap-4 sticky top-0 z-50">
      {/* Company | Fund Navigation */}
      <div className="flex items-center gap-2">
        <Link href="/company/portfolios" className="flex items-center gap-2 hover:opacity-80">
          <div className="h-6 w-6 rounded flex items-center justify-center overflow-hidden bg-primary/10">
            {company?.logoUrl ? (
              <Image
                src={company.logoUrl}
                alt={company.name || 'Company'}
                width={24}
                height={24}
                className="w-full h-full object-contain"
              />
            ) : (
              <Building2 className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <span className="font-medium text-sm">{company?.name || 'Company'}</span>
        </Link>

        {/* Show fund name when inside a fund */}
        {selectedPortfolio && (
          <>
            <span className="text-muted-foreground">|</span>
            <span className="font-medium text-sm">{selectedPortfolio.name}</span>
          </>
        )}
      </div>

      {/* Process Breadcrumb */}
      {breadcrumbs.length > 0 && (
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-muted-foreground mx-2">|</span>
          {breadcrumbs.map((crumb, i) => (
            <div key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
              {crumb.icon}
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

      {/* Notifications */}
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 relative"
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>

        {showNotifications && (
          <div className="absolute right-0 top-10 w-80 bg-popover border rounded-lg shadow-lg z-50">
            <div className="p-3 border-b">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Notifications</span>
                <Button variant="ghost" size="sm" className="h-6 text-xs">
                  Mark all read
                </Button>
              </div>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {MOCK_NOTIFICATIONS.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 border-b last:border-0 hover:bg-muted/50 cursor-pointer ${
                    !notif.read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <div className="text-sm">{notif.title}</div>
                  <div className="text-xs text-muted-foreground">{notif.time}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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
          <span className="text-sm">{user?.name || 'User'}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>

        {showUserMenu && (
          <div className="absolute right-0 top-10 w-56 bg-popover border rounded-lg shadow-lg z-50">
            <div className="p-3 border-b">
              <div className="font-medium text-sm">{user?.name || 'User'}</div>
              <div className="text-xs text-muted-foreground">{user?.email || ''}</div>
              <Badge variant="outline" className="mt-1 text-xs capitalize">
                {user?.companyRole?.toLowerCase().replace('_', ' ') || 'member'}
              </Badge>
            </div>
            <div className="p-1">
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="w-full justify-start h-8">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
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
