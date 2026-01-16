'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  FileCheck,
  Activity,
  Users,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  ArrowLeft,
  Plus,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigation } from '@/contexts/NavigationContext';

interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: { label: string; href: string }[];
}

interface MandateItem {
  id: string;
  name: string;
}

// Company-level navigation (when no portfolio selected)
const companyNavItems: NavItem[] = [
  {
    label: 'Portfolios',
    href: '/company/portfolios',
    icon: BarChart3,
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: FileCheck,
  },
  {
    label: 'Monitoring',
    href: '/monitoring',
    icon: Activity,
  },
];

// Portfolio/Fund-level navigation - Overview section (top)
function getPortfolioOverviewItems(portfolioId: string): NavItem[] {
  return [
    {
      label: 'Overview',
      href: `/company/portfolios/${portfolioId}`,
      icon: LayoutDashboard,
    },
  ];
}

// Portfolio/Fund-level navigation - Middle section (Baseline + Mandates)
function getPortfolioMiddleNavItems(portfolioId: string): NavItem[] {
  return [
    {
      label: 'Baseline',
      href: `/company/portfolios/${portfolioId}/baseline`,
    },
  ];
}

// Portfolio/Fund-level navigation - Bottom section (Users)
function getPortfolioBottomNavItems(portfolioId: string): NavItem[] {
  return [
    {
      label: 'Users',
      href: `/company/portfolios/${portfolioId}/users`,
    },
  ];
}


interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { selectedPortfolio, getMandateLabel, getPortfolioLabel } = useNavigation();
  const [mandatesExpanded, setMandatesExpanded] = useState(false);
  const [mandates, setMandates] = useState<MandateItem[]>([]);
  const [isLoadingMandates, setIsLoadingMandates] = useState(false);

  // Determine which nav items to show based on context
  const portfolioLabelSingular = getPortfolioLabel(false);
  const mandateLabelSingular = getMandateLabel(false);
  const mandateLabelPlural = getMandateLabel(true);

  // Fetch mandates when a portfolio is selected
  useEffect(() => {
    if (selectedPortfolio?.id) {
      setIsLoadingMandates(true);
      fetch(`/api/portfolios/${selectedPortfolio.id}/mandates`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.mandates) {
            setMandates(data.mandates);
          } else {
            setMandates([]);
          }
        })
        .catch(() => setMandates([]))
        .finally(() => setIsLoadingMandates(false));
    } else {
      setMandates([]);
    }
  }, [selectedPortfolio?.id]);

  // When inside a portfolio, use portfolio-specific nav
  const overviewItems = selectedPortfolio
    ? getPortfolioOverviewItems(selectedPortfolio.id)
    : companyNavItems;

  const middleNavItems = selectedPortfolio
    ? getPortfolioMiddleNavItems(selectedPortfolio.id)
    : [];

  const bottomNavItems = selectedPortfolio
    ? getPortfolioBottomNavItems(selectedPortfolio.id)
    : [];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    // For portfolio overview, exact match
    if (href.match(/\/company\/portfolios\/[^/]+$/)) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className={cn('h-full w-56 bg-card border-r flex flex-col', className)}>
      {/* Logo */}
      <div className="h-14 flex items-center justify-center border-b">
        <Link href="/company/portfolios">
          <Image
            src="/juris-logo.png"
            alt="Juris"
            width={56}
            height={20}
            className="dark:invert w-14 h-auto"
            priority
          />
        </Link>
      </div>

      {/* Back link when in a portfolio */}
      {selectedPortfolio && (
        <div className="px-2 pt-3 pb-1">
          <Link
            href="/company/portfolios"
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            All {getPortfolioLabel(true)}
          </Link>
          <div className="px-3 py-2">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              {portfolioLabelSingular}
            </div>
            <div className="font-medium text-sm mt-0.5 truncate">
              {selectedPortfolio.name}
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {/* Overview section (or company nav when not in portfolio) */}
        <ul className="space-y-1 px-2">
          {overviewItems.map((item) => {
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
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Middle section: Baseline + Mandates - only when portfolio selected */}
        {selectedPortfolio && (
          <>
            <div className="my-4 mx-4 border-t" />

            <ul className="space-y-1 px-2">
              {/* Baseline */}
              {middleNavItems.map((item) => {
                const active = isActive(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}

              {/* Mandates - Expandable */}
              <li>
                <button
                  onClick={() => setMandatesExpanded(!mandatesExpanded)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    pathname.includes(`/portfolios/${selectedPortfolio.id}/mandates`)
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <span>{mandateLabelPlural}</span>
                  {mandatesExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>

                {mandatesExpanded && (
                  <ul className="mt-1 space-y-1 pl-4">
                    {isLoadingMandates ? (
                      <li className="px-3 py-2 text-xs text-muted-foreground">
                        Loading...
                      </li>
                    ) : mandates.length === 0 ? (
                      <li className="px-3 py-2 text-xs text-muted-foreground italic">
                        No {mandateLabelPlural.toLowerCase()} yet
                      </li>
                    ) : (
                      mandates.map((mandate) => {
                        const mandateHref = `/company/portfolios/${selectedPortfolio.id}/mandates/${mandate.id}`;
                        const mandateActive = pathname === mandateHref || pathname.startsWith(mandateHref + '/');
                        return (
                          <li key={mandate.id}>
                            <Link
                              href={mandateHref}
                              className={cn(
                                'flex items-center px-3 py-1.5 rounded-md text-sm transition-colors',
                                mandateActive
                                  ? 'bg-primary text-primary-foreground'
                                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                              )}
                            >
                              <span className="truncate">{mandate.name}</span>
                            </Link>
                          </li>
                        );
                      })
                    )}
                    {/* Create new mandate link */}
                    <li>
                      <Link
                        href={`/company/portfolios/${selectedPortfolio.id}/mandates/new`}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Create {mandateLabelSingular}</span>
                      </Link>
                    </li>
                  </ul>
                )}
              </li>
            </ul>

            {/* Bottom section: Users */}
            <div className="my-4 mx-4 border-t" />

            <ul className="space-y-1 px-2">
              {bottomNavItems.map((item) => {
                const active = isActive(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
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
