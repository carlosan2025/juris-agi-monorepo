# Third-Party Services Architecture

## Overview

Juris AGI requires a clear separation of third-party services across three levels:

1. **Platform Level** - Juris AGI's own default services (managed in `/administration`)
2. **Tenant Level** - Company-specific services including Evidence App (managed in `/company/settings`)
3. **Shared Evidence Repository** - Shared legal knowledge base only (managed from Juris Admin)

### Key Insight: Evidence Services are Tenant-Level

Each company's Evidence App services (AI, document processing, storage, vector DB) are **tenant-specific** because:
- Companies have their own documents and evidence graphs
- Data sovereignty requirements (documents may need specific regions)
- Cost control (companies may want their own AI/storage quotas)
- Customization (different OCR languages, embedding models, etc.)

Only the **shared legal knowledge base** (case law, regulations) is truly platform-level.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           JURIS AGI PLATFORM                                 │
│                    (Managed in /administration)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  DEFAULT SERVICES (Used when tenant has no override)                         │
│                                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │   AI SERVICES       │  │   EMAIL SERVICES    │  │  PAYMENT SERVICES   │  │
│  │   (Platform Keys)   │  │   (Platform Keys)   │  │  (Platform Only)    │  │
│  ├─────────────────────┤  ├─────────────────────┤  ├─────────────────────┤  │
│  │ • OpenAI (default)  │  │ • Gmail SMTP        │  │ • Stripe            │  │
│  │ • Anthropic         │  │ • SendGrid          │  │                     │  │
│  │ • Azure OpenAI      │  │ • AWS SES           │  │                     │  │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │            SHARED LEGAL KNOWLEDGE BASE (Platform-Level)                  ││
│  │              (Managed from /administration/evidence)                     ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │  This is the ONLY Evidence service that is platform-wide:                ││
│  │  • Case law database (shared across all tenants)                         ││
│  │  • Regulatory guidance library                                           ││
│  │  • Legal precedent repository                                            ││
│  │  • NOT tenant documents - those are tenant-level                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         TENANT (COMPANY) LEVEL                               │
│                   (Managed in /company/settings)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  ALL TENANT-SPECIFIC SERVICES (including Evidence for their documents)       │
│                                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │   AI SERVICES       │  │   EMAIL SERVICES    │  │  DOCUMENT STORAGE   │  │
│  │  (Cases + Evidence) │  │   (Notifications)   │  │   (Case Documents)  │  │
│  ├─────────────────────┤  ├─────────────────────┤  ├─────────────────────┤  │
│  │ • OpenAI            │  │ • SMTP              │  │ • S3 bucket         │  │
│  │ • Anthropic         │  │ • SendGrid          │  │ • Cloudflare R2     │  │
│  │ • Azure OpenAI      │  │ • AWS SES           │  │ • GCS               │  │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │               TENANT EVIDENCE SERVICES (Company's Documents)             ││
│  │    (Managed in /company/settings/evidence - SENSITIVE DATA)              ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │                                                                          ││
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          ││
│  │  │ EVIDENCE AI     │  │ DOCUMENT PROC.  │  │ EVIDENCE STORAGE│          ││
│  │  │ (Embeddings)    │  │ (PDF/OCR)       │  │ (Tenant Docs)   │          ││
│  │  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤          ││
│  │  │ • OpenAI        │  │ • iLovePDF      │  │ • Cloudflare R2 │          ││
│  │  │ • Cohere        │  │ • Adobe PDF     │  │ • AWS S3        │          ││
│  │  │ • Voyage        │  │ • Tesseract     │  │ • Azure Blob    │          ││
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘          ││
│  │                                                                          ││
│  │  ┌─────────────────┐  ┌─────────────────┐                               ││
│  │  │ VECTOR DB       │  │ EVIDENCE DB     │                               ││
│  │  │ (Embeddings)    │  │ (Tenant Schema) │                               ││
│  │  ├─────────────────┤  ├─────────────────┤                               ││
│  │  │ • Pinecone      │  │ • PostgreSQL    │                               ││
│  │  │ • Weaviate      │  │ • Neon          │                               ││
│  │  │ • pgvector      │  │ • Supabase      │                               ││
│  │  └─────────────────┘  └─────────────────┘                               ││
│  │                                                                          ││
│  │  ⚠️  ALL TENANT DOCUMENTS ARE STORED HERE - NEVER ON PLATFORM           ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  FALLBACK: If tenant has no config → Use Platform defaults                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Why Evidence Services Must Be Tenant-Level

| Concern | Why Tenant-Level |
|---------|------------------|
| **Data Sensitivity** | VC deal memos, insurance claims, clinical trial data - all highly confidential |
| **Data Sovereignty** | EU companies may need GDPR-compliant storage in EU regions |
| **Cost Control** | Companies pay for their own AI tokens and storage |
| **Isolation** | One tenant's documents should never be accessible to another |
| **Audit Trail** | Compliance requires knowing exactly where data is stored |
| **Customization** | Different industries need different OCR, embedding models |

### Critical: No Platform Fallback for Evidence Services

**Evidence App services have NO platform fallback.** This is intentional:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SERVICE RESOLUTION RULES                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  GENERAL SERVICES (AI, Email, Storage for Cases):                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Tenant Config exists? ──YES──► Use Tenant Config                       ││
│  │         │                                                                ││
│  │        NO                                                                ││
│  │         │                                                                ││
│  │         └──────────────────────► Use Platform Default                   ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  EVIDENCE SERVICES (Document Processing, Vector DB, Evidence Storage):       │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Tenant Config exists? ──YES──► Use Tenant Config                       ││
│  │         │                                                                ││
│  │        NO                                                                ││
│  │         │                                                                ││
│  │         └──────────────────────► ❌ ERROR: Evidence services not        ││
│  │                                     configured. Company must set up     ││
│  │                                     Evidence services before use.       ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  WHY NO FALLBACK FOR EVIDENCE:                                               │
│  • Tenant documents must NEVER touch platform infrastructure                 │
│  • Company is fully responsible for their document storage                   │
│  • Clear audit trail: documents only touch tenant's own services            │
│  • Compliance: no accidental data mixing between tenants                    │
│  • Forces explicit setup before Evidence App can be used                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Infrastructure Evolution: Multi-Tenant to Dedicated

Companies can start with **shared infrastructure** (cost-effective) and later **migrate to dedicated infrastructure** (full isolation):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE EVOLUTION PATH                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STAGE 1: MULTI-TENANT (Default for new companies)                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  • Company uses Juris AGI's shared infrastructure                       ││
│  │  • Data isolation via tenant_id on all records                          ││
│  │  • Shared PostgreSQL with row-level security                            ││
│  │  • Shared S3 bucket with tenant prefixes                                ││
│  │  • Shared vector index with tenant namespaces                           ││
│  │  • Cost: Included in subscription                                       ││
│  │  • Best for: Startups, small teams, trial period                        ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                               │                                              │
│                               ▼                                              │
│  STAGE 2: HYBRID (Partial migration)                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  • Company provides their own storage (S3/R2)                           ││
│  │  • Still uses shared DB and vector index                                ││
│  │  • Documents stored in company's bucket                                 ││
│  │  • Metadata in shared DB (references external storage)                  ││
│  │  • Cost: Company pays for storage                                       ││
│  │  • Best for: Data sovereignty requirements                              ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                               │                                              │
│                               ▼                                              │
│  STAGE 3: DEDICATED (Full isolation)                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  • Company provides ALL their own infrastructure:                       ││
│  │    - Own PostgreSQL database                                            ││
│  │    - Own S3/R2/GCS bucket                                               ││
│  │    - Own Pinecone/Weaviate index                                        ││
│  │    - Own AI provider keys                                               ││
│  │  • Complete data isolation                                              ││
│  │  • Can be hosted in company's cloud account                             ││
│  │  • Cost: Company pays for all infrastructure                            ││
│  │  • Best for: Enterprise, compliance-heavy industries                    ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Migration Support

The system supports **gradual migration** from multi-tenant to dedicated:

```typescript
// Tenant infrastructure mode
enum InfrastructureMode {
  MULTI_TENANT = 'multi_tenant',   // Uses Juris AGI shared infra
  HYBRID = 'hybrid',               // Mix of shared and dedicated
  DEDICATED = 'dedicated',         // All tenant-owned infrastructure
}

// Migration steps tracked per service
interface TenantInfrastructure {
  mode: InfrastructureMode;
  services: {
    database: 'shared' | 'dedicated';
    storage: 'shared' | 'dedicated';
    vectorDb: 'shared' | 'dedicated';
    ai: 'platform' | 'tenant';
    email: 'platform' | 'tenant';
  };
  migrationStatus?: {
    inProgress: boolean;
    currentStep: string;
    startedAt: Date;
    estimatedCompletion: Date;
  };
}
```

### Data Migration Process

When a tenant migrates to dedicated infrastructure:

1. **Pre-Migration**
   - Tenant sets up their own S3 bucket / DB / vector index
   - Configures credentials in Company Settings
   - System validates connectivity

2. **Migration**
   - Documents copied to tenant's storage
   - Database records exported and imported
   - Vector embeddings migrated to tenant's index
   - All operations logged for audit

3. **Cutover**
   - Traffic switched to new infrastructure
   - Old data marked for deletion
   - Retention period before final cleanup

4. **Post-Migration**
   - Shared data purged after retention period
   - Tenant fully on dedicated infrastructure
   - No fallback to shared systems

### UI: Company Settings → Infrastructure

```
/company/settings/infrastructure
├── Current Mode: [Multi-Tenant / Hybrid / Dedicated]
├── Services Status:
│   ├── Database: Shared (Juris AGI) ──── [Migrate to Dedicated]
│   ├── Storage: Shared (Juris AGI) ──── [Migrate to Dedicated]
│   ├── Vector DB: Shared (Juris AGI) ── [Migrate to Dedicated]
│   ├── AI Provider: Platform Default ── [Use Own Keys]
│   └── Email: Platform Default ──────── [Use Own SMTP]
└── Migration Wizard [Start Migration →]
```

---

## Service Categories

### 1. Platform-Only Services

These are managed ONLY by Juris Admin and cannot be overridden by tenants:

| Service | Purpose | Provider Options | Location |
|---------|---------|------------------|----------|
| **Billing** | Subscription management | Stripe | `/administration/billing` |
| **Tenant Provisioning** | Database creation | Internal | `/administration/tenants` |
| **Platform Analytics** | Usage tracking | Internal + Mixpanel | `/administration/analytics` |
| **Admin Authentication** | Juris Admin login | Internal | `/administration/login` |

### 2. Platform + Tenant Override Services

Juris AGI provides default keys; tenants CAN provide their own:

| Service | Purpose | Platform Default | Tenant Override | Fallback |
|---------|---------|------------------|-----------------|----------|
| **AI (LLM)** | Document analysis, reasoning | OpenAI (Juris key) | Tenant's OpenAI/Anthropic | Platform |
| **Email** | Invitations, notifications | Gmail SMTP | Tenant's SMTP/SendGrid | Platform |
| **Document Storage** | Case documents | S3 (Juris bucket) | Tenant's S3/GCS | Platform |

**Why tenants might want their own:**
- **AI**: Control token costs, use enterprise agreement, data residency
- **Email**: Branded sender domain, compliance requirements
- **Storage**: Data sovereignty, existing infrastructure

### 3. Evidence App Services

These power the Evidence Repository (separate application) but are managed from Juris Admin:

| Service | Purpose | Provider Options | Managed From |
|---------|---------|------------------|--------------|
| **AI/Embeddings** | Document vectorization | OpenAI, Cohere, Anthropic | `/administration/evidence/ai` |
| **Document Processing** | PDF extraction, OCR | iLovePDF, Adobe, Tesseract | `/administration/evidence/documents` |
| **Storage/CDN** | Legal document storage | Cloudflare R2, AWS S3 | `/administration/evidence/storage` |
| **Vector Database** | Semantic search | Pinecone, Weaviate, pgvector | `/administration/evidence/vector` |
| **Evidence Database** | PostgreSQL for Evidence App | Neon, AWS RDS, Cloud SQL | `/administration/evidence/database` |

---

## Database Schema Updates

### Platform Database (juris_platform)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     PLATFORM SERVICE CONFIGURATIONS                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PlatformAIConfig              PlatformEmailConfig         PlatformStorage   │
│  ├── id                        ├── id                      ├── id           │
│  ├── provider (enum)           ├── provider (enum)         ├── provider     │
│  ├── apiKeyEncrypted           ├── host/port/credentials   ├── bucket       │
│  ├── organizationId            ├── fromEmail/fromName      ├── region       │
│  ├── defaultModel              ├── isActive                ├── credentials  │
│  ├── isPrimary                 ├── isPrimary               ├── isPrimary    │
│  └── rateLimits                └── rateLimits              └── quotaGb      │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                     EVIDENCE APP SERVICE CONFIGURATIONS                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  EvidenceAIConfig              EvidenceDocumentConfig      EvidenceStorage   │
│  ├── id                        ├── id                      ├── id           │
│  ├── provider (enum)           ├── provider (enum)         ├── provider     │
│  ├── apiKeyEncrypted           ├── apiKeyEncrypted         ├── bucket       │
│  ├── embeddingModel            ├── ocrEnabled              ├── cdnDomain    │
│  ├── chatModel                 ├── maxFileSizeMb           ├── region       │
│  ├── isPrimary                 ├── supportedFormats        ├── isPrimary    │
│  └── tokensPerMonth            └── isPrimary               └── quotaGb      │
│                                                                              │
│  EvidenceVectorConfig          EvidenceDatabaseConfig                        │
│  ├── id                        ├── id                                        │
│  ├── provider (enum)           ├── host/port                                 │
│  ├── apiKeyEncrypted           ├── databaseName                              │
│  ├── indexName                 ├── credentialsEncrypted                      │
│  ├── dimensions                ├── sslMode                                   │
│  ├── metric                    ├── poolSize                                  │
│  └── isPrimary                 └── isPrimary                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Tenant Database (juris_tenant_{slug})

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     TENANT SERVICE OVERRIDES (Optional)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  TenantAIConfig                TenantEmailConfig           TenantStorage     │
│  ├── id                        ├── id                      ├── id           │
│  ├── provider (enum)           ├── provider (enum)         ├── provider     │
│  ├── apiKeyEncrypted           ├── host/port/credentials   ├── bucket       │
│  ├── organizationId            ├── fromEmail/fromName      ├── region       │
│  ├── defaultModel              ├── replyToEmail            ├── credentials  │
│  ├── isActive                  ├── isActive                ├── isActive     │
│  └── createdAt                 └── createdAt               └── createdAt    │
│                                                                              │
│  NOTE: These tables may be EMPTY - fallback to Platform configs              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Service Resolution Flow

```typescript
// Pseudo-code for service resolution

async function getAIProvider(tenantId: string): Promise<AIProvider> {
  // 1. Check tenant database for override
  const tenantConfig = await tenantDb.tenantAIConfig.findFirst({
    where: { isActive: true }
  });

  if (tenantConfig) {
    return createProvider(tenantConfig);
  }

  // 2. Fallback to platform config
  const platformConfig = await platformDb.platformAIConfig.findFirst({
    where: { isPrimary: true, isActive: true }
  });

  if (platformConfig) {
    return createProvider(platformConfig);
  }

  // 3. No config available
  throw new Error('No AI provider configured');
}

async function getEmailProvider(tenantId: string): Promise<EmailProvider> {
  // Same pattern: tenant override → platform fallback
}

async function getStorageProvider(tenantId: string): Promise<StorageProvider> {
  // Same pattern: tenant override → platform fallback
}

// Evidence App services always use platform-level configs
async function getEvidenceAIProvider(): Promise<AIProvider> {
  return platformDb.evidenceAIConfig.findFirst({ where: { isPrimary: true } });
}
```

---

## UI Management Locations

### 1. Juris Admin (`/administration`)

| Route | Purpose | Services Managed |
|-------|---------|------------------|
| `/administration` | Platform dashboard | Overview of all services |
| `/administration/services/ai` | Platform AI providers | OpenAI, Anthropic keys |
| `/administration/services/email` | Platform email | Gmail SMTP, SendGrid |
| `/administration/services/storage` | Platform storage | S3 buckets |
| `/administration/services/billing` | Stripe config | Payment processing |
| `/administration/evidence` | Evidence App hub | All Evidence services |
| `/administration/evidence/ai` | Evidence AI | Embeddings, chat models |
| `/administration/evidence/documents` | Document processing | iLovePDF, OCR |
| `/administration/evidence/storage` | Evidence storage | Cloudflare R2, S3 |
| `/administration/evidence/vector` | Vector DB | Pinecone, Weaviate |
| `/administration/evidence/database` | Evidence PostgreSQL | Connection config |

### 2. Company Settings (`/company/settings`)

| Route | Purpose | Services Managed |
|-------|---------|------------------|
| `/company/settings` | Company dashboard | Overview + quick connect |
| `/company/settings/integrations` | Integration hub | All tenant overrides |
| `/company/settings/integrations/ai` | Tenant AI | OpenAI/Anthropic override |
| `/company/settings/integrations/email` | Tenant email | Custom SMTP/SendGrid |
| `/company/settings/integrations/storage` | Tenant storage | Custom S3/GCS bucket |

---

## Provider Enums

```typescript
// Platform AI Providers
enum PlatformAIProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  AZURE_OPENAI = 'azure_openai',
  GOOGLE_VERTEX = 'google_vertex',
}

// Evidence AI Providers (may differ - includes embedding specialists)
enum EvidenceAIProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  COHERE = 'cohere',           // Strong for embeddings
  VOYAGE = 'voyage',           // Legal-specific embeddings
}

// Email Providers
enum EmailProvider {
  SMTP = 'smtp',               // Generic SMTP (Gmail, etc.)
  SENDGRID = 'sendgrid',
  SES = 'ses',                 // AWS SES
  MAILGUN = 'mailgun',
  POSTMARK = 'postmark',
}

// Document Processing Providers
enum DocumentProvider {
  ILOVEPDF = 'ilovepdf',
  ADOBE_PDF = 'adobe_pdf',
  DOCPARSER = 'docparser',
  INTERNAL = 'internal',       // Self-hosted OCR (Tesseract)
}

// Storage Providers
enum StorageProvider {
  AWS_S3 = 'aws_s3',
  CLOUDFLARE_R2 = 'cloudflare_r2',
  GCS = 'gcs',                 // Google Cloud Storage
  AZURE_BLOB = 'azure_blob',
  MINIO = 'minio',             // Self-hosted S3-compatible
}

// Vector Database Providers
enum VectorProvider {
  PINECONE = 'pinecone',
  WEAVIATE = 'weaviate',
  QDRANT = 'qdrant',
  PGVECTOR = 'pgvector',       // PostgreSQL extension
  CHROMA = 'chroma',
}
```

---

## Security Considerations

### Encryption

All API keys and secrets are encrypted at rest using envelope encryption:

```
┌─────────────────────────────────────────────────────────────┐
│  1. Master Key (ENCRYPTION_KEY env var)                     │
│     └── Stored in AWS Secrets Manager / HashiCorp Vault     │
│                                                              │
│  2. Data Encryption Key (DEK) per service config            │
│     └── Generated per-record, encrypted with Master Key     │
│                                                              │
│  3. Actual API Key                                           │
│     └── Encrypted with DEK                                   │
└─────────────────────────────────────────────────────────────┘
```

### Access Control

| Service Type | Who Can View | Who Can Modify |
|--------------|--------------|----------------|
| Platform Services | Super Admin, Admin | Super Admin only |
| Evidence Services | Super Admin, Admin | Super Admin only |
| Tenant Services | Company Owner, Org Admin | Company Owner only |

### Audit Logging

All service configuration changes are logged:
- Who changed what
- Previous value (redacted)
- New value (redacted)
- Timestamp
- IP address

---

## Implementation Phases

### Phase 1: Service Abstraction Layer
- [ ] Create `lib/services/ai.ts` - AI provider abstraction
- [ ] Create `lib/services/email.ts` - Email provider abstraction (extend existing)
- [ ] Create `lib/services/storage.ts` - Storage provider abstraction
- [ ] Create `lib/services/resolver.ts` - Service resolution logic

### Phase 2: Platform Schema & Admin UI
- [ ] Add Evidence service models to `platform.prisma`
- [ ] Create `/administration/services/*` pages
- [ ] Create `/administration/evidence/*` pages
- [ ] Add encryption utilities

### Phase 3: Tenant Override Support
- [ ] Verify tenant schema has override tables
- [ ] Update `/company/settings/integrations` to use new types
- [ ] Implement service resolution with fallback

### Phase 4: Evidence App Integration
- [ ] Create API endpoints for Evidence App to fetch configs
- [ ] Implement secure config delivery (signed tokens)
- [ ] Add health checks and monitoring

---

## Environment Variables

```env
# =============================================================================
# PLATFORM-LEVEL API KEYS (Juris AGI's own keys)
# =============================================================================

# AI Providers (Platform Default)
OPENAI_API_KEY="sk-..."
OPENAI_ORG_ID="org-..."
ANTHROPIC_API_KEY="sk-ant-..."

# Email (Platform Default)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="platform@juris-agi.com"
SMTP_PASSWORD="..."
SENDGRID_API_KEY="SG...."  # Alternative

# Storage (Platform Default)
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_S3_BUCKET="juris-platform-documents"
AWS_S3_REGION="us-east-1"

# Billing (Platform Only)
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# =============================================================================
# EVIDENCE APP SERVICES (Managed from Juris Admin)
# =============================================================================

# Evidence AI
EVIDENCE_OPENAI_API_KEY="sk-..."  # May differ from platform key
EVIDENCE_EMBEDDING_MODEL="text-embedding-3-large"

# Evidence Document Processing
ILOVEPDF_PUBLIC_KEY="..."
ILOVEPDF_SECRET_KEY="..."

# Evidence Storage
CLOUDFLARE_R2_ACCESS_KEY="..."
CLOUDFLARE_R2_SECRET_KEY="..."
CLOUDFLARE_R2_BUCKET="juris-evidence"
CLOUDFLARE_R2_ENDPOINT="https://xxx.r2.cloudflarestorage.com"
CLOUDFLARE_CDN_DOMAIN="evidence.juris-agi.com"

# Evidence Vector Database
PINECONE_API_KEY="..."
PINECONE_ENVIRONMENT="us-east-1-aws"
PINECONE_INDEX="juris-evidence"

# Evidence PostgreSQL
EVIDENCE_DATABASE_URL="postgresql://..."

# =============================================================================
# ENCRYPTION
# =============================================================================

ENCRYPTION_KEY="base64-encoded-32-byte-key"
```

---

## File Structure

```
apps/juris-agi-web/
├── lib/
│   ├── services/
│   │   ├── index.ts           # Service exports
│   │   ├── types.ts           # Service type definitions
│   │   ├── resolver.ts        # Service resolution logic
│   │   ├── encryption.ts      # Key encryption utilities
│   │   ├── ai/
│   │   │   ├── index.ts       # AI provider factory
│   │   │   ├── openai.ts      # OpenAI implementation
│   │   │   ├── anthropic.ts   # Anthropic implementation
│   │   │   └── types.ts       # AI types
│   │   ├── email/
│   │   │   ├── index.ts       # Email provider factory
│   │   │   ├── smtp.ts        # SMTP implementation
│   │   │   ├── sendgrid.ts    # SendGrid implementation
│   │   │   └── types.ts       # Email types
│   │   ├── storage/
│   │   │   ├── index.ts       # Storage provider factory
│   │   │   ├── s3.ts          # S3 implementation
│   │   │   ├── r2.ts          # Cloudflare R2 implementation
│   │   │   └── types.ts       # Storage types
│   │   └── document/
│   │       ├── index.ts       # Document processor factory
│   │       ├── ilovepdf.ts    # iLovePDF implementation
│   │       └── types.ts       # Document types
│   └── db/
│       ├── platform.ts        # Platform DB client
│       ├── tenant.ts          # Tenant DB factory
│       └── router.ts          # DB routing
├── app/
│   ├── administration/
│   │   ├── services/
│   │   │   ├── page.tsx       # Services overview
│   │   │   ├── ai/page.tsx    # Platform AI config
│   │   │   ├── email/page.tsx # Platform email config
│   │   │   └── storage/page.tsx # Platform storage config
│   │   └── evidence/
│   │       ├── page.tsx       # Evidence App hub
│   │       ├── ai/page.tsx    # Evidence AI config
│   │       ├── documents/page.tsx # Document processing
│   │       ├── storage/page.tsx   # Evidence storage
│   │       ├── vector/page.tsx    # Vector DB config
│   │       └── database/page.tsx  # Evidence PostgreSQL
│   └── company/
│       └── settings/
│           └── integrations/
│               ├── page.tsx   # Integration overview
│               ├── ai/page.tsx    # Tenant AI override
│               ├── email/page.tsx # Tenant email override
│               └── storage/page.tsx # Tenant storage override
└── prisma/
    ├── platform.prisma        # Platform + Evidence configs
    └── tenant.prisma          # Tenant override configs
```

---

## Summary

This architecture ensures:

1. **Clear Separation**: Platform services, tenant overrides, and Evidence App services are distinct
2. **Fallback Logic**: Tenants use platform services unless they provide their own
3. **Central Management**: Evidence App services are managed from Juris Admin (not scattered)
4. **Security**: All secrets encrypted, proper access control, audit logging
5. **Flexibility**: Tenants can choose their own providers for compliance/cost reasons
6. **Scalability**: Each service type can be scaled/replaced independently
