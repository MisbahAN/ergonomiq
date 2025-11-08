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

export interface IUserSettings {
  emailAlerts: boolean;
  notificationFrequency: number; // seconds
  alertEmail?: string;
  updatedAt?: Timestamp | FieldValue | null;
}

export interface IUserAnalytics {
  postureScore?: number;
  rsiRisk?: "LOW" | "MEDIUM" | "HIGH";
  weeklyImprovement?: number;
  breakStatus?: number;
  avgSessionTime?: number;
  lastUpdated?: Timestamp | FieldValue | null;
}

export interface IUserData {
  uid: string;
  name?: string;
  email: string;
  occupation?: string;
  ergonomicGoal?: string;
  age?: number | null;
  gender?: string;
  createdAt?: Timestamp | FieldValue | null;
  updatedAt?: Timestamp | FieldValue | null;
  settings?: IUserSettings;
  analytics?: IUserAnalytics;
}

export interface IPostureSession {
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

export interface IRSISession {
  id?: string;
  timestampStart: Timestamp | FieldValue;
  duration: number;
  emgSignalAvg: number;
  fatigueRisk: number;
  device: string;
  createdAt?: Timestamp | FieldValue | null;
  updatedAt?: Timestamp | FieldValue | null;
}

const USERS_COLLECTION = "users";
const POSTURE_SESSIONS_SUBCOLLECTION = "postureSessions";
const RSI_SESSIONS_SUBCOLLECTION = "rsiSessions";
const DEFAULT_NOTIFICATION_FREQUENCY = 60; // seconds

const getUserRef = (uid: string) => doc(db, USERS_COLLECTION, uid);
const getUserSubcollection = (uid: string, subcollection: string) =>
  collection(getUserRef(uid), subcollection);

type TimestampInput = Date | Timestamp | FieldValue | undefined;

const toTimestamp = (value?: TimestampInput) => {
  if (!value) {
    return serverTimestamp();
  }
  if (value instanceof Date) {
    return Timestamp.fromDate(value);
  }
  return value;
};

const countBadFrames = (postureString: string) =>
  postureString.split("").filter((char) => char === "1").length;

const recalculateAnalytics = async (
  uid: string,
  fallbackFrequency: number,
  previousAnalytics?: IUserAnalytics
) => {
  const sessionsSnapshot = await getDocs(
    query(
      getUserSubcollection(uid, POSTURE_SESSIONS_SUBCOLLECTION),
      orderBy("timestampEnd", "desc"),
      limit(20)
    )
  );

  if (sessionsSnapshot.empty) {
    await updateDoc(getUserRef(uid), {
      "analytics.lastUpdated": serverTimestamp(),
    });
    return;
  }

  const ratios = sessionsSnapshot.docs
    .map((sessionDoc) => sessionDoc.data()?.badRatio)
    .filter((ratio): ratio is number => typeof ratio === "number");

  const avgBadRatio = ratios.length
    ? ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length
    : 0;

  const postureScore = Number((1 - avgBadRatio).toFixed(2));
  const previousScore =
    typeof previousAnalytics?.postureScore === "number"
      ? previousAnalytics.postureScore
      : postureScore;

  const weeklyImprovement = Number(
    ((postureScore - previousScore) * 100).toFixed(2)
  );

  const breakStatus =
    typeof previousAnalytics?.breakStatus === "number"
      ? previousAnalytics.breakStatus
      : Math.max(0, Math.round((1 - avgBadRatio) * 10));

  const avgSessionTime =
    typeof previousAnalytics?.avgSessionTime === "number"
      ? previousAnalytics.avgSessionTime
      : Number((fallbackFrequency / 3600).toFixed(2));

  await updateDoc(getUserRef(uid), {
    "analytics.postureScore": postureScore,
    "analytics.weeklyImprovement": weeklyImprovement,
    "analytics.breakStatus": breakStatus,
    "analytics.avgSessionTime": avgSessionTime,
    "analytics.rsiRisk": previousAnalytics?.rsiRisk ?? "LOW",
    "analytics.lastUpdated": serverTimestamp(),
  });
};

export const firestoreService = {
  // User operations
  async getUser(uid: string): Promise<IUserData | null> {
    try {
      const snapshot = await getDoc(getUserRef(uid));
      if (!snapshot.exists()) {
        return null;
      }
      return { uid: snapshot.id, ...(snapshot.data() as IUserData) };
    } catch (error) {
      console.error("Error getting user:", error);
      throw error;
    }
  },

  async createUser(
    userData: Partial<IUserData> & { uid: string; email: string }
  ): Promise<void> {
    try {
      const userRef = getUserRef(userData.uid);
      const now = serverTimestamp();

      const payload: Record<string, any> = {
        uid: userData.uid,
        name: userData.name ?? "",
        email: userData.email,
        occupation: userData.occupation ?? "",
        ergonomicGoal: userData.ergonomicGoal ?? "both",
        age: userData.age ?? null,
        gender: userData.gender ?? "",
        createdAt: userData.createdAt ?? now,
        updatedAt: now,
        settings: {
          emailAlerts: userData.settings?.emailAlerts ?? true,
          notificationFrequency:
            userData.settings?.notificationFrequency ?? DEFAULT_NOTIFICATION_FREQUENCY,
          alertEmail: userData.settings?.alertEmail ?? userData.email,
          updatedAt: now,
        },
        analytics: {
          postureScore: userData.analytics?.postureScore ?? 1,
          rsiRisk: userData.analytics?.rsiRisk ?? "LOW",
          weeklyImprovement: userData.analytics?.weeklyImprovement ?? 0,
          breakStatus: userData.analytics?.breakStatus ?? 0,
          avgSessionTime: userData.analytics?.avgSessionTime ?? 0,
          lastUpdated: now,
        },
      };

      await setDoc(userRef, payload, { merge: true });
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  async updateUser(uid: string, userData: Partial<IUserData>): Promise<void> {
    try {
      await setDoc(
        getUserRef(uid),
        {
          ...userData,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  },

  async getUserSettings(uid: string): Promise<IUserSettings | null> {
    try {
      const snapshot = await getDoc(getUserRef(uid));
      if (!snapshot.exists()) return null;
      return (snapshot.data()?.settings as IUserSettings) ?? null;
    } catch (error) {
      console.error("Error getting user settings:", error);
      throw error;
    }
  },

  async getNotificationFrequency(uid: string): Promise<number> {
    const settings = await this.getUserSettings(uid);
    return settings?.notificationFrequency ?? DEFAULT_NOTIFICATION_FREQUENCY;
  },

  async updateUserSettings(uid: string, settings: IUserSettings): Promise<void> {
    try {
      const update: Record<string, any> = {
        "settings.updatedAt": serverTimestamp(),
      };

      if (settings.emailAlerts !== undefined) {
        update["settings.emailAlerts"] = settings.emailAlerts;
      }
      if (settings.notificationFrequency !== undefined) {
        update["settings.notificationFrequency"] = settings.notificationFrequency;
      }
      if (settings.alertEmail !== undefined) {
        update["settings.alertEmail"] = settings.alertEmail;
      }

      await setDoc(getUserRef(uid), update, { merge: true });
    } catch (error) {
      console.error("Error updating user settings:", error);
      throw error;
    }
  },

  // Posture sessions
  async logPostureSession(
    uid: string,
    postureData: string,
    options?: {
      device?: string;
      frequency?: number;
      timestampStart?: TimestampInput;
      timestampEnd?: TimestampInput;
      processed?: boolean;
    }
  ): Promise<{ sessionId: string; triggerAlert: boolean; badRatio: number }> {
    try {
      const userRef = getUserRef(uid);
      const userSnapshot = await getDoc(userRef);
      const userSettings = userSnapshot.exists()
        ? (userSnapshot.data()?.settings as IUserSettings | undefined)
        : undefined;
      const previousAnalytics = userSnapshot.exists()
        ? (userSnapshot.data()?.analytics as IUserAnalytics | undefined)
        : undefined;

      const frequency =
        options?.frequency ??
        userSettings?.notificationFrequency ??
        DEFAULT_NOTIFICATION_FREQUENCY;

      const totalFrames = Math.max(1, postureData.length);
      const badFrames = countBadFrames(postureData);
      const badRatio = badFrames / totalFrames;
      const triggerAlert = badRatio >= 0.5;

      const sessionRef = await addDoc(
        getUserSubcollection(uid, POSTURE_SESSIONS_SUBCOLLECTION),
        {
          frequency,
          timestampStart: toTimestamp(options?.timestampStart),
          timestampEnd: toTimestamp(options?.timestampEnd),
          postureData,
          totalFrames,
          badFrames,
          badRatio,
          triggerAlert,
          processed: options?.processed ?? false,
          device: options?.device ?? "local_webcam",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      await recalculateAnalytics(uid, frequency, previousAnalytics);

      return {
        sessionId: sessionRef.id,
        triggerAlert,
        badRatio,
      };
    } catch (error) {
      console.error("Error logging posture session:", error);
      throw error;
    }
  },

  async getUserPostureSessions(
    uid: string,
    take: number = 20
  ): Promise<IPostureSession[]> {
    try {
      const sessionsSnapshot = await getDocs(
        query(
          getUserSubcollection(uid, POSTURE_SESSIONS_SUBCOLLECTION),
          orderBy("timestampEnd", "desc"),
          limit(take)
        )
      );

      return sessionsSnapshot.docs.map((sessionDoc) => ({
        id: sessionDoc.id,
        ...(sessionDoc.data() as IPostureSession),
      }));
    } catch (error) {
      console.error("Error getting posture sessions:", error);
      throw error;
    }
  },

  // RSI sessions
  async logRSISession(
    uid: string,
    sessionData: Omit<IRSISession, "id" | "timestampStart"> & {
      timestampStart?: TimestampInput;
    }
  ): Promise<string> {
    try {
      const sessionRef = await addDoc(
        getUserSubcollection(uid, RSI_SESSIONS_SUBCOLLECTION),
        {
          ...sessionData,
          timestampStart: toTimestamp(sessionData.timestampStart),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );
      return sessionRef.id;
    } catch (error) {
      console.error("Error logging RSI session:", error);
      throw error;
    }
  },

  async getUserRSISessions(uid: string): Promise<IRSISession[]> {
    try {
      const sessionsSnapshot = await getDocs(
        query(
          getUserSubcollection(uid, RSI_SESSIONS_SUBCOLLECTION),
          orderBy("timestampStart", "desc"),
          limit(20)
        )
      );

      return sessionsSnapshot.docs.map((sessionDoc) => ({
        id: sessionDoc.id,
        ...(sessionDoc.data() as IRSISession),
      }));
    } catch (error) {
      console.error("Error getting RSI sessions:", error);
      throw error;
    }
  },
};
