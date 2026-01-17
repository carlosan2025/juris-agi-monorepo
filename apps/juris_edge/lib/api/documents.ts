/**
 * Document Management API Client
 * Connects to the Evidence API for document operations
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

// =============================================================================
// Types
// =============================================================================

export interface DocumentVersion {
  id: string;
  version_number: number;
  file_size: number;
  file_hash: string;
  storage_path: string;
  upload_status: 'pending' | 'uploaded' | 'failed';
  extraction_status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_status: 'pending' | 'uploaded' | 'processing' | 'completed' | 'failed';
  extracted_text?: string;
  page_count?: number;
  metadata_?: Record<string, unknown>;
  created_at: string;
  extracted_at?: string;
}

export interface Document {
  id: string;
  filename: string;
  original_filename: string;
  content_type: string;
  profile_code: 'general' | 'vc' | 'pharma' | 'insurance';
  metadata_?: Record<string, unknown>;
  deletion_status: 'active' | 'marked_for_deletion' | 'deleting_resources' | 'deleted' | 'deletion_failed';
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  versions: DocumentVersion[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface DocumentUploadResponse {
  document_id: string;
  version_id: string;
  job_id: string;
  message: string;
}

export interface PresignedUploadResponse {
  upload_url: string;
  document_id: string;
  version_id: string;
  key: string;
  content_type: string;
  expires_in: number;
  message: string;
}

export interface DocumentStats {
  document_id: string;
  version_id: string;
  filename: string;
  extraction_status: string;
  extracted_at?: string;
  text_length: number;
  page_count?: number;
  spans: {
    total: number;
    by_type: Record<string, number>;
  };
  embeddings: {
    total: number;
    model: string;
    dimensions: number;
    chunk_size: number;
    chunk_overlap: number;
  };
  metadata?: Record<string, unknown>;
  version_metadata?: Record<string, unknown>;
}

export interface QualityAnalysis {
  document_id: string;
  version_id?: string;
  analysis_timestamp: string;
  summary: {
    total_issues: number;
    metric_conflicts: number;
    claim_conflicts: number;
    open_questions: number;
  };
  metric_conflicts: Array<{
    metric_name: string;
    conflicting_values: Array<{ value: unknown; source: string }>;
    suggested_resolution?: string;
  }>;
  claim_conflicts: Array<{
    claim_field: string;
    conflicting_values: Array<{ value: unknown; source: string }>;
  }>;
  open_questions: Array<{
    type: string;
    description: string;
    affected_claims: string[];
  }>;
}

// =============================================================================
// Error Handling
// =============================================================================

export class DocumentAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'DocumentAPIError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new DocumentAPIError(
      error.detail || error.message || `Request failed with status ${response.status}`,
      response.status,
      error
    );
  }
  return response.json();
}

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (API_KEY) {
    headers['x-api-key'] = API_KEY;
  }
  return headers;
}

// =============================================================================
// Document CRUD Operations
// =============================================================================

/**
 * List all documents with pagination
 */
export async function listDocuments(options: {
  page?: number;
  pageSize?: number;
  includeDeleted?: boolean;
  includeDeleting?: boolean;
} = {}): Promise<PaginatedResponse<Document>> {
  const params = new URLSearchParams();
  if (options.page) params.set('page', options.page.toString());
  if (options.pageSize) params.set('page_size', options.pageSize.toString());
  if (options.includeDeleted) params.set('include_deleted', 'true');
  if (options.includeDeleting) params.set('include_deleting', 'true');

  const response = await fetch(
    `${API_BASE}/api/v1/documents?${params.toString()}`,
    { headers: getHeaders() }
  );
  return handleResponse(response);
}

/**
 * Get a single document by ID
 */
export async function getDocument(documentId: string): Promise<Document> {
  const response = await fetch(
    `${API_BASE}/api/v1/documents/${documentId}`,
    { headers: getHeaders() }
  );
  return handleResponse(response);
}

/**
 * Upload a new document (direct upload)
 */
export async function uploadDocument(
  file: File,
  profileCode: 'general' | 'vc' | 'pharma' | 'insurance' = 'general'
): Promise<DocumentUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('profile_code', profileCode);

  const headers: HeadersInit = {};
  if (API_KEY) {
    headers['x-api-key'] = API_KEY;
  }

  const response = await fetch(`${API_BASE}/api/v1/documents`, {
    method: 'POST',
    headers,
    body: formData,
  });
  return handleResponse(response);
}

/**
 * Get presigned URL for large file upload
 */
export async function getPresignedUploadUrl(options: {
  filename: string;
  contentType: string;
  fileSize: number;
  profileCode?: 'general' | 'vc' | 'pharma' | 'insurance';
}): Promise<PresignedUploadResponse> {
  const response = await fetch(`${API_BASE}/api/v1/documents/presigned-upload`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      filename: options.filename,
      content_type: options.contentType,
      file_size: options.fileSize,
      profile_code: options.profileCode || 'general',
    }),
  });
  return handleResponse(response);
}

/**
 * Confirm presigned upload completed
 */
export async function confirmPresignedUpload(
  documentId: string,
  versionId: string
): Promise<{ document_id: string; version_id: string; job_id: string | null; message: string }> {
  const response = await fetch(`${API_BASE}/api/v1/documents/confirm-upload`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      document_id: documentId,
      version_id: versionId,
    }),
  });
  return handleResponse(response);
}

/**
 * Upload a new version of an existing document
 */
export async function uploadDocumentVersion(
  documentId: string,
  file: File
): Promise<{ document_id: string; version_id: string; version_number: number; job_id: string; message: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const headers: HeadersInit = {};
  if (API_KEY) {
    headers['x-api-key'] = API_KEY;
  }

  const response = await fetch(`${API_BASE}/api/v1/documents/${documentId}/versions`, {
    method: 'POST',
    headers,
    body: formData,
  });
  return handleResponse(response);
}

/**
 * Delete a document
 */
export async function deleteDocument(documentId: string): Promise<{
  status: string;
  document_id: string;
  filename: string;
  task_count: number;
  message: string;
}> {
  const response = await fetch(`${API_BASE}/api/v1/documents/${documentId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleResponse(response);
}

/**
 * Retry document processing
 */
export async function retryDocumentProcessing(
  documentId: string,
  force: boolean = false
): Promise<{ success: boolean; document_id: string; version_id: string; filename: string; message: string }> {
  const params = new URLSearchParams();
  if (force) params.set('force', 'true');

  const response = await fetch(
    `${API_BASE}/api/v1/documents/${documentId}/retry?${params.toString()}`,
    {
      method: 'POST',
      headers: getHeaders(),
    }
  );
  return handleResponse(response);
}

// =============================================================================
// Document Download
// =============================================================================

/**
 * Download the latest version of a document
 */
export async function downloadDocument(documentId: string): Promise<Blob> {
  const response = await fetch(
    `${API_BASE}/api/v1/documents/${documentId}/download`,
    { headers: getHeaders() }
  );

  if (!response.ok) {
    throw new DocumentAPIError(
      `Failed to download document`,
      response.status
    );
  }

  return response.blob();
}

/**
 * Download a specific version of a document
 */
export async function downloadDocumentVersion(
  documentId: string,
  versionId: string
): Promise<Blob> {
  const response = await fetch(
    `${API_BASE}/api/v1/documents/${documentId}/versions/${versionId}/download`,
    { headers: getHeaders() }
  );

  if (!response.ok) {
    throw new DocumentAPIError(
      `Failed to download document version`,
      response.status
    );
  }

  return response.blob();
}

// =============================================================================
// Document Analysis
// =============================================================================

/**
 * Get document statistics (spans, embeddings, etc.)
 */
export async function getDocumentStats(documentId: string): Promise<DocumentStats> {
  const response = await fetch(
    `${API_BASE}/api/v1/documents/${documentId}/stats`,
    { headers: getHeaders() }
  );
  return handleResponse(response);
}

/**
 * Analyze document quality (conflicts, open questions)
 */
export async function analyzeDocumentQuality(
  documentId: string,
  options: {
    versionId?: string;
    profileId?: string;
    levelId?: string;
  } = {}
): Promise<QualityAnalysis> {
  const params = new URLSearchParams();
  if (options.versionId) params.set('version_id', options.versionId);
  if (options.profileId) params.set('profile_id', options.profileId);
  if (options.levelId) params.set('level_id', options.levelId);

  const response = await fetch(
    `${API_BASE}/api/v1/documents/${documentId}/quality?${params.toString()}`,
    { headers: getHeaders() }
  );
  return handleResponse(response);
}

/**
 * Trigger extraction for a document
 */
export async function triggerExtraction(
  documentId: string,
  versionId?: string
): Promise<{ document_id: string; version_id: string; status: string; message: string }> {
  const params = new URLSearchParams();
  if (versionId) params.set('version_id', versionId);

  const response = await fetch(
    `${API_BASE}/api/v1/documents/${documentId}/extract?${params.toString()}`,
    {
      method: 'POST',
      headers: getHeaders(),
    }
  );
  return handleResponse(response);
}

// =============================================================================
// Document Content
// =============================================================================

/**
 * List document spans (text chunks)
 */
export async function listDocumentSpans(
  documentId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<{
  items: Array<{
    id: string;
    span_type: string;
    text_content: string;
    text_length: number;
    start_locator?: string;
    end_locator?: string;
    metadata?: Record<string, unknown>;
    created_at?: string;
  }>;
  total: number;
  limit: number;
  offset: number;
}> {
  const params = new URLSearchParams();
  if (options.limit) params.set('limit', options.limit.toString());
  if (options.offset) params.set('offset', options.offset.toString());

  const response = await fetch(
    `${API_BASE}/api/v1/documents/${documentId}/spans?${params.toString()}`,
    { headers: getHeaders() }
  );
  return handleResponse(response);
}

/**
 * List document embeddings
 */
export async function listDocumentEmbeddings(
  documentId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<{
  items: Array<{
    id: string;
    chunk_index: number;
    text: string;
    text_length: number;
    char_start: number;
    char_end: number;
    metadata?: Record<string, unknown>;
    created_at?: string;
  }>;
  total: number;
  limit: number;
  offset: number;
  model: string;
  dimensions: number;
}> {
  const params = new URLSearchParams();
  if (options.limit) params.set('limit', options.limit.toString());
  if (options.offset) params.set('offset', options.offset.toString());

  const response = await fetch(
    `${API_BASE}/api/v1/documents/${documentId}/embeddings?${params.toString()}`,
    { headers: getHeaders() }
  );
  return handleResponse(response);
}

// =============================================================================
// Deletion Status
// =============================================================================

/**
 * Get deletion status for a document
 */
export async function getDeletionStatus(documentId: string): Promise<{
  document_id: string;
  filename: string;
  deletion_status: string;
  task_summary: {
    total: number;
    completed: number;
    pending: number;
    failed: number;
  };
  tasks: Array<{
    id: string;
    resource_type: string;
    status: string;
    error?: string;
    retry_count: number;
    created_at: string;
    completed_at?: string;
  }>;
}> {
  const response = await fetch(
    `${API_BASE}/api/v1/documents/${documentId}/deletion-status`,
    { headers: getHeaders() }
  );
  return handleResponse(response);
}

/**
 * Retry failed deletion
 */
export async function retryDeletion(documentId: string): Promise<{
  success: boolean;
  document_id: string;
  message: string;
  tasks_reset: number;
}> {
  const response = await fetch(
    `${API_BASE}/api/v1/documents/${documentId}/retry-deletion`,
    {
      method: 'POST',
      headers: getHeaders(),
    }
  );
  return handleResponse(response);
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Upload document with progress tracking (uses presigned URLs for large files)
 */
export async function uploadDocumentWithProgress(
  file: File,
  profileCode: 'general' | 'vc' | 'pharma' | 'insurance' = 'general',
  onProgress?: (progress: number) => void
): Promise<DocumentUploadResponse> {
  const PRESIGNED_THRESHOLD = 4 * 1024 * 1024; // 4MB - use presigned for larger files

  if (file.size <= PRESIGNED_THRESHOLD) {
    // Direct upload for small files
    return uploadDocument(file, profileCode);
  }

  // Use presigned upload for large files
  // 1. Get presigned URL
  const presigned = await getPresignedUploadUrl({
    filename: file.name,
    contentType: file.type || 'application/octet-stream',
    fileSize: file.size,
    profileCode,
  });

  // 2. Upload directly to storage
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new DocumentAPIError(`Upload failed`, xhr.status));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new DocumentAPIError('Upload failed', 0));
    });

    xhr.open('PUT', presigned.upload_url);
    xhr.setRequestHeader('Content-Type', presigned.content_type);
    xhr.send(file);
  });

  // 3. Confirm upload
  const confirmation = await confirmPresignedUpload(
    presigned.document_id,
    presigned.version_id
  );

  return {
    document_id: confirmation.document_id,
    version_id: confirmation.version_id,
    job_id: confirmation.job_id || '',
    message: confirmation.message,
  };
}

/**
 * Poll for document processing completion
 */
export async function pollDocumentProcessing(
  documentId: string,
  options: {
    maxAttempts?: number;
    intervalMs?: number;
    onProgress?: (status: string) => void;
  } = {}
): Promise<Document> {
  const { maxAttempts = 60, intervalMs = 2000, onProgress } = options;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const doc = await getDocument(documentId);
    const latestVersion = doc.versions[0];

    if (latestVersion) {
      onProgress?.(latestVersion.extraction_status);

      if (
        latestVersion.extraction_status === 'completed' ||
        latestVersion.extraction_status === 'failed'
      ) {
        return doc;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new DocumentAPIError('Document processing timed out', 408);
}
