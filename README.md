# Turn Pro Poker

Live Poker Bankroll Management App

## Quick Start

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
python -m uvicorn app.main:app --reload
```

API docs: http://localhost:8000/docs

## Features

- Session tracking with profit/loss calculations
- Bankroll management (deposits/withdrawals)
- Statistics (BB/100, $/hour, win rate)
- JWT authentication
- Subscription tiers (Free/Premium/Pro)

## Tech Stack

- FastAPI + SQLAlchemy 2.0
- PostgreSQL (prod) / SQLite (dev)
- Pydantic for validation
- JWT authentication
