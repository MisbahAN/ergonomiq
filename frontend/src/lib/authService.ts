import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  User,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
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

export const authService = {
  async login(credentials: ILoginCredentials): Promise<IAuthResponse> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );
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

      // Optionally update the user's display name
      if (credentials.name) {
        await userCredential.user.updateProfile({
          displayName: credentials.name,
        });
      }

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
      await currentUser.updateProfile(profileData);
    } else {
      throw new Error("User not authenticated");
    }
  },

  getCurrentUser(): User | null {
    return auth.currentUser;
  },
};