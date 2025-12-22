# 🏢 TB ERP System

> Modern Enterprise Resource Planning system built with Microservices Architecture

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.108-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)](https://postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://docker.com/)

## 📋 Overview

TB ERP is a production-ready Enterprise Resource Planning system featuring:

- **🎨 Unified Frontend**: Next.js monorepo with seamless UX
- **⚙️ Microservices Backend**: Independent Python FastAPI services
- **💾 Schema Isolation**: Database-per-service pattern with PostgreSQL
- **🔐 JWT Authentication**: Stateless auth with role-based access control
- **🐳 Containerized**: Docker Compose orchestration

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
│                   (Web Browser)                              │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                  FRONTEND LAYER                              │
│              Next.js + NextAuth (BFF)                        │
│  ┌──────────┬──────────┬──────────┬──────────┐              │
│  │ Assets UI│Invoices │Employees │Dashboard │              │
│  └──────────┴──────────┴──────────┴──────────┘              │
└──────────┬──────────────┬──────────────┬────────────────────┘
           │              │              │
┌──────────▼───┐  ┌───────▼─────┐  ┌─────▼─────────┐
│Asset Service │  │Invoice Svc  │  │Employee Svc   │
│  (FastAPI)   │  │  (FastAPI)  │  │  (FastAPI)    │
└──────┬───────┘  └──────┬──────┘  └───────┬───────┘
       │                 │                  │
┌──────▼───────┐  ┌──────▼──────┐  ┌───────▼───────┐
│  asset_db    │  │ invoice_db  │  │ employee_db   │
│ (PostgreSQL) │  │ (PostgreSQL)│  │ (PostgreSQL)  │
└──────────────┘  └─────────────┘  └───────────────┘
```

## 📁 Project Structure

```
tb-erp-system/
├── apps/
│   ├── web-frontend/          # Next.js BFF Application
│   │   ├── src/
│   │   │   ├── app/           # App Router pages
│   │   │   │   ├── api/       # BFF API routes
│   │   │   │   └── dashboard/ # Dashboard pages
│   │   │   └── lib/           # Utilities
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── asset-service/         # Asset Management Service
│   │   ├── app/
│   │   │   ├── api/v1/        # REST endpoints
│   │   │   ├── core/          # Config & security
│   │   │   ├── db/            # Database session
│   │   │   ├── models/        # SQLAlchemy models
│   │   │   └── schemas/       # Pydantic schemas
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   ├── invoice-service/       # Invoice Management Service
│   └── employee-service/      # Employee Management Service
│
├── packages/                  # Shared packages (future)
├── docker-compose.yml         # Container orchestration
├── turbo.json                 # Turborepo config
└── package.json               # Root workspace config
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- npm or pnpm

### 1️⃣ Clone and Setup

```bash
cd tb-erp-system

# Copy environment file
cp .env.example .env

# Install Node.js dependencies
npm install
```

### 2️⃣ Start with Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 3️⃣ Access the Application

| Service | URL | Description |
|---------|-----|-------------|
| **Web App** | http://localhost:3000 | Next.js Frontend |
| **Asset API** | http://localhost:8001/docs | Asset Service Swagger |
| **Invoice API** | http://localhost:8002/docs | Invoice Service Swagger |
| **Employee API** | http://localhost:8003/docs | Employee Service Swagger |

## 🔧 Development

### Run Frontend Only

```bash
cd apps/web-frontend
npm install
npm run dev
```

### Run Backend Service Locally

```bash
cd apps/asset-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run service
uvicorn app.main:app --reload --port 8001
```

## 🔐 Authentication

The system uses JWT-based authentication:

1. User logs in via Next.js (NextAuth.js)
2. JWT token generated with user roles
3. BFF forwards requests with Bearer token
4. Backend services verify token signature

### Role-Based Access

| Role | Assets | Invoices | Employees |
|------|--------|----------|-----------|
| `admin` | ✅ Full | ✅ Full | ✅ Full |
| `asset_manager` | ✅ Full | ❌ | 👁️ Read |
| `accountant` | 👁️ Read | ✅ Full | 👁️ Read |
| `hr_manager` | 👁️ Read | 👁️ Read | ✅ Full |

## 📦 API Endpoints

### Asset Service (`/api/v1/assets`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/assets` | List all assets (paginated) |
| GET | `/assets/{id}` | Get asset by ID |
| POST | `/assets` | Create new asset |
| PUT | `/assets/{id}` | Update asset |
| DELETE | `/assets/{id}` | Delete asset |

## 🐳 Docker Commands

```bash
# Build all containers
docker-compose build

# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f web_frontend
docker-compose logs -f asset_service

# Reset databases
docker-compose down -v
```

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

**Built with ❤️ using Next.js, FastAPI, and PostgreSQL**
