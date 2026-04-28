# UrbanMind AI — Smart City Expansion Planner

An AI-powered full-stack application that simulates 50 years of city expansion using reinforcement learning heuristics, real geospatial data, and Claude-powered planning explanations.

## Features

- 9 real-world cities (NYC, Tokyo, LA, London, Lagos, São Paulo, Singapore, Dubai, Mumbai)
- 5 planning scenarios: Maximum Growth, Balanced Sustainable, Climate Resilient, Equity Focused, Historic Pattern
- Real-time WebSocket simulation streaming zone placements year by year
- Claude API integration for plain-English zone placement explanations
- D3.js metrics dashboard with 20+ city health metrics
- User override system — pause and place zones manually
- Sandbox city generator with Perlin noise terrain
- Mapbox GL JS dark map with GeoJSON zone rendering

## Quick Start (Local, No Docker)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy env file and add your keys
cp ../.env.example .env
# Edit .env: add ANTHROPIC_API_KEY and MAPBOX_TOKEN

uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install

# Copy env file
cp .env.example .env.local
# Edit .env.local: add VITE_MAPBOX_TOKEN

npm run dev
```

Open http://localhost:3000

### With Docker Compose (requires Docker Desktop)

```bash
cp .env.example .env
# Edit .env with your API keys

docker-compose up --build
```

Open http://localhost

## Architecture

```
frontend/          React 18 + TypeScript + Vite + Mapbox GL + D3.js + Zustand
backend/           FastAPI + WebSockets + Redis cache + Pydantic
ai_engine/         SPS heuristic simulation engine (PPO-ready with SB3)
data/cities/       9 real-world city JSON profiles
data/zone_types.json  20 zone type definitions
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic Claude API key |
| `MAPBOX_TOKEN` | Mapbox public token (starts with `pk.`) |
| `REDIS_URL` | Redis connection URL (optional, uses in-memory fallback) |
| `DATABASE_URL` | PostgreSQL URL (optional for basic usage) |

## Zone Types

20 zone types across 7 categories: Residential (low/med/high), Commercial (retail/office), Industrial (light/heavy), Mixed Use, Green (park/forest), Health, Education, Infrastructure, Transport, Safety.

## Scenarios

| Scenario | Focus |
|----------|-------|
| Maximum Growth | Economic output, density, GDP |
| Balanced Sustainable | Equal weights across all metrics |
| Climate Resilient | Flood risk, green ratio, disaster preparedness |
| Equity Focused | Equitable access to services and housing |
| Historic Pattern | Extrapolates historical growth direction |

## WebSocket Protocol

| Message | Direction | Description |
|---------|-----------|-------------|
| `SIM_INIT` | Server→Client | City loaded, initial state |
| `SIM_FRAME` | Server→Client | Year update with zones + metrics |
| `SIM_COMPLETE` | Server→Client | 50-year simulation finished |
| `USER_OVERRIDE` | Client→Server | Manual zone placement |
| `SCENARIO_CHANGE` | Client→Server | Switch scenario mid-run |
| `PAUSE` / `RESUME` | Client→Server | Control playback |

## Hackathon: AI Autonomous Smart City Hackathon 2026
