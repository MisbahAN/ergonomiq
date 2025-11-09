# Firestore Schema

Reference for the ergonomics platform data model. Paths are relative to the Firestore root.

## `users/{uid}`

| Field           | Type      | Example / Notes                                    |
| --------------- | --------- | -------------------------------------------------- |
| `uid`           | string    | `"swe-alberta-01"`                                 |
| `name`          | string    | `"Casey Jordan"`                                   |
| `email`         | string    | `"casey@ualberta.ca"`                              |
| `occupation`    | string    | `"SWE @ UAlberta"`                                 |
| `ergonomicGoal` | string    | `"both"` (can be `"posture"`, `"wrist"`, `"both"`) |
| `age`           | number    | `26` (optional)                                    |
| `gender`        | string    | `"they/them"` (optional / free-form)               |
| `createdAt`     | timestamp | `serverTimestamp()`                                |
| `updatedAt`     | timestamp | `serverTimestamp()`                                |
| `settings`      | map       | see below                                          |
| `analytics`     | map       | see below                                          |

### `settings`

| Field                   | Type      | Example / Notes                |
| ----------------------- | --------- | ------------------------------ |
| `emailAlerts`           | boolean   | `true`                         |
| `notificationFrequency` | number    | `60` seconds between reminders |
| `alertEmail`            | string    | `"casey.alerts@gmail.com"`     |
| `updatedAt`             | timestamp | `serverTimestamp()`            |

### `analytics`

| Field                        | Type      | Example / Notes                             |
| ---------------------------- | --------- | ------------------------------------------- |
| `postureScore`               | number    | `82.5` // percentage (0–100)                |
| `rsiRisk`                    | string    | `"MEDIUM"` // `"LOW" \| "MEDIUM" \| "HIGH"` |
| `eyeStrainRisk`              | string    | `"LOW"`                                     |
| `avgSessionTime`             | number    | `1.25` // hours                             |
| `weeklyImprovement`          | number    | `4.2` // percentage delta                   |
| `weeklyRSIImprovement`       | number    | `-1.1`                                      |
| `weeklyEyeStrainImprovement` | number    | `2.7`                                       |
| `breakStatus`                | number    | `3` // breaks taken today                   |
| `avgEyeStrainScore`          | number    | `0.42` // normalized 0–1                    |
| `lastUpdated`                | timestamp | `serverTimestamp()`                         |

## `users/{uid}/postureSessions/{sessionId}`

Flat session docs for CV posture captures.

| Field            | Type      | Example / Notes                                      |
| ---------------- | --------- | ---------------------------------------------------- |
| `frequency`      | number    | `30` // seconds between captures                     |
| `timestampStart` | timestamp | `2024-11-27T02:00:00Z`                               |
| `timestampEnd`   | timestamp | `2024-11-27T02:15:00Z`                               |
| `postureData`    | string    | `"00111100001111"` // per-frame flags (0=good,1=bad) |
| `totalFrames`    | number    | `16`                                                 |
| `badFrames`      | number    | `8`                                                  |
| `badRatio`       | number    | `0.5`                                                |
| `triggerAlert`   | boolean   | `true` // when `badRatio >= 0.5`                     |
| `processed`      | boolean   | `false` // toggled when aggregated                   |
| `device`         | string    | `"local_webcam"`                                     |
| `createdAt`      | timestamp | `serverTimestamp()`                                  |
| `updatedAt`      | timestamp | `serverTimestamp()`                                  |

## `users/{uid}/rsiSessions/{sessionId}`

| Field            | Type      | Example / Notes                    |
| ---------------- | --------- | ---------------------------------- |
| `timestampStart` | timestamp | `2024-11-26T18:30:00Z`             |
| `duration`       | number    | `900` // seconds                   |
| `emgSignalAvg`   | number    | `0.58` // arbitrary normalized EMG |
| `fatigueRisk`    | number    | `0.44` // 0–1 scale                |
| `device`         | string    | `"wearable_sensor"`                |
| `processed`      | boolean   | `false`                            |
| `createdAt`      | timestamp | `serverTimestamp()`                |
| `updatedAt`      | timestamp | `serverTimestamp()`                |

## `users/{uid}/eyeStrainSessions/{sessionId}`

| Field                        | Type      | Example / Notes            |
| ---------------------------- | --------- | -------------------------- |
| `timestampStart`             | timestamp | `2024-11-27T01:00:00Z`     |
| `duration`                   | number    | `1200` // seconds          |
| `device`                     | string    | `"webcam"`                 |
| `avgBlinkRate`               | number    | `14` // blinks per minute  |
| `totalBlinks`                | number    | `280`                      |
| `avgEAR`                     | number    | `0.23` // Eye Aspect Ratio |
| `eyeClosureEvents`           | number    | `3`                        |
| `strainAlerts`               | number    | `2`                        |
| `lowBlinkRateAlerts`         | number    | `1`                        |
| `takeBreakAlerts`            | number    | `2`                        |
| `eyesStrainedAlerts`         | number    | `0`                        |
| `maxSessionTimeWithoutBreak` | number    | `900` // seconds           |
| `processed`                  | boolean   | `false`                    |
| `createdAt`                  | timestamp | `serverTimestamp()`        |
| `updatedAt`                  | timestamp | `serverTimestamp()`        |

## `users/{uid}/devices/{deviceId}`

Optional metadata for capture hardware.

| Field      | Type      | Example / Notes                                 |
| ---------- | --------- | ----------------------------------------------- |
| `name`     | string    | `"MacBook Webcam"`                              |
| `type`     | string    | `"camera"` // `"camera" \| "emg" \| "wearable"` |
| `lastSeen` | timestamp | `serverTimestamp()`                             |
| `active`   | boolean   | `true`                                          |

---

### Helper Flow Summary

1. `createUser(uid, profile)` sets profile + default `settings`/`analytics`.
2. `updateUserSettings(uid, settings)` updates nested map & timestamps.
3. `logPostureSession`, `logRSISession`, `logEyeStrainSession` add docs under their subcollections, using `serverTimestamp()` for all date fields.
4. After each session, `recalculateAnalytics(uid)` runs to refresh the aggregated metrics in `users/{uid}.analytics`.
