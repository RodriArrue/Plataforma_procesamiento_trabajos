# 🚀 Job Processing Platform

[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![BullMQ](https://img.shields.io/badge/BullMQ-6-3C873A?style=flat-square)](https://bullmq.io/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis)](https://redis.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

A robust background **job processing system** that demonstrates advanced backend architecture beyond REST APIs. Built with **NestJS**, **BullMQ**, **Redis**, and **PostgreSQL**.

## 📋 Table of Contents

- [Architecture](#-architecture)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [API Endpoints](#-api-endpoints)
- [Job Types](#-job-types)
- [Queue Features](#-queue-features)
- [Monitoring Dashboard](#-monitoring-dashboard)
- [Project Structure](#-project-structure)

## 🏗️ Architecture

```
Client (REST API)
       │
       ▼
  NestJS API ──────────► PostgreSQL
       │                  (Job persistence)
       ▼
  Redis / BullMQ Queue
       │
       ▼
    Workers
       │
       ├── 📧 Send Email
       ├── 📊 Generate Report
       ├── 🖼️  Process Image
       └── 🔔 Notifications
```

The API receives job requests, persists them in PostgreSQL, and dispatches them to a **BullMQ queue** backed by **Redis**. Workers process jobs asynchronously with automatic retries, exponential backoff, and priority handling.

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Async Processing** | Jobs are processed in background workers, freeing the API |
| **Retry with Backoff** | Exponential backoff strategy (2s → 4s → 8s) |
| **Priority Queue** | Jobs with higher priority are processed first (1-10 scale) |
| **Progress Tracking** | Real-time progress updates for long-running jobs |
| **Rate Limiting** | Maximum 10 jobs/second to prevent overload |
| **Concurrency Control** | Up to 5 concurrent workers |
| **Failed Job Management** | View, inspect, and retry failed jobs |
| **Visual Dashboard** | Bull Board UI for queue monitoring |
| **Health Checks** | Terminus-based health endpoints |
| **API Documentation** | Swagger/OpenAPI auto-generated docs |

## 🛠️ Tech Stack

- **Framework:** NestJS 11
- **Queue:** BullMQ 6
- **Broker:** Redis 7
- **Database:** PostgreSQL 16
- **ORM:** TypeORM
- **Monitoring:** Bull Board
- **Docs:** Swagger/OpenAPI
- **Container:** Docker & Docker Compose

## 🚀 Getting Started

### Prerequisites

- **Docker** & **Docker Compose** (recommended)
- Or: **Node.js 20+**, **PostgreSQL 16+**, **Redis 7+**

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/your-username/job-processing-platform.git
cd job-processing-platform

# Start all services
docker compose up -d

# The API will be available at:
# - API:        http://localhost:3000/api
# - Swagger:    http://localhost:3000/api/docs
# - Dashboard:  http://localhost:3000/queues
```

### Option 2: Local Development

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL and Redis credentials

# Start development server
npm run start:dev
```

## 📡 API Endpoints

### Jobs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/jobs` | Create a new job |
| `GET` | `/api/jobs` | List jobs (with filters & pagination) |
| `GET` | `/api/jobs/stats` | Get job statistics |
| `GET` | `/api/jobs/:id` | Get job details |
| `DELETE` | `/api/jobs/:id` | Cancel a pending job |
| `POST` | `/api/jobs/:id/retry` | Retry a failed job |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/docs` | Swagger documentation |
| `GET` | `/queues` | Bull Board dashboard |

## 📨 Job Types

### 1. Send Email (`SEND_EMAIL`)

```json
{
  "type": "SEND_EMAIL",
  "payload": {
    "to": "user@example.com",
    "subject": "Welcome!",
    "body": "Hello from Job Processing Platform"
  },
  "priority": 5
}
```

### 2. Generate Report (`GENERATE_REPORT`)

```json
{
  "type": "GENERATE_REPORT",
  "payload": {
    "reportType": "monthly-sales",
    "dateRange": { "from": "2024-01-01", "to": "2024-12-31" },
    "format": "pdf"
  },
  "priority": 8
}
```

### 3. Process Image (`PROCESS_IMAGE`)

```json
{
  "type": "PROCESS_IMAGE",
  "payload": {
    "imageUrl": "https://example.com/photo.jpg",
    "operations": ["resize", "compress", "watermark"]
  },
  "priority": 5
}
```

### 4. Notification (`NOTIFICATION`)

```json
{
  "type": "NOTIFICATION",
  "payload": {
    "userId": "user-123",
    "channel": "push",
    "title": "New message",
    "message": "You have a new order"
  },
  "priority": 1
}
```

## ⚙️ Queue Features

### Exponential Backoff

```
Attempt 1: Immediate
Attempt 2: Wait 2 seconds
Attempt 3: Wait 4 seconds
Attempt 4: Wait 8 seconds
```

### Priority System

| Priority | Level | Example |
|----------|-------|---------|
| 1 | 🔴 Critical | Notifications |
| 5 | 🟡 Normal | Emails |
| 10 | 🟢 Low | Reports |

### Job Lifecycle

```
PENDING → PROCESSING → COMPLETED ✅
                     → RETRYING → PROCESSING (retry)
                     → FAILED ❌ (after max attempts)
```

## 📊 Monitoring Dashboard

Access the **Bull Board** dashboard at `http://localhost:3000/queues` to:

- View all queues and their status
- Inspect individual jobs (payload, result, errors)
- Retry failed jobs directly from the UI
- Monitor queue metrics in real-time

## 📁 Project Structure

```
src/
├── main.ts                          # Application entry point
├── app.module.ts                    # Root module
├── config/
│   ├── database.config.ts           # TypeORM configuration
│   └── redis.config.ts              # Redis/BullMQ configuration
├── common/
│   ├── enums/
│   │   ├── job-type.enum.ts         # Job type definitions
│   │   └── job-status.enum.ts       # Job status definitions
│   ├── filters/
│   │   └── http-exception.filter.ts # Global exception handler
│   └── interceptors/
│       └── transform.interceptor.ts # Response transformation
└── modules/
    ├── jobs/
    │   ├── jobs.module.ts
    │   ├── jobs.controller.ts       # REST endpoints
    │   ├── jobs.service.ts          # Business logic
    │   ├── dto/
    │   │   ├── create-job.dto.ts    # Create job validation
    │   │   └── query-jobs.dto.ts    # Query filters validation
    │   └── entities/
    │       └── job.entity.ts        # TypeORM entity
    ├── queue/
    │   ├── queue.module.ts
    │   ├── queue.service.ts         # Queue management
    │   └── processors/
    │       └── job.processor.ts     # Job workers
    └── health/
        ├── health.module.ts
        └── health.controller.ts     # Health checks
```

## 📝 License

This project is [UNLICENSED](LICENSE).
