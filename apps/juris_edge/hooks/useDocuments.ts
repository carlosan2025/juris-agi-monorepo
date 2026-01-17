'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  listDocuments,
  getDocument,
  uploadDocumentWithProgress,
  deleteDocument,
  getDocumentStats,
  type Document,
  type PaginatedResponse,
  type DocumentStats,
  DocumentAPIError,
} from '@/lib/api/documents';
import type { EnhancedDocument, DocumentTrustLevel } from '@/types/domain';

interface UseDocumentsOptions {
  page?: number;
  pageSize?: number;
  autoFetch?: boolean;
}

interface UseDocumentsResult {
  documents: EnhancedDocument[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  refetch: () => Promise<void>;
  uploadDocument: (file: File, profileCode?: 'general' | 'vc' | 'pharma' | 'insurance', onProgress?: (progress: number) => void) => Promise<void>;
  removeDocument: (documentId: string) => Promise<void>;
  isApiAvailable: boolean;
}

// Transform API Document to EnhancedDocument for UI
function transformDocument(doc: Document): EnhancedDocument {
  const latestVersion = doc.versions[0];

  // Determine trust level based on metadata
  let trustLevel: DocumentTrustLevel = 'unverified';
  if (doc.metadata_?.verified) {
    trustLevel = 'verified';
  } else if (doc.metadata_?.disputed) {
    trustLevel = 'disputed';
  }

  // Determine status from extraction status
  let status: 'uploaded' | 'processing' | 'ready' | 'failed' = 'uploaded';
  if (latestVersion) {
    if (latestVersion.extraction_status === 'completed') {
      status = 'ready';
    } else if (latestVersion.extraction_status === 'processing') {
      status = 'processing';
    } else if (latestVersion.extraction_status === 'failed') {
      status = 'failed';
    }
  }

  return {
    id: doc.id,
    organizationId: 'org-1', // backend_pending: Get from actual org context
    workspaceId: null,
    filename: doc.original_filename || doc.filename,
    type: doc.profile_code === 'vc' ? 'pitch_deck' : 'tech_description',
    status,
    trustLevel,
    provenance: {
      source: doc.metadata_?.source as string || 'Direct Upload',
      sourceUrl: doc.metadata_?.source_url as string || null,
      retrievedAt: doc.metadata_?.retrieved_at ? new Date(doc.metadata_.retrieved_at as string) : null,
      verifiedBy: doc.metadata_?.verified_by as string || null,
      verifiedAt: doc.metadata_?.verified_at ? new Date(doc.metadata_.verified_at as string) : null,
    },
    metadata: {
      pageCount: latestVersion?.page_count,
      fileSize: latestVersion?.file_size,
      extractedAt: latestVersion?.extracted_at ? new Date(latestVersion.extracted_at) : undefined,
    },
    assignedMandates: doc.metadata_?.assigned_projects as string[] || [],
    assignedCases: doc.metadata_?.assigned_cases as string[] || [],
    tags: doc.metadata_?.tags as string[] || [],
    version: latestVersion?.version_number || 1,
    previousVersionId: doc.versions[1]?.id || null,
    uploadedBy: doc.metadata_?.uploaded_by as string || 'unknown',
    uploadedAt: new Date(doc.created_at),
    processedAt: latestVersion?.extracted_at ? new Date(latestVersion.extracted_at) : null,
  };
}

// Mock data fallback when API is not available
const MOCK_DOCUMENTS: EnhancedDocument[] = [
  {
    id: 'doc-1',
    organizationId: 'org-1',
    workspaceId: 'ws-1',
    filename: 'TechCorp_Series_B_Pitch.pdf',
    type: 'pitch_deck',
    status: 'ready',
    trustLevel: 'verified',
    provenance: {
      source: 'Direct Upload',
      sourceUrl: null,
      retrievedAt: null,
      verifiedBy: 'John Smith',
      verifiedAt: new Date('2024-01-15'),
    },
    metadata: { pageCount: 24, fileSize: 2400000 },
    assignedMandates: ['proj-1'],
    assignedCases: ['case-1'],
    tags: ['series-b', 'saas'],
    version: 1,
    previousVersionId: null,
    uploadedBy: 'user-1',
    uploadedAt: new Date('2024-01-10'),
    processedAt: new Date('2024-01-10'),
  },
  {
    id: 'doc-2',
    organizationId: 'org-1',
    workspaceId: 'ws-1',
    filename: 'HealthTech_Financial_Model_2024.xlsx',
    type: 'financial_model',
    status: 'processing',
    trustLevel: 'unverified',
    provenance: {
      source: 'Email Attachment',
      sourceUrl: null,
      retrievedAt: new Date('2024-01-12'),
      verifiedBy: null,
      verifiedAt: null,
    },
    metadata: { fileSize: 450000 },
    assignedMandates: ['proj-2'],
    assignedCases: [],
    tags: ['financials', 'healthtech'],
    version: 1,
    previousVersionId: null,
    uploadedBy: 'user-2',
    uploadedAt: new Date('2024-01-12'),
    processedAt: null,
  },
  {
    id: 'doc-3',
    organizationId: 'org-1',
    workspaceId: null,
    filename: 'GreenEnergy_IC_Memo_Draft.docx',
    type: 'ic_memo',
    status: 'ready',
    trustLevel: 'verified',
    provenance: {
      source: 'Internal Generation',
      sourceUrl: null,
      retrievedAt: null,
      verifiedBy: 'Sarah Chen',
      verifiedAt: new Date('2024-01-14'),
    },
    metadata: { pageCount: 8, fileSize: 180000 },
    assignedMandates: [],
    assignedCases: [],
    tags: ['ic-memo', 'cleantech'],
    version: 2,
    previousVersionId: 'doc-3-v1',
    uploadedBy: 'user-1',
    uploadedAt: new Date('2024-01-14'),
    processedAt: new Date('2024-01-14'),
  },
];

export function useDocuments(options: UseDocumentsOptions = {}): UseDocumentsResult {
  const { page = 1, pageSize = 20, autoFetch = true } = options;

  const [documents, setDocuments] = useState<EnhancedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isApiAvailable, setIsApiAvailable] = useState(true);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await listDocuments({ page, pageSize });
      const transformed = response.items.map(transformDocument);
      setDocuments(transformed);
      setTotal(response.total);
      setTotalPages(response.pages);
      setIsApiAvailable(true);
    } catch (err) {
      console.warn('Evidence API not available, using mock data:', err);
      setIsApiAvailable(false);
      // Fall back to mock data
      setDocuments(MOCK_DOCUMENTS);
      setTotal(MOCK_DOCUMENTS.length);
      setTotalPages(1);
      setError(null); // Don't show error, just use mock data
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  const uploadDocument = useCallback(async (
    file: File,
    profileCode: 'general' | 'vc' | 'pharma' | 'insurance' = 'general',
    onProgress?: (progress: number) => void
  ) => {
    if (!isApiAvailable) {
      throw new Error('Document upload is not available in demo mode');
    }

    await uploadDocumentWithProgress(file, profileCode, onProgress);
    await fetchDocuments(); // Refresh the list
  }, [isApiAvailable, fetchDocuments]);

  const removeDocument = useCallback(async (documentId: string) => {
    if (!isApiAvailable) {
      // In demo mode, just remove from local state
      setDocuments(prev => prev.filter(d => d.id !== documentId));
      setTotal(prev => prev - 1);
      return;
    }

    await deleteDocument(documentId);
    await fetchDocuments(); // Refresh the list
  }, [isApiAvailable, fetchDocuments]);

  useEffect(() => {
    if (autoFetch) {
      fetchDocuments();
    }
  }, [autoFetch, fetchDocuments]);

  return {
    documents,
    loading,
    error,
    total,
    page,
    pageSize,
    totalPages,
    refetch: fetchDocuments,
    uploadDocument,
    removeDocument,
    isApiAvailable,
  };
}

// Hook for single document details
export function useDocument(documentId: string | null) {
  const [document, setDocument] = useState<EnhancedDocument | null>(null);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) {
      setDocument(null);
      setStats(null);
      return;
    }

    const fetchDocument = async () => {
      setLoading(true);
      setError(null);

      try {
        const [doc, docStats] = await Promise.all([
          getDocument(documentId),
          getDocumentStats(documentId).catch(() => null),
        ]);

        setDocument(transformDocument(doc));
        setStats(docStats);
      } catch (err) {
        console.error('Failed to fetch document:', err);
        setError(err instanceof DocumentAPIError ? err.message : 'Failed to fetch document');
        // Try to find in mock data
        const mockDoc = MOCK_DOCUMENTS.find(d => d.id === documentId);
        if (mockDoc) {
          setDocument(mockDoc);
          setError(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [documentId]);

  return { document, stats, loading, error };
}
