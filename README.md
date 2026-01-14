# Event-Driven Lead Scoring System

## Overview
The Event-Driven Lead Scoring System is a real-time, scalable application designed to evaluate and rank sales leads based on their interactions across multiple touchpoints. The system ingests behavioral and transactional events—such as page views, email opens, form submissions, demo requests, and purchases—and dynamically recalculates lead scores using an asynchronous event-driven architecture.

## Tech Stack
- **Frontend**: React (Vite), Tailwind CSS, Recharts, Lucide React, Socket.io-client.
- **Backend**: Node.js, Express, MongoDB (Mongoose), Redis, BullMQ (Queue Management), Socket.io.
- **Testing**: Jest, Supertest.

## Features
- **Event Ingestion**: Supports REST API, Webhooks, and Batch CSV uploads.
- **Real-time Scoring**: Asynchronous processing using BullMQ and Redis.
- **Leaderboard**: Live dashboard showing top leads and scoring trends.
- **Idempotency & Ordering**: Ensures events are processed once and in the correct sequence.
- **Analytics**: Visualization of activity trends and company distributions using Recharts.

---

## Setup & Installation

### Prerequisites
- Node.js (v18+)
- MongoDB
- Redis Server

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Targetgrid-Assignments
```

### 2. Backend Setup
```bash
cd server
cp .env.example .env
npm install
```
Edit `.env` to match your local configuration:
- `MONGO_URI`: Your MongoDB connection string.
- `REDIS_HOST`: Localhost (default).
- `PORT`: 7777 (default).

**Seed initial rules and data:**
```bash
npm run dev # Rules are automatically seeded on startup
# Optional: Run seed script for sample leads/events
npx ts-node src/seedData.ts
```

### 3. Frontend Setup
```bash
cd ../client
cp .env.example .env
npm install
```
Edit `.env`:
- `VITE_API_BASE_URL`: http://localhost:7777

### 4. Running the Application
**Start Backend:**
```bash
# In server directory
npm run dev
```
**Start Frontend:**
```bash
# In client directory
npm run dev
```

---

## Event Ingestion

### Single Event (REST API)
**Endpoint**: `POST /api/events`
**Body Example:**
```json
{
  "event_type": "PURCHASE",
  "source": "manual",
  "metadata": {
    "email": "alice@microsoft.com",
    "name": "Alice Johnson"
  }
}
```

### Batch Upload
You can use the provided [sample_batch.csv] in the **Event Upload** tab of the dashboard.

### Webhooks
**Endpoint**: `POST /api/webhook`
The system accepts structured payloads representing external service integrations.

---

## Testing
The project uses **Jest** for unit and integration testing.

```bash
# In server directory
npm test
```
The tests cover:
- Event worker logic.
- Scoring correctness.
- Idempotency checks.

---

## Scoring Rules
| Event Type | Points |
| :--- | :--- |
| **EMAIL_OPEN** | +10 |
| **PAGE_VIEW** | +5 |
| **FORM_SUBMISSION** | +20 |
| **DEMO_REQUEST** | +50 |
| **PURCHASE** | +100 |

*Rules are configurable via the `Rules` section in the UI.*
