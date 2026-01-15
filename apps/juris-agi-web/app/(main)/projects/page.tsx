'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  MoreVertical,
  FolderOpen,
  Calendar,
  GitBranch,
  FileText,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { ProjectStatus } from '@/types/domain';

// UI display type (simplified from domain type)
interface ProjectDisplay {
  id: string;
  name: string;
  description?: string;
  activeBaselineVersion: string | null;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Mock data for demonstration
const MOCK_PROJECTS: ProjectDisplay[] = [
  {
    id: '1',
    name: 'Series A Evaluation Framework',
    description: 'Standard evaluation criteria for Series A investments',
    activeBaselineVersion: 'v1.2.0',
    status: 'active',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-03-10'),
  },
  {
    id: '2',
    name: 'Seed Stage Assessment',
    description: 'Early stage startup evaluation framework',
    activeBaselineVersion: 'v2.0.1',
    status: 'active',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-03-08'),
  },
  {
    id: '3',
    name: 'Growth Equity Criteria',
    description: 'Framework for growth stage investments',
    activeBaselineVersion: 'v1.0.0',
    status: 'draft',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-05'),
  },
];

function getStatusBadgeVariant(status: ProjectStatus) {
  switch (status) {
    case 'active':
      return 'default';
    case 'draft':
      return 'secondary';
    case 'archived':
      return 'outline';
    default:
      return 'secondary';
  }
}

export default function ProjectsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [projects] = useState<ProjectDisplay[]>(MOCK_PROJECTS);

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProjectClick = (project: ProjectDisplay) => {
    router.push(`/projects/${project.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage evaluation frameworks and baselines
          </p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          New Project
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Projects Table */}
      <div className="border rounded-lg bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2">
                Project
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 w-28">
                Baseline
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 w-24">
                Status
              </th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2 w-32">
                Updated
              </th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-2 w-10">
                {/* Actions */}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map((project) => (
              <tr
                key={project.id}
                onClick={() => handleProjectClick(project)}
                className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
              >
                <td className="px-4 py-2">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FolderOpen className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {project.name}
                      </div>
                      {project.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {project.description}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <GitBranch className="h-3 w-3" />
                    <span className="font-mono">
                      {project.activeBaselineVersion || '—'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <Badge
                    variant={getStatusBadgeVariant(project.status)}
                    className="text-xs capitalize"
                  >
                    {project.status}
                  </Badge>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {project.updatedAt.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Show menu
                    }}
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredProjects.length === 0 && (
          <div className="py-12 text-center">
            <FolderOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No projects found</p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <FolderOpen className="h-4 w-4" />
            <span className="text-xs font-medium">Active Projects</span>
          </div>
          <div className="text-2xl font-semibold">
            {projects.filter((p) => p.status === 'active').length}
          </div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Briefcase className="h-4 w-4" />
            <span className="text-xs font-medium">Total Cases</span>
          </div>
          <div className="text-2xl font-semibold">24</div>
        </div>
        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <FileText className="h-4 w-4" />
            <span className="text-xs font-medium">Decisions This Month</span>
          </div>
          <div className="text-2xl font-semibold">8</div>
        </div>
      </div>
    </div>
  );
}
