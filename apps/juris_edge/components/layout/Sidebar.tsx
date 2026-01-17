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
  LayoutDashboard,
  ArrowLeft,
  ScrollText,
  FileText,
  Library,
  Gavel,
  PieChart,
  ShieldCheck,
} from 'lucide-react';
import { useNavigation } from '@/contexts/NavigationContext';

interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
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

// Portfolio/Fund-level navigation items
function getPortfolioNavItems(portfolioId: string): NavItem[] {
  return [
    {
      label: 'Overview',
      href: `/company/portfolios/${portfolioId}`,
      icon: LayoutDashboard,
    },
    {
      label: 'Baseline (Constitution)',
      href: `/company/portfolios/${portfolioId}/baseline`,
      icon: ScrollText,
    },
    {
      label: 'Cases',
      href: `/company/portfolios/${portfolioId}/cases`,
      icon: FileText,
    },
    {
      label: 'Evidence Library',
      href: `/company/portfolios/${portfolioId}/evidence`,
      icon: Library,
    },
    {
      label: 'Decisions & Exceptions',
      href: `/company/portfolios/${portfolioId}/decisions`,
      icon: Gavel,
    },
    {
      label: 'Positions / Exposures',
      href: `/company/portfolios/${portfolioId}/positions`,
      icon: PieChart,
    },
    {
      label: 'Monitoring',
      href: `/company/portfolios/${portfolioId}/monitoring`,
      icon: Activity,
    },
    {
      label: 'Reports',
      href: `/company/portfolios/${portfolioId}/reports`,
      icon: FileCheck,
    },
    {
      label: 'Access & Audit',
      href: `/company/portfolios/${portfolioId}/access`,
      icon: ShieldCheck,
    },
  ];
}


interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { selectedPortfolio, getPortfolioLabel } = useNavigation();

  // Determine which nav items to show based on context
  const portfolioLabelSingular = getPortfolioLabel(false);

  // When inside a portfolio, use portfolio-specific nav
  const navItems = selectedPortfolio
    ? getPortfolioNavItems(selectedPortfolio.id)
    : companyNavItems;

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
            className="dark:invert"
            style={{ width: 'auto', height: 'auto' }}
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
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
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
