# 🛡️ SecureChat — Full-Stack Real-Time Messaging & Calling Platform

> **Developed with ❤️ by Shubham Mishra**  
> *© 2026 SecureChat. All Rights Reserved.*

A production-grade, end-to-end encrypted (E2EE) messaging, voice/video calling, and community platform inspired by WhatsApp, Telegram, Instagram, and LinkedIn.

---

## 🌟 Key Features

- **🔐 End-to-End Encryption (E2EE)**: Client-side ECDH P-256 keypair agreement and AES-GCM 256 payload encryption with Safety Number verification.
- **📹 WebRTC Video & Audio Calls**: Real-time peer-to-peer calling with screen sharing, camera/mic toggle, ringtones, and call duration logs.
- **💼 LinkedIn Professional Profiles**: Professional headlines, skills, and 1st-degree connection status badges.
- **📸 Stories & Status (24h)**: Instagram/WhatsApp style story status carousel with photo, video, and gradient text support.
- **👁️ View-Once Media (1x)**: Disappearing photos and videos that self-destruct after being opened once.
- **🔒 Private Account Mode**: Instagram-style privacy where non-contacts must send a Chat Request to message.
- **☀️ Dark / Light Mode & 💡 Brightness Slider**: Quick 1-click theme toggle and real-time screen brightness controller (70% - 130%).
- **❤️ Double-Tap to React & 🎙️ Speed Controls**: Double tap messages to like ❤️, and switch voice note playback between 1x, 1.5x, and 2x speeds.
- **👥 Megagroups & Channels**: Broadcast channels with subscriber feeds, and multi-user group chats with interactive live polls.
- **⚡ Super Admin Command Center**: Special administrative powers for platform moderation, global system broadcasts, server telemetry, and account management.

---

## 🔑 Super Admin Credentials

Access the Super Admin Portal at `http://localhost:5173/admin`:

* **Admin Email**: `shubhammishra23082004@gmail.com`
* **Admin Password**: `Shubham@080605`
* **2FA Master Code**: `999888`

---

## ⚡ Quick Start

### 1. Backend Server
```bash
cd server
npm install
node server.js
```
Runs on: `http://localhost:5000`

### 2. Frontend Web App
```bash
cd client
npm install
npm run dev
```
Runs on: `http://localhost:5173`

### 3. Database (Docker Compose)
```bash
cd database
docker-compose up -d
```
MongoDB available at `mongodb://localhost:27017` with Mongo-Express GUI on `http://localhost:8081`.

---

## 👤 Credits

* **Developer**: Shubham Mishra
* **Copyright**: © 2026 SecureChat. All Rights Reserved.
