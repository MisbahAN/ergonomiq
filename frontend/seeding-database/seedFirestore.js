#!/usr/bin/env node
import fs from "fs";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HISTORICAL_WINDOWS = [
  { label: "12m", monthsAgo: 12, durationMinutes: 25 },
  { label: "6m", monthsAgo: 6, durationMinutes: 22 },
  { label: "3m", monthsAgo: 3, durationMinutes: 18 },
];

const USERS = [
  {
    uid: "demo-test-1",
    email: "test1@gmail.com",
    name: "Test User One",
    occupation: "Frontend Engineer",
    ergonomicGoal: "both",
    gender: "they/them",
    age: 27,
    notificationFrequency: 45,
    postureRatios: { "12m": 0.42, "6m": 0.33, "3m": 0.21 },
    blinkRates: { "12m": 14, "6m": 16, "3m": 18 },
    avgEar: { "12m": 0.28, "6m": 0.26, "3m": 0.23 },
    strainAlerts: { "12m": 3, "6m": 2, "3m": 1 },
    takeBreakAlerts: { "12m": 4, "6m": 3, "3m": 2 },
    lowBlinkAlerts: { "12m": 2, "6m": 1, "3m": 0 },
    eyesStrainedAlerts: { "12m": 1, "6m": 1, "3m": 0 },
    analytics: {
      postureScore: 88,
      avgSessionTime: 1.4,
      weeklyImprovement: 5.5,
      weeklyEyeStrainImprovement: 2.3,
      weeklyRSIImprovement: 1.4,
      breakStatus: 4,
      avgEyeStrainScore: 0.41,
      eyeStrainRisk: "LOW",
      rsiRisk: "MEDIUM",
    },
    devices: [
      { id: "seed-macbook-cam", name: "MacBook Pro Webcam", type: "camera", active: true },
      { id: "seed-wrist-band", name: "FlexEMG Wrist Band", type: "wearable", active: true },
    ],
  },
  {
    uid: "demo-test-2",
    email: "test2@gmail.com",
    name: "Test User Two",
    occupation: "Product Designer",
    ergonomicGoal: "posture",
    gender: "she/her",
    age: 31,
    notificationFrequency: 60,
    postureRatios: { "12m": 0.55, "6m": 0.41, "3m": 0.28 },
    blinkRates: { "12m": 12, "6m": 14, "3m": 16 },
    avgEar: { "12m": 0.31, "6m": 0.27, "3m": 0.24 },
    strainAlerts: { "12m": 4, "6m": 3, "3m": 2 },
    takeBreakAlerts: { "12m": 5, "6m": 4, "3m": 3 },
    lowBlinkAlerts: { "12m": 3, "6m": 2, "3m": 1 },
    eyesStrainedAlerts: { "12m": 2, "6m": 1, "3m": 0 },
    analytics: {
      postureScore: 81,
      avgSessionTime: 1.1,
      weeklyImprovement: 3.2,
      weeklyEyeStrainImprovement: 1.6,
      weeklyRSIImprovement: 0.8,
      breakStatus: 3,
      avgEyeStrainScore: 0.46,
      eyeStrainRisk: "MEDIUM",
      rsiRisk: "MEDIUM",
    },
    devices: [
      { id: "seed-imac-cam", name: "iMac Studio Cam", type: "camera", active: true },
    ],
  },
  {
    uid: "demo-test-3",
    email: "test3@gmail.com",
    name: "Test User Three",
    occupation: "Data Scientist",
    ergonomicGoal: "both",
    gender: "he/him",
    age: 35,
    notificationFrequency: 75,
    postureRatios: { "12m": 0.47, "6m": 0.39, "3m": 0.32 },
    blinkRates: { "12m": 15, "6m": 16, "3m": 17 },
    avgEar: { "12m": 0.29, "6m": 0.27, "3m": 0.26 },
    strainAlerts: { "12m": 2, "6m": 2, "3m": 2 },
    takeBreakAlerts: { "12m": 3, "6m": 3, "3m": 2 },
    lowBlinkAlerts: { "12m": 1, "6m": 1, "3m": 1 },
    eyesStrainedAlerts: { "12m": 1, "6m": 1, "3m": 1 },
    analytics: {
      postureScore: 76,
      avgSessionTime: 0.9,
      weeklyImprovement: 1.2,
      weeklyEyeStrainImprovement: 0.4,
      weeklyRSIImprovement: 0.2,
      breakStatus: 2,
      avgEyeStrainScore: 0.52,
      eyeStrainRisk: "MEDIUM",
      rsiRisk: "HIGH",
    },
    devices: [
      { id: "seed-laptop-cam", name: "ThinkPad Webcam", type: "camera", active: true },
      { id: "seed-desk-sensor", name: "Desk EMG Sensor", type: "emg", active: false },
    ],
  },
];

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    mode: "seed",
    serviceAccountPath:
      process.env.FIREBASE_SERVICE_ACCOUNT ??
      path.resolve(__dirname, "../../posture-ai-18e1b-firebase-adminsdk-fbsvc-4cc978908f.json"),
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--cleanup") {
      options.mode = "cleanup";
    } else if (arg === "--seed") {
      options.mode = "seed";
    } else if (arg === "--service-account") {
      options.serviceAccountPath = args[i + 1];
      i += 1;
    }
  }

  return options;
};

const loadServiceAccount = (serviceAccountPath) => {
  const resolved = path.resolve(serviceAccountPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Service account JSON not found at ${resolved}`);
  }
  const raw = fs.readFileSync(resolved, "utf-8");
  return JSON.parse(raw);
};

const monthsAgoDate = (monthsAgo) => {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  return date;
};

const postureFrames = (totalFrames, badRatio) => {
  if (badRatio <= 0) return "0".repeat(totalFrames);
  const badFrames = Math.max(1, Math.round(totalFrames * badRatio));
  const frames = Array(totalFrames).fill("0");
  const interval = Math.max(1, Math.floor(totalFrames / badFrames));
  for (let i = 0; i < badFrames; i += 1) {
    const index = Math.min(totalFrames - 1, i * interval);
    frames[index] = "1";
  }
  return frames.join("");
};

const hoursBetween = (start, end) => Number(((end.getTime() - start.getTime()) / 3_600_000).toFixed(2));

const buildUserDoc = (user, targetUid) => {
  const firstSeen = monthsAgoDate(12);
  return {
    uid: targetUid,
    name: user.name,
    email: user.email,
    occupation: user.occupation,
    ergonomicGoal: user.ergonomicGoal,
    age: user.age,
    gender: user.gender,
    createdAt: Timestamp.fromDate(firstSeen),
    updatedAt: FieldValue.serverTimestamp(),
    settings: {
      emailAlerts: true,
      notificationFrequency: user.notificationFrequency,
      alertEmail: user.email,
      updatedAt: FieldValue.serverTimestamp(),
    },
    analytics: {
      postureScore: user.analytics.postureScore,
      rsiRisk: user.analytics.rsiRisk,
      eyeStrainRisk: user.analytics.eyeStrainRisk,
      avgSessionTime: user.analytics.avgSessionTime,
      weeklyImprovement: user.analytics.weeklyImprovement,
      weeklyRSIImprovement: user.analytics.weeklyRSIImprovement,
      weeklyEyeStrainImprovement: user.analytics.weeklyEyeStrainImprovement,
      breakStatus: user.analytics.breakStatus,
      avgEyeStrainScore: user.analytics.avgEyeStrainScore,
      lastUpdated: Timestamp.now(),
    },
  };
};

const buildPostureSessions = (user) =>
  HISTORICAL_WINDOWS.map((window) => {
    const start = monthsAgoDate(window.monthsAgo);
    const end = new Date(start.getTime() + window.durationMinutes * 60 * 1000);
    const postureData = postureFrames(window.durationMinutes, user.postureRatios[window.label]);
    const totalFrames = postureData.length;
    const badFrames = postureData.split("").filter((c) => c === "1").length;
    const badRatio = Number((badFrames / totalFrames).toFixed(2));
    return {
      id: `seed-posture-${window.label}`,
      data: {
        frequency: user.notificationFrequency,
        timestampStart: Timestamp.fromDate(start),
        timestampEnd: Timestamp.fromDate(end),
        postureData,
        totalFrames,
        badFrames,
        badRatio,
        triggerAlert: badRatio >= 0.5,
        processed: true,
        device: "seed_script_webcam",
        createdAt: Timestamp.fromDate(end),
        updatedAt: Timestamp.fromDate(end),
      },
      durationHours: hoursBetween(start, end),
    };
  });

const buildEyeSessions = (user) =>
  HISTORICAL_WINDOWS.map((window) => {
    const start = monthsAgoDate(window.monthsAgo);
    const durationSeconds = window.durationMinutes * 60;
    const avgBlinkRate = user.blinkRates[window.label];
    const totalBlinks = Math.round((avgBlinkRate / 60) * durationSeconds);
    const avgEAR = user.avgEar[window.label];
    return {
      id: `seed-eye-${window.label}`,
      data: {
        timestampStart: Timestamp.fromDate(start),
        duration: durationSeconds,
        device: "seed_script_webcam",
        avgBlinkRate,
        totalBlinks,
        avgEAR,
        eyeClosureEvents: Math.max(1, Math.round(avgBlinkRate / 10)),
        strainAlerts: user.strainAlerts[window.label],
        lowBlinkRateAlerts: user.lowBlinkAlerts[window.label],
        takeBreakAlerts: user.takeBreakAlerts[window.label],
        eyesStrainedAlerts: user.eyesStrainedAlerts[window.label],
        maxSessionTimeWithoutBreak: Math.round(durationSeconds / (user.takeBreakAlerts[window.label] + 1)),
        processed: true,
        createdAt: Timestamp.fromDate(start),
        updatedAt: Timestamp.fromDate(start),
      },
    };
  });

const buildRsiSessions = () =>
  HISTORICAL_WINDOWS.map((window) => {
    const start = monthsAgoDate(window.monthsAgo);
    return {
      id: `seed-rsi-${window.label}`,
      data: {
        timestampStart: Timestamp.fromDate(start),
        duration: window.durationMinutes * 60,
        emgSignalAvg: Number((0.35 + Math.random() * 0.25).toFixed(2)),
        fatigueRisk: Number((0.3 + Math.random() * 0.4).toFixed(2)),
        device: "seed_script_emg",
        processed: true,
        createdAt: Timestamp.fromDate(start),
        updatedAt: Timestamp.fromDate(start),
      },
    };
  });

const seedDevices = (user) =>
  user.devices.map((device, index) => ({
    id: device.id || `seed-device-${index + 1}`,
    data: {
      name: device.name,
      type: device.type,
      active: device.active,
      lastSeen: Timestamp.now(),
    },
  }));

const seedUser = async (db, user) => {
  const userRef = db.collection("users").doc(user.targetUid);
  await userRef.set(buildUserDoc(user, user.targetUid), { merge: true });

  const postureSessions = buildPostureSessions(user);
  const eyeSessions = buildEyeSessions(user);
  const rsiSessions = buildRsiSessions();

  await Promise.all(
    postureSessions.map(({ id, data }) =>
      userRef.collection("postureSessions").doc(id).set(data, { merge: true })
    )
  );

  await Promise.all(
    eyeSessions.map(({ id, data }) =>
      userRef.collection("eyeStrainSessions").doc(id).set(data, { merge: true })
    )
  );

  await Promise.all(
    rsiSessions.map(({ id, data }) =>
      userRef.collection("rsiSessions").doc(id).set(data, { merge: true })
    )
  );

  await Promise.all(
    seedDevices(user).map(({ id, data }) =>
      userRef.collection("devices").doc(id).set(data, { merge: true })
    )
  );

  const avgSessionTime =
    postureSessions.reduce((sum, session) => sum + session.durationHours, 0) /
    Math.max(1, postureSessions.length);

  await userRef.update({
    "analytics.avgSessionTime": Number(avgSessionTime.toFixed(2)),
    "analytics.lastUpdated": Timestamp.now(),
    updatedAt: FieldValue.serverTimestamp(),
  });
};

const cleanupUser = async (db, user) => {
  const userRef = db.collection("users").doc(user.targetUid);
  const deleteDocs = async (subcollection, ids) =>
    Promise.all(
      ids.map((id) =>
        userRef
          .collection(subcollection)
          .doc(id)
          .delete()
          .catch(() => null)
      )
    );

  await deleteDocs(
    "postureSessions",
    HISTORICAL_WINDOWS.map((window) => `seed-posture-${window.label}`)
  );
  await deleteDocs(
    "eyeStrainSessions",
    HISTORICAL_WINDOWS.map((window) => `seed-eye-${window.label}`)
  );
  await deleteDocs(
    "rsiSessions",
    HISTORICAL_WINDOWS.map((window) => `seed-rsi-${window.label}`)
  );
  await deleteDocs(
    "devices",
    (user.devices || []).map((device, index) => device.id || `seed-device-${index + 1}`)
  );

  await userRef.delete().catch(() => null);
};

const resolveTargetUid = async (authClient, user) => {
  const lookupEmail = user.authEmail ?? user.email;

  if (lookupEmail) {
    try {
      const record = await authClient.getUserByEmail(lookupEmail);
      if (record?.uid) {
        if (user.uid && user.uid !== record.uid) {
          console.log(`ℹ️  Using Auth UID ${record.uid} for ${lookupEmail} (override ${user.uid})`);
        }
        return record.uid;
      }
    } catch (error) {
      if (error.code !== "auth/user-not-found") {
        console.warn(`⚠️  Failed to look up Auth user for ${lookupEmail}:`, error.message);
      }
    }
  }

  if (!user.uid) {
    throw new Error(`Unable to resolve UID for ${user.email}. Provide uid or create Auth user first.`);
  }

  return user.uid;
};

const prepareUsers = async (authClient) =>
  Promise.all(
    USERS.map(async (user) => ({
      ...user,
      targetUid: await resolveTargetUid(authClient, user),
    }))
  );

const run = async () => {
  const options = parseArgs();
  const serviceAccount = loadServiceAccount(options.serviceAccountPath);

  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount),
    });
  }

  const db = getFirestore();
  const authClient = getAuth();
  const preparedUsers = await prepareUsers(authClient);

  if (options.mode === "cleanup") {
    await Promise.all(preparedUsers.map((user) => cleanupUser(db, user)));
    console.log("✅ Cleanup complete. Users removed.");
  } else {
    for (const user of preparedUsers) {
      await seedUser(db, user);
      console.log(`✅ Seeded data for ${user.email} (uid: ${user.targetUid})`);
    }
  }

  process.exit(0);
};

run().catch((error) => {
  console.error("❌ Firestore seed script failed:", error);
  process.exit(1);
});
