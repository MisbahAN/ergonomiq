import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export interface IAuthResponse {
  user: User | null;
  error: string | null;
}

export interface ILoginCredentials {
  email: string;
  password: string;
}

export interface IRegisterCredentials {
  email: string;
  password: string;
  name?: string;
}

type EnsureProfileOptions = {
  name?: string;
  email?: string;
};

const ensureFirestoreUser = async (user: User, options?: EnsureProfileOptions) => {
  try {
    const { firestoreService } = await import("./firestoreService");
    const existingUser = await firestoreService.getUser(user.uid);
    if (existingUser) {
      return;
    }

    const email = options?.email ?? user.email ?? "";
    const name =
      options?.name ??
      user.displayName ??
      (email ? email.split("@")[0] : "New User");

    await firestoreService.createUser(user.uid, {
      email,
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error ensuring Firestore user profile:", error);
  }
};

export const authService = {
  async login(credentials: ILoginCredentials): Promise<IAuthResponse> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );
      await ensureFirestoreUser(userCredential.user, {
        email: credentials.email,
      });
      return { user: userCredential.user, error: null };
    } catch (error: any) {
      console.error("Login error:", error.message);
      return { user: null, error: error.message };
    }
  },

  async register(credentials: IRegisterCredentials): Promise<IAuthResponse> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      // Update the user's display name
      if (credentials.name) {
        await updateProfile(userCredential.user, {
          displayName: credentials.name,
        });
      }

      await ensureFirestoreUser(userCredential.user, {
        email: userCredential.user.email || credentials.email,
        name: credentials.name || credentials.email.split("@")[0],
      });

      return { user: userCredential.user, error: null };
    } catch (error: any) {
      console.error("Registration error:", error.message);
      return { user: null, error: error.message };
    }
  },

  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error("Logout error:", error.message);
      throw error;
    }
  },

  async loginWithGoogle(): Promise<IAuthResponse> {
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      await ensureFirestoreUser(userCredential.user, {
        email: userCredential.user.email || "",
        name:
          userCredential.user.displayName ||
          userCredential.user.email?.split("@")[0],
      });
      return { user: userCredential.user, error: null };
    } catch (error: any) {
      console.error("Google login error:", error.message);
      return { user: null, error: error.message };
    }
  },

  async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      await sendPasswordResetEmail(auth, email);
      return { error: null };
    } catch (error: any) {
      console.error("Password reset error:", error.message);
      return { error: error.message };
    }
  },

  async updateProfile(profileData: { displayName?: string; photoURL?: string }): Promise<void> {
    const currentUser = auth.currentUser;
    if (currentUser) {
      await updateProfile(currentUser, profileData);
    } else {
      throw new Error("User not authenticated");
    }
  },

  getCurrentUser(): User | null {
    return auth.currentUser;
  },
};
