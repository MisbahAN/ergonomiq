import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  User,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile
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

      // Update the user's display name
      if (credentials.name) {
        await updateProfile(userCredential.user, {
          displayName: credentials.name,
        });
      }

      // Create a user profile document in Firestore
      try {
        const { firestoreService } = await import("./firestoreService");
        await firestoreService.createUser({
          uid: userCredential.user.uid,
          email: userCredential.user.email || credentials.email,
          name: credentials.name || credentials.email.split('@')[0],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch (dbError) {
        console.error("Error creating user profile in Firestore:", dbError);
        // Don't fail the registration if Firestore creation fails
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
      
      // Check if user profile exists in Firestore, create if it doesn't
      try {
        const { firestoreService } = await import("./firestoreService");
        const existingUser = await firestoreService.getUser(userCredential.user.uid);
        
        if (!existingUser) {
          // Create user profile in Firestore if it doesn't exist
          await firestoreService.createUser({
            uid: userCredential.user.uid,
            email: userCredential.user.email || "",
            name: userCredential.user.displayName || userCredential.user.email?.split('@')[0] || "",
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      } catch (dbError) {
        console.error("Error creating/updating user profile in Firestore:", dbError);
        // Don't fail the login if Firestore creation fails
      }
      
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
