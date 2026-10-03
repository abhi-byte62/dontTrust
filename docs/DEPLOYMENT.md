# DontTrust: Deployment Guide

## Docker Compose Deployment

DontTrust provides a multi-container deployment architecture.

### Services

- `api`: REST and WebSocket API gateway
- `web`: React dashboard interface
- `lab`: Benchmark application container

### One-Command Start

```bash
docker compose up --build
```

Access the dashboard at `http://localhost:3000` and API at `http://localhost:4000`.
