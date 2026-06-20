# Eventum (PLAN. CONNECT. CELEBRATE)

**EVENTUM** is an event management system designed to seamlessly bridge the gap between organizers and attendees. Built as a high-performance full-stack application, it utilizes a robust **FastAPI (Python)** backend and a lightning-fast **React + Vite** frontend to deliver a secure, responsive, and intuitive platform for planning, connecting, and celebrating events.

---

## 🛠️ Tech Stack

### Backend Infrastructure
* **Framework:** FastAPI (Python)
* **Database ORM:** SQLAlchemy
* **Database Engine:** SQLite (Local data storage)
* **Security & Auth:** PyJWT (JSON Web Tokens) & Passlib with Bcrypt (Password Hashing)
* **Data Validation:** Pydantic

### Frontend Interface
* **Framework:** React.js (Functional Architecture & Hooks)
* **Build Bundler:** Vite
* **Styling Framework:** Tailwind CSS (Utility-First Responsive Design)

---

## ✨ Key System Features

### 🛡️ 1. Multi-Tier Role Architecture
The platform enforces strict Role-Based Access Control (RBAC). The entire frontend interface dynamically adapts based on the privilege vector of the authenticated user token:
* **Administrators & Organizers:** Gain access to real-time metric analytics banners and interactive event deployment panels.
* **Audience Members:** Experience a clean, single-pane focus grid designed exclusively for viewing and registering for active events.

### 📊 2. Chronological Waitlist Automation
Event limits are strictly managed at the database level to ensure synchronization accuracy:
* When an event hits its maximum capacity, the backend intercepts incoming registration data.
* Overflow registrants are automatically placed into a `Waitlist` tier, organized sequentially based on their exact entry time in the database.

### 📝 3. Self-Documenting API Playground
The backend route ecosystem is fully mapped using OpenAPI specifications. Developers can instantly access interactive testing docs locally at `/docs` to inspect payload schemas and test live endpoints.

---

## 📁 Repository Architecture

```text
Eventum/
├── backend/            # Python FastAPI Framework
│   ├── venv/           # Isolated Virtual Environment
│   ├── main.py         # Application Entry & CryptContext Configs
│   ├── models.py       # Relational Database Schemas
│   └── database.db     # Active SQLite Target File
├── frontend/           # React + Vite Client
│   ├── src/            # Core Pages & Dynamic Components
│   ├── vite.config.js  # Asset Watcher & Server Configuration
│   └── package.json    # Node Dependency Manifest
└── .gitignore          # Root System File Guard