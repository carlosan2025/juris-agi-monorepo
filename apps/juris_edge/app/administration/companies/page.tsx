'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Users,
  FolderOpen,
  FileText,
  Briefcase,
  ArrowLeft,
  Search,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useJurisAdmin } from '@/contexts/JurisAdminContext';

interface CompanyStats {
  users: number;
  activeUsers: number;
  portfolios: number;
  mandates: number;
  documents: number;
}

interface Company {
  id: string;
  name: string;
  slug: string;
  industryProfile: string;
  domain: string | null;
  timezone: string;
  currency: string;
  logoUrl: string | null;
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
  updatedAt: string;
  stats: CompanyStats;
}

interface CompaniesResponse {
  success: boolean;
  companies: Company[];
  stats: {
    total: number;
    active: number;
    inactive: number;
    pending: number;
  };
}

function getStatusBadge(status: Company['status']) {
  switch (status) {
    case 'active':
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case 'inactive':
      return (
        <Badge variant="outline" className="text-muted-foreground">
          <XCircle className="h-3 w-3 mr-1" />
          Inactive
        </Badge>
      );
  }
}

function getIndustryLabel(profile: string) {
  const labels: Record<string, string> = {
    VENTURE_CAPITAL: 'Venture Capital',
    INSURANCE: 'Insurance',
    PHARMA: 'Pharmaceutical',
    GENERIC: 'General',
  };
  return labels[profile] || profile;
}

export default function CompaniesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useJurisAdmin();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, pending: 0 });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/administration/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch companies
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchCompanies = async () => {
      try {
        const response = await fetch('/api/admin/companies');
        if (response.ok) {
          const data: CompaniesResponse = await response.json();
          if (data.success) {
            setCompanies(data.companies);
            setStats(data.stats);
          }
        }
      } catch (error) {
        console.error('Failed to fetch companies:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchCompanies();
  }, [isAuthenticated]);

  // Filter companies by search
  const filteredCompanies = companies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (company.domain && company.domain.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/administration">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="font-semibold text-lg">Companies</h1>
              <p className="text-xs text-muted-foreground">Manage tenant organizations</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-semibold">{stats.total}</div>
                  <div className="text-xs text-muted-foreground">Total Companies</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-semibold">{stats.active}</div>
                  <div className="text-xs text-muted-foreground">Active</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-2xl font-semibold">{stats.pending}</div>
                  <div className="text-xs text-muted-foreground">Pending Setup</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-900/30 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <div className="text-2xl font-semibold">{stats.inactive}</div>
                  <div className="text-xs text-muted-foreground">Inactive</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Companies Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Companies</CardTitle>
                <CardDescription>
                  View and manage all tenant organizations on the platform
                </CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingData ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'No companies match your search' : 'No companies yet'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-4 w-4" />
                        Users
                      </div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <FolderOpen className="h-4 w-4" />
                        Portfolios
                      </div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        Mandates
                      </div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <FileText className="h-4 w-4" />
                        Documents
                      </div>
                    </TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center font-semibold text-primary">
                            {company.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{company.name}</div>
                            <div className="text-xs text-muted-foreground">{company.slug}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getIndustryLabel(company.industryProfile)}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(company.status)}</TableCell>
                      <TableCell className="text-center">
                        <div className="font-medium">{company.stats.users}</div>
                        {company.stats.activeUsers > 0 && (
                          <div className="text-xs text-green-600">{company.stats.activeUsers} active</div>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-medium">{company.stats.portfolios}</TableCell>
                      <TableCell className="text-center font-medium">{company.stats.mandates}</TableCell>
                      <TableCell className="text-center font-medium">{company.stats.documents}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Dashboard
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Users className="h-4 w-4 mr-2" />
                              Manage Users
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Building2 className="h-4 w-4 mr-2" />
                              Edit Company
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              Suspend Company
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
