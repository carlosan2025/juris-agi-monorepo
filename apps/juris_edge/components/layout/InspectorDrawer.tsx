'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { X, Maximize2, Minimize2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Inspector Context
interface InspectorContextType {
  isOpen: boolean;
  content: ReactNode | null;
  title: string;
  subtitle?: string;
  width: 'sm' | 'md' | 'lg' | 'xl';
  inspectorData: InspectorData | null;
  openInspector: (options: OpenInspectorOptions) => void;
  closeInspector: () => void;
}

// Data-driven inspector (for standard entity types)
interface InspectorData {
  type: 'document' | 'case' | 'claim' | 'project' | 'portfolio' | 'custom';
  id: string;
  title: string;
  data: unknown;
}

interface OpenInspectorOptions {
  title: string;
  subtitle?: string;
  content?: ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl';
  // Data-driven options
  type?: InspectorData['type'];
  id?: string;
  data?: unknown;
}

const InspectorContext = createContext<InspectorContextType | undefined>(undefined);

export function useInspector() {
  const context = useContext(InspectorContext);
  if (!context) {
    throw new Error('useInspector must be used within an InspectorProvider');
  }
  return context;
}

export function InspectorProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<ReactNode | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState<string | undefined>();
  const [width, setWidth] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const [inspectorData, setInspectorData] = useState<InspectorData | null>(null);

  const openInspector = ({ title, subtitle, content, width = 'md', type, id, data }: OpenInspectorOptions) => {
    setTitle(title);
    setSubtitle(subtitle);
    setContent(content || null);
    setWidth(width);

    // Set data-driven inspector data if provided
    if (type && id) {
      setInspectorData({ type, id, title, data });
    } else {
      setInspectorData(null);
    }

    setIsOpen(true);
  };

  const closeInspector = () => {
    setIsOpen(false);
    // Delay clearing content to allow animation
    setTimeout(() => {
      setContent(null);
      setTitle('');
      setSubtitle(undefined);
      setInspectorData(null);
    }, 300);
  };

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeInspector();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <InspectorContext.Provider
      value={{ isOpen, content, title, subtitle, width, inspectorData, openInspector, closeInspector }}
    >
      {children}
    </InspectorContext.Provider>
  );
}

const WIDTH_CLASSES = {
  sm: 'w-[320px]',
  md: 'w-[480px]',
  lg: 'w-[640px]',
  xl: 'w-[800px]',
};

export function InspectorDrawer() {
  const { isOpen, content, title, subtitle, width, inspectorData, closeInspector } = useInspector();
  const [isExpanded, setIsExpanded] = useState(false);

  // Render content based on type or custom content
  const renderContent = () => {
    if (content) {
      return content;
    }

    if (inspectorData) {
      switch (inspectorData.type) {
        case 'document':
          return <DocumentInspectorContent data={inspectorData.data} />;
        case 'case':
          return <CaseInspectorContent data={inspectorData.data} />;
        case 'claim':
          return <ClaimInspectorContent data={inspectorData.data} />;
        default:
          return <div className="p-4 text-muted-foreground">No content available</div>;
      }
    }

    return null;
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={closeInspector}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full bg-background border-l shadow-xl z-50 transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${isExpanded ? 'w-[90vw]' : WIDTH_CLASSES[width]}`}
      >
        {/* Header */}
        <div className="h-12 border-b flex items-center justify-between px-4">
          <div className="min-w-0 flex-1">
            <h2 className="font-medium text-sm truncate">{title}</h2>
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={closeInspector}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-48px)] overflow-y-auto">{renderContent()}</div>
      </div>
    </>
  );
}

// ========================================
// Document Inspector Content
// ========================================
import {
  FileText,
  Calendar,
  User,
  Tag,
  Shield,
  ShieldQuestion,
  ShieldAlert,
  Download,
  Trash2,
  FolderOpen,
  Link2,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

function DocumentInspectorContent({ data }: { data: unknown }) {
  const doc = data as {
    id: string;
    filename: string;
    type: string;
    status: string;
    trustLevel: string;
    provenance: {
      source: string;
      sourceUrl: string | null;
      retrievedAt: Date | null;
      verifiedBy: string | null;
      verifiedAt: Date | null;
    };
    metadata: { pageCount?: number; fileSize?: number };
    assignedProjects: string[];
    assignedCases: string[];
    tags: string[];
    version: number;
    uploadedBy: string;
    uploadedAt: Date;
    processedAt: Date | null;
  };

  if (!doc) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: Date | null | string): string => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(d);
  };

  const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; color: string }> = {
    uploaded: { label: 'Uploaded', icon: Clock, color: 'text-gray-500' },
    processing: { label: 'Processing', icon: Clock, color: 'text-blue-500' },
    ready: { label: 'Ready', icon: CheckCircle2, color: 'text-green-500' },
    failed: { label: 'Failed', icon: XCircle, color: 'text-red-500' },
  };

  const TRUST_CONFIG: Record<string, { label: string; icon: typeof Shield; color: string; bg: string }> = {
    verified: { label: 'Verified', icon: Shield, color: 'text-green-600', bg: 'bg-green-100' },
    unverified: { label: 'Unverified', icon: ShieldQuestion, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    disputed: { label: 'Disputed', icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-100' },
  };

  const TYPE_LABELS: Record<string, string> = {
    pitch_deck: 'Pitch Deck',
    financial_model: 'Financial Model',
    tech_description: 'Technical Document',
    ic_memo: 'IC Memo',
  };

  const statusConfig = STATUS_CONFIG[doc.status] || STATUS_CONFIG.uploaded;
  const trustConfig = TRUST_CONFIG[doc.trustLevel] || TRUST_CONFIG.unverified;
  const StatusIcon = statusConfig.icon;
  const TrustIcon = trustConfig.icon;

  return (
    <div>
      {/* Actions */}
      <div className="px-4 py-3 border-b flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button variant="outline" size="sm">
          <FolderOpen className="h-4 w-4 mr-2" />
          Assign
        </Button>
        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>

      {/* Status Banner */}
      <div className={`px-4 py-3 ${trustConfig.bg} border-b`}>
        <div className="flex items-center gap-2">
          <TrustIcon className={`h-5 w-5 ${trustConfig.color}`} />
          <span className={`font-medium ${trustConfig.color}`}>{trustConfig.label}</span>
          {doc.provenance.verifiedBy && (
            <span className="text-sm text-muted-foreground">
              by {doc.provenance.verifiedBy}
            </span>
          )}
        </div>
      </div>

      <InspectorSection title="Document Info">
        <InspectorField label="Filename" value={doc.filename} />
        <InspectorField
          label="Type"
          value={<Badge variant="outline">{TYPE_LABELS[doc.type] || doc.type}</Badge>}
        />
        <InspectorField
          label="Status"
          value={
            <div className="flex items-center gap-2">
              <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
              <span>{statusConfig.label}</span>
            </div>
          }
        />
        <InspectorField label="Version" value={`v${doc.version}`} />
        <InspectorField
          label="Size"
          value={formatFileSize(doc.metadata.fileSize || 0)}
        />
        {doc.metadata.pageCount && (
          <InspectorField label="Pages" value={doc.metadata.pageCount.toString()} />
        )}
      </InspectorSection>

      <InspectorSection title="Provenance">
        <InspectorField label="Source" value={doc.provenance.source} />
        {doc.provenance.sourceUrl && (
          <InspectorField
            label="Source URL"
            value={
              <a
                href={doc.provenance.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                {doc.provenance.sourceUrl}
                <Link2 className="h-3 w-3" />
              </a>
            }
          />
        )}
        {doc.provenance.verifiedBy && (
          <InspectorField label="Verified By" value={doc.provenance.verifiedBy} />
        )}
        {doc.provenance.verifiedAt && (
          <InspectorField
            label="Verified At"
            value={formatDate(doc.provenance.verifiedAt)}
          />
        )}
      </InspectorSection>

      <InspectorSection title="Assignments">
        <InspectorField
          label="Projects"
          value={
            doc.assignedProjects.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {doc.assignedProjects.map((p) => (
                  <Badge key={p} variant="secondary">
                    {p}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground">No projects assigned</span>
            )
          }
        />
        <InspectorField
          label="Cases"
          value={
            doc.assignedCases.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {doc.assignedCases.map((c) => (
                  <Badge key={c} variant="secondary">
                    {c}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground">No cases assigned</span>
            )
          }
        />
      </InspectorSection>

      <InspectorSection title="Tags">
        {doc.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {doc.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No tags</p>
        )}
      </InspectorSection>

      <InspectorSection title="Timeline">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center mt-0.5">
              <User className="h-3 w-3" />
            </div>
            <div>
              <p className="text-sm">Uploaded by {doc.uploadedBy}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(doc.uploadedAt)}
              </p>
            </div>
          </div>
          {doc.processedAt && (
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
              </div>
              <div>
                <p className="text-sm">Processing completed</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(doc.processedAt)}
                </p>
              </div>
            </div>
          )}
        </div>
      </InspectorSection>
    </div>
  );
}

// ========================================
// Case Inspector Content (placeholder)
// ========================================
function CaseInspectorContent({ data }: { data: unknown }) {
  return (
    <div className="p-4">
      <p className="text-muted-foreground">Case details coming soon...</p>
      <pre className="mt-4 text-xs bg-muted p-2 rounded overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

// ========================================
// Claim Inspector Content (placeholder)
// ========================================
function ClaimInspectorContent({ data }: { data: unknown }) {
  return (
    <div className="p-4">
      <p className="text-muted-foreground">Claim details coming soon...</p>
      <pre className="mt-4 text-xs bg-muted p-2 rounded overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

// Pre-built inspector content components
export function InspectorSection({
  title,
  children,
  collapsible = false,
}: {
  title: string;
  children: ReactNode;
  collapsible?: boolean;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="border-b last:border-0">
      <button
        className={`w-full px-4 py-3 flex items-center justify-between text-left ${
          collapsible ? 'hover:bg-muted/50 cursor-pointer' : ''
        }`}
        onClick={() => collapsible && setIsCollapsed(!isCollapsed)}
        disabled={!collapsible}
      >
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </span>
        {collapsible && (
          <span className="text-xs text-muted-foreground">{isCollapsed ? '+' : '-'}</span>
        )}
      </button>
      {!isCollapsed && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export function InspectorField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="py-1.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-sm ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}

export function InspectorLink({
  label,
  href,
  external = false,
}: {
  label: string;
  href: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="flex items-center gap-1 text-sm text-primary hover:underline"
    >
      {label}
      {external && <ExternalLink className="h-3 w-3" />}
    </a>
  );
}
