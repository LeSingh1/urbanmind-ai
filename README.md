# UrbanMind AI

> AI-powered smart city expansion planner for the AI Autonomous Smart City Hackathon 2026.

[Demo Video Link] | [Live Demo] | [Documentation]

## What It Does

UrbanMind AI helps planners explore how real cities can expand over the next 50 years. It combines live city maps, zoning constraints, infrastructure placement, growth metrics, and AI-generated planning explanations into one interactive simulation.

The app lets a user select one of nine global cities, choose a planning scenario, and watch an autonomous agent place housing, roads, services, utilities, parks, and resilience infrastructure year by year. The map, metrics, charts, timeline, and AI decision history update as the simulation runs.

The impact is a faster way to compare urban futures. Planners can test growth-first, equity-first, climate-resilient, historic, and balanced strategies, then export a professional report that explains tradeoffs in population, mobility, emissions, green space, infrastructure load, and public-service coverage.

## Quick Start

```bash
git clone https://github.com/yourusername/urbanmind-ai
cd urbanmind-ai
cp .env.example .env
# Add ANTHROPIC_API_KEY and MAPBOX_TOKEN to .env
docker-compose up
# Open http://localhost
```

## Tech Stack

React, TypeScript, Vite, Mapbox GL, D3, Zustand, Framer Motion, Python, FastAPI, PostgreSQL/PostGIS, Redis, RQ, MinIO, Docker Compose, OSMnx, GeoPandas, PyTorch, Stable Baselines3, Anthropic Claude.

## AI Architecture

UrbanMind AI is structured around a reinforcement-learning simulation loop. The agent observes a geospatial grid, existing roads, terrain suitability, city metrics, and scenario weights, then chooses the next zone or infrastructure placement. Phase 2 provides the AI-engine foundation for PPO-style optimization, constraint validation, road generation, demand forecasting, and population modeling.

The backend streams each simulation frame through Redis and WebSockets. The frontend renders those frames as Mapbox layers and D3 analytics. Claude powers the narrative layer: hover explanations, annual summaries, decision history, report summaries, and recommendations.

## Features

- Real-city planning for New York, Los Angeles, Tokyo, Lagos, London, Sao Paulo, Singapore, Dubai, and Mumbai
- Year-by-year WebSocket simulation playback
- Mapbox zones, roads, heatmaps, and 3D building extrusions
- Scenario selector for balanced, max growth, climate resilient, equity focused, and historic plans
- Six live D3 dashboard charts
- AI decision tooltips and explanation drawer
- Split-screen scenario comparison
- Procedural sandbox city generator
- ReportLab PDF export
- Keyboard navigation, ARIA labels, and color-blind-friendly secondary cues

## Screenshots

- Landing and city gallery
- Tokyo simulation map
- Analytics dashboard
- AI explanation tooltip
- Split-screen comparison
- Sandbox terrain generator
- PDF report export

## Hackathon Category

Smart Traffic and Mobility, Smart Energy Management, Urban Healthcare, and Public Safety Infrastructure.

## Team

See `members.csv` for team roster details.

## License

MIT

## Demo Video Script

0:00-0:30: Show Tokyo at Year 2074 and introduce the 50-year planning question.

0:30-1:20: Open the gallery, select Lagos, and choose the Equity Focused scenario.

1:20-2:30: Run playback at 10x. Pause at Year 20 and hover a hospital placement to show the AI explanation.

2:30-3:15: Demonstrate a manual override and show how metrics respond.

3:15-4:00: Open the dashboard and explain the population timeline, radar chart, and infrastructure scatter.

4:00-4:30: Compare Equity Focused against Max Growth in split-screen mode.

4:30-5:00: Generate a coastal sandbox city, start the simulation, and export the PDF report.
