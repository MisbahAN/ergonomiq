# Firestore Seeding Guide

This folder contains the Node script used to backfill demo data into Firestore for local development, demos, or QA.

## Prerequisites

- Install project dependencies: `npm install`
- Place your Firebase service account JSON in the repo root (`../posture-ai-18e1b-firebase-adminsdk-fbsvc-4cc978908f.json`) or set `FIREBASE_SERVICE_ACCOUNT=/absolute/path/to/credential.json`
- Ensure the service account has `Editor` (or finer-grained Firestore write) permissions

## Commands

| Purpose                                  | Command                          |
| ---------------------------------------- | -------------------------------- |
| Seed sample users & sessions             | `npm run seed:firestore`         |
| Remove the seeded users/sessions/devices | `npm run seed:firestore:cleanup` |

Both commands use `seeding-database/seedFirestore.js` under the hood. You can run the script directly:

```bash
node seeding-database/seedFirestore.js --service-account /path/to/key.json
node seeding-database/seedFirestore.js --cleanup
```

## What Gets Seeded

- Three demo users: `test1@gmail.com`, `test2@gmail.com`, `test3@gmail.com`
- Historical posture, eye strain, and RSI sessions from 3/6/12 months ago (matching `firestore-schema.md`)
- Device metadata per user
- Aggregated analytics fields after inserts
- If a Firebase Auth user with the same email exists, Firestore docs reuse that Auth UID so the dashboard can load the seeded analytics immediately after login

Document IDs are deterministic (`seed-posture-12m`, etc.), so cleanup reliably deletes only the generated data.

## Customizing

- Edit the `USERS` array in `seedFirestore.js` to change emails, metrics, or devices
- Adjust the `HISTORICAL_WINDOWS` array to seed different time spans or durations
- Pass `--service-account` if the credential file lives elsewhere

> Tip: rerun the seed script any time you change `seedFirestore.js` to refresh Firestore with the latest fixture definitions.
