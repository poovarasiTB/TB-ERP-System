# 🚀 TB ERP System - Complete Beginner's Guide

> **Your step-by-step guide to running the TB ERP System**  
> This guide explains every detail for first-time developers

---

## 📋 Table of Contents

1. [Prerequisites](#-prerequisites)
2. [Understanding the Architecture](#-understanding-the-architecture)
3. [Environment Variables Explained](#-environment-variables-explained)
4. [Setting Up Environment](#-setting-up-environment)
5. [Starting the Services](#-starting-the-services)
6. [Accessing the Application](#-accessing-the-application)
7. [Troubleshooting](#-troubleshooting)

---

## 🔧 Prerequisites

Before you begin, ensure you have these installed:

| Software           | Version | How to Check        | Download Link                       |
| ------------------ | ------- | ------------------- | ----------------------------------- |
| **Node.js**        | 18+     | `node --version`    | [nodejs.org](https://nodejs.org/)   |
| **npm**            | 10+     | `npm --version`     | Comes with Node.js                  |
| **Python**         | 3.11+   | `python --version`  | [python.org](https://python.org/)   |
| **Docker Desktop** | Latest  | Open Docker Desktop | [docker.com](https://docker.com/)   |
| **Git**            | Latest  | `git --version`     | [git-scm.com](https://git-scm.com/) |

> [!IMPORTANT]
> **Docker Desktop must be running** before you execute any Docker commands!

---

## 🏗️ Understanding the Architecture

Your system has **6 services** that work together:

```
┌─────────────────────────────────────────────────────────────────┐
│                        YOUR BROWSER                              │
│                     http://localhost:3000                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│              WEB FRONTEND (Next.js) - Port 3000                  │
│              This is what users see and interact with            │
└───────────────────────────┬─────────────────────────────────────┘
                            │ (Internal API calls)
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼───────┐   ┌───────▼───────┐   ┌───────▼───────┐
│ Asset Service │   │Invoice Service│   │Employee Svc   │
│   Port 8001   │   │   Port 8002   │   │   Port 8003   │
│   (Python)    │   │   (Python)    │   │   (Python)    │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
┌───────▼───────┐   ┌───────▼───────┐   ┌───────▼───────┐
│   asset_db    │   │  invoice_db   │   │  employee_db  │
│  Port 5432    │   │  Port 5433    │   │  Port 5434    │
│ (PostgreSQL)  │   │ (PostgreSQL)  │   │ (PostgreSQL)  │
└───────────────┘   └───────────────┘   └───────────────┘

                    ┌───────────────┐
                    │     Redis     │
                    │  Port 6379    │
                    │   (Cache)     │
                    └───────────────┘
```

### What Each Service Does:

| Service              | Port | Purpose                        |
| -------------------- | ---- | ------------------------------ |
| **web_frontend**     | 3000 | User interface (React/Next.js) |
| **asset_service**    | 8001 | Manages company assets         |
| **invoice_service**  | 8002 | Handles billing and invoices   |
| **employee_service** | 8003 | Employee and HR management     |
| **asset_db**         | 5432 | Database for assets            |
| **invoice_db**       | 5433 | Database for invoices          |
| **employee_db**      | 5434 | Database for employees         |
| **redis**            | 6379 | Caching layer                  |

---

## 🔐 Environment Variables Explained

Environment variables are **configuration settings** that your application reads at startup. They keep sensitive data (passwords, secrets) separate from your code.

### What is the `.env` file?

The `.env` file stores all your environment variables. It should **NEVER be committed to Git** (that's why it's in `.gitignore`).

---

### 📝 Step-by-Step: Create Your `.env` File

**Step 1:** Open your terminal in the project folder:
```powershell
cd "c:\TB ERP\tb-erp-system"
```

**Step 2:** Create the `.env` file by copying the example:
```powershell
copy .env.example .env
```

**Step 3:** Open the `.env` file in VS Code:
```powershell
code .env
```

**Step 4:** Replace the content with these values:

```env
# ===========================================
# TB ERP System - Environment Configuration
# ===========================================

# Environment Mode
ENVIRONMENT=development

# ===========================================
# DATABASE CREDENTIALS
# ===========================================
# These are usernames and passwords for PostgreSQL databases
# In production, use strong random passwords!

# Asset Database
ASSET_DB_USER=asset_user
ASSET_DB_PASSWORD=AssetPass123!

# Invoice Database  
INVOICE_DB_USER=invoice_user
INVOICE_DB_PASSWORD=InvoicePass123!

# Employee Database
EMPLOYEE_DB_USER=employee_user
EMPLOYEE_DB_PASSWORD=EmployeePass123!

# ===========================================
# SECURITY SECRETS
# ===========================================
# These are cryptographic keys for security
# IMPORTANT: In production, generate random 32+ character strings!

# JWT Secret - Used to sign authentication tokens
# All backend services use this same secret to verify tokens
JWT_SECRET=tb-erp-development-jwt-secret-key-2024

# NextAuth Secret - Used by Next.js for session encryption
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=tb-erp-nextauth-secret-key-development-2024

# ===========================================
# APPLICATION URLs
# ===========================================

# NextAuth URL - Where your frontend runs
NEXTAUTH_URL=http://localhost:3000

# Service URLs (used inside Docker network)
ASSET_SERVICE_URL=http://asset_service:8000
INVOICE_SERVICE_URL=http://invoice_service:8000
EMPLOYEE_SERVICE_URL=http://employee_service:8000

# Redis URL
REDIS_URL=redis://redis:6379
```

**Step 5:** Save the file (**Ctrl + S**)

---

### 🔑 Variable Reference Table

| Variable            | What It Does                        | Example Value           |
| ------------------- | ----------------------------------- | ----------------------- |
| `ENVIRONMENT`       | Sets development or production mode | `development`           |
| `ASSET_DB_USER`     | Username for Asset database         | `asset_user`            |
| `ASSET_DB_PASSWORD` | Password for Asset database         | `AssetPass123!`         |
| `JWT_SECRET`        | Secret key to sign login tokens     | Any 32+ char string     |
| `NEXTAUTH_SECRET`   | Encrypts user sessions              | Any 32+ char string     |
| `NEXTAUTH_URL`      | Your frontend URL                   | `http://localhost:3000` |

> [!TIP]
> **How to generate secure secrets for production:**
> ```powershell
> # Open Python and run:
> python -c "import secrets; print(secrets.token_urlsafe(32))"
> ```

---

## 🚀 Starting the Services

You have **two options** to run the application:

### Option 1: Docker Compose (Recommended) ⭐

This starts ALL services (databases + backend + frontend) with one command.

**Step 1:** Make sure Docker Desktop is running (check system tray)

**Step 2:** Open terminal in project folder:
```powershell
cd "c:\TB ERP\tb-erp-system"
```

**Step 3:** Start all services:
```powershell
docker-compose up -d
```

**What happens:**
- `-d` = runs in background (detached mode)
- Docker reads `docker-compose.yml`
- Creates networks for services to communicate
- Starts databases first, then waits for them
- Starts backend services
- Starts frontend

**Step 4:** Check if all services are running:
```powershell
docker-compose ps
```

You should see something like:
```
NAME                      STATUS    PORTS
tb_erp_asset_db          running   0.0.0.0:5432->5432/tcp
tb_erp_invoice_db        running   0.0.0.0:5433->5432/tcp
tb_erp_employee_db       running   0.0.0.0:5434->5432/tcp
tb_erp_redis             running   0.0.0.0:6379->6379/tcp
tb_erp_asset_service     running   0.0.0.0:8001->8000/tcp
tb_erp_invoice_service   running   0.0.0.0:8002->8000/tcp
tb_erp_employee_service  running   0.0.0.0:8003->8000/tcp
tb_erp_web               running   0.0.0.0:3000->3000/tcp
```

**Step 5:** View logs (if something goes wrong):
```powershell
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs web_frontend
docker-compose logs asset_service

# Follow logs in real-time
docker-compose logs -f
```

---

### Option 2: Local Development (Without Docker)

Use this when you want to develop and see changes instantly.

**Step 1: Start Databases with Docker**
```powershell
cd "c:\TB ERP\tb-erp-system"
docker-compose up -d asset_db invoice_db employee_db redis
```

**Step 2: Start Backend Services**

Open **3 separate terminals** for each service:

**Terminal 1 - Asset Service:**
```powershell
cd "c:\TB ERP\tb-erp-system\apps\asset-service"
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

**Terminal 2 - Invoice Service:**
```powershell
cd "c:\TB ERP\tb-erp-system\apps\invoice-service"
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8002
```

**Terminal 3 - Employee Service:**
```powershell
cd "c:\TB ERP\tb-erp-system\apps\employee-service"
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8003
```

**Step 3: Start Frontend**

Open a **4th terminal**:
```powershell
cd "c:\TB ERP\tb-erp-system"
npm install
npm run dev
```

---

## 🌐 Accessing the Application

Once everything is running:

| Application           | URL                        | What You'll See             |
| --------------------- | -------------------------- | --------------------------- |
| **Main App**          | http://localhost:3000      | TB ERP Dashboard            |
| **Asset API Docs**    | http://localhost:8001/docs | Swagger UI for Asset API    |
| **Invoice API Docs**  | http://localhost:8002/docs | Swagger UI for Invoice API  |
| **Employee API Docs** | http://localhost:8003/docs | Swagger UI for Employee API |

### Test the API:

1. Open http://localhost:8001/docs
2. You'll see interactive API documentation
3. Click on any endpoint to test it
4. Click "Try it out" → "Execute"

---

## 🛑 Stopping the Services

### Stop Docker Services:
```powershell
# Stop all services (keeps data)
docker-compose stop

# Stop and remove containers (keeps data volumes)
docker-compose down

# Stop and remove everything INCLUDING data
docker-compose down -v
```

### Stop Local Development:
Press **Ctrl + C** in each terminal window.

---

## 🔧 Troubleshooting

### ❌ "Port already in use"

Another application is using that port.

**Fix:**
```powershell
# Find what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace 12345 with actual PID)
taskkill /PID 12345 /F
```

### ❌ "Cannot connect to database"

Database container might not be ready.

**Fix:**
```powershell
# Check if database is running
docker-compose ps

# Restart the database
docker-compose restart asset_db
```

### ❌ "Module not found" (Python)

Virtual environment not activated.

**Fix:**
```powershell
# Activate virtual environment first
.\venv\Scripts\activate

# Then run the service
uvicorn app.main:app --reload --port 8001
```

### ❌ Docker build fails

**Fix:**
```powershell
# Clean up Docker
docker system prune -f

# Rebuild with no cache
docker-compose build --no-cache

# Try again
docker-compose up -d
```

---

## 📁 Quick Reference: Project Structure

```
c:\TB ERP\tb-erp-system\
│
├── 📄 .env                    ← YOUR SECRETS (create this!)
├── 📄 .env.example            ← Template for .env
├── 📄 docker-compose.yml      ← Docker configuration
├── 📄 package.json            ← Node.js dependencies
├── 📄 turbo.json              ← Monorepo configuration
│
├── 📁 apps/
│   ├── 📁 web-frontend/       ← Next.js frontend
│   │   ├── src/app/           ← React pages
│   │   └── package.json
│   │
│   ├── 📁 asset-service/      ← Python backend
│   │   ├── app/main.py        ← Entry point
│   │   └── requirements.txt   ← Python dependencies
│   │
│   ├── 📁 invoice-service/    ← Python backend
│   └── 📁 employee-service/   ← Python backend
```

---

## ✅ Checklist: Your First Run

- [ ] Docker Desktop is running
- [ ] Created `.env` file from `.env.example`
- [ ] Updated secrets in `.env` file
- [ ] Ran `npm install` in project root
- [ ] Ran `docker-compose up -d`
- [ ] Checked `docker-compose ps` - all services running
- [ ] Opened http://localhost:3000 in browser
- [ ] Saw the TB ERP Dashboard 🎉

---

## 🎓 Next Steps for Development

Once you have everything running:

1. **Explore the API docs** at http://localhost:8001/docs
2. **Look at the code structure** in `apps/asset-service/app/`
3. **Try adding a new API endpoint** in `assets.py`
4. **Customize the frontend** in `apps/web-frontend/src/app/`

---

**Need Help?** Check the logs: `docker-compose logs -f`

**Happy Coding! 🚀**
