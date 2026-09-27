# FINTRACE — Financial Crime & Insider Risk Intelligence Platform

FINTRACE is a financial-crime and insider-risk investigation workbench. It combines deterministic rule engines, scikit-learn Isolation Forest unsupervised anomaly detection, and graph correlation networks into a single cohesive analyst interface.

---

## 🏛️ System Architecture

```
Financial Dataset (CSV / IBM AML)
               │
               ▼
   [ Validation & Ingestion ]
               │
               ▼
     [ Feature Engineering ]
        │             │
        ▼             ▼
 [ Rule Engine ]  [ Isolation Forest ML ]
        │             │
        ▼             ▼
      [ Risk Signal Generation ]
               │
               ▼
     [ Correlation Engine ]
   (Entity overlap, temporal proximity,
       transitive graph links)
               │
               ▼
  [ Investigation Cases & Timeline ]
               │
               ▼
    [ Analyst Investigation UI ]
 (Graph Visualizer + Timeline + Evidence Dossier)
```

---

## 🚀 Key Capabilities

1. **Dual-Engine Risk Detection**:
   - **Rule Engine**: Rapidly identifies hard boundary violations (e.g., off-hours insider access, high-velocity outbound transfers, rapid structuring thresholds).
   - **Isolation Forest ML**: Unsupervised anomaly scoring isolating high-dimensional transactional and behavioral outliers.

2. **Automated Signal Correlation**:
   - Aggregates multi-source risk triggers based on shared accounts, employees, counterparties, and temporal proximity.
   - Eliminates alert fatigue by clustering raw signals into prioritized **Investigation Cases**.

3. **Interactive Forensic Graph & Timeline**:
   - Interactive force-directed node-link map rendering entity relationships (Employees, Accounts, Counterparties, Transactions).
   - Horizontal and chronological event timeline tracing anomalies from initiation to execution.

4. **Deterministic Case Dossier & Reporting**:
   - Zero hallucinations: Generates structured, exportable case reports compiled directly from database-persisted evidence and audit trails.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.11+, FastAPI, SQLAlchemy, SQLite, Scikit-learn, Pandas, NumPy, Pydantic v2.
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Force-Graph 2D.
- **Security**: JWT Authentication (OAuth2 Bearer), BCrypt password hashing, Configurable CORS.

---

## ⚙️ Quickstart & Local Setup

### 1. Prerequisites
- Python 3.11 or higher
- Node.js 18+ and npm

### 2. Environment Configuration
Copy `.env.example` to `.env` and configure your credentials:
```bash
cp .env.example .env
```

### 3. Backend Setup
```bash
cd backend
python -m venv .venv

# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend API documentation at `http://localhost:8000/docs`.

### 5. Default Credentials
- **Username**: `admin`
- **Password**: `test123` (or configured via `DEFAULT_ADMIN_PASSWORD` in `.env`)

---

## 📁 Repository Structure

```
FINTRACE/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI Routers (auth, investigations, cases, signals, report)
│   │   ├── core/            # Configuration & security utilities
│   │   ├── database/        # Database initialization & session management
│   │   ├── models/          # SQLAlchemy ORM models
│   │   └── pipeline/        # Ingestion, validation, rule engine, ML & correlation
│   ├── requirements.txt
│   └── cleanup_db.py        # Database utility script
├── frontend/
│   ├── src/
│   │   ├── components/      # UI, Cases, Graph, Timeline, Signals, Entity Inspector
│   │   ├── context/         # Auth state context
│   │   ├── pages/           # Dashboard, Workspace, Login, Upload pages
│   │   ├── services/        # Axios API client
│   │   └── types/           # TypeScript interfaces
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── .env.example
├── .gitignore
└── README.md
```

---

## 🔒 Security & Deployment Notes

- Never commit `.env` or database files (`*.db`, `*.sqlite`) to source control.
- In production, set `SECRET_KEY` to a cryptographically strong 256-bit secret and restrict `allow_origins` in CORS middleware.