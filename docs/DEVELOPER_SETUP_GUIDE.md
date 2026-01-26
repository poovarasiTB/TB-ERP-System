# TB ERP System - Developer Setup Guide

> **Complete setup documentation for development and production environments**  
> **Last Updated:** December 2024

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Database Setup](#database-setup)
4. [Backend Services Setup](#backend-services-setup)
5. [Frontend Setup](#frontend-setup)
6. [Authentication Setup](#authentication-setup)
7. [Running the Application](#running-the-application)
8. [Production Deployment](#production-deployment)
9. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### Required Software

| Software              | Version       | Purpose                   |
| --------------------- | ------------- | ------------------------- |
| **Node.js**           | 18.x or later | Frontend (Next.js)        |
| **Python**            | 3.11 or later | Backend microservices     |
| **PostgreSQL**        | 15.x          | Database (cloud or local) |
| **Git**               | Latest        | Version control           |
| **Docker** (optional) | Latest        | Containerized deployment  |

### Recommended Tools

- VS Code with Python and TypeScript extensions
- Postman or similar API testing tool
- pgAdmin or DBeaver for database management

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                    Next.js 14 (BFF Pattern)                     │
│                     http://localhost:3000                        │
└──────────────────────────┬───────────────────────────────────────┘
                           │
           ─────────────────┼─────────────────
                           │
    ┌──────────────────────┼──────────────────────┐
    │                      │                      │
    ▼                      ▼                      ▼
┌─────────┐          ┌─────────┐          ┌─────────┐
│ Asset   │          │Invoice  │          │Employee │
│ Service │          │Service  │          │Service  │
│ :8001   │          │ :8002   │          │ :8003   │
└────┬────┘          └────┬────┘          └────┬────┘
     │                    │                    │
     └────────────────────┼────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │    PostgreSQL DB      │
              │    Schema Separation  │
              │  ┌─────┬─────┬─────┐ │
              │  │auth │asset│inv. │ │
              │  │     │     │emp. │ │
              │  └─────┴─────┴─────┘ │
              └───────────────────────┘
```

### Schema Separation

All services connect to **ONE database** but use different schemas:

| Schema      | Purpose                | Used By           |
| ----------- | ---------------------- | ----------------- |
| `auth`      | Users, roles, sessions | Frontend (Prisma) |
| `assets`    | Asset management       | Asset Service     |
| `invoices`  | Invoice management     | Invoice Service   |
| `employees` | Employee management    | Employee Service  |

---

## 💾 Database Setup

### Option A: Cloud Database (Render, Supabase, etc.)

1. **Create a PostgreSQL database** on your cloud provider
2. **Get the connection details:**
   - Host: `your-db-host.render.com`
   - Port: `5432`
   - Database: `tb_erp_db`
   - Username: `admin`
   - Password: `your-password`

3. **Run the initialization script:**
   ```bash
   # Connect to your database using psql or pgAdmin
   psql -h your-db-host.render.com -U admin -d tb_erp_db -f db/init_db.sql
   ```

### Option B: Local Docker Database

```bash
docker run -d \
  --name tb_erp_postgres \
  -e POSTGRES_DB=tb_erp_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres_secret \
  -p 5432:5432 \
  postgres:15-alpine

# Initialize the database
docker exec -i tb_erp_postgres psql -U postgres -d tb_erp_db < db/init_db.sql
```

### Database Initialization Script

The `db/init_db.sql` script creates:
- All 4 schemas (auth, assets, invoices, employees)
- Required tables with proper relationships
- Default roles (admin, asset_manager, invoice_manager, hr_manager, employee)
- Default admin user
- Sample data

**Default Admin Credentials:**
- Email: `poovarasi@trustybytes.in`
- Password: `admin123`

---

## ⚙️ Backend Services Setup

### Step 1: Install Python Dependencies

```bash
# Navigate to each service and install dependencies
cd apps/asset-service
pip install -r requirements.txt

cd ../invoice-service
pip install -r requirements.txt

cd ../employee-service
pip install -r requirements.txt
```

### Step 2: Configure Backend Services

Each service has a `app/core/config.py` file. Update the following values:

```python
# apps/[service-name]/app/core/config.py

class Settings(BaseSettings):
    # Database Configuration
    DB_USER: str = "admin"
    DB_PASSWORD: str = "YOUR_DB_PASSWORD"
    DB_HOST: str = "YOUR_DB_HOST"  # e.g., dpg-xxx.render.com
    DB_PORT: str = "5432"
    DB_NAME: str = "tb_erp_db"
    
    # Security - MUST MATCH FRONTEND JWT_SECRET
    JWT_SECRET: str = "YOUR_JWT_SECRET"
    JWT_ALGORITHM: str = "HS256"
```

### Step 3: SSL Configuration for Cloud Databases

For cloud databases (Render, AWS RDS, etc.), SSL is required. The `app/db/session.py` automatically handles this:

```python
# This is already configured in the codebase
is_cloud = "render.com" in DATABASE_URL or "cloud" in DATABASE_URL.lower()
if is_cloud:
    ssl_context = ssl.create_default_context()
    connect_args = {"ssl": ssl_context}
```

### Step 4: Run Backend Services

Open **3 terminals** and run each service:

```bash
# Terminal 1 - Asset Service
cd apps/asset-service
uvicorn app.main:app --reload --port 8001

# Terminal 2 - Invoice Service
cd apps/invoice-service
uvicorn app.main:app --reload --port 8002

# Terminal 3 - Employee Service
cd apps/employee-service
uvicorn app.main:app --reload --port 8003
```

### Step 5: Verify Backend Services

```bash
# Test health endpoints
curl http://localhost:8001/health
curl http://localhost:8002/health
curl http://localhost:8003/health
```

Expected response:
```json
{"status": "healthy", "service": "asset-service"}
```

---

## 🖥️ Frontend Setup

### Step 1: Install Node Dependencies

```bash
cd apps/web-frontend
npm install
```

### Step 2: Setup Prisma (for Authentication)

```bash
# Install Prisma dependencies
npm install prisma@5 @prisma/client@5 bcryptjs jsonwebtoken
npm install -D @types/bcryptjs @types/jsonwebtoken

# Generate Prisma Client
npx prisma generate
```

### Step 3: Configure Frontend Environment

Create/update `apps/web-frontend/.env`:

```env
# Database URL for Prisma (Auth schema)
DATABASE_URL=postgresql://admin:YOUR_PASSWORD@YOUR_DB_HOST:5432/tb_erp_db?schema=auth

# NextAuth Configuration (REQUIRED)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-min-32-chars

# JWT Secret (MUST MATCH BACKEND SERVICES)
JWT_SECRET=YOUR_JWT_SECRET

# Backend Service URLs
ASSET_SERVICE_URL=http://localhost:8001
INVOICE_SERVICE_URL=http://localhost:8002
EMPLOYEE_SERVICE_URL=http://localhost:8003
```

### Step 4: Run Frontend

```bash
cd apps/web-frontend
npm run dev
```

---

## 🔐 Authentication Setup

### Architecture

1. **NextAuth.js** handles session management in the frontend
2. **Prisma** connects to `auth` schema for user validation
3. **JWT tokens** are generated for backend service authentication
4. **bcrypt** is used for password hashing

### Key Files

| File                                      | Purpose                  |
| ----------------------------------------- | ------------------------ |
| `src/lib/db.ts`                           | Prisma client singleton  |
| `src/lib/auth.ts`                         | Authentication functions |
| `src/app/api/auth/[...nextauth]/route.ts` | NextAuth configuration   |
| `prisma/schema.prisma`                    | Database schema for auth |

### Prisma Schema

```prisma
// apps/web-frontend/prisma/schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["multiSchema"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["auth"]
}

// Models are auto-generated by `npx prisma db pull`
```

### Reset Admin Password

If you need to reset the admin password:

1. Visit: `http://localhost:3000/api/setup`
2. This updates the password to `admin123`
3. **Delete** `src/app/api/setup/route.ts` after use (security)

---

## 🚀 Running the Application

### Development Mode

Run these commands in **4 separate terminals**:

```bash
# Terminal 1 - Asset Service (Port 8001)
cd apps/asset-service
uvicorn app.main:app --reload --port 8001

# Terminal 2 - Invoice Service (Port 8002)
cd apps/invoice-service
uvicorn app.main:app --reload --port 8002

# Terminal 3 - Employee Service (Port 8003)
cd apps/employee-service
uvicorn app.main:app --reload --port 8003

# Terminal 4 - Frontend (Port 3000)
cd apps/web-frontend
npm run dev
```

### Access the Application

| URL                                       | Description               |
| ----------------------------------------- | ------------------------- |
| http://localhost:3000                     | Main application          |
| http://localhost:3000/auth/signin         | Login page                |
| http://localhost:3000/dashboard/assets    | Assets management         |
| http://localhost:3000/dashboard/invoices  | Invoice management        |
| http://localhost:3000/dashboard/employees | Employee management       |
| http://localhost:8001/docs                | Asset Service API docs    |
| http://localhost:8002/docs                | Invoice Service API docs  |
| http://localhost:8003/docs                | Employee Service API docs |

### Default Login

- **Email:** `poovarasi@trustybytes.in`
- **Password:** `admin123`

---

## 🏭 Production Deployment

### Using Docker Compose

1. **Update `docker-compose.yml`** with production values
2. **Create production `.env`** file:

```env
# Production Environment
ENVIRONMENT=production
DB_HOST=your-production-db-host
DB_PASSWORD=your-secure-password
JWT_SECRET=your-production-jwt-secret-min-32-chars
NEXTAUTH_SECRET=your-production-nextauth-secret
NEXTAUTH_URL=https://your-domain.com
```

3. **Build and run:**

```bash
docker-compose up -d --build
```

### Cloud Deployment (Render, Railway, etc.)

#### Backend Services

1. Deploy each service separately
2. Set environment variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `ENVIRONMENT=production`

#### Frontend

1. Build the Next.js app:
   ```bash
   cd apps/web-frontend
   npm run build
   ```

2. Set environment variables:
   - `DATABASE_URL`
   - `NEXTAUTH_URL` (your production URL)
   - `NEXTAUTH_SECRET`
   - `JWT_SECRET`
   - `ASSET_SERVICE_URL`
   - `INVOICE_SERVICE_URL`
   - `EMPLOYEE_SERVICE_URL`

---

## 🔧 Troubleshooting

### Common Issues

#### 1. "Invalid email or password"

**Cause:** Password hash in database is incorrect

**Solution:** 
1. Visit `http://localhost:3000/api/setup` to reset password
2. Or regenerate the hash in the database

#### 2. JWT Decryption Failed

**Cause:** Old session cookies with different NEXTAUTH_SECRET

**Solution:**
1. Clear browser cookies for localhost
2. Restart the Next.js server
3. Login again

#### 3. 401 Unauthorized from Backend Services

**Cause:** JWT_SECRET mismatch between frontend and backend

**Solution:**
1. Ensure `JWT_SECRET` is identical in:
   - `apps/web-frontend/.env`
   - All backend `config.py` files
2. Restart all services

#### 4. Database Connection Timeout

**Cause:** Cloud database requires SSL

**Solution:**
1. Ensure `session.py` has SSL configuration
2. Check if your DB host contains "render.com" or "cloud"

#### 5. Prisma Client Error

**Cause:** Prisma client not generated or outdated

**Solution:**
```bash
cd apps/web-frontend
npx prisma generate
```

### Health Check Commands

```bash
# Check all services are running
curl http://localhost:8001/health
curl http://localhost:8002/health
curl http://localhost:8003/health

# Check database connection
npx prisma db pull  # from apps/web-frontend
```

---

## 📁 Project Structure

```
TB-ERP-System/
├── apps/
│   ├── asset-service/          # Asset Management Microservice
│   │   ├── app/
│   │   │   ├── api/v1/         # API endpoints
│   │   │   ├── core/           # Config, security
│   │   │   ├── db/             # Database session
│   │   │   ├── models/         # SQLAlchemy models
│   │   │   └── schemas/        # Pydantic schemas
│   │   └── requirements.txt
│   │
│   ├── invoice-service/        # Invoice Management Microservice
│   ├── employee-service/       # Employee Management Microservice
│   │
│   └── web-frontend/           # Next.js Frontend (BFF)
│       ├── prisma/             # Prisma schema
│       ├── src/
│       │   ├── app/            # Next.js App Router
│       │   │   ├── api/        # BFF API routes
│       │   │   ├── auth/       # Auth pages
│       │   │   └── dashboard/  # Dashboard pages
│       │   ├── lib/            # Utilities (auth, db)
│       │   └── types/          # TypeScript definitions
│       └── package.json
│
├── db/
│   └── init_db.sql             # Database initialization
│
├── docs/                       # Documentation
├── docker-compose.yml          # Container orchestration
└── .env.example                # Environment template
```

---

## 🔑 Environment Variables Reference

### Backend Services

| Variable      | Description       | Example                        |
| ------------- | ----------------- | ------------------------------ |
| `DB_HOST`     | Database host     | `localhost` or `db.render.com` |
| `DB_PORT`     | Database port     | `5432`                         |
| `DB_NAME`     | Database name     | `tb_erp_db`                    |
| `DB_USER`     | Database username | `admin`                        |
| `DB_PASSWORD` | Database password | `secret`                       |
| `JWT_SECRET`  | JWT signing key   | `your-32-char-secret`          |
| `ENVIRONMENT` | Environment mode  | `development` or `production`  |

### Frontend

| Variable               | Description                     | Example                        |
| ---------------------- | ------------------------------- | ------------------------------ |
| `DATABASE_URL`         | Prisma connection string        | `postgresql://...?schema=auth` |
| `NEXTAUTH_URL`         | Base URL of your app            | `http://localhost:3000`        |
| `NEXTAUTH_SECRET`      | NextAuth encryption key         | `your-secret-key`              |
| `JWT_SECRET`           | JWT signing key (match backend) | `your-32-char-secret`          |
| `ASSET_SERVICE_URL`    | Asset service URL               | `http://localhost:8001`        |
| `INVOICE_SERVICE_URL`  | Invoice service URL             | `http://localhost:8002`        |
| `EMPLOYEE_SERVICE_URL` | Employee service URL            | `http://localhost:8003`        |

---

## 📞 Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review the existing documentation in `/docs`
3. Contact the development team

---

*Documentation generated for TB ERP System v1.0*
