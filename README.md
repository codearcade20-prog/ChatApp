# WhatsApp Mini Automation Platform

A mini WhatsApp-like messaging automation platform built using the **MERN Stack** (React, Express, Node.js, MongoDB Atlas) with **Secure User Authentication (JWT + Bcrypt)**, a **High-Availability Asymmetric Queue System** (MongoDB-backed custom FIFO Queue & BullMQ/Redis worker), and **Real-Time Sockets synchronisation** (Socket.IO).

---

## 🏗️ Architecture & Workflows

### Tech Stack
*   **Frontend**: React.js, Axios, Socket.IO Client, Custom CSS (Premium Glassmorphism Dark Theme).
*   **Backend**: Node.js, Express.js (REST API & Webhooks), Socket.IO, Dotenv.
*   **Database**: MongoDB (Atlas Cloud) and Mongoose ODM.
*   **Authentication**: JWT & bcryptjs (password hashing).
*   **Queueing**: Hybrid Sequential Queue (Custom MongoDB FIFO Queue + optional BullMQ/Redis).

### Project Workflows
```text
[User Register/Login] ➜ [Send Message] ➜ [Stored as "pending" in DB] ➜ [Pushed to Queue]
                                                                                ↓
[Live UI Updates to "delivered"] 🔀 [Simulate Webhook] 🔀 [Worker processes (3s) & updates "sent"]
```

1.  **Register & Authenticate**:
    Users register or login. The server hashes passwords via `bcrypt` and returns a secure JWT token, which is stored in `localStorage` and attached to all future HTTP headers.
2.  **Queue Message**:
    Sending a message registers a record in MongoDB with `pending` status, which is instantly queued in our FIFO Queue.
3.  **Background Processing**:
    The worker pulls messages sequentially, waits **3 seconds** (simulating API delay), updates status to `sent`, and broadcasts the state change.
4.  **Real-Time Status updates**:
    Socket.IO pushes the update to the client. The frontend badge instantly turns blue (**SENT**) in real-time.
5.  **Webhook Simulation**:
    Clicking **Simulate Delivery** fires a webhook to `/api/webhook` (simulating WhatsApp delivered callback), changing status to `delivered` and updating the UI badge to green (**DELIVERED**) instantly.

---

## 🚀 Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   MongoDB Atlas Account (or local MongoDB Community Server)

### 1. Backend Setup
1. Navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in `server/` and configure:
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/whatsapp-mini
   JWT_SECRET=your_jwt_secret_key
   QUEUE_TYPE=custom
   REDIS_HOST=127.0.0.1
   REDIS_PORT=6379
   ```
4. Start the server:
   ```bash
   npm start
   ```

### 2. Frontend Setup
1. Navigate to the `client/` directory:
   ```bash
   cd ../client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```

---

## 🌐 Public Tunnel Exposure (Testing on Mobile Phones)
To test this on your phone or share it with friends, you can expose your local ports to the internet using **Serveo** (free SSH tunnel):

1. Expose backend server (port 5000):
   ```bash
   ssh -R 80:localhost:5000 serveo.net
   ```
   *Copy the output URL (e.g. `https://xxx.serveo.net`) and update the API base URLs in `client/src/App.jsx` and `client/src/components/Dashboard.jsx`.*

2. Expose frontend client (port 5173):
   ```bash
   ssh -R 80:localhost:5173 serveo.net
   ```
   *Send the output URL (e.g. `https://yyy.serveo.net`) to your friends!*

---

Developed by [codearcade](https://codearcade20.vercel.app)
