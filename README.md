# Baby Studio

React Native (Expo SDK 51) + Next.js 15 project for AI-powered baby photo studio editing.

## Mobile App

- Expo + TypeScript
- React Navigation (stack + tabs)
- Zustand state store
- Supabase + RevenueCat placeholders
- Camera, Upload, Theme selection, Processing, Result, Gallery, Subscription

## Backend

- Next.js API routes in `backend/app/api`
- Main processing endpoint: `POST /api/process`
- Pipeline: background removal -> template resize/position -> shadow -> composite -> color match

## Quick Start

```bash
cd baby-studio
npm install
npm run start
```

Backend:

```bash
cd backend
npm install
npm run dev
```

## Environment

Copy `.env.example` and fill required keys for Expo and backend.

## Notes

- `backend/app/api/process/route.ts` contains the highest-fidelity placeholder pipeline.
- Replace placeholder theme URLs and storage return URLs with real Supabase storage assets.
