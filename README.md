# MineGuard AI - Comprehensive Underground Mining Safety Platform (`sih_mining`)

Welcome to the **`sih_mining`** integrated repository. MineGuard AI is an end-to-end intelligent safety, monitoring, and rescue coordination platform designed for underground mining environments.

---

## 🏗️ Platform Modules

### 📡 [Module 1: IoT & AI Subsidence Monitoring](./module_1_iot_ai/)
- Real-time IoT geotechnical sensors (extensometers, piezometers, crack meters, tiltmeters).
- AI/ML subsidence anomaly prediction and strata risk modeling.
- Automated sensor telemetry polling and FastAPI services.

### ⌚ [Module 2: Smart Miner Safety Band & Biometrics](./src/)
- Wearable smart band monitoring vitals (heart rate, SpO2, body temperature).
- Inertial 6-axis fall detection, impact sensing, and instant manual SOS triggers.
- Web-based band emulator and Server-Sent Events (SSE) telemetry dispatch.

### 🏢 [Module 3: Command Center, Digital Mine Map & Rescue Coordination](./server/)
- **Command Dashboard**: Real-time situational awareness and KPI telemetry monitoring.
- **Interactive 2D Digital Mine Map** with vector layout, hazard overlays, and Side Detail Panel for instant inspection.
- **Central Alert Engine**: Multi-source hazard ingestion, severity normalization, and pinned critical hazards.
- **Rescue Coordination Board**: 6-step search-and-rescue (SAR) operational workflow and encrypted radio log.
- **Emergency Downlink Broadcast**: Instant audio/haptic siren dispatch to underground Smart Bands.
- **Theme**: Modern Industrial Safety Command Center.

---

## 🚀 Quick Start & Running Locally

### Prerequisites
- Node.js (v18+)
- Python (3.9+) for Module 1 AI services

### 1. Install Dependencies
```bash
npm install
npm --prefix client install
```

### 2. Run Module 3 (Command Center)
```bash
# Development mode (Backend + React Frontend)
npm run dev

# Or run backend only
npm start
```
The Command Center is available at: **http://localhost:5000** (or Vite dev on **http://localhost:5173**).

### 3. Run Module 2 (Smart Miner Safety Band Server)
```bash
npm run start:mod2
```
Access Module 2 UI at: **http://localhost:3000**

---

## 🔀 Branching & Git Workflow

This repository uses a modular branching strategy:
- `main`: Main production & integrated codebase.
- `MOD_1`: Module 1 development.
- `MODD_2`: Module 2 development.
- `MOD_3`: Module 3 development.

For detailed guidelines, see [`GIT_WORKFLOW.md`](./GIT_WORKFLOW.md).

## ⚙️ CI/CD

Automated validation runs on all pushes and PRs via GitHub Actions ([`.github/workflows/ci.yml`](./.github/workflows/ci.yml)).
