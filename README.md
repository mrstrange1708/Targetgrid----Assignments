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

## Technical Architecture & Design Decisions

### 1. Event-Driven Architecture
The system is built using an asynchronous, non-blocking architecture:
- **Ingestion**: API endpoints (`/api/events`, `/api/webhook`) accept payloads and immediately push them to a **BullMQ** queue (backed by Redis). This ensures high throughput and low latency for the sender.
- **Processing**: A decoupled **Event Worker** listens to the queue and processes events in the background. This allows the system to scale horizontally and handle traffic spikes without affecting UI responsiveness.
- **Real-time Updates**: Once an event is processed and a score is updated, the server emits a `score-update` event via **WebSockets (Socket.IO)** to reflect changes in the frontend immediately.

### 2. Idempotency Handling
To prevent duplicate processing of the same event (e.g., due to network retries), every event requires a unique `eventId`.
- Before processing, the worker checks the `Event` collection in MongoDB for the existence of the `eventId`.
- If an event is already found and marked as `processed`, the worker skips it, maintaining score integrity even if the same payload is sent multiple times.

### 3. Event Ordering & Out-of-Order Handling
Handling "true" out-of-order events is achieved through two mechanisms:
- **Timestamp Priority**: The scoring logic uses the provided `timestamp` from the event metadata rather than the arrival time. 
- **Event Replay (Recalculation)**: When rules change or events arrive significantly out of order, the **Event Replay** utility can be triggered. This wipes current scores and re-processes the entire event history in strict chronological order based on event timestamps, ensuring the final score calculation is deterministic and correct.

### 4. Configurable Scoring Rules
Rules are never hardcoded. They are stored in the database and can be status-toggled or adjusted via the UI. At startup, the system seeds a default set of rules if none exist, but the engine fetches the latest active rule for an `event_type` from the database at the moment of processing.

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

## Advanced Features
- **Score Decay**: Background worker automatically reduces scores for inactive leads (configurable).
- **Event Replay**: High-privilege endpoint to recalculate scores from full historical event logs.
- **Negative Scoring**: Support for point deductions (e.g., `REFUND`).
- **Webhook Security**: HMAC-SHA256 signature verification for external webhooks.
- **Schema Validation**: payload enforcement using Joi.

## Testing
The project uses **Jest** for unit and integration testing.

```bash
# In server directory
npm test
```
The tests cover:
- **Unit Tests**: Scoring algorithm correctness (capping, negative points).
- **Integration Tests**: Event worker logic, idempotency (deduplication), and lead identification.
- **Service Tests**: Analytics and rule management.

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
