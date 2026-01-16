'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Users,
  BarChart3,
  CreditCard,
  HelpCircle,
  Cog,
  ChevronRight,
  Building2,
  Server,
} from 'lucide-react';
import { useNavigation } from '@/contexts/NavigationContext';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresAdmin?: boolean;
  requiresOwner?: boolean;
  isDynamic?: boolean; // For items where label depends on industry
}

interface CompanySidebarProps {
  className?: string;
}

export function CompanySidebar({ className }: CompanySidebarProps) {
  const pathname = usePathname();
  const { company, isAdmin, isOwner, getPortfolioLabel } = useNavigation();

  // Navigation items - portfolios label is dynamic based on industry
  const mainNavItems: NavItem[] = [
    {
      label: 'Configuration',
      href: '/company/configuration',
      icon: Cog,
      requiresAdmin: true,
    },
    {
      label: 'Users',
      href: '/company/users',
      icon: Users,
      requiresAdmin: true,
    },
    {
      label: getPortfolioLabel(true), // Use industry-specific label (Funds/Books/Pipelines)
      href: '/company/portfolios',
      icon: BarChart3,
      isDynamic: true,
    },
    {
      label: 'Services',
      href: '/company/settings',
      icon: Server,
      requiresAdmin: true,
    },
  ];

  const secondaryNavItems: NavItem[] = [
    {
      label: 'Billing',
      href: '/company/billing',
      icon: CreditCard,
      requiresOwner: true,
    },
    {
      label: 'Support',
      href: '/company/support',
      icon: HelpCircle,
    },
  ];

  const isActive = (href: string) => {
    return pathname.startsWith(href);
  };

  const canSeeItem = (item: NavItem) => {
    if (item.requiresOwner) return isOwner();
    if (item.requiresAdmin) return isAdmin();
    return true;
  };

  const visibleMainItems = mainNavItems.filter(canSeeItem);
  const visibleSecondaryItems = secondaryNavItems.filter(canSeeItem);

  return (
    <aside className={cn('h-full w-56 bg-card border-r flex flex-col', className)}>
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b">
        <Link href="/company">
          <Image
            src="/juris-logo.png"
            alt="Juris"
            width={80}
            height={28}
            className="dark:invert"
            style={{ width: 'auto', height: 'auto' }}
            priority
          />
        </Link>
      </div>

      {/* Company Name Header */}
      <div className="px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center overflow-hidden">
            {company?.logoUrl ? (
              <Image
                src={company.logoUrl}
                alt={company.name || 'Company'}
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            ) : (
              <Building2 className="h-4 w-4 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{company?.name || 'Company'}</div>
            <div className="text-xs text-muted-foreground">Company Settings</div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {visibleMainItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {active && <ChevronRight className="h-4 w-4 ml-auto" />}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Separator */}
        {visibleSecondaryItems.length > 0 && (
          <div className="my-4 mx-4">
            <div className="border-t w-2/3" />
          </div>
        )}

        {/* Secondary Navigation */}
        <ul className="space-y-1 px-2">
          {visibleSecondaryItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t px-4 py-3">
        <p className="text-xs text-muted-foreground">
          Enterprise v1.0
        </p>
      </div>
    </aside>
  );
}
