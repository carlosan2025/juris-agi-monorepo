'use client';

import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  ScrollText,
  FileText,
  Library,
  Gavel,
  PieChart,
  FileBarChart,
  ShieldCheck,
  ChevronRight,
  Building2,
  Activity,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Fund-level navigation items
const fundNavItems = [
  {
    label: 'Baseline (Constitution)',
    href: 'constitution',
    icon: ScrollText,
    description: 'Baseline versions and rulebook',
  },
  {
    label: 'Cases',
    href: 'cases',
    icon: FileText,
    description: 'Deal lifecycle and owners',
  },
  {
    label: 'Evidence Library',
    href: 'evidence',
    icon: Library,
    description: 'Documents, claims, and admissibility',
  },
  {
    label: 'Decisions & Exceptions',
    href: 'decisions',
    icon: Gavel,
    description: 'Exceptions, approvals, and sign-offs',
  },
  {
    label: 'Positions / Exposures',
    href: 'positions',
    icon: PieChart,
    description: 'Portfolio exposures and holdings',
  },
  {
    label: 'Monitoring',
    href: 'monitoring',
    icon: Activity,
    description: 'Real-time compliance monitoring',
  },
  {
    label: 'Reports',
    href: 'reports',
    icon: FileBarChart,
    description: 'Reporting packs and certifications',
  },
  {
    label: 'Access & Audit',
    href: 'access',
    icon: ShieldCheck,
    description: 'RBAC and audit log',
  },
];

// Mock data - will be replaced with real data fetch
const MOCK_FUND = {
  id: 'portfolio-1',
  name: 'Fund III',
  company: {
    id: 'company-1',
    name: 'Convolution Sum',
    slug: 'convolution-sum',
  },
};

interface PortfolioLayoutProps {
  children: React.ReactNode;
}

export default function PortfolioLayout({ children }: PortfolioLayoutProps) {
  const params = useParams();
  const pathname = usePathname();
  const portfolioId = params.id as string;

  // Determine active section from pathname
  const getActiveSection = () => {
    const parts = pathname.split('/');
    const sectionIndex = parts.findIndex((p) => p === portfolioId) + 1;
    return parts[sectionIndex] || '';
  };

  const activeSection = getActiveSection();

  return (
    <div className="flex h-full">
      {/* Fund Sidebar */}
      <aside className="w-56 border-r bg-card flex flex-col">
        {/* Fund Header / Breadcrumb */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <Building2 className="h-3 w-3" />
            <Link href="/portfolios" className="hover:text-foreground">
              {MOCK_FUND.company.name}
            </Link>
            <ChevronRight className="h-3 w-3" />
          </div>
          <h2 className="font-semibold text-lg">{MOCK_FUND.name}</h2>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2">
          <TooltipProvider delayDuration={300}>
            <ul className="space-y-0.5 px-2">
              {fundNavItems.map((item) => {
                const Icon = item.icon;
                const href = `/portfolios/${portfolioId}/${item.href}`;
                const isActive = activeSection === item.href;

                return (
                  <li key={item.href}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={href}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p className="font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </li>
                );
              })}
            </ul>
          </TooltipProvider>
        </nav>

        {/* Footer */}
        <div className="border-t p-3">
          <Link
            href={`/portfolios/${portfolioId}`}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← Back to Overview
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
