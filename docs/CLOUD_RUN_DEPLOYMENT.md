# TB ERP System - Google Cloud Run Deployment Guide

> **Deployment Target:** Google Cloud Run (Serverless Containers)  
> **CI/CD:** GitHub Actions  
> **Repository:** Shared repo (you are a contributor)

---

## 📋 Table of Contents

1. [Understanding CI/CD with Shared Repos](#understanding-cicd-with-shared-repos)
2. [Prerequisites](#prerequisites)
3. [Google Cloud Setup](#google-cloud-setup)
4. [Build Docker Images](#build-docker-images)
5. [Deploy to Cloud Run](#deploy-to-cloud-run)
6. [Configure CI/CD Pipeline](#configure-cicd-pipeline)
7. [Environment Variables](#environment-variables)
8. [Testing Your Deployment](#testing-your-deployment)

---

## 🔄 Understanding CI/CD with Shared Repos

### How CI/CD Works

```
┌─────────────────────────────────────────────────────────────────┐
│                        CI/CD FLOW                                │
│                                                                  │
│   You (Contributor)         Repository Owner                     │
│        │                          │                              │
│        │ 1. Push code             │                              │
│        ├─────────────────────────►│                              │
│        │                          │                              │
│        │ 2. Create Pull Request   │                              │
│        ├─────────────────────────►│                              │
│        │                          │                              │
│        │                    3. PR triggers GitHub Actions        │
│        │                          │                              │
│        │                    4. Tests run automatically           │
│        │                          │                              │
│        │ 5. Owner reviews & merges│                              │
│        │◄─────────────────────────┤                              │
│        │                          │                              │
│        │                    6. Merge triggers deployment         │
│        │                          │                              │
│        │                    7. Cloud Run updated! 🚀             │
└─────────────────────────────────────────────────────────────────┘
```

### Your Role as a Contributor

| What YOU can do                      | What OWNER must do           |
| ------------------------------------ | ---------------------------- |
| Push code to your fork/branch        | Set up GitHub Secrets        |
| Create GitHub Actions workflow files | Add Google Cloud credentials |
| Test locally                         | Approve cloud deployments    |
| Create Pull Requests                 | Merge to main branch         |

### Two Approaches

**Option A: You set up everything on your own Google Cloud**
- You pay for cloud resources
- Full control over deployment
- Good for learning

**Option B: Repository owner sets up cloud**
- Owner pays for resources
- You just write code and workflows
- More common in teams

**I'll show you Option A (your own cloud) - you can share the workflow with the owner later.**

---

## ✅ Prerequisites

### 1. Google Cloud Account
- Go to: https://cloud.google.com/
- Create account (free $300 credit for new users)
- Create a new project called `tb-erp-system`

### 2. Install Google Cloud CLI
```bash
# Windows - Download from:
# https://cloud.google.com/sdk/docs/install

# After install, authenticate:
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### 3. Enable Required APIs
```bash
# Run these commands in terminal
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable artifactregistry.googleapis.com
```

---

## ☁️ Google Cloud Setup

### Step 1: Create Artifact Registry Repository

Artifact Registry stores your Docker images.

```bash
# Create a repository for Docker images
gcloud artifacts repositories create tb-erp-images \
    --repository-format=docker \
    --location=asia-south1 \
    --description="TB ERP Docker Images"
```

### Step 2: Create a Service Account for CI/CD

```bash
# Create service account
gcloud iam service-accounts create github-actions \
    --display-name="GitHub Actions CI/CD"

# Get your project ID
PROJECT_ID=$(gcloud config get-value project)

# Grant permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/iam.serviceAccountUser"

# Create and download key
gcloud iam service-accounts keys create ~/github-actions-key.json \
    --iam-account=github-actions@$PROJECT_ID.iam.gserviceaccount.com

echo "Key saved to: ~/github-actions-key.json"
echo "You'll need this for GitHub Secrets"
```

---

## 🐳 Build Docker Images

### Step 1: Update Dockerfiles for Cloud Run

Cloud Run requires specific configurations. Update your Dockerfiles:

#### Frontend (apps/web-frontend/Dockerfile)
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copy built assets
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

EXPOSE 8080

CMD ["npm", "start"]
```

#### Backend Service Example (apps/asset-service/Dockerfile)
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Cloud Run uses PORT environment variable
ENV PORT=8080

# Run with uvicorn
CMD exec uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Step 2: Test Locally with Docker

```bash
# Build frontend
cd apps/web-frontend
docker build -t tb-erp-frontend .

# Build asset service
cd ../asset-service
docker build -t tb-erp-asset-service .

# Test run
docker run -p 3000:8080 tb-erp-frontend
```

---

## 🚀 Deploy to Cloud Run

### Manual Deployment (First Time)

```bash
# Set variables
PROJECT_ID=$(gcloud config get-value project)
REGION=asia-south1

# --- Deploy Asset Service ---
cd apps/asset-service

# Build and push to Artifact Registry
gcloud builds submit --tag $REGION-docker.pkg.dev/$PROJECT_ID/tb-erp-images/asset-service

# Deploy to Cloud Run
gcloud run deploy asset-service \
    --image $REGION-docker.pkg.dev/$PROJECT_ID/tb-erp-images/asset-service \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --set-env-vars "DATABASE_URL=YOUR_RENDER_DATABASE_URL" \
    --set-env-vars "JWT_SECRET=YOUR_JWT_SECRET"

# --- Deploy Invoice Service ---
cd ../invoice-service
gcloud builds submit --tag $REGION-docker.pkg.dev/$PROJECT_ID/tb-erp-images/invoice-service

gcloud run deploy invoice-service \
    --image $REGION-docker.pkg.dev/$PROJECT_ID/tb-erp-images/invoice-service \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --set-env-vars "DATABASE_URL=YOUR_RENDER_DATABASE_URL" \
    --set-env-vars "JWT_SECRET=YOUR_JWT_SECRET"

# --- Deploy Employee Service ---
cd ../employee-service
gcloud builds submit --tag $REGION-docker.pkg.dev/$PROJECT_ID/tb-erp-images/employee-service

gcloud run deploy employee-service \
    --image $REGION-docker.pkg.dev/$PROJECT_ID/tb-erp-images/employee-service \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --set-env-vars "DATABASE_URL=YOUR_RENDER_DATABASE_URL" \
    --set-env-vars "JWT_SECRET=YOUR_JWT_SECRET"

# --- Deploy Frontend ---
cd ../web-frontend
gcloud builds submit --tag $REGION-docker.pkg.dev/$PROJECT_ID/tb-erp-images/web-frontend

# Get backend service URLs first
ASSET_URL=$(gcloud run services describe asset-service --region $REGION --format="value(status.url)")
INVOICE_URL=$(gcloud run services describe invoice-service --region $REGION --format="value(status.url)")
EMPLOYEE_URL=$(gcloud run services describe employee-service --region $REGION --format="value(status.url)")

gcloud run deploy web-frontend \
    --image $REGION-docker.pkg.dev/$PROJECT_ID/tb-erp-images/web-frontend \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --set-env-vars "NEXTAUTH_URL=https://YOUR_FRONTEND_URL" \
    --set-env-vars "NEXTAUTH_SECRET=YOUR_SECRET" \
    --set-env-vars "DATABASE_URL=YOUR_RENDER_DATABASE_URL" \
    --set-env-vars "JWT_SECRET=YOUR_JWT_SECRET" \
    --set-env-vars "ASSET_SERVICE_URL=$ASSET_URL" \
    --set-env-vars "INVOICE_SERVICE_URL=$INVOICE_URL" \
    --set-env-vars "EMPLOYEE_SERVICE_URL=$EMPLOYEE_URL"
```

---

## ⚙️ Configure CI/CD Pipeline

### Step 1: Add GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

| Secret Name       | Value                | Where to get it                        |
| ----------------- | -------------------- | -------------------------------------- |
| `GCP_PROJECT_ID`  | Your project ID      | `gcloud config get-value project`      |
| `GCP_SA_KEY`      | Service account JSON | Content of `~/github-actions-key.json` |
| `DATABASE_URL`    | Render database URL  | Your Render dashboard                  |
| `JWT_SECRET`      | Your JWT secret      | Same as local .env                     |
| `NEXTAUTH_SECRET` | NextAuth secret      | Same as local .env                     |

**Note:** If you're a contributor, ask the repo owner to add these secrets.

### Step 2: Create GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  REGION: asia-south1
  
jobs:
  # Detect which services changed
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      frontend: ${{ steps.changes.outputs.frontend }}
      asset-service: ${{ steps.changes.outputs.asset-service }}
      invoice-service: ${{ steps.changes.outputs.invoice-service }}
      employee-service: ${{ steps.changes.outputs.employee-service }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v2
        id: changes
        with:
          filters: |
            frontend:
              - 'apps/web-frontend/**'
            asset-service:
              - 'apps/asset-service/**'
            invoice-service:
              - 'apps/invoice-service/**'
            employee-service:
              - 'apps/employee-service/**'

  # Deploy Asset Service
  deploy-asset-service:
    needs: detect-changes
    if: needs.detect-changes.outputs.asset-service == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      
      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2
      
      - name: Configure Docker
        run: gcloud auth configure-docker ${{ env.REGION }}-docker.pkg.dev
      
      - name: Build and Push
        working-directory: apps/asset-service
        run: |
          docker build -t ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/tb-erp-images/asset-service:${{ github.sha }} .
          docker push ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/tb-erp-images/asset-service:${{ github.sha }}
      
      - name: Deploy to Cloud Run
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        run: |
          gcloud run deploy asset-service \
            --image ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/tb-erp-images/asset-service:${{ github.sha }} \
            --region ${{ env.REGION }} \
            --platform managed \
            --allow-unauthenticated \
            --set-env-vars "DATABASE_URL=${{ secrets.DATABASE_URL }}" \
            --set-env-vars "JWT_SECRET=${{ secrets.JWT_SECRET }}"

  # Deploy Invoice Service
  deploy-invoice-service:
    needs: detect-changes
    if: needs.detect-changes.outputs.invoice-service == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      
      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2
      
      - name: Configure Docker
        run: gcloud auth configure-docker ${{ env.REGION }}-docker.pkg.dev
      
      - name: Build and Push
        working-directory: apps/invoice-service
        run: |
          docker build -t ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/tb-erp-images/invoice-service:${{ github.sha }} .
          docker push ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/tb-erp-images/invoice-service:${{ github.sha }}
      
      - name: Deploy to Cloud Run
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        run: |
          gcloud run deploy invoice-service \
            --image ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/tb-erp-images/invoice-service:${{ github.sha }} \
            --region ${{ env.REGION }} \
            --platform managed \
            --allow-unauthenticated \
            --set-env-vars "DATABASE_URL=${{ secrets.DATABASE_URL }}" \
            --set-env-vars "JWT_SECRET=${{ secrets.JWT_SECRET }}"

  # Deploy Employee Service
  deploy-employee-service:
    needs: detect-changes
    if: needs.detect-changes.outputs.employee-service == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      
      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2
      
      - name: Configure Docker
        run: gcloud auth configure-docker ${{ env.REGION }}-docker.pkg.dev
      
      - name: Build and Push
        working-directory: apps/employee-service
        run: |
          docker build -t ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/tb-erp-images/employee-service:${{ github.sha }} .
          docker push ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/tb-erp-images/employee-service:${{ github.sha }}
      
      - name: Deploy to Cloud Run
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        run: |
          gcloud run deploy employee-service \
            --image ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/tb-erp-images/employee-service:${{ github.sha }} \
            --region ${{ env.REGION }} \
            --platform managed \
            --allow-unauthenticated \
            --set-env-vars "DATABASE_URL=${{ secrets.DATABASE_URL }}" \
            --set-env-vars "JWT_SECRET=${{ secrets.JWT_SECRET }}"

  # Deploy Frontend (after backend services)
  deploy-frontend:
    needs: [detect-changes, deploy-asset-service, deploy-invoice-service, deploy-employee-service]
    if: always() && needs.detect-changes.outputs.frontend == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      
      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2
      
      - name: Configure Docker
        run: gcloud auth configure-docker ${{ env.REGION }}-docker.pkg.dev
      
      - name: Get Backend Service URLs
        id: urls
        run: |
          echo "ASSET_URL=$(gcloud run services describe asset-service --region ${{ env.REGION }} --format='value(status.url)' 2>/dev/null || echo '')" >> $GITHUB_OUTPUT
          echo "INVOICE_URL=$(gcloud run services describe invoice-service --region ${{ env.REGION }} --format='value(status.url)' 2>/dev/null || echo '')" >> $GITHUB_OUTPUT
          echo "EMPLOYEE_URL=$(gcloud run services describe employee-service --region ${{ env.REGION }} --format='value(status.url)' 2>/dev/null || echo '')" >> $GITHUB_OUTPUT
      
      - name: Build and Push
        working-directory: apps/web-frontend
        run: |
          docker build -t ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/tb-erp-images/web-frontend:${{ github.sha }} .
          docker push ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/tb-erp-images/web-frontend:${{ github.sha }}
      
      - name: Deploy to Cloud Run
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        run: |
          FRONTEND_URL=$(gcloud run services describe web-frontend --region ${{ env.REGION }} --format='value(status.url)' 2>/dev/null || echo 'https://web-frontend-xxx.run.app')
          
          gcloud run deploy web-frontend \
            --image ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/tb-erp-images/web-frontend:${{ github.sha }} \
            --region ${{ env.REGION }} \
            --platform managed \
            --allow-unauthenticated \
            --set-env-vars "DATABASE_URL=${{ secrets.DATABASE_URL }}" \
            --set-env-vars "JWT_SECRET=${{ secrets.JWT_SECRET }}" \
            --set-env-vars "NEXTAUTH_SECRET=${{ secrets.NEXTAUTH_SECRET }}" \
            --set-env-vars "NEXTAUTH_URL=$FRONTEND_URL" \
            --set-env-vars "ASSET_SERVICE_URL=${{ steps.urls.outputs.ASSET_URL }}" \
            --set-env-vars "INVOICE_SERVICE_URL=${{ steps.urls.outputs.INVOICE_URL }}" \
            --set-env-vars "EMPLOYEE_SERVICE_URL=${{ steps.urls.outputs.EMPLOYEE_URL }}"
```

---

## 🔐 Environment Variables

### For GitHub Secrets (ask repo owner to add)

```
GCP_PROJECT_ID=your-gcp-project-id
GCP_SA_KEY={"type":"service_account","project_id":"..."} (full JSON content)
DATABASE_URL=postgresql://admin:xxx@render-host:5432/tb_erp_db?schema=auth
JWT_SECRET=uE_VgD2LeyeHfE-5hjnZOpxh6BA_C5DOrGIvqWxYJ_Q
NEXTAUTH_SECRET=your-nextauth-secret-key
```

---

## 🧪 Testing Your Deployment

### Check Deployed Services

```bash
# List all Cloud Run services
gcloud run services list

# Get URLs
gcloud run services describe web-frontend --region asia-south1 --format="value(status.url)"
gcloud run services describe asset-service --region asia-south1 --format="value(status.url)"
```

### Test Endpoints

```bash
# Test asset service health
curl https://asset-service-xxx.run.app/health

# Test frontend
curl https://web-frontend-xxx.run.app
```

---

## 📊 How CI/CD Will Work After Setup

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTOMATIC DEPLOYMENT FLOW                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. You push code to feature branch                             │
│     git push origin feature/my-changes                          │
│                                                                  │
│  2. Create Pull Request to main                                  │
│     → GitHub Actions runs tests                                  │
│     → Shows ✅ or ❌ status                                      │
│                                                                  │
│  3. Owner reviews and merges PR                                  │
│     → GitHub Actions detects merge to main                       │
│     → Builds Docker images                                       │
│     → Pushes to Artifact Registry                                │
│     → Deploys to Cloud Run                                       │
│                                                                  │
│  4. Live in ~3 minutes! 🚀                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 Step-by-Step Checklist

### For You (Contributor)

- [ ] Create Google Cloud account (free $300 credit)
- [ ] Create project `tb-erp-system`
- [ ] Enable required APIs
- [ ] Create Artifact Registry repository
- [ ] Create service account and download key
- [ ] Update Dockerfiles for Cloud Run
- [ ] Create `.github/workflows/deploy.yml`
- [ ] Test manual deployment first
- [ ] Share workflow file via Pull Request

### For Repository Owner

- [ ] Add GitHub Secrets (GCP_PROJECT_ID, GCP_SA_KEY, etc.)
- [ ] Review and merge your workflow PR
- [ ] Test automatic deployments

---

## 💰 Cost Estimate

Google Cloud Run Pricing (as of 2024):
- **Free tier:** 2 million requests/month, 360,000 GB-seconds compute
- **After free tier:** ~$0.00002400 per vCPU-second

**For your project:** Likely **$0-10/month** during development

---

## 🆘 Need Help?

1. **Can't access GitHub Secrets?** → Ask repo owner to add them
2. **Build fails?** → Check Dockerfile and logs in GitHub Actions
3. **Deploy fails?** → Check Cloud Run logs: `gcloud run logs read --service SERVICE_NAME`

---

> **Next Step:** Start with manual deployment first, then set up CI/CD once you're comfortable!
