# JURIS-AGI Monorepo Deployment Guide

This monorepo contains both the **Evidence Repository API** and the **JURIS-AGI Web Application**, deployed as two separate Vercel projects from the same GitHub repository.

## Repository Structure

```
/apps
  /evidence-api        # FastAPI service (Evidence Repository)
  /juris-agi-web       # Next.js app + Python AGI backend
/packages
  /contracts           # Shared OpenAPI specs + JSON schemas
  /sdk-ts              # TypeScript SDK for both APIs
  /sdk-py              # Python SDK for both APIs
  /shared              # Shared utilities (optional)
```

## Deploying to Vercel

### Step 1: Connect Repository to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import this GitHub repository

### Step 2: Create Two Projects

You need to create **two separate Vercel projects** from the same repository:

#### Project A: Evidence API

1. Create new project
2. **Root Directory**: `apps/evidence-api`
3. **Framework Preset**: Other
4. **Build Command**: (leave default or `echo 'No build'`)
5. **Output Directory**: `api`
6. **Environment Variables**:
   - `DATABASE_URL` - PostgreSQL connection string
   - `REDIS_URL` - Redis connection string (optional)
   - `OPENAI_API_KEY` - For embeddings
   - `LOVEPDF_PUBLIC_KEY` - For PDF extraction
   - `LOVEPDF_SECRET_KEY` - For PDF extraction
   - `API_KEYS` - Comma-separated API keys for auth

#### Project B: JURIS-AGI Web

1. Create new project
2. **Root Directory**: `apps/juris-agi-web`
3. **Framework Preset**: Next.js
4. **Build Command**: `npm run build`
5. **Output Directory**: `.next`
6. **Environment Variables**:
   - `EVIDENCE_API_URL` - URL of deployed Evidence API
   - `EVIDENCE_API_KEY` - API key for Evidence API
   - `NEXT_PUBLIC_APP_URL` - Public URL of this app

### Step 3: Configure Domains

After deployment, configure custom domains if needed:
- Evidence API: `api.juris-agi.com` or `evidence.juris-agi.com`
- JURIS-AGI Web: `app.juris-agi.com` or `juris-agi.com`

## Local Development

### Prerequisites

- Node.js >= 18
- Python >= 3.10
- PostgreSQL (for Evidence API)
- Redis (optional, for background jobs)

### Setup

```bash
# Install Node dependencies
npm install

# Install Python dependencies for Evidence API
cd apps/evidence-api
pip install -e ".[dev]"

# Install Python dependencies for JURIS-AGI
cd apps/juris-agi-web/python
pip install -e ".[dev]"

# Install SDK packages
cd packages/sdk-py
pip install -e ".[dev]"
```

### Running Locally

```bash
# Terminal 1: Evidence API
cd apps/evidence-api
uvicorn src.evidence_repository.main:app --reload --port 8000

# Terminal 2: JURIS-AGI Web
cd apps/juris-agi-web
npm run dev
```

### Environment Variables

Create `.env.local` files in each app:

**apps/evidence-api/.env.local**:
```
DATABASE_URL=postgresql://user:pass@localhost:5432/evidence
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-...
LOVEPDF_PUBLIC_KEY=...
LOVEPDF_SECRET_KEY=...
API_KEYS=dev-key-1,dev-key-2
```

**apps/juris-agi-web/.env.local**:
```
EVIDENCE_API_URL=http://localhost:8000
EVIDENCE_API_KEY=dev-key-1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## API Contract Changes

When the API contract evolves:

1. Update OpenAPI specs in `packages/contracts/`
2. Regenerate SDKs:
   ```bash
   cd packages/contracts && npm run build
   cd packages/sdk-ts && npm run generate && npm run build
   ```
3. Update both apps in the same PR
4. Both apps compile/fail together - no drift

## CI/CD Pipeline

The monorepo supports:
- **Turbo**: For caching and parallel builds
- **Vercel**: Automatic deployments on push

Each Vercel project watches its own root directory, so:
- Changes to `apps/evidence-api` trigger Evidence API deployment
- Changes to `apps/juris-agi-web` trigger JURIS-AGI Web deployment
- Changes to `packages/*` trigger both deployments

## Troubleshooting

### "Module not found" errors on Vercel

Ensure `PYTHONPATH` is set correctly in `vercel.json`:
```json
{
  "env": {
    "PYTHONPATH": "src"
  }
}
```

### Function timeout errors

Increase `maxDuration` in `vercel.json` functions config (max 60s on Hobby, 300s on Pro).

### Build failures

Check that:
1. Root directory is set correctly in Vercel project settings
2. Framework preset matches the app type
3. All required environment variables are set
