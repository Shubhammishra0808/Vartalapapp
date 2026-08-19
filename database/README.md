# SecureChat Database Management

This directory contains MongoDB setup files, schemas, and initialization scripts for **SecureChat**.

---

## 🚀 Options to Run MongoDB

### Option 1: Docker (Fastest, zero installation required)
Make sure Docker Desktop is running, then in this directory:
```bash
docker-compose up -d
```
- MongoDB runs on `localhost:27017`
- Web-based MongoDB Admin GUI (Mongo-Express) runs on `http://localhost:8081` (User: `admin`, Pass: `pass`)

### Option 2: Local MongoDB Service
If you installed MongoDB locally on Windows:
```bash
net start MongoDB
```
Connection URI:
```
mongodb://127.0.0.1:27017/securechat
```

### Option 3: MongoDB Atlas (Cloud)
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Get your connection string (e.g. `mongodb+srv://<user>:<password>@cluster0.mongodb.net/securechat`).
3. Set `MONGODB_URI` in `server/.env`.

---

## 🗄️ Collections & Schemas Overview

| Collection | Description | Key Indexes |
| :--- | :--- | :--- |
| `users` | User accounts, privacy settings, E2EE public keys | `email` (unique), `username` (unique) |
| `sessions` | Active JWT refresh sessions and device fingerprints | `userId`, `refreshToken` |
| `conversations`| Direct chats, groups, and broadcast channels | `participants.user`, `lastMessageAt` |
| `messages` | Chat messages, encrypted payloads, attachments, polls | `conversation`, `createdAt`, `expiresAt` (TTL) |
| `calls` | WebRTC audio/video call logs & duration | `caller`, `receiver`, `createdAt` |
| `stories` | 24-hour status media with viewer list | `user`, `expiresAt` (TTL) |
| `reports` | User and message abuse reports for moderation | `status`, `reportedUser` |
| `admins` | SuperAdmin, Moderator, and Support Admin accounts | `email` (unique) |
| `auditlogs` | Immutable audit log of all admin operations | `createdAt`, `adminId` |
