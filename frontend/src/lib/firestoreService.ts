import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  QuerySnapshot,
  DocumentData
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface IUserData {
  uid: string;
  email: string;
  name?: string;
  createdAt?: Date;
  lastLoginAt?: Date;
  [key: string]: any; // Allow additional fields
}

export interface IPostureSession {
  id?: string;
  userId: string;
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  metrics: {
    neckAngle: number;
    trunkAngle: number;
    kneeAngle: number;
    elbowAngle: number;
    pelvicTilt: number;
    [key: string]: any;
  };
  status: 'active' | 'completed' | 'interrupted';
  createdAt: Date;
  updatedAt: Date;
}

export interface IRSISession {
  id?: string;
  userId: string;
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  emgData: {
    muscleActivity: number;
    fatigueLevel: number;
    strainIndex: number;
    [key: string]: any;
  };
  status: 'active' | 'completed' | 'interrupted';
  createdAt: Date;
  updatedAt: Date;
}

export const firestoreService = {
  // User operations
  async getUser(userId: string): Promise<IUserData | null> {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        return { uid: userDoc.id, ...userDoc.data() } as IUserData;
      }
      return null;
    } catch (error) {
      console.error("Error getting user:", error);
      throw error;
    }
  },

  async createUser(userData: Partial<IUserData>): Promise<string> {
    try {
      const userRef = await addDoc(collection(db, "users"), {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return userRef.id;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  async updateUser(userId: string, userData: Partial<IUserData>): Promise<void> {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        ...userData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  },

  // Posture session operations
  async createPostureSession(sessionData: IPostureSession): Promise<string> {
    try {
      const sessionRef = await addDoc(collection(db, "postureSessions"), {
        ...sessionData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return sessionRef.id;
    } catch (error) {
      console.error("Error creating posture session:", error);
      throw error;
    }
  },

  async updatePostureSession(sessionId: string, sessionData: Partial<IPostureSession>): Promise<void> {
    try {
      const sessionRef = doc(db, "postureSessions", sessionId);
      await updateDoc(sessionRef, {
        ...sessionData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating posture session:", error);
      throw error;
    }
  },

  async getUserPostureSessions(userId: string): Promise<IPostureSession[]> {
    try {
      const q = query(
        collection(db, "postureSessions"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as IPostureSession));
    } catch (error) {
      console.error("Error getting user posture sessions:", error);
      throw error;
    }
  },

  // RSI session operations
  async createRSISession(sessionData: IRSISession): Promise<string> {
    try {
      const sessionRef = await addDoc(collection(db, "rsiSessions"), {
        ...sessionData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return sessionRef.id;
    } catch (error) {
      console.error("Error creating RSI session:", error);
      throw error;
    }
  },

  async updateRSISession(sessionId: string, sessionData: Partial<IRSISession>): Promise<void> {
    try {
      const sessionRef = doc(db, "rsiSessions", sessionId);
      await updateDoc(sessionRef, {
        ...sessionData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating RSI session:", error);
      throw error;
    }
  },

  async getUserRSISessions(userId: string): Promise<IRSISession[]> {
    try {
      const q = query(
        collection(db, "rsiSessions"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as IRSISession));
    } catch (error) {
      console.error("Error getting user RSI sessions:", error);
      throw error;
    }
  },

  // General document operations
  async getDocument(collectionName: string, docId: string): Promise<DocumentData | null> {
    try {
      const docRef = await getDoc(doc(db, collectionName, docId));
      return docRef.exists() ? { id: docRef.id, ...docRef.data() } : null;
    } catch (error) {
      console.error(`Error getting document from ${collectionName}/${docId}:`, error);
      throw error;
    }
  },

  async addDocument(collectionName: string, data: DocumentData): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error(`Error adding document to ${collectionName}:`, error);
      throw error;
    }
  },

  async updateDocument(collectionName: string, docId: string, data: DocumentData): Promise<void> {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error(`Error updating document in ${collectionName}/${docId}:`, error);
      throw error;
    }
  },
};