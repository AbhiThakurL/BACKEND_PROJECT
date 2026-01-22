A high-performance, scalable backend solution for property management, focusing on **data integrity** and **optimized performance**.

## 🛡️ Technical Highlights

### 1. Atomic Transactions (ACID Compliance)
Handled complex multi-document updates using **MongoDB Sessions**. When creating a 'Home' with multiple 'Rooms', the system ensures an "all-or-nothing" approach to prevent orphaned data.

### ⚡ 2. Surgical Redis Caching
Implemented a custom caching layer to reduce DB latency.
- **Tracking Keys:** Uses Redis Sets to track user-specific cache keys.
- **Automated Invalidation:** Automatically clears relevant cache on data updates to ensure data freshness.

### 📊 3. Complex Aggregations
Utilized MongoDB Aggregation Pipelines for:
- Deep-nested Lookups (Owner -> Homes -> Rooms).
- Real-time room counting and property analytics.

## 🛠️ Tech Stack
- **Runtime:** Node.js (Express.js)
- **Language:** TypeScript
- **Database:** MongoDB (Mongoose)
- **Caching:** Redis
- **Security:** JWT (Access & Refresh Tokens), Bcrypt

## 📁 Project Structure
