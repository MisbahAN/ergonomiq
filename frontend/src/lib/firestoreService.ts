import {
  addDoc,
  collection,
  doc,
  FieldValue,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface UserProfile {
  uid: string;
  name?: string;
  email: string;
  occupation?: string;
  ergonomicGoal?: string;
  age?: number | null;
  gender?: string;
  createdAt?: Timestamp | FieldValue | null;
  updatedAt?: Timestamp | FieldValue | null;
}

export interface UserSettings {
  emailAlerts: boolean;
  notificationFrequency: number;
  alertEmail?: string;
  updatedAt?: Timestamp | FieldValue | null;
}

export interface UserAnalytics {
  postureScore: number;
  eyeStrainRisk: RiskLevel;
  avgSessionTime: number;
  weeklyImprovement: number;
  weeklyEyeStrainImprovement: number;
  breakStatus: number;
  avgEyeStrainScore: number;
  lastUpdated?: Timestamp | FieldValue | null;
}

export interface UserDocument extends UserProfile {
  settings?: UserSettings;
  analytics?: UserAnalytics;
}

export interface PostureSession {
  id?: string;
  frequency: number;
  timestampStart: Timestamp | FieldValue;
  timestampEnd: Timestamp | FieldValue;
  postureData: string;
  totalFrames: number;
  badFrames: number;
  badRatio: number;
  triggerAlert: boolean;
  processed: boolean;
  device: string;
  createdAt?: Timestamp | FieldValue | null;
  updatedAt?: Timestamp | FieldValue | null;
}

export interface EyeStrainSession {
  id?: string;
  timestampStart: Timestamp | FieldValue;
  duration: number;
  device: string;
  avgBlinkRate: number;
  totalBlinks: number;
  avgEAR: number;
  eyeClosureEvents: number;
  strainAlerts: number;
  lowBlinkRateAlerts: number;
  takeBreakAlerts: number;
  eyesStrainedAlerts: number;
  maxSessionTimeWithoutBreak: number;
  processed: boolean;
  createdAt?: Timestamp | FieldValue | null;
  updatedAt?: Timestamp | FieldValue | null;
}

export interface DeviceMetadata {
  id?: string;
  name: string;
  type: string;
  lastSeen: Timestamp | FieldValue;
  active: boolean;
}

const USERS_COLLECTION = "users";
const POSTURE_SESSIONS_SUBCOLLECTION = "postureSessions";
const EYE_STRAIN_SESSIONS_SUBCOLLECTION = "eyeStrainSessions";
const DEVICES_SUBCOLLECTION = "devices";

const DEFAULT_NOTIFICATION_FREQUENCY = 60;
const DEFAULT_EMAIL_ALERTS = true;
const POSTURE_ALERT_THRESHOLD = 0.5;
const SESSION_STATS_LIMIT = 30;

type TimestampInput = Date | Timestamp | FieldValue | null | undefined;

const getUserRef = (uid: string) => doc(db, USERS_COLLECTION, uid);
const getUserSubcollection = (uid: string, subcollection: string) =>
  collection(getUserRef(uid), subcollection);

const toTimestamp = (value?: TimestampInput) => {
  if (!value) {
    return serverTimestamp();
  }
  if (value instanceof Date) {
    return Timestamp.fromDate(value);
  }
  return value;
};

const ensureNumber = (value: number | undefined | null, fallback = 0) =>
  typeof value === "number" && !Number.isNaN(value) ? value : fallback;

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

const computeEyeStrainRisk = (alertsAvg: number): RiskLevel => {
  if (alertsAvg >= 4) return "HIGH";
  if (alertsAvg >= 2) return "MEDIUM";
  return "LOW";
};

const buildDefaultSettings = (email: string): UserSettings => ({
  emailAlerts: DEFAULT_EMAIL_ALERTS,
  notificationFrequency: DEFAULT_NOTIFICATION_FREQUENCY,
  alertEmail: email,
  updatedAt: serverTimestamp(),
});

const buildDefaultAnalytics = (): UserAnalytics => ({
  postureScore: 0,
  eyeStrainRisk: "LOW",
  avgSessionTime: 0,
  weeklyImprovement: 0,
  weeklyEyeStrainImprovement: 0,
  breakStatus: 0,
  avgEyeStrainScore: 0,
  lastUpdated: serverTimestamp(),
});

const getPostureSessionHours = (session: PostureSession) => {
  const frames = ensureNumber(session.totalFrames, 0);
  const frequency = ensureNumber(session.frequency, DEFAULT_NOTIFICATION_FREQUENCY);
  return Number(((frames * frequency) / 3600).toFixed(2));
};

const average = (values: number[]) => {
  if (!values.length) return undefined;
  const sum = values.reduce((acc, value) => acc + value, 0);
  return sum / values.length;
};

const recalcAnalyticsInternal = async (uid: string, cachedAnalytics?: UserAnalytics) => {
  const userRef = getUserRef(uid);
  let previousAnalytics = cachedAnalytics;

  if (!previousAnalytics) {
    const snapshot = await getDoc(userRef);
    previousAnalytics = snapshot.exists()
      ? ((snapshot.data()?.analytics as UserAnalytics) ?? undefined)
      : undefined;
  }

  const [postureSnapshot, eyeSnapshot] = await Promise.all([
    getDocs(
      query(
        getUserSubcollection(uid, POSTURE_SESSIONS_SUBCOLLECTION),
        orderBy("timestampEnd", "desc"),
        limit(SESSION_STATS_LIMIT)
      )
    ),
    getDocs(
      query(
        getUserSubcollection(uid, EYE_STRAIN_SESSIONS_SUBCOLLECTION),
        orderBy("timestampStart", "desc"),
        limit(SESSION_STATS_LIMIT)
      )
    ),
  ]);

  const postureSessions = postureSnapshot.docs.map(
    (sessionDoc) => sessionDoc.data() as PostureSession
  );
  const eyeStrainSessions = eyeSnapshot.docs.map(
    (sessionDoc) => sessionDoc.data() as EyeStrainSession
  );

  // Posture analytics
  const postureRatios = postureSessions
    .map((session) => ensureNumber(session.badRatio, 0))
    .filter((ratio) => ratio >= 0);
  const avgBadRatio = average(postureRatios);
  const postureScore =
    avgBadRatio !== undefined
      ? Number(((1 - clamp(avgBadRatio, 0, 1)) * 100).toFixed(2))
      : ensureNumber(previousAnalytics?.postureScore, 0);
  const prevPostureScore = ensureNumber(previousAnalytics?.postureScore, postureScore);
  const weeklyImprovement =
    avgBadRatio !== undefined
      ? Number((postureScore - prevPostureScore).toFixed(2))
      : ensureNumber(previousAnalytics?.weeklyImprovement, 0);
  const avgSessionTime =
    postureSessions.length > 0
      ? Number(
          (
            postureSessions.reduce((hours, session) => hours + getPostureSessionHours(session), 0) /
            postureSessions.length
          ).toFixed(2)
        )
      : ensureNumber(previousAnalytics?.avgSessionTime, 0);

  // Eye strain analytics
  const eyeScores = eyeStrainSessions.map((session) => {
    const blinkScore = clamp(session.avgBlinkRate / 20, 0, 1);
    const earScore = 1 - clamp(session.avgEAR / 0.4, 0, 1);
    return Number(((blinkScore + earScore) / 2).toFixed(2));
  });
  const avgEyeStrainScore =
    eyeScores.length > 0
      ? Number((eyeScores.reduce((sum, value) => sum + value, 0) / eyeScores.length).toFixed(2))
      : ensureNumber(previousAnalytics?.avgEyeStrainScore, 0);
  const prevEyeScore = ensureNumber(previousAnalytics?.avgEyeStrainScore, avgEyeStrainScore);
  const weeklyEyeStrainImprovement =
    eyeScores.length > 0
      ? Number(((avgEyeStrainScore - prevEyeScore) * 100).toFixed(2))
      : ensureNumber(previousAnalytics?.weeklyEyeStrainImprovement, 0);
  const totalStrainAlerts = eyeStrainSessions.reduce(
    (sum, session) => sum + ensureNumber(session.strainAlerts, 0),
    0
  );
  const totalSessions = Math.max(1, eyeStrainSessions.length);
  const eyeStrainRisk =
    eyeStrainSessions.length > 0
      ? computeEyeStrainRisk(totalStrainAlerts / totalSessions)
      : previousAnalytics?.eyeStrainRisk ?? "LOW";
  const breakStatusCount = eyeStrainSessions.reduce(
    (sum, session) => sum + ensureNumber(session.takeBreakAlerts, 0),
    0
  );
  const breakStatus =
    eyeStrainSessions.length > 0
      ? breakStatusCount
      : ensureNumber(previousAnalytics?.breakStatus, 0);

  const analyticsUpdate: Record<string, any> = {
    "analytics.postureScore": postureScore,
    "analytics.weeklyImprovement": weeklyImprovement,
    "analytics.avgSessionTime": avgSessionTime,
    "analytics.eyeStrainRisk": eyeStrainRisk,
    "analytics.avgEyeStrainScore": avgEyeStrainScore,
    "analytics.weeklyEyeStrainImprovement": weeklyEyeStrainImprovement,
    "analytics.breakStatus": breakStatus,
    "analytics.lastUpdated": serverTimestamp(),
  };

  await updateDoc(userRef, analyticsUpdate);
};

const countBadFrames = (postureString: string) =>
  postureString.split("").filter((char) => char === "1").length;

export const firestoreService = {
  async getUser(uid: string): Promise<UserDocument | null> {
    const snapshot = await getDoc(getUserRef(uid));
    if (!snapshot.exists()) {
      return null;
    }
    return { ...(snapshot.data() as UserDocument), uid: snapshot.id };
  },

  async createUser(
    uid: string,
    profileData: Partial<Omit<UserProfile, "uid">> & {
      email: string;
      settings?: UserSettings;
      analytics?: UserAnalytics;
    }
  ): Promise<void> {
    const userRef = getUserRef(uid);
    const now = serverTimestamp();
    const payload: Record<string, any> = {
      uid,
      name: profileData.name ?? "",
      email: profileData.email,
      occupation: profileData.occupation ?? "",
      ergonomicGoal: profileData.ergonomicGoal ?? "both",
      age: profileData.age ?? null,
      gender: profileData.gender ?? "",
      createdAt: profileData.createdAt ?? now,
      updatedAt: now,
      settings: profileData.settings ?? buildDefaultSettings(profileData.email),
      analytics: profileData.analytics ?? buildDefaultAnalytics(),
    };
    await setDoc(userRef, payload, { merge: true });
  },

  async updateUser(uid: string, userData: Partial<UserProfile>): Promise<void> {
    await setDoc(
      getUserRef(uid),
      {
        ...userData,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  },

  async getUserSettings(uid: string): Promise<UserSettings | null> {
    const snapshot = await getDoc(getUserRef(uid));
    if (!snapshot.exists()) return null;
    return (snapshot.data()?.settings as UserSettings) ?? null;
  },

  async updateUserSettings(uid: string, settings: Partial<UserSettings>): Promise<void> {
    const updatePayload: Record<string, any> = {
      "settings.updatedAt": serverTimestamp(),
    };

    if (settings.emailAlerts !== undefined) {
      updatePayload["settings.emailAlerts"] = settings.emailAlerts;
    }
    if (settings.notificationFrequency !== undefined) {
      updatePayload["settings.notificationFrequency"] = settings.notificationFrequency;
    }
    if (settings.alertEmail !== undefined) {
      updatePayload["settings.alertEmail"] = settings.alertEmail;
    }

    await setDoc(getUserRef(uid), updatePayload, { merge: true });
  },

  async logPostureSession(
    uid: string,
    sessionData: {
      postureData: string;
      device?: string;
      frequency?: number;
      timestampStart?: TimestampInput;
      timestampEnd?: TimestampInput;
      processed?: boolean;
    }
  ): Promise<{ sessionId: string; triggerAlert: boolean; badRatio: number }> {
    const userSnapshot = await getDoc(getUserRef(uid));
    const userSettings = userSnapshot.exists()
      ? ((userSnapshot.data()?.settings as UserSettings) ?? undefined)
      : undefined;
    const previousAnalytics = userSnapshot.exists()
      ? ((userSnapshot.data()?.analytics as UserAnalytics) ?? undefined)
      : undefined;

    const frequency = sessionData.frequency ?? userSettings?.notificationFrequency ?? DEFAULT_NOTIFICATION_FREQUENCY;
    const totalFrames = Math.max(1, sessionData.postureData.length);
    const badFrames = countBadFrames(sessionData.postureData);
    const badRatio = badFrames / totalFrames;
    const triggerAlert = badRatio >= POSTURE_ALERT_THRESHOLD;

    const sessionRef = await addDoc(
      getUserSubcollection(uid, POSTURE_SESSIONS_SUBCOLLECTION),
      {
        frequency,
        timestampStart: toTimestamp(sessionData.timestampStart),
        timestampEnd: toTimestamp(sessionData.timestampEnd),
        postureData: sessionData.postureData,
        totalFrames,
        badFrames,
        badRatio,
        triggerAlert,
        processed: sessionData.processed ?? false,
        device: sessionData.device ?? "local_webcam",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    );

    await recalcAnalyticsInternal(uid, previousAnalytics);

    return {
      sessionId: sessionRef.id,
      triggerAlert,
      badRatio,
    };
  },

  async getUserPostureSessions(uid: string, take: number = 20): Promise<PostureSession[]> {
    const sessionsSnapshot = await getDocs(
      query(
        getUserSubcollection(uid, POSTURE_SESSIONS_SUBCOLLECTION),
        orderBy("timestampEnd", "desc"),
        limit(take)
      )
    );

    return sessionsSnapshot.docs.map((sessionDoc) => ({
      id: sessionDoc.id,
      ...(sessionDoc.data() as PostureSession),
    }));
  },

  async logEyeStrainSession(
    uid: string,
    sessionData: Omit<EyeStrainSession, "id" | "timestampStart" | "processed" | "createdAt" | "updatedAt"> & {
      timestampStart?: TimestampInput;
      processed?: boolean;
    }
  ): Promise<string> {
    const sessionRef = await addDoc(
      getUserSubcollection(uid, EYE_STRAIN_SESSIONS_SUBCOLLECTION),
      {
        ...sessionData,
        timestampStart: toTimestamp(sessionData.timestampStart),
        processed: sessionData.processed ?? false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    );

    await recalcAnalyticsInternal(uid);

    return sessionRef.id;
  },

  async getUserEyeStrainSessions(uid: string, take: number = 20): Promise<EyeStrainSession[]> {
    const sessionsSnapshot = await getDocs(
      query(
        getUserSubcollection(uid, EYE_STRAIN_SESSIONS_SUBCOLLECTION),
        orderBy("timestampStart", "desc"),
        limit(take)
      )
    );

    return sessionsSnapshot.docs.map((sessionDoc) => ({
      id: sessionDoc.id,
      ...(sessionDoc.data() as EyeStrainSession),
    }));
  },

  async registerDevice(
    uid: string,
    deviceId: string,
    metadata: Omit<DeviceMetadata, "id">
  ): Promise<void> {
    await setDoc(
      doc(getUserSubcollection(uid, DEVICES_SUBCOLLECTION), deviceId),
      {
        ...metadata,
        lastSeen: toTimestamp(metadata.lastSeen),
      },
      { merge: true }
    );
  },

  async recalculateAnalytics(uid: string): Promise<void> {
    await recalcAnalyticsInternal(uid);
  },
};
