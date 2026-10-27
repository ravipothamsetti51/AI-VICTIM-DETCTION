# AeroSentry // AI Disaster-Response Command Center

> **NASA Mission Control meets 911 Emergency Dispatch**  
> Tactical disaster-response command application integrating drone aerial reconnaissance, real-time YOLOv8 victim detection, Express & MongoDB telemetry, and a high-contrast React GIS dashboard.

---

## ⚡ System Pipeline

```
Drone Camera → Image/Video Upload → Python AI Service (OpenCV + YOLOv8) 
  → Detection Results (bounding boxes + confidence + GPS) 
  → Node.js/Express API → MongoDB 
  → React Dashboard (map + alerts + mission tracking) 
  → Rescue Team Action
```

---

## 🛠️ Tech Stack (Direct Host Execution - No Docker)

| Layer | Technology |
|---|---|
| **Frontend** | React 19 (Vite), Tailwind CSS, React Router v7, Leaflet + React-Leaflet, Recharts, Lucide React |
| **Backend** | Node.js, Express.js, Mongoose, JWT, bcryptjs, Multer, Axios, embedded MongoDB fallback |
| **AI Microservice** | Python 3.9+, FastAPI, Ultralytics YOLOv8, OpenCV, NumPy, Pillow, Uvicorn |
| **Database** | MongoDB (supports local MongoDB or high-speed automated embedded fallback) |

---

## 🚀 Quick Start (1-Click Launcher)

### Option A: Windows Batch Launcher
Double-click `start-all.bat` or run:
```cmd
start-all.bat
```

### Option B: PowerShell Launcher
```powershell
.\start-all.ps1
```

---

## 💻 Manual Step-by-Step Launch (3 Terminals)

If you prefer running each service in your own terminal tabs:

### 1. Terminal 1: Python YOLOv8 AI Service (Port 8000)
```bash
cd ai-service
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
*Verify:* Open [http://localhost:8000/health](http://localhost:8000/health)

---

### 2. Terminal 2: Node.js Express REST API (Port 5000)
```bash
cd backend
npm install
npm run dev
```
> **Database Note:** If you do not have MongoDB running on port 27017, the backend automatically spins up an embedded in-memory MongoDB server and seeds it with demo operations, UAV drones, and triage records immediately!

*Verify:* Open [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

### 3. Terminal 3: React Vite Command UI (Port 5173)
```bash
cd frontend
npm install
npm run dev
```
*Access UI:* Open [http://localhost:5173](http://localhost:5173)

---

## 🔑 Pre-Configured Tactical Credentials

The system includes instant **1-click login buttons** on the login screen for rapid evaluator testing:

| Role | Callsign | Email | Password | Clearance Permissions |
|---|---|---|---|---|
| **Administrator** | Cmdr. Sarah Vance | `admin@aerosentry.io` | `Admin@123` | Full theater authority, user role administration, mission commissioning |
| **Flight Operator** | Marcus Chen | `operator@aerosentry.io` | `Operator@123` | UAV fleet dispatch, mission planning, status modifications |
| **Field Rescuer** | Elena Rostova | `rescuer@aerosentry.io` | `Rescuer@123` | Casualty triage, status confirmation (`confirmed`, `rescued`), ground SAR |

---

## 📸 Test Reconnaissance Imagery

Test drone aerial images ready for upload and YOLO inference are located in `sample-imagery/`:
- `sample-imagery/drone_recon_alpha.jpg` (2 victims in rubble)
- `sample-imagery/drone_recon_bravo.jpg` (1 victim in sector)
- `sample-imagery/drone_recon_charlie.jpg` (3 victims in collapsed grid)

Click **"UPLOAD RECON"** in the top navigation bar, drop any of these images, set your GPS coordinates, and observe real-time YOLOv8 bounding boxes and emergency alerts generated!

---

## 🗺️ Key Features & Pages

1. **Tactical Dashboard (`/dashboard`)**:
   - Defcon threat status & UTC live mission clock
   - KPI telemetry cards: Active Missions, Drones Online, Unconfirmed Victims, Casualty Extractions
   - Recharts analytics: 7-day YOLO detection timeline, Triage donut ratio
   - Live Emergency Alerts ticker with 1-click acknowledgement
2. **GIS Live Tactical Map (`/map`)**:
   - Dark satellite-style Leaflet map
   - Drone markers with pulsing radar rings, battery %, and telemetry
   - Disaster zone epicenter circles (Earthquake, Flood, Structural Collapse)
   - Color-coded victim detection pins (`unconfirmed` red, `confirmed` amber, `rescued` emerald)
   - Interactive popups with reconnaissance photo thumbnails and triage actions
3. **Mission Control (`/missions`)**:
   - Multi-UAV fleet assignment
   - Operational phase lifecycle (`planning` → `active` → `completed` / `aborted`)
   - Role-based permissions (Rescuers have read-only view)
4. **UAV Fleet Telemetry (`/drones`)**:
   - Live battery level monitoring with automatic critical low-battery alerts (<= 20%)
   - Command overrides (`DEPLOY`, `RTH`, `STANDBY`, `OFFLINE`)
   - Commission new UAVs
5. **AI Reconnaissance & Casualty Triage (`/detections`)**:
   - Drag & drop drone imagery dropzone
   - Side-by-side inspection: Raw optical sensor frame vs AI HUD annotated frame
   - YOLOv8 bounding box coordinates & confidence percentages
   - Ground triage status updates (`CONFIRM`, `RESCUED`, `REJECT`)
6. **Alert Dispatch Matrix (`/alerts`)**:
   - Critical, high, medium, and low priority filters
   - Instant acknowledgement and dismissal
7. **Personnel Registry (`/users`)**:
   - Admin-only access guard
   - Role elevation and security clearance changes
