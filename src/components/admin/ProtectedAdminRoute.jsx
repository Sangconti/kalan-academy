import { Navigate } from "react-router-dom";
import useAdmin from "../../hooks/useAdmin";

export default function ProtectedAdminRoute({ children }) {
  const { loading, isAdmin } = useAdmin();

   console.log("🛡️ [PROTECTED ADMIN]", {
      loading,
      isAdmin,
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Chargement...
      </div>
    );
  }

  if (!isAdmin) {

      console.log("🚫 [PROTECTED ADMIN] REDIRECTION /admin/login");
    return <Navigate to="/admin/login" replace />;
  }
 console.log("✅ [PROTECTED ADMIN] ACCÈS AUTORISÉ");

console.log("🛡️ ProtectedAdminRoute", {
  loading,
  isAdmin
});

  return children;
}