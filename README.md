# ChatApp 💬

A production-ready real-time chat application built with React Native, demonstrating full-stack mobile development skills.

## Screenshots

> Add screenshots here after taking them from simulator

## Features

- 🔐 Email/Password Authentication (Firebase Auth)
- 💬 Real-time messaging (Socket.io)
- 👥 Group chat rooms + private 1-on-1 chat
- 🟢 Online/offline presence indicators
- 🌙 Dark mode support (system-aware)
- 🖼 Image sharing in chat
- 💾 Message persistence (Firestore)
- ⌨️ Typing indicators
- 🕐 Message timestamps
- 📱 Cross-platform (iOS + Android)

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React Native (Expo) | Cross-platform mobile framework |
| TypeScript | Type safety |
| React Navigation | Screen navigation |
| Firebase JS SDK | Auth + Firestore |
| Socket.io Client | Real-time messaging |
| Expo Image Picker | Image sharing |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | HTTP server |
| Socket.io | WebSocket server |
| Deployed on Render.com | Cloud hosting |

### Database & Auth
| Service | Purpose |
|---|---|
| Firebase Authentication | User management |
| Cloud Firestore | Message persistence + presence |

## Architecture
┌─────────────────┐     WebSocket      ┌──────────────────┐
│                 │◄──────────────────►│                  │
│  React Native   │                    │  Node.js Server  │
│     Client      │                    │   (Socket.io)    │
│                 │                    │  Render.com      │
└────────┬────────┘                    └──────────────────┘
│
│ REST/SDK
▼
┌─────────────────┐
│    Firebase     │
│  Auth           │
│  Firestore DB   │
└─────────────────┘

## Project Structure

src/
├── screens/
│   ├── LoginScreen.tsx      # Auth with email/password
│   ├── HomeScreen.tsx       # Room list + online users
│   └── ChatScreen.tsx       # Real-time chat UI
├── navigation/
│   └── AppNavigator.tsx     # Stack navigation + auth guard
├── hooks/
│   └── useTheme.ts          # Dark/light mode hook
├── services/
│   └── firebase.ts          # Firebase config + helpers
└── types/
└── index.ts             # TypeScript interfaces
backend/
└── server.js                # Express + Socket.io server