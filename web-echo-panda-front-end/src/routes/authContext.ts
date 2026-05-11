import { auth, googleProvider } from "./firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { app } from "./firebaseConfig";
import { supabase } from "../backend/supabaseClient";
import { loginFirebaseUserToBackend } from "./backendAuth";

const db = getFirestore(app);

interface UserData {
  username?: string;
  email: string;
  registeredAt?: string;
  displayName?: string;
  photoURL?: string;
  uid?: string;
  authProvider?: "google" | "email";
  backendRole?: "user" | "artist" | "publicer" | "admin";
}

interface AuthResult {
  success: boolean;
  user?: UserData;
  error?: string;
}

// Google Sign In
export async function SignInWithGoogle(): Promise<UserData> {
  let result;
  
  try {
    result = await signInWithPopup(auth, googleProvider);
  } catch (popupError: any) {
    // Handle Cross-Origin-Opener-Policy errors
    if (popupError.code === 'auth/popup-blocked' || 
        popupError.code === 'auth/popup-closed-by-user' ||
        popupError.message?.includes('COOP') ||
        popupError.message?.includes('window.closed')) {
      throw new Error('Popup was blocked or closed. Please allow popups for this site and try again.');
    }
    throw popupError;
  }
  
  const user = result.user;

  // Check user status in Firestore first
  try {
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    
    // Check if user is blocked
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.status === "blocked") {
        await auth.signOut();
        throw new Error("Your account has been blocked. Please contact support.");
      }
      
      // Update last login
      await setDoc(userDocRef, {
        lastLogin: new Date().toISOString(),
      }, { merge: true });
    } else {
      // First time sign in - create user document
      await setDoc(userDocRef, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        registeredAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        status: "active",
      });
    }

    // Store Firebase UID in Supabase
    const { error } = await supabase
      .from('users')
      .upsert({ uid: user.uid }, { onConflict: 'uid' });

    if (error) {
      console.error("Error storing UID in Supabase:", error);
    }

  } catch (error: any) {
    console.error("Error checking/saving user to Firestore:", error);
    if (error.message.includes("blocked")) {
      throw error;
    }
  }

  // Store user data in localStorage
  const backendAuth = await loginFirebaseUserToBackend({
    email: user.email || "",
    name: user.displayName || undefined,
    firebase_uid: user.uid,
    provider: "google",
  });

  const userData: UserData = {
    email: user.email || "",
    displayName: user.displayName || "",
    photoURL: user.photoURL || "",
    uid: user.uid,
    registeredAt: new Date().toISOString(),
    authProvider: "google",
    backendRole: backendAuth.user.role,
  };

  localStorage.setItem("user", JSON.stringify(userData));
  localStorage.setItem("isAuthenticated", "true");

  return userData;
}
//=========================================================================

// Email/Password Registration
export async function registerWithEmail(
  username: string,
  email: string,
  password: string,
  confirmPassword: string
): Promise<AuthResult> {
  // Validation
  if (password !== confirmPassword) {
    return { success: false, error: "Passwords do not match" };
  }

  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters" };
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (username) {
      await updateProfile(user, { displayName: username });
    }

    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, {
      email: user.email,
      displayName: username || user.displayName,
      photoURL: user.photoURL,
      registeredAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      status: "active",
      authProvider: "email",
    }, { merge: true });

    const { error } = await supabase
      .from('users')
      .upsert({ uid: user.uid }, { onConflict: 'uid' });

    if (error) {
      console.error("Error storing UID in Supabase:", error);
    }

    const backendAuth = await loginFirebaseUserToBackend({
      email: user.email || email,
      name: username || user.displayName || undefined,
      firebase_uid: user.uid,
      provider: "email",
    });

    const userData: UserData = {
      username,
      email: user.email || email,
      displayName: username || user.displayName || "",
      photoURL: user.photoURL || "",
      uid: user.uid,
      registeredAt: new Date().toISOString(),
      authProvider: "email",
      backendRole: backendAuth.user.role,
    };

    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("isAuthenticated", "true");

    return { success: true, user: userData };
  } catch (error: any) {
    if (error?.code === "auth/email-already-in-use") {
      return { success: false, error: "An account with this email already exists" };
    }

    if (error?.code === "auth/invalid-email") {
      return { success: false, error: "Invalid email address" };
    }

    if (error?.code === "auth/weak-password") {
      return { success: false, error: "Password is too weak" };
    }

    console.error("Email registration error:", error);
    return { success: false, error: "Failed to register. Please try again." };
  }
}
//=====================================================================================
// Email/Password Login
export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists() && userDoc.data().status === "blocked") {
      await firebaseSignOut(auth);
      return { success: false, error: "Your account has been blocked. Please contact support." };
    }

    await setDoc(userDocRef, {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastLogin: new Date().toISOString(),
      status: userDoc.exists() ? (userDoc.data().status || "active") : "active",
      ...(userDoc.exists() ? {} : { registeredAt: new Date().toISOString(), authProvider: "email" }),
    }, { merge: true });

    const { error } = await supabase
      .from('users')
      .upsert({ uid: user.uid }, { onConflict: 'uid' });

    if (error) {
      console.error("Error storing UID in Supabase:", error);
    }

    const backendAuth = await loginFirebaseUserToBackend({
      email: user.email || email,
      name: user.displayName || undefined,
      firebase_uid: user.uid,
      provider: "email",
    });

    const userData: UserData = {
      email: user.email || email,
      displayName: user.displayName || "",
      photoURL: user.photoURL || "",
      uid: user.uid,
      registeredAt: userDoc.exists() ? userDoc.data().registeredAt : new Date().toISOString(),
      authProvider: "email",
      backendRole: backendAuth.user.role,
    };

    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("isAuthenticated", "true");

    return { success: true, user: userData };
  } catch (error: any) {
    if (
      error?.code === "auth/invalid-credential" ||
      error?.code === "auth/wrong-password" ||
      error?.code === "auth/user-not-found"
    ) {
      return { success: false, error: "Invalid email or password" };
    }

    if (error?.code === "auth/invalid-email") {
      return { success: false, error: "Invalid email address" };
    }

    console.error("Email login error:", error);
    return { success: false, error: "Failed to log in. Please try again." };
  }
}
//================================================================================

// Sign Out
export function signOut(): void {
  localStorage.removeItem("isAuthenticated");
  localStorage.removeItem("user");
}

//+++++++++++++++++++++++++++++=++++++++++++++
// for storing user data and can be easily call from other page
export function getCurrentUser(): UserData | null {
  const isAuthenticated = localStorage.getItem("isAuthenticated");
  if (isAuthenticated !== "true") {
    return null;
  }

  const storedUser = localStorage.getItem("user");
  if (!storedUser) {
    return null;
  }

  return JSON.parse(storedUser) as UserData;
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return localStorage.getItem("isAuthenticated") === "true";
}