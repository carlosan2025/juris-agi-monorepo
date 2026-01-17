# Juris AGI - Multi-Database Architecture

## Overview

Juris AGI requires strict separation between platform-level data and tenant (company) data for:
- **Security**: Tenant data isolation prevents cross-contamination
- **Compliance**: Regulatory requirements (GDPR, SOC2, etc.) for data segregation
- **Scalability**: Independent scaling of platform vs tenant databases
- **Data Sovereignty**: Tenants may require data in specific geographic regions
- **Billing**: Clear separation for usage metering

---

## Database Architecture

### 1. Platform Database (Juris AGI Core)

**Purpose**: Manages the Juris AGI platform itself - NOT client data.

**Database**: `juris_platform` (Single, centralized)

**Contents**:
```
┌─────────────────────────────────────────────────────────────────┐
│                    JURIS_PLATFORM DATABASE                      │
├─────────────────────────────────────────────────────────────────┤
│ ADMINISTRATION                                                  │
│ ├── JurisAdmin (platform administrators)                        │
│ ├── AdminSession (admin login sessions)                         │
│ ├── AuditLog (platform-level audit trail)                       │
│ └── SystemSettings (global platform configuration)              │
├─────────────────────────────────────────────────────────────────┤
│ TENANT MANAGEMENT                                               │
│ ├── Tenant (company registration & metadata)                    │
│ ├── TenantSubscription (billing plans, status)                  │
│ ├── TenantDatabaseConfig (connection strings, regions)          │
│ └── TenantUsageMetrics (API calls, storage, etc.)              │
├─────────────────────────────────────────────────────────────────┤
│ PLATFORM SERVICES                                               │
│ ├── EmailTemplate (system email templates)                      │
│ ├── EmailLog (sent email records)                               │
│ ├── APIKeyRegistry (platform-level API keys)                    │
│ └── WebhookRegistry (platform webhooks)                         │
├─────────────────────────────────────────────────────────────────┤
│ INTEGRATIONS (Platform-Level Credentials)                       │
│ ├── AIProviderConfig (OpenAI, Anthropic keys - PLATFORM)        │
│ ├── StorageProviderConfig (S3, GCS - PLATFORM buckets)          │
│ └── EmailProviderConfig (Gmail, SendGrid - PLATFORM)            │
└─────────────────────────────────────────────────────────────────┘
```

---

### 2. Tenant Databases (Company Data)

**Purpose**: Each tenant company gets their own isolated database.

**Naming Convention**: `juris_tenant_{tenant_slug}` (e.g., `juris_tenant_acme_capital`)

**Contents**:
```
┌─────────────────────────────────────────────────────────────────┐
│              TENANT DATABASE (per company)                      │
├─────────────────────────────────────────────────────────────────┤
│ COMPANY & USERS                                                 │
│ ├── Company (single record - tenant settings)                   │
│ ├── User (company users)                                        │
│ ├── Account, Session (NextAuth for this tenant)                 │
│ └── UserInvitation (pending invites)                            │
├─────────────────────────────────────────────────────────────────┤
│ MANDATES & BASELINES                                            │
│ ├── Mandate (rulebooks/constitutions)                           │
│ ├── MandateMember (user assignments)                            │
│ ├── MandateBaselineVersion (versioned rules)                    │
│ └── MandateBaselineModule (rule modules)                        │
├─────────────────────────────────────────────────────────────────┤
│ CASES & EVALUATION                                              │
│ ├── Case (deals/underwritings/assessments)                      │
│ ├── Document (uploaded evidence)                                │
│ ├── Claim (extracted facts)                                     │
│ ├── Exception (rule violations)                                 │
│ └── DecisionRecord (final decisions)                            │
├─────────────────────────────────────────────────────────────────┤
│ PORTFOLIOS                                                      │
│ └── Portfolio (fund/book/pipeline aggregations)                 │
├─────────────────────────────────────────────────────────────────┤
│ TENANT INTEGRATIONS (Optional - Tenant's own keys)              │
│ ├── TenantAIConfig (tenant-provided OpenAI key)                 │
│ ├── TenantStorageConfig (tenant's S3 bucket)                    │
│ └── TenantEmailConfig (tenant's email sender)                   │
└─────────────────────────────────────────────────────────────────┘
```

---

### 3. Evidence Repository Database (Separate App)

**Purpose**: Manages shared legal/regulatory evidence - NOT tenant-specific.

**Database**: `evidence_repository`

**Contents**:
```
┌─────────────────────────────────────────────────────────────────┐
│               EVIDENCE_REPOSITORY DATABASE                      │
├─────────────────────────────────────────────────────────────────┤
│ LEGAL SOURCES                                                   │
│ ├── Jurisdiction (countries, states, regulatory bodies)         │
│ ├── LegalSource (courts, regulators, standards bodies)          │
│ ├── CaseLaw (legal precedents)                                  │
│ └── Regulation (rules, laws, guidance)                          │
├─────────────────────────────────────────────────────────────────┤
│ CONTENT                                                         │
│ ├── Document (legal documents, PDFs)                            │
│ ├── DocumentVersion (version history)                           │
│ ├── Section (document sections)                                 │
│ └── Citation (cross-references)                                 │
├─────────────────────────────────────────────────────────────────┤
│ CLASSIFICATION                                                  │
│ ├── Topic (legal topics, industries)                            │
│ ├── Tag (user-defined tags)                                     │
│ └── DocumentTopic (many-to-many)                                │
├─────────────────────────────────────────────────────────────────┤
│ SEARCH & ACCESS                                                 │
│ ├── SearchIndex (full-text search data)                         │
│ ├── AccessLog (who accessed what)                               │
│ └── APIKey (evidence repo API keys)                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Integration & API Key Management

### Platform-Level Keys (Juris AGI Pays)

These are managed in the **Platform Database** and used for platform operations:

| Service | Purpose | Stored In | Used For |
|---------|---------|-----------|----------|
| OpenAI/Anthropic | AI processing | `juris_platform.AIProviderConfig` | Default AI for all tenants |
| SendGrid/Gmail | System emails | `juris_platform.EmailProviderConfig` | Invitations, system alerts |
| AWS S3 | Platform storage | `juris_platform.StorageProviderConfig` | Default document storage |
| Stripe | Billing | `juris_platform.SystemSettings` | Subscription management |

### Tenant-Level Keys (Tenant Pays - Optional)

Tenants can optionally provide their own API keys for:

| Service | Purpose | Stored In | When Used |
|---------|---------|-----------|-----------|
| OpenAI/Anthropic | Custom AI | `tenant_db.TenantAIConfig` | Tenant prefers own AI budget |
| AWS S3/GCS | Custom storage | `tenant_db.TenantStorageConfig` | Data sovereignty requirements |
| Email service | Custom sender | `tenant_db.TenantEmailConfig` | Branded emails from tenant |

### Fallback Logic

```
1. Check tenant database for tenant-specific config
2. If not found, use platform config from platform database
3. If neither exists, fail with appropriate error
```

---

## Connection Management

### Environment Variables

```env
# Platform Database (Juris AGI Core)
PLATFORM_DATABASE_URL="postgresql://user:pass@host/juris_platform"

# Evidence Repository
EVIDENCE_DATABASE_URL="postgresql://user:pass@host/evidence_repository"

# Tenant Database Template (used for provisioning)
TENANT_DATABASE_HOST="tenant-db.cluster.aws.com"
TENANT_DATABASE_PORT="5432"
TENANT_DATABASE_USER="juris_tenant_admin"
TENANT_DATABASE_PASSWORD="..."

# Platform API Keys (encrypted at rest)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
SMTP_PASSWORD="..."
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
```

### Database Router

```typescript
// Pseudo-code for database routing
class DatabaseRouter {
  // Platform operations
  getPlatformClient(): PrismaClient {
    return new PrismaClient({ datasources: { db: { url: PLATFORM_DATABASE_URL } } })
  }

  // Tenant operations (resolved from request context)
  getTenantClient(tenantId: string): PrismaClient {
    const tenantConfig = await this.getPlatformClient().tenantDatabaseConfig.findUnique({
      where: { tenantId }
    })
    return new PrismaClient({ datasources: { db: { url: tenantConfig.connectionString } } })
  }

  // Evidence repository
  getEvidenceClient(): PrismaClient {
    return new PrismaClient({ datasources: { db: { url: EVIDENCE_DATABASE_URL } } })
  }
}
```

---

## Tenant Provisioning Flow

```
1. New company signs up on Juris AGI
   └── Platform DB: Create Tenant record

2. Subscription activated (Stripe webhook)
   └── Platform DB: Create TenantSubscription record

3. Tenant database provisioned
   ├── Create new PostgreSQL database: juris_tenant_{slug}
   ├── Run Prisma migrations for tenant schema
   ├── Platform DB: Store connection string in TenantDatabaseConfig
   └── Initialize Company record in tenant database

4. First admin user created
   ├── Tenant DB: Create User with OWNER role
   └── Send welcome email via platform email service
```

---

## Security Considerations

### Data Isolation

1. **Database-Level**: Each tenant has completely separate database
2. **Connection Pooling**: Separate pools per tenant to prevent connection leaks
3. **Query Validation**: All queries include tenant context check
4. **No Cross-Tenant Joins**: Architecturally impossible

### Encryption

1. **At Rest**: All databases encrypted with AES-256
2. **In Transit**: TLS 1.3 for all database connections
3. **API Keys**: Encrypted in platform database using envelope encryption
4. **Secrets Management**: Use AWS Secrets Manager or HashiCorp Vault

### Access Control

1. **Platform Admins**: Access to platform database only via Juris Admin
2. **Tenant Admins**: Access to their tenant database only
3. **Users**: Scoped to their company within tenant database
4. **No Direct Database Access**: All access through API layer

---

## Deployment Architecture

```
                    ┌──────────────────────────────┐
                    │        Load Balancer          │
                    └──────────────┬───────────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
          ▼                        ▼                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Juris AGI     │     │   Juris AGI     │     │   Evidence      │
│   Web App       │     │   Admin Panel   │     │   Repository    │
│   (Next.js)     │     │   (Next.js)     │     │   (Next.js)     │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │                       │                       │
    ┌────┴────┐             ┌────┴────┐             ┌────┴────┐
    │ Request │             │ Platform │             │Evidence │
    │ Context │             │   DB     │             │   DB    │
    │(tenant) │             │ Client   │             │ Client  │
    └────┬────┘             └────┬────┘             └────┬────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PostgreSQL Cluster                         │
├─────────────────┬─────────────────┬─────────────────────────────┤
│ juris_platform  │ evidence_repo   │ juris_tenant_*              │
│ (1 database)    │ (1 database)    │ (N databases, 1 per tenant) │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Schema Separation (Current Focus)
- [ ] Create `prisma/platform.prisma` for platform schema
- [ ] Create `prisma/tenant.prisma` for tenant schema
- [ ] Create `prisma/evidence.prisma` for evidence repo (if not exists)
- [ ] Update database clients to use correct schema

### Phase 2: Multi-Database Support
- [ ] Implement database router utility
- [ ] Add tenant context middleware
- [ ] Update all API routes to use correct client

### Phase 3: Tenant Provisioning
- [ ] Create tenant provisioning service
- [ ] Database creation automation
- [ ] Migration runner for tenant databases

### Phase 4: API Key Management
- [ ] Move platform API keys to encrypted storage
- [ ] Implement tenant API key override feature
- [ ] Add key rotation support

---

## File Structure

```
apps/juris-agi-web/
├── prisma/
│   ├── platform.prisma     # Platform database schema
│   ├── tenant.prisma       # Tenant database schema template
│   └── migrations/
│       ├── platform/       # Platform migrations
│       └── tenant/         # Tenant migrations
├── lib/
│   ├── db/
│   │   ├── platform.ts     # Platform database client
│   │   ├── tenant.ts       # Tenant database client factory
│   │   ├── evidence.ts     # Evidence repo client
│   │   └── router.ts       # Database routing logic
│   └── services/
│       ├── ai.ts           # AI service with fallback logic
│       ├── email.ts        # Email service with fallback logic
│       └── storage.ts      # Storage service with fallback logic
└── middleware.ts           # Tenant context extraction
```
