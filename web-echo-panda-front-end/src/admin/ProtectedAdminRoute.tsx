import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "../routes/firebaseConfig";
import { getAdminBackendUrl, loginFirebaseUserToBackend } from "../routes/backendAuth";

const auth = getAuth(app);
const db = getFirestore(app);

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export default function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (!user) {
            navigate("/admin/login", { replace: true });
            setIsChecking(false);
            return;
          }

          // Optional admin metadata from Firestore (may not exist for artists)
          const adminDocRef = doc(db, "admins", user.uid);
          const adminDoc = await getDoc(adminDocRef);
          const adminData = adminDoc.exists() ? adminDoc.data() : null;

          // Synchronize with backend to get the authoritative role
          const backendAuth = await loginFirebaseUserToBackend({
            email: user.email || "",
            name: adminData?.name || user.displayName || undefined,
            firebase_uid: user.uid,
            provider: "email",
          });

          const role = backendAuth.user.role;

          // If Firestore admin doc exists, enforce its status
          if (adminData && adminData.status !== "active") {
            console.error("Account inactive per Firestore admins doc");
            await auth.signOut();
            localStorage.removeItem("adminUser");
            navigate("/admin/login", { replace: true });
            setIsChecking(false);
            return;
          }

          if (role === "admin") {
            // Backend says admin -> go to Laravel backend admin UI
            window.location.href = getAdminBackendUrl();
            setIsChecking(false);
            return;
          }

          if (!["artist", "publicer"].includes(role)) {
            console.error("Only artist/publicer can access frontend dashboard");
            await auth.signOut();
            localStorage.removeItem("adminUser");
            navigate("/admin/login", { replace: true });
            setIsChecking(false);
            return;
          }

          // Authorized for frontend artist/publicer dashboard
          setIsAuthorized(true);
          setIsChecking(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Auth check error:", error);
        navigate("/admin/login", { replace: true });
        setIsChecking(false);
      }
    };

    checkAdminAuth();
  }, [navigate, location]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium">Verifying artist/publicer access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
