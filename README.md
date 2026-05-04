# ThreatFlow
A lightweight, modern, SOAR-like platform for security operations and threat intelligence automation. Built natively with FastAPI and React (Vite).

## Features
- **Flexible IOC Intake**: Paste raw logs/emails and automatically extract IPs, Domains, Hashes, and URLs.
- **Automated Intelligence**: Enriches observables against VirusTotal, AbuseIPDB, and IPInfo simultaneously.
- **Risk Scoring**: Implements custom weighing logic to calculate a definitive 0-100 score and assign severity levels.
- **Dashboard & Reporting**: Features dynamic ingestion timelines with Recharts and one-click PDF generation via ReportLab.

## Prerequisites
- Python 3.10+
- Node.js 18+

## Setup Instructions

### 1. Backend Setup
1. Open terminal in the `backend` directory.
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Copy the env template and customize the keys (if you have them):
   ```bash
   cp .env.example .env
   ```
   > *Note: ThreatFlow gracefully handles empty API keys by returning "skipped" tags, ensuring you can still run extraction and basic tests without paid/registered keys.*
4. Start the server:
   ```bash
   uvicorn main:app --reload
   ```
   API Docs will be available at: http://localhost:8000/docs

### 2. Frontend Setup
1. Open terminal in the `frontend` directory.
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```

## Architecture
- **Backend (FastAPI)**: Operates on async SQLAlchemy models. Routes are modularized into `iocs`, `enrichment`, `reports`, and `dashboard`. Core correlation and extraction logic is decoupled into the `services/` layer.
- **Frontend (React)**: Bootstrapped dynamically with Vite, managed globally via Zustand, and stylized intimately with TailwindCSS using a sophisticated Slate/Indigo UI palette. Components leverage Lucide-react for iconography.

## Getting API Keys
- **VirusTotal**: Available free by signing up on virustotal.com.
- **AbuseIPDB**: Register for a free API key for 1,000 checks/day limit.
- **IPInfo**: Create a developer account for an access token to bypass the lowest rate limiting tiers.
