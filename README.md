# Thermal-X

**Thermal-X** is a geospatial thermal-anomaly intelligence platform for detecting, clustering, contextualizing, classifying, and prioritizing potential industrial and environmental fire events.

It is designed as a prototype for **Smart India Hackathon (SIH) Problem Statement 26162**, with a focus on satellite-derived thermal observations, explainable event classification, infrastructure context, baseline comparison, analyst review, and GIS visualization.

> **Current project status:** This repository is a prototype/demo application. The current persistence layer uses a JSON data file, not a production database. Some external-data integrations and satellite/context features are intentionally simplified or simulated.

---

## Table of Contents

- [What Thermal-X Does](#what-thermal-x-does)
- [Core Pipeline](#core-pipeline)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [Production Build](#production-build)
- [NASA FIRMS Setup](#nasa-firms-setup)
- [Deployment](#deployment)
- [Important Deployment Note](#important-deployment-note)
- [API Routes](#api-routes)
- [Data and Processing](#data-and-processing)
- [Security Notes](#security-notes)
- [Known Limitations](#known-limitations)
- [Recommended Production Improvements](#recommended-production-improvements)
- [License](#license)

---

## What Thermal-X Does

Thermal-X turns satellite thermal observations into actionable geospatial events.

The application combines:

- NASA FIRMS thermal observations
- Spatial and temporal clustering
- Fire radiative power (FRP)
- Brightness temperature
- Detection confidence
- Persistence and recurrence
- Facility/infrastructure proximity
- Contextual land-use information
- Baseline deviation
- Explainable rule-based classification
- Multi-factor priority scoring
- Analyst review
- Alerts
- GIS visualization
- Analytics and reporting
- Data export

The goal is not simply to display satellite hotspots, but to convert individual observations into **interpretable events with context and priority**.

---

## Core Pipeline

```text
NASA FIRMS / Demo Data
          |
          v
   Thermal Observations
          |
          v
 Spatial + Temporal Clustering
          |
          v
     Feature Extraction
          |
          +----------------------+
          |                      |
          v                      v
 Infrastructure / Context     Historical Baselines
          |                      |
          +----------+-----------+
                     |
                     v
          Explainable Classifier
                     |
                     v
             Priority Scoring
                     |
                     v
          Event / Alert Creation
                     |
                     v
          GIS Dashboard + Review
                     |
                     v
             Reports / Export
```

---

## Features

### GIS Dashboard

- Interactive map
- Thermal-event visualization
- Event clustering
- Event detail drawer
- Geographic filtering
- Facility/infrastructure context

### Event Intelligence

Events can be classified into categories such as:

- `industrial_fire`
- `persistent_industrial`
- `gas_flare`
- `wildfire`
- `agricultural_burning`
- `mining_activity`
- `uncertain`

Classification is based on explainable features and rules rather than an opaque black-box prediction.

### Analytics

The application provides:

- Event statistics
- Classification breakdown
- Priority information
- Temporal analysis
- Baseline comparison
- Validation information

### Analyst Review

Events can be reviewed and their review state recorded through the application.

### Alerts

The project includes alert handling and read/unread state management.

### Reports and Export

The application includes reporting and export functionality for analysis and presentation.

### Demo Mode

Thermal-X contains built-in demo scenarios so the application can be demonstrated without a live NASA FIRMS key.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 |
| UI | React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Maps | Leaflet + MarkerCluster |
| Charts | Recharts |
| State | Zustand / React Context |
| HTTP | Axios |
| Dates | date-fns |
| PDF | jsPDF |
| CSV | PapaParse |
| Testing | Jest + ts-jest |
| Runtime | Node.js |

---

## Project Structure

```text
thermal-x/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── alerts/
│   │   │   ├── analytics/
│   │   │   ├── events/
│   │   │   ├── export/
│   │   │   ├── facilities/
│   │   │   ├── firms/
│   │   │   ├── ingest/
│   │   │   ├── observations/
│   │   │   ├── status/
│   │   │   └── validation/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── Alert/
│   │   ├── Analytics/
│   │   ├── Events/
│   │   ├── Export/
│   │   ├── Filters/
│   │   ├── Map/
│   │   ├── ...
│   │   └── ValidationView.tsx
│   │
│   ├── contexts/
│   │   └── AlertContext.tsx
│   │
│   ├── lib/
│   │   ├── data/
│   │   │   └── demoData.ts
│   │   ├── db/
│   │   │   ├── index.ts
│   │   │   ├── migrate.ts
│   │   │   └── seed.ts
│   │   └── services/
│   │       ├── baselines.ts
│   │       ├── classifier.ts
│   │       ├── clustering.ts
│   │       ├── context.ts
│   │       ├── export.ts
│   │       ├── features.ts
│   │       ├── firms.ts
│   │       ├── infrastructure.ts
│   │       ├── priority.ts
│   │       └── reports.ts
│   │
│   ├── tests/
│   │   └── core.test.ts
│   │
│   └── types/
│       └── index.ts
│
├── thermal-x-data.json
├── package.json
├── package-lock.json
├── .env.example
├── .gitignore
└── next.config.js
```

---

## Prerequisites

Install:

- **Node.js 20+**
- npm
- Git

Check your versions:

```bash
node -v
npm -v
git --version
```

---

## Local Setup

### 1. Clone the repository

```bash
git clone YOUR_REPOSITORY_URL
cd thermal-x
```

### 2. Install dependencies

```bash
npm install
```

Do not commit the generated `node_modules` directory.

### 3. Create `.env.local`

Copy the example:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

For a simple demo/local run:

```env
FIRMS_API_KEY=
DATABASE_PATH=./thermal-x-data.json
DEMO_MODE=true
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Environment Variables

| Variable | Required | Description |
|---|---:|---|
| `FIRMS_API_KEY` | Only for live FIRMS | NASA FIRMS MAP_KEY |
| `DATABASE_PATH` | Recommended | Path to the JSON persistence file |
| `DEMO_MODE` | Yes | `true` for demo data, `false` for live operation |
| `NEXT_PUBLIC_APP_URL` | Recommended | Public/local application URL |

### Local demo configuration

```env
FIRMS_API_KEY=
DATABASE_PATH=./thermal-x-data.json
DEMO_MODE=true
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Live configuration

```env
FIRMS_API_KEY=YOUR_NASA_FIRMS_MAP_KEY
DATABASE_PATH=/data/thermal-x-data.json
DEMO_MODE=false
NEXT_PUBLIC_APP_URL=https://YOUR-DOMAIN
```

Do **not** commit `.env.local` or real API keys.

---

## Running the Application

### Development

```bash
npm run dev
```

### Production build

```bash
npm run build
```

### Production server

```bash
npm start
```

The normal production workflow is:

```text
npm install
    ↓
npm run build
    ↓
npm start
```

---

## Testing

Run the test suite:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

The current tests cover important analytical components including clustering, feature extraction, classification, priority scoring, and related core behavior.

---

## Database / Persistence

The current application uses:

```text
thermal-x-data.json
```

as its persistence layer.

This is suitable for a prototype/demo, but it is **not a production-grade multi-user database**.

The project also contains migration/seed scripts:

```bash
npm run db:migrate
npm run db:seed
```

Before relying on these scripts in production, verify that the current implementation and deployment storage match your intended persistence architecture.

### Important

The environment variable:

```env
DATABASE_PATH=...
```

should point to the actual JSON persistence file.

For local development:

```env
DATABASE_PATH=./thermal-x-data.json
```

For a persistent hosted volume:

```env
DATABASE_PATH=/data/thermal-x-data.json
```

---

## NASA FIRMS Setup

Thermal-X can use NASA FIRMS for live thermal observations.

NASA FIRMS:

https://firms.modaps.eosdis.nasa.gov/

Create/get a **FIRMS MAP_KEY** and place it in:

```env
FIRMS_API_KEY=YOUR_MAP_KEY
```

Do not expose the key in client-side React code.

### Demo mode

If you only want to demonstrate the application:

```env
DEMO_MODE=true
```

You can then run the project without a live FIRMS key.

### Live mode

For live FIRMS operation:

```env
DEMO_MODE=false
FIRMS_API_KEY=YOUR_MAP_KEY
```

---

## Deployment

### Recommended deployment for the current architecture

Because the current persistence layer writes to a JSON file, use a hosting environment with **persistent storage**.

A suitable prototype deployment architecture is:

```text
GitHub
   |
   v
Render Web Service
   |
   +---- Next.js
   |
   +---- Persistent Disk
              |
              v
      thermal-x-data.json
```

### Build command

```bash
npm install && npm run build
```

### Start command

```bash
npm start
```

### Production environment

```env
FIRMS_API_KEY=YOUR_NASA_FIRMS_MAP_KEY
DATABASE_PATH=/data/thermal-x-data.json
DEMO_MODE=false
NEXT_PUBLIC_APP_URL=https://YOUR-DOMAIN
```

Mount the persistent disk at:

```text
/data
```

so that:

```text
/data/thermal-x-data.json
```

survives application restarts and redeployments.

---

## API Routes

The current application exposes the following API areas.

| Route | Purpose |
|---|---|
| `/api/alerts` | Alert retrieval/management |
| `/api/alerts/[id]/read` | Mark an alert as read |
| `/api/analytics` | Analytics data |
| `/api/events` | Event retrieval |
| `/api/events/[id]` | Individual event |
| `/api/events/[id]/review` | Event review |
| `/api/export` | Data export |
| `/api/facilities` | Facility data |
| `/api/facilities/[id]` | Individual facility |
| `/api/firms/sync` | FIRMS synchronization |
| `/api/ingest` | Observation/event ingestion |
| `/api/observations` | Thermal observations |
| `/api/status` | System status |
| `/api/validation` | Validation information |

---

## Data and Processing

### Spatial and temporal clustering

Thermal observations are grouped using geographic and temporal relationships to convert individual satellite detections into candidate events.

### Feature extraction

The system derives features such as:

- FRP
- Brightness temperature
- Confidence
- Persistence
- Recurrence
- Spatial concentration
- Temporal behavior
- Facility proximity
- Contextual information

### Classification

The classifier uses explainable rules to distinguish different event types.

### Baselines

Historical/event context is used to identify deviations from expected behavior.

### Priority scoring

Events are assigned a priority using multiple factors rather than relying on a single satellite measurement.

### Human review

Analysts can review events and record review outcomes.

---

## Security Notes

### Never commit secrets

Do not commit:

```text
.env.local
```

or files containing real API keys.

Verify before pushing:

```bash
git status
```

You can also check whether Git is tracking `.env.local`:

```bash
git ls-files .env.local
```

The command should return no output.

### If a key has already been exposed

Rotate the affected credential through the provider before using the repository publicly.

---

## Known Limitations

This version is a prototype and has several limitations that should be understood before treating it as a production platform.

### JSON persistence

The application currently stores persistent data in a JSON file.

This is not appropriate for:

- high-concurrency writes
- multiple application instances
- large datasets
- transactional workloads
- enterprise-scale production

### External-data coverage

Some contextual/satellite capabilities are simplified for the prototype and should not be interpreted as a complete operational remote-sensing pipeline.

### Validation

The project includes validation functionality, but a proper large-scale ground-truth dataset is still required for authoritative model-performance metrics.

### Satellite pass information

Satellite-pass/prediction functionality should be treated as prototype functionality unless connected to a verified orbital-data pipeline.

### Security

Authentication, authorization, rate limiting, and production-grade API protection should be added before exposing administrative endpoints to an unrestricted public audience.

---

## Recommended Production Improvements

For a production-grade Thermal-X deployment, the next architectural steps are:

### 1. Replace JSON persistence

Move from:

```text
thermal-x-data.json
```

to:

```text
PostgreSQL
```

with appropriate indexes and transactional writes.

### 2. Add authentication

Protect:

- event review
- synchronization
- administrative operations
- configuration
- reports containing sensitive operational information

### 3. Add API rate limiting

Especially protect:

```text
/api/firms/sync
```

to prevent repeated external API requests.

### 4. Add scheduled ingestion

Instead of relying entirely on manual synchronization:

```text
Scheduled Job
     |
     v
NASA FIRMS
     |
     v
Deduplication
     |
     v
Clustering
     |
     v
Classification
     |
     v
Database
```

### 5. Add monitoring

Recommended:

- structured logs
- error tracking
- health checks
- sync status
- last successful ingestion time
- external API failure status

### 6. Separate demo and production data

Maintain clearly separated:

```text
DEMO DATA
```

and

```text
LIVE DATA
```

so users can immediately tell which dataset is being displayed.

---

## Recommended SIH Demo Flow

For a live demonstration:

```text
1. Open Thermal-X dashboard
          ↓
2. Show GIS thermal events
          ↓
3. Select a suspicious event
          ↓
4. Show event features
          ↓
5. Show nearby infrastructure/context
          ↓
6. Show classification explanation
          ↓
7. Show priority score
          ↓
8. Show historical/baseline comparison
          ↓
9. Review/validate the event
          ↓
10. Generate/export a report
```

This demonstrates the complete journey from **satellite observation → intelligence → decision support**.

---

## Development Scripts

Available npm commands:

```bash
npm run dev
npm run build
npm start
npm test
npm run test:watch
npm run lint
npm run db:migrate
npm run db:seed
```

---

## License

This project does not currently specify an open-source license.

If you intend to publish the repository publicly, add an appropriate `LICENSE` file and clearly define the permitted use of the source code.

---

## Disclaimer

Thermal-X is a research/prototype decision-support application. Satellite thermal detections can contain uncertainty, false positives, spatial/temporal limitations, and classification ambiguity.

The system should therefore be used as an **analytical and decision-support tool**, not as a sole source for operational or emergency decisions.
