# TB ERP System - Architecture & System Design Diagrams

> **Document Purpose**: Production-grade architecture diagrams for initial stakeholder approval  
> **Architecture Style**: Microservices with Backend-for-Frontend (BFF) Pattern  
> **Technology Stack**: Next.js (Frontend/BFF) | Python FastAPI (Backend) | PostgreSQL (Persistence)

---

## 1. High-Level System Architecture

This diagram shows the complete ERP ecosystem from client to data layer.

```mermaid
flowchart TB
    subgraph CLIENT["🌐 Client Layer"]
        WEB["Web Browser"]
        MOBILE["Mobile App (Future)"]
    end

    subgraph FRONTEND["🎨 Frontend Layer - Next.js Monorepo"]
        direction TB
        NEXTJS["Next.js Application"]
        
        subgraph UI_MODULES["Unified UI Modules"]
            ASSET_UI["Asset Management UI"]
            INVOICE_UI["Invoice Management UI"]
            EMPLOYEE_UI["Employee Management UI"]
            DASHBOARD["Dashboard & Analytics"]
        end
        
        subgraph BFF["Backend-for-Frontend (API Routes)"]
            API_GW["API Gateway Layer"]
            AUTH_HANDLER["Auth Handler"]
            COMPOSER["API Composer"]
        end
    end

    subgraph BACKEND["⚙️ Backend Layer - Python FastAPI Microservices"]
        direction LR
        subgraph ASSET_SVC["Asset Service Container"]
            ASSET_API["Asset API"]
        end
        subgraph INVOICE_SVC["Invoice Service Container"]
            INVOICE_API["Invoice API"]
        end
        subgraph EMPLOYEE_SVC["Employee Service Container"]
            EMPLOYEE_API["Employee API"]
        end
    end

    subgraph DATA["💾 Data Layer - PostgreSQL"]
        direction LR
        ASSET_DB[("Asset DB/Schema")]
        INVOICE_DB[("Invoice DB/Schema")]
        EMPLOYEE_DB[("Employee DB/Schema")]
    end

    subgraph INFRA["🔧 Infrastructure Services"]
        REDIS["Redis Cache"]
        QUEUE["Message Queue"]
        MONITOR["Observability Stack"]
    end

    WEB --> NEXTJS
    MOBILE --> NEXTJS
    NEXTJS --> UI_MODULES
    UI_MODULES --> BFF
    BFF --> ASSET_SVC
    BFF --> INVOICE_SVC
    BFF --> EMPLOYEE_SVC
    ASSET_API --> ASSET_DB
    INVOICE_API --> INVOICE_DB
    EMPLOYEE_API --> EMPLOYEE_DB
    ASSET_SVC --> REDIS
    INVOICE_SVC --> REDIS
    EMPLOYEE_SVC --> REDIS
    ASSET_SVC --> QUEUE
    INVOICE_SVC --> QUEUE
    EMPLOYEE_SVC --> QUEUE

    style CLIENT fill:#E3F2FD,stroke:#1565C0
    style FRONTEND fill:#E8F5E9,stroke:#2E7D32
    style BACKEND fill:#FFF3E0,stroke:#EF6C00
    style DATA fill:#FCE4EC,stroke:#C2185B
    style INFRA fill:#F3E5F5,stroke:#7B1FA2
```

---

## 2. Database-per-Service Architecture (Schema Isolation)

Shows how each microservice owns its data with logical schema separation.

```mermaid
flowchart TB
    subgraph SERVICES["Microservices Layer"]
        direction LR
        
        subgraph AS["Asset Service"]
            AS_APP["FastAPI App"]
            AS_ALEMBIC["Alembic Migrations"]
        end
        
        subgraph IS["Invoice Service"]
            IS_APP["FastAPI App"]
            IS_ALEMBIC["Alembic Migrations"]
        end
        
        subgraph ES["Employee Service"]
            ES_APP["FastAPI App"]
            ES_ALEMBIC["Alembic Migrations"]
        end
    end

    subgraph POSTGRES["PostgreSQL Cluster"]
        subgraph ASSET_SCHEMA["asset_schema"]
            direction TB
            T1["assets"]
            T2["maintenance_logs"]
            T3["depreciation_schedules"]
            T4["asset_categories"]
        end
        
        subgraph INVOICE_SCHEMA["invoice_schema"]
            direction TB
            T5["invoices"]
            T6["line_items"]
            T7["payments"]
            T8["tax_records"]
        end
        
        subgraph EMPLOYEE_SCHEMA["employee_schema"]
            direction TB
            T9["employees"]
            T10["departments"]
            T11["roles"]
            T12["attendance"]
        end
    end

    AS --> ASSET_SCHEMA
    IS --> INVOICE_SCHEMA
    ES --> EMPLOYEE_SCHEMA

    AS_ALEMBIC -.->|"manages"| ASSET_SCHEMA
    IS_ALEMBIC -.->|"manages"| INVOICE_SCHEMA
    ES_ALEMBIC -.->|"manages"| EMPLOYEE_SCHEMA

    style ASSET_SCHEMA fill:#BBDEFB,stroke:#1976D2
    style INVOICE_SCHEMA fill:#C8E6C9,stroke:#388E3C
    style EMPLOYEE_SCHEMA fill:#FFE0B2,stroke:#F57C00
```

> [!IMPORTANT]
> **No Foreign Keys Across Schemas**: Cross-service references use soft IDs (e.g., `assigned_employee_id` in Assets). Consistency is maintained via event-driven updates.

---

## 3. Backend-for-Frontend (BFF) Pattern

Detailed view of how Next.js orchestrates requests to backend services.

```mermaid
sequenceDiagram
    autonumber
    participant Browser
    participant NextJS as Next.js BFF<br/>(API Routes)
    participant Auth as NextAuth.js
    participant Asset as Asset Service<br/>(FastAPI)
    participant Employee as Employee Service<br/>(FastAPI)
    
    Browser->>NextJS: GET /api/assets
    NextJS->>Auth: Validate Session
    Auth-->>NextJS: Session Valid + JWT
    
    rect rgb(240, 248, 255)
        Note over NextJS,Employee: API Composition (Distributed Join)
        NextJS->>Asset: GET /api/v1/assets<br/>[Authorization: Bearer JWT]
        Asset-->>NextJS: Assets[] with employee_ids
        NextJS->>NextJS: Extract unique employee_ids
        NextJS->>Employee: GET /api/v1/employees?ids=1,2,5<br/>[Authorization: Bearer JWT]
        Employee-->>NextJS: Employee details
        NextJS->>NextJS: Merge: Asset + Employee data
    end
    
    NextJS-->>Browser: Enriched Assets JSON
```

---

## 4. Monorepo Project Structure

Recommended folder organization using Turborepo.

```mermaid
flowchart LR
    subgraph REPO["📁 tb-erp-system (Monorepo)"]
        direction TB
        
        subgraph APPS["apps/"]
            WEB["📱 web-frontend/<br/>(Next.js)"]
            ASSET["🔧 asset-service/<br/>(Python FastAPI)"]
            INVOICE["📄 invoice-service/<br/>(Python FastAPI)"]
            EMPLOYEE["👤 employee-service/<br/>(Python FastAPI)"]
        end
        
        subgraph PACKAGES["packages/"]
            UI["🎨 ui/<br/>(Shared Components)"]
            TS_CONFIG["⚙️ ts-config/"]
            ESLINT["📏 eslint-config/"]
            SHARED["📦 shared/<br/>(Types, Utils)"]
        end
        
        subgraph INFRA["infrastructure/"]
            DOCKER["🐳 docker-compose.yml"]
            K8S["☸️ kubernetes/"]
            TERRAFORM["🏗️ terraform/"]
        end
        
        subgraph ROOT_FILES["Root Config"]
            TURBO["turbo.json"]
            PACKAGE["package.json"]
            README["README.md"]
        end
    end

    style APPS fill:#E8F5E9,stroke:#2E7D32
    style PACKAGES fill:#E3F2FD,stroke:#1565C0
    style INFRA fill:#FFF3E0,stroke:#EF6C00
    style ROOT_FILES fill:#F5F5F5,stroke:#616161
```

### Service Directory Standard (Python FastAPI)

```
apps/asset-service/
├── app/
│   ├── api/
│   │   └── v1/
│   │       └── endpoints/
│   │           ├── assets.py
│   │           └── maintenance.py
│   ├── core/           # Configuration
│   ├── db/             # Database connection
│   ├── models/         # SQLAlchemy models
│   ├── schemas/        # Pydantic schemas
│   └── main.py         # FastAPI entrypoint
├── alembic/            # DB migrations
├── tests/              # Pytest suite
├── Dockerfile
└── requirements.txt
```

---

## 5. Container & Infrastructure Architecture

Docker container orchestration and networking.

```mermaid
flowchart TB
    subgraph DOCKER_HOST["🐳 Docker Host / Kubernetes Cluster"]
        
        subgraph EXTERNAL_NET["External Network (Public)"]
            LB["Load Balancer<br/>:443"]
        end
        
        subgraph FRONTEND_NET["Frontend Network"]
            WEB_CONTAINER["Next.js Container<br/>:3000"]
        end
        
        subgraph BACKEND_NET["Backend Network (Private)"]
            ASSET_CONTAINER["Asset Service<br/>:8000"]
            INVOICE_CONTAINER["Invoice Service<br/>:8000"]
            EMPLOYEE_CONTAINER["Employee Service<br/>:8000"]
        end
        
        subgraph DATA_NET["Data Network (Private)"]
            ASSET_PG["PostgreSQL<br/>asset_db<br/>:5432"]
            INVOICE_PG["PostgreSQL<br/>invoice_db<br/>:5433"]
            EMPLOYEE_PG["PostgreSQL<br/>employee_db<br/>:5434"]
            REDIS_CACHE["Redis<br/>:6379"]
        end
    end

    subgraph EXTERNAL["External Users"]
        CLIENT["👤 End Users"]
    end

    CLIENT -->|HTTPS| LB
    LB --> WEB_CONTAINER
    WEB_CONTAINER -->|HTTP Internal| ASSET_CONTAINER
    WEB_CONTAINER -->|HTTP Internal| INVOICE_CONTAINER
    WEB_CONTAINER -->|HTTP Internal| EMPLOYEE_CONTAINER
    ASSET_CONTAINER --> ASSET_PG
    INVOICE_CONTAINER --> INVOICE_PG
    EMPLOYEE_CONTAINER --> EMPLOYEE_PG
    ASSET_CONTAINER --> REDIS_CACHE
    INVOICE_CONTAINER --> REDIS_CACHE
    EMPLOYEE_CONTAINER --> REDIS_CACHE

    style EXTERNAL_NET fill:#FFCDD2,stroke:#C62828
    style FRONTEND_NET fill:#C8E6C9,stroke:#388E3C
    style BACKEND_NET fill:#FFE0B2,stroke:#F57C00
    style DATA_NET fill:#E1BEE7,stroke:#7B1FA2
```

> [!NOTE]
> **Network Isolation**: Backend services are NOT exposed to public internet. Only the Next.js BFF receives external traffic.

---

## 6. Security & Authentication Flow

JWT-based stateless authentication across the distributed system.

```mermaid
sequenceDiagram
    autonumber
    participant User as 👤 User Browser
    participant NextJS as Next.js App
    participant NextAuth as NextAuth.js
    participant JWT as JWT Token
    participant Asset as Asset Service
    participant DB as Asset DB

    rect rgb(255, 243, 224)
        Note over User,NextAuth: Authentication Phase
        User->>NextJS: Login Request
        NextJS->>NextAuth: Authenticate
        NextAuth->>NextAuth: Verify Credentials
        NextAuth->>JWT: Generate JWT<br/>(user_id, email, roles[])
        NextAuth-->>NextJS: Set HTTP-Only Cookie
        NextJS-->>User: Login Success
    end

    rect rgb(232, 245, 233)
        Note over User,DB: Authorized Request Phase
        User->>NextJS: GET /api/assets<br/>[Cookie: session]
        NextJS->>NextAuth: Extract JWT from Cookie
        NextAuth-->>NextJS: Decoded User Context
        NextJS->>Asset: GET /assets<br/>[Authorization: Bearer JWT]
        Asset->>Asset: Verify JWT Signature<br/>(Shared Secret)
        Asset->>Asset: Check roles[] for "asset_manager"
        Asset->>DB: Query Assets
        DB-->>Asset: Asset Data
        Asset-->>NextJS: JSON Response
        NextJS-->>User: Rendered UI
    end
```

### Role-Based Access Control Matrix

| Role | Asset Service | Invoice Service | Employee Service |
|:-----|:-------------:|:---------------:|:----------------:|
| `admin` | ✅ Full | ✅ Full | ✅ Full |
| `asset_manager` | ✅ Full | ❌ None | 👁️ Read |
| `accountant` | 👁️ Read | ✅ Full | 👁️ Read |
| `hr_manager` | 👁️ Read | 👁️ Read | ✅ Full |
| `employee` | 👁️ Own | 👁️ Own | 👁️ Own |

---

## 7. API Composition & Data Flow

How distributed data is aggregated for unified views.

```mermaid
flowchart LR
    subgraph REQUEST["📥 Client Request"]
        REQ["GET /dashboard/assets-with-owners"]
    end

    subgraph BFF["🔀 Next.js BFF (Composition Layer)"]
        HANDLER["API Route Handler"]
        
        subgraph PARALLEL["Parallel Fetch"]
            CALL1["Fetch Assets"]
            CALL2["Fetch Employees"]
        end
        
        MERGE["Data Merger"]
    end

    subgraph SERVICES["⚙️ Microservices"]
        ASSET_SVC["Asset Service"]
        EMP_SVC["Employee Service"]
    end

    subgraph DBS["💾 Databases"]
        A_DB[("asset_db")]
        E_DB[("employee_db")]
    end

    subgraph RESPONSE["📤 Unified Response"]
        JSON["Enriched JSON"]
    end

    REQ --> HANDLER
    HANDLER --> CALL1
    HANDLER --> CALL2
    CALL1 --> ASSET_SVC
    CALL2 --> EMP_SVC
    ASSET_SVC --> A_DB
    EMP_SVC --> E_DB
    A_DB --> ASSET_SVC
    E_DB --> EMP_SVC
    ASSET_SVC --> MERGE
    EMP_SVC --> MERGE
    MERGE --> JSON

    style REQUEST fill:#E3F2FD,stroke:#1565C0
    style BFF fill:#E8F5E9,stroke:#2E7D32
    style SERVICES fill:#FFF3E0,stroke:#EF6C00
    style DBS fill:#FCE4EC,stroke:#C2185B
    style RESPONSE fill:#F3E5F5,stroke:#7B1FA2
```

### Composition Algorithm

```plaintext
1. Receive request for enriched asset list
2. Call Asset Service → Get assets with employee_ids
3. Extract unique employee_ids: [1, 5, 12, 23]
4. Call Employee Service with batch endpoint: GET /employees?ids=1,5,12,23
5. Create lookup map: { 1: "John", 5: "Jane", ... }
6. Merge employee names into asset objects
7. Return unified response to client
```

---

## 8. CI/CD Pipeline Architecture

Independent deployment pipelines per service.

```mermaid
flowchart TB
    subgraph TRIGGER["🎯 Trigger"]
        PUSH["Git Push"]
        PR["Pull Request"]
    end

    subgraph DETECT["🔍 Change Detection"]
        TURBO_CHECK["Turborepo Affected<br/>Check"]
    end

    subgraph PIPELINES["⚡ Parallel Pipelines"]
        direction TB
        
        subgraph P1["Next.js Pipeline"]
            N_LINT["Lint & Type Check"]
            N_TEST["Unit Tests"]
            N_BUILD["Build"]
            N_DEPLOY["Deploy to Vercel/K8s"]
        end
        
        subgraph P2["Asset Service Pipeline"]
            A_LINT["Python Lint (Ruff)"]
            A_TEST["Pytest"]
            A_MIGRATE["Run Alembic"]
            A_BUILD["Docker Build"]
            A_DEPLOY["Deploy Container"]
        end
        
        subgraph P3["Invoice Service Pipeline"]
            I_LINT["Python Lint (Ruff)"]
            I_TEST["Pytest"]
            I_MIGRATE["Run Alembic"]
            I_BUILD["Docker Build"]
            I_DEPLOY["Deploy Container"]
        end
        
        subgraph P4["Employee Service Pipeline"]
            E_LINT["Python Lint (Ruff)"]
            E_TEST["Pytest"]
            E_MIGRATE["Run Alembic"]
            E_BUILD["Docker Build"]
            E_DEPLOY["Deploy Container"]
        end
    end

    subgraph REGISTRY["📦 Container Registry"]
        ACR["Azure CR / Docker Hub"]
    end

    subgraph ENVIRONMENTS["🌍 Environments"]
        DEV["Development"]
        STAGING["Staging"]
        PROD["Production"]
    end

    PUSH --> TURBO_CHECK
    PR --> TURBO_CHECK
    TURBO_CHECK -->|"apps/web-frontend changed"| P1
    TURBO_CHECK -->|"apps/asset-service changed"| P2
    TURBO_CHECK -->|"apps/invoice-service changed"| P3
    TURBO_CHECK -->|"apps/employee-service changed"| P4
    
    P1 --> REGISTRY
    P2 --> REGISTRY
    P3 --> REGISTRY
    P4 --> REGISTRY
    
    REGISTRY --> DEV
    DEV --> STAGING
    STAGING --> PROD

    style TRIGGER fill:#FFCDD2,stroke:#C62828
    style DETECT fill:#E1BEE7,stroke:#7B1FA2
    style REGISTRY fill:#B3E5FC,stroke:#0277BD
    style ENVIRONMENTS fill:#C8E6C9,stroke:#388E3C
```

> [!TIP]
> **Independent Deployability**: Asset team can hotfix their service without waiting for Invoice team's testing cycle.

---

## 9. Event-Driven Architecture (Optional Enhancement)

For cross-service consistency and real-time updates.

```mermaid
flowchart LR
    subgraph PRODUCERS["Event Producers"]
        EMP_SVC["Employee Service"]
        ASSET_SVC["Asset Service"]
        INV_SVC["Invoice Service"]
    end

    subgraph BROKER["📬 Message Broker (Redis/RabbitMQ)"]
        direction TB
        TOPIC1["employee.deleted"]
        TOPIC2["asset.created"]
        TOPIC3["invoice.paid"]
    end

    subgraph CONSUMERS["Event Consumers"]
        ASSET_HANDLER["Asset Event Handler"]
        DASHBOARD_SVC["Dashboard Service"]
        NOTIFICATION["Notification Service"]
    end

    EMP_SVC -->|"EmployeeDeleted"| TOPIC1
    ASSET_SVC -->|"AssetCreated"| TOPIC2
    INV_SVC -->|"InvoicePaid"| TOPIC3
    
    TOPIC1 --> ASSET_HANDLER
    TOPIC2 --> DASHBOARD_SVC
    TOPIC3 --> NOTIFICATION
    TOPIC3 --> DASHBOARD_SVC

    ASSET_HANDLER -->|"Set assigned_employee_id = NULL"| ASSET_SVC

    style PRODUCERS fill:#FFE0B2,stroke:#F57C00
    style BROKER fill:#E1BEE7,stroke:#7B1FA2
    style CONSUMERS fill:#C8E6C9,stroke:#388E3C
```

### Event Scenarios

| Event | Producer | Consumer(s) | Action |
|:------|:---------|:------------|:-------|
| `employee.deleted` | Employee Service | Asset Service | Nullify `assigned_employee_id` |
| `asset.created` | Asset Service | Dashboard Service | Update total asset value |
| `invoice.paid` | Invoice Service | Dashboard, Notification | Update revenue, send receipt |

---

## 10. Technology Stack Summary

```mermaid
mindmap
    root((TB ERP<br/>Tech Stack))
        Frontend
            Next.js 14+
            React 18
            TypeScript
            TailwindCSS
            NextAuth.js
        Backend
            Python 3.11+
            FastAPI
            SQLModel
            Pydantic
            Alembic
        Database
            PostgreSQL 15+
            Redis Cache
        Infrastructure
            Docker
            Kubernetes
            Turborepo
        DevOps
            GitHub Actions
            Terraform
        Observability
            OpenTelemetry
            Grafana
            Prometheus
```

---

## 11. Deployment Architecture

Production infrastructure layout.

```mermaid
flowchart TB
    subgraph CLOUD["☁️ Cloud Provider (Azure/AWS/GCP)"]
        subgraph CDN_LAYER["CDN & Edge"]
            CDN["CDN (CloudFront/Vercel Edge)"]
        end
        
        subgraph COMPUTE["Compute Layer"]
            subgraph K8S["Kubernetes Cluster"]
                subgraph FRONTEND_PODS["Frontend Pods"]
                    WEB1["Next.js Pod 1"]
                    WEB2["Next.js Pod 2"]
                end
                
                subgraph BACKEND_PODS["Backend Pods"]
                    ASSET_POD["Asset Service Pod"]
                    INVOICE_POD["Invoice Service Pod"]
                    EMPLOYEE_POD["Employee Service Pod"]
                end
            end
        end
        
        subgraph DATA_LAYER["Managed Data Services"]
            PG_PRIMARY["PostgreSQL Primary"]
            PG_REPLICA["PostgreSQL Read Replica"]
            REDIS_MANAGED["Redis Cluster"]
        end
        
        subgraph MONITORING["Observability"]
            LOG_AGG["Log Aggregator"]
            METRICS["Metrics Server"]
            TRACES["Distributed Traces"]
        end
    end

    subgraph USERS["Global Users"]
        USER1["👤 User (Region 1)"]
        USER2["👤 User (Region 2)"]
    end

    USER1 --> CDN
    USER2 --> CDN
    CDN --> WEB1
    CDN --> WEB2
    WEB1 --> ASSET_POD
    WEB1 --> INVOICE_POD
    WEB1 --> EMPLOYEE_POD
    WEB2 --> ASSET_POD
    WEB2 --> INVOICE_POD
    WEB2 --> EMPLOYEE_POD
    ASSET_POD --> PG_PRIMARY
    INVOICE_POD --> PG_PRIMARY
    EMPLOYEE_POD --> PG_PRIMARY
    ASSET_POD -.-> PG_REPLICA
    INVOICE_POD -.-> PG_REPLICA
    EMPLOYEE_POD -.-> PG_REPLICA
    ASSET_POD --> REDIS_MANAGED
    INVOICE_POD --> REDIS_MANAGED
    EMPLOYEE_POD --> REDIS_MANAGED

    style CDN_LAYER fill:#FFECB3,stroke:#FF8F00
    style COMPUTE fill:#E3F2FD,stroke:#1565C0
    style DATA_LAYER fill:#FCE4EC,stroke:#C2185B
    style MONITORING fill:#E8F5E9,stroke:#2E7D32
```

---

## Appendix: Key Architectural Decisions

| Decision | Choice | Rationale |
|:---------|:-------|:----------|
| **Architecture Pattern** | Microservices + BFF | Independent scaling & development while maintaining unified UX |
| **Frontend Framework** | Next.js (App Router) | SSR, API Routes as BFF, React ecosystem |
| **Backend Framework** | Python FastAPI | High-performance async I/O, Pydantic validation, auto-docs |
| **Database Strategy** | Schema-per-Service | Logical isolation with cost efficiency |
| **Authentication** | NextAuth.js + JWT | Stateless, scalable identity propagation |
| **Repository Strategy** | Monorepo (Turborepo) | Simplified management, shared tooling |
| **Container Strategy** | Docker + Kubernetes | Consistent environments, horizontal scaling |
| **Communication** | REST (HTTP) + Events | Simple synchronous calls + eventual consistency |

---

> **Next Steps**: Upon approval, proceed with monorepo scaffolding and service skeleton implementation.
