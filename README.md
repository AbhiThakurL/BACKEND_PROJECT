# 🚀 Advanced  Backend (Production Ready)

A high-performance, scalable backend solution for property management, focusing on **data integrity**, **optimized performance** .



## 🛡️ Technical Highlights

### 1. Atomic Transactions (ACID Compliance)
Handled complex multi-document updates using **MongoDB Sessions**. When creating a 'Home' with multiple 'Rooms', the system ensures an "all-or-nothing" approach to prevent orphaned data or partial writes.

### ⚡ 2. Surgical Redis Caching
Implemented a custom caching layer to reduce DB latency and improve response times.
- **Tracking Keys:** Uses Redis Sets to track user-specific cache keys.
- **Automated Invalidation:** Automatically clears relevant cache on data updates (Create/Update/Delete) to ensure data freshness.

### 📊 3. Complex Aggregations
Utilized MongoDB Aggregation Pipelines for:
- **Deep-nested Lookups:** Fetching Owner -> Homes -> Rooms in a single query.
- **Real-time Analytics:** Calculating room counts and property distribution per owner.



## 🐳 Dockerization (DevOps Ready)
The entire stack is containerized for seamless deployment.
- **Multi-Container Setup:** Orchestrates Node.js, MongoDB (with Replica Set for Transactions), and Redis.
- **Persistent Storage:** Volumes configured for databases to ensure data safety across restarts.

## 🛠️ Tech Stack
- **Runtime:** Node.js (Express.js)
- **Language:** TypeScript
- **Database:** MongoDB (Mongoose)
- **Caching:** Redis
- **Containerization:** Docker & Docker Compose
- **Security:** JWT (Access & Refresh Tokens), Bcrypt

---

## 📁 Project Structure
```text
src/
├── config/         # Database, Redis & Environment configs
├── controllers/    # Business logic (Owner, Home, Room)
├── models/         # Mongoose Schemas & TypeScript Interfaces
├── routes/         # API Route definitions
├── middlewares/    # Auth, Error handling & Validations
└── types/          # Global TypeScript declarations
